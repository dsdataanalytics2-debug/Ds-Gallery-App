import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

/**
 * Initiates Google OAuth 2.0 authorization flow.
 * Redirects user to Google's consent screen.
 * access_type=offline + prompt=consent ensures a refresh_token is always issued.
 */
export async function GET(request: NextRequest) {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${new URL(request.url).origin}/api/google-auth/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    include_granted_scopes: true,
  });

  return NextResponse.redirect(authUrl);
}
