import { google } from "googleapis";
import prisma from "@/lib/db";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
}

/**
 * Store OAuth tokens in the database
 */
export async function storeOAuthTokens(tokens: OAuthTokens): Promise<void> {
  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000); // Default 1 hour

  // Delete any existing tokens (we only support one account for now)
  await prisma.googleOAuthToken.deleteMany({});

  // Store new tokens
  await prisma.googleOAuthToken.create({
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      expiresAt,
      scope: tokens.scope,
      tokenType: tokens.token_type || "Bearer",
    },
  });
}

/**
 * Get valid OAuth tokens, refreshing if necessary
 */
export async function getValidOAuthTokens(): Promise<OAuthTokens | null> {
  // Get the most recent token
  const tokenRecord = await prisma.googleOAuthToken.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!tokenRecord) {
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = new Date();
  const expiresAt = new Date(tokenRecord.expiresAt);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt > fiveMinutesFromNow) {
    // Token is still valid
    return {
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      expiry_date: expiresAt.getTime(),
      scope: tokenRecord.scope || undefined,
      token_type: tokenRecord.tokenType,
    };
  }

  // Token is expired or about to expire, refresh it
  if (!tokenRecord.refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    oauth2Client.setCredentials({
      refresh_token: tokenRecord.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    const newTokens: OAuthTokens = {
      access_token: credentials.access_token!,
      refresh_token:
        credentials.refresh_token || tokenRecord.refreshToken || undefined,
      expiry_date: credentials.expiry_date || undefined,
      scope: credentials.scope || undefined,
      token_type: credentials.token_type || undefined,
    };

    // Store the refreshed tokens
    await storeOAuthTokens(newTokens);

    return newTokens;
  } catch (error) {
    console.error("Error refreshing OAuth token:", error);
    throw new Error("Failed to refresh OAuth token");
  }
}

/**
 * Check if OAuth is configured
 */
export async function isOAuthConnected(): Promise<boolean> {
  const tokenRecord = await prisma.googleOAuthToken.findFirst();
  return tokenRecord !== null;
}

/**
 * Disconnect OAuth (delete tokens)
 */
export async function disconnectOAuth(): Promise<void> {
  await prisma.googleOAuthToken.deleteMany({});
}

/**
 * Get OAuth client with valid tokens
 */
export async function getAuthenticatedOAuthClient() {
  const tokens = await getValidOAuthTokens();

  if (!tokens) {
    throw new Error("No OAuth tokens found. Please authenticate first.");
  }

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  return oauth2Client;
}

/**
 * Get an authenticated Google Drive instance using user OAuth tokens
 * Returns null if not authenticated, instead of throwing.
 */
export async function getOptionalAuthenticatedDrive() {
  try {
    const tokens = await getValidOAuthTokens();
    if (!tokens) return null;

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    auth.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    return google.drive({ version: "v3", auth });
  } catch (error) {
    console.error("Failed to get authenticated drive:", error);
    return null;
  }
}
