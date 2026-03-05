import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { getGoogleDriveClient, ensureRootFolder } from "@/lib/gdrive-client";

/**
 * Handles Google OAuth 2.0 callback.
 * - Exchanges code for tokens
 * - Fetches user profile (email, name, picture)
 * - Encrypts and saves refreshToken to GoogleAccount
 * - Creates DS-Gallery/{email} Drive folder, saves rootFolderId
 * - Redirects to /settings?connected=true
 */
export async function GET(request: NextRequest) {
  const fs = require("fs");
  const path = require("path");
  const logFile = path.join(process.cwd(), "auth-callback.log");
  const log = (msg: string) =>
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

  log("Auth callback started");
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      log(`OAuth Error from Google: ${error}`);
      return NextResponse.redirect(
        new URL(
          `/settings?oauth_error=${encodeURIComponent(error)}`,
          request.url,
        ),
      );
    }

    if (!code) {
      log("Missing code parameter");
      return NextResponse.redirect(
        new URL("/settings?oauth_error=missing_code", request.url),
      );
    }

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${new URL(request.url).origin}/api/google-auth/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    log("Exchanging code for tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      log("No refresh_token returned by Google");
      return NextResponse.redirect(
        new URL(
          "/settings?oauth_error=no_refresh_token_ensure_prompt_consent",
          request.url,
        ),
      );
    }
    oauth2Client.setCredentials(tokens);

    log("Fetching user profile...");
    const oauth2Info = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2Info.userinfo.get();
    log(`Profile received: ${profile.email}`);

    if (!profile.email) {
      log("Profile email missing");
      return NextResponse.redirect(
        new URL("/settings?oauth_error=no_email", request.url),
      );
    }

    const encryptedRefreshToken = encryptToken(tokens.refresh_token);
    const isFirstAccount = (await prisma.googleAccount.count()) === 0;

    log(`Upserting account for ${profile.email}...`);
    const account = await prisma.googleAccount.upsert({
      where: { email: profile.email },
      update: {
        displayName: profile.name ?? undefined,
        picture: profile.picture ?? undefined,
        refreshToken: encryptedRefreshToken,
      },
      create: {
        email: profile.email,
        displayName: profile.name ?? undefined,
        picture: profile.picture ?? undefined,
        refreshToken: encryptedRefreshToken,
        isActive: isFirstAccount,
        tenantId: "default",
      },
    });
    log(`Account upserted. ID: ${account.id}, Email: ${account.email}`);

    // Auto-create DS-Gallery/{email} folder in Drive
    try {
      log(`Ensuring root folder for account ${account.id}...`);
      const drive = await getGoogleDriveClient(account.id);
      const folderId = await ensureRootFolder(drive, profile.email);
      await prisma.googleAccount.update({
        where: { id: account.id },
        data: { rootFolderId: folderId },
      });
      log(`Root folder ensured: ${folderId}`);
    } catch (folderErr: any) {
      log(`Failed to create root Drive folder: ${folderErr.message}`);
      console.error("Failed to create root Drive folder:", folderErr);
    }

    log("Auth callback completed successfully");
    return NextResponse.redirect(
      new URL("/settings?connected=true", request.url),
    );
  } catch (err: any) {
    log(`Auth callback CRASH: ${err.message}\n${err.stack}`);
    console.error("OAuth callback error:", err);
    const msg =
      err instanceof Error ? encodeURIComponent(err.message) : "unknown";
    return NextResponse.redirect(
      new URL(`/settings?oauth_error=${msg}`, request.url),
    );
  }
}
