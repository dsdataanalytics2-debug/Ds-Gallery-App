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
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/settings?oauth_error=${encodeURIComponent(error)}`,
          request.url,
        ),
      );
    }

    if (!code) {
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

    // Exchange code for tokens — must include refresh_token
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL(
          "/settings?oauth_error=no_refresh_token_ensure_prompt_consent",
          request.url,
        ),
      );
    }
    oauth2Client.setCredentials(tokens);

    // Fetch user profile
    const oauth2Info = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2Info.userinfo.get();

    if (!profile.email) {
      return NextResponse.redirect(
        new URL("/settings?oauth_error=no_email", request.url),
      );
    }

    const encryptedRefreshToken = encryptToken(tokens.refresh_token);
    const isFirstAccount = (await prisma.googleAccount.count()) === 0;

    // Upsert account
    const account = await prisma.googleAccount.upsert({
      where: { email: profile.email },
      update: {
        displayName: profile.name ?? undefined,
        picture: profile.picture ?? undefined,
        refreshToken: encryptedRefreshToken,
        // Update tenantId if passed in state or similar (omitted for simplicity here)
      },
      create: {
        email: profile.email,
        displayName: profile.name ?? undefined,
        picture: profile.picture ?? undefined,
        refreshToken: encryptedRefreshToken,
        isActive: isFirstAccount,
        tenantId: "default", // Defaulting as requested
      },
    });

    // Auto-create DS-Gallery/{email} folder in Drive
    try {
      const drive = await getGoogleDriveClient(account.id);
      const folderId = await ensureRootFolder(drive, profile.email);
      await prisma.googleAccount.update({
        where: { id: account.id },
        data: { rootFolderId: folderId },
      });
    } catch (folderErr) {
      // Non-fatal: folder creation failure shouldn't block account save
      console.error("Failed to create root Drive folder:", folderErr);
    }

    return NextResponse.redirect(
      new URL("/settings?connected=true", request.url),
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    const msg =
      err instanceof Error ? encodeURIComponent(err.message) : "unknown";
    return NextResponse.redirect(
      new URL(`/settings?oauth_error=${msg}`, request.url),
    );
  }
}
