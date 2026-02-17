import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { storeOAuthTokens } from "@/lib/oauth/token-storage";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Check if user denied access
    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=access_denied`, request.url),
      );
    }

    // Check if authorization code is present
    if (!code) {
      return NextResponse.redirect(
        new URL(`/?error=missing_code`, request.url),
      );
    }

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in database
    await storeOAuthTokens({
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      scope: tokens.scope || undefined,
      token_type: tokens.token_type || undefined,
    });

    // Redirect to success page or settings
    return NextResponse.redirect(
      new URL("/?google_drive_connected=true", request.url),
    );
  } catch (error) {
    console.error("Error during OAuth callback:", error);
    return NextResponse.redirect(
      new URL(`/?error=authentication_failed`, request.url),
    );
  }
}
