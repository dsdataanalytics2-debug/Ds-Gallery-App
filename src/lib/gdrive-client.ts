import { google, drive_v3 } from "googleapis";
import prisma from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/crypto";

// Cache for Google Drive clients: Map<accountId, driveClient>
const driveClientCache = new Map<string, drive_v3.Drive>();

/**
 * Returns an authenticated Google Drive client for a specific account.
 * MUST ALWAYS take an accountId. Never fall back to implicit active account.
 */
export async function getGoogleDriveClient(
  accountId: string,
): Promise<drive_v3.Drive> {
  if (!accountId) {
    throw new Error(
      "Missing googleAccountId: Every Drive operation must specify an account.",
    );
  }

  // Check cache first
  if (driveClientCache.has(accountId)) {
    return driveClientCache.get(accountId)!;
  }

  const account = await prisma.googleAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error(`Google account ${accountId} not found in database.`);
  }

  const refreshToken = decryptToken(account.refreshToken);

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
    throw new Error(
      "Missing Google OAuth environment variables (CLIENT_ID, CLIENT_SECRET, or REDIRECT_URI).",
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // Persist refreshed access token back to DB if assigned by Google
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      await prisma.googleAccount.update({
        where: { id: account.id },
        data: { refreshToken: encryptToken(tokens.refresh_token) },
      });
    }
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Save to cache
  driveClientCache.set(accountId, drive);

  return drive;
}

/**
 * Clears the Drive client cache.
 * If accountId is provided, clears only that specific client.
 * Otherwise, clears the entire cache.
 */
export function clearDriveClientCache(accountId?: string) {
  if (accountId) {
    driveClientCache.delete(accountId);
  } else {
    driveClientCache.clear();
  }
}

/**
 * Ensures DS-Gallery/{email} folder exists in Google Drive.
 * Returns the folder ID. Creates it if missing.
 */
export async function ensureRootFolder(
  drive: drive_v3.Drive,
  email: string,
): Promise<string> {
  const folderName = `DS-Gallery/${email}`;

  // Search for existing folder
  const search = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: "files(id,name)",
    spaces: "drive",
  });

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id!;
  }

  // Create it
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  return folder.data.id!;
}
