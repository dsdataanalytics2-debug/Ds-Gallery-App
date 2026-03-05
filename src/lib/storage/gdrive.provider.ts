import { Readable } from "stream";
import { StorageProvider, StorageResult } from "./index";
import {
  getGoogleDriveClient,
  ensureRootFolder,
  clearDriveClientCache,
} from "@/lib/gdrive-client";
import prisma from "@/lib/prisma";
import { drive_v3 } from "googleapis";

export class GoogleDriveStorageProvider implements StorageProvider {
  private async getOrCreateFolder(
    drive: drive_v3.Drive,
    name: string,
    parentId?: string,
  ): Promise<string> {
    const safe = name.replace(/'/g, "\\'");
    let q = `name='${safe}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) q += ` and '${parentId}' in parents`;

    const res = await drive.files.list({
      q,
      fields: "files(id)",
      spaces: "drive",
    });
    if (res.data.files?.length) return res.data.files[0].id!;

    const folder = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentId ? [parentId] : [],
      },
      fields: "id",
    });
    if (!folder.data.id)
      throw new Error("Failed to create folder in Google Drive");
    return folder.data.id;
  }

  /** Resolve app folder path in Drive, using account's rootFolderId. */
  private async resolveDriveFolder(
    drive: drive_v3.Drive,
    folderId: string,
    accountId: string,
  ): Promise<string> {
    if (!accountId) {
      throw new Error(
        "resolveDriveFolder: accountId is required for GDrive operations.",
      );
    }

    const acc = await prisma.googleAccount.findUnique({
      where: { id: accountId },
      select: { rootFolderId: true, email: true },
    });

    if (!acc) throw new Error(`Google account ${accountId} not found`);

    let rootId: string;
    if (!acc.rootFolderId) {
      try {
        rootId = await ensureRootFolder(drive, acc.email);
        await prisma.googleAccount.update({
          where: { id: accountId },
          data: { rootFolderId: rootId },
        });
      } catch (err) {
        throw new Error(
          `Google account ${acc.email} has no rootFolderId and we failed to create it: ${err instanceof Error ? err.message : String(err)}. **CRITICAL**: Please reconnect your account and ensure you CHECK the box "See, edit, create, and delete all your Google Drive files" on the Google consent screen.`,
        );
      }
    } else {
      rootId = acc.rootFolderId;
    }

    // Resolve folder hierarchy inside the root
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });
    if (!folder) return rootId;

    const path: string[] = [];
    let current: { id: string; name: string; parentId?: string | null } | null =
      folder;
    while (current) {
      path.unshift(current.name);
      current = current.parentId
        ? await prisma.folder.findUnique({ where: { id: current.parentId } })
        : null;
    }

    let currentParentId = rootId;
    for (const segment of path) {
      currentParentId = await this.getOrCreateFolder(
        drive,
        segment,
        currentParentId,
      );
    }
    return currentParentId;
  }

  async upload(
    file: Buffer | ArrayBuffer,
    filePath: string,
    accountId: string,
  ): Promise<StorageResult> {
    if (!accountId) {
      throw new Error("GDrive upload: googleAccountId is mandatory.");
    }

    try {
      const drive = await getGoogleDriveClient(accountId);
      const parts = filePath.split("/");
      const folderId = parts[0];
      const fileName = parts.slice(1).join("/");

      const targetFolderId = await this.resolveDriveFolder(
        drive,
        folderId,
        accountId,
      );
      const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);

      const response = await drive.files.create({
        requestBody: { name: fileName, parents: [targetFolderId] },
        media: {
          body: Readable.from(buffer),
          mimeType: "application/octet-stream",
        },
        fields: "id, webViewLink, webContentLink, thumbnailLink",
      });

      return {
        fileId: response.data.id!,
        url: response.data.webContentLink || response.data.webViewLink || "",
        thumbnailUrl: response.data.thumbnailLink || undefined,
        storageType: "gdrive",
        googleAccountId: accountId, // Explicitly return the account used
      };
    } catch (error: any) {
      console.error("GDrive upload error:", error);

      if (error.message?.includes("invalid_grant")) {
        clearDriveClientCache(accountId);
        console.log(
          `[Storage] Cleared GDrive cache for ${accountId} due to invalid_grant`,
        );
        throw new Error("AUTH_ERROR_GDRIVE_REAUTH");
      }

      throw new Error(
        `GDrive upload failed: ${error instanceof Error ? error.message : "Unknown"}`,
      );
    }
  }

  async download(fileId: string, accountId: string): Promise<Buffer> {
    if (!accountId) {
      throw new Error("GDrive download: googleAccountId is mandatory.");
    }
    try {
      const drive = await getGoogleDriveClient(accountId);
      const response = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "arraybuffer" },
      );
      return Buffer.from(response.data as ArrayBuffer);
    } catch (error: any) {
      if (error.message?.includes("invalid_grant")) {
        clearDriveClientCache(accountId);
        throw new Error("AUTH_ERROR_GDRIVE_REAUTH");
      }
      throw error;
    }
  }

  async delete(fileId: string, accountId: string): Promise<void> {
    if (!accountId) {
      throw new Error("GDrive delete: googleAccountId is mandatory.");
    }
    const drive = await getGoogleDriveClient(accountId);
    await drive.files.delete({ fileId });
  }

  async rename(
    fileId: string,
    newName: string,
    accountId: string,
  ): Promise<{ fileId: string; url?: string }> {
    if (!accountId) {
      throw new Error("GDrive rename: googleAccountId is mandatory.");
    }
    const drive = await getGoogleDriveClient(accountId);
    await drive.files.update({ fileId, requestBody: { name: newName } });
    return { fileId };
  }

  getPublicUrl(fileId: string): string {
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }
}
