import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";
import { StorageProvider, StorageResult } from "./index";
import { getOptionalAuthenticatedDrive } from "@/lib/oauth/token-storage";
import prisma from "@/lib/prisma";

export class GoogleDriveStorageProvider implements StorageProvider {
  private serviceAccountDrive: drive_v3.Drive;
  private rootFolderName = "DS-Gallery";
  private baseFolderId: string | undefined;

  constructor() {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    this.serviceAccountDrive = google.drive({ version: "v3", auth });
    this.baseFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  }

  /**
   * Prioritizes User OAuth drive, falls back to Service Account drive
   */
  private async getDrive() {
    try {
      const userDrive = await getOptionalAuthenticatedDrive();
      if (userDrive) {
        return userDrive;
      }
    } catch (err) {
      console.warn("OAuth drive failed, falling back to Service Account:", err);
    }
    return this.serviceAccountDrive;
  }

  private async getOrCreateFolder(
    name: string,
    parentId?: string,
  ): Promise<string> {
    console.log(
      `GDrive: getOrCreateFolder(name="${name}", parentId="${parentId || "root"}")`,
    );
    const drive = await this.getDrive();
    // If no parentId provided, and we have a baseFolderId, use it for the root search
    const actualParentId = parentId || this.baseFolderId;

    // Sanitize name for GDrive search
    const sanitizedName = name.replace(/'/g, "\\'");
    let q = `name='${sanitizedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (actualParentId) {
      q += ` and '${actualParentId}' in parents`;
    }

    const response = await drive.files.list({
      q,
      fields: "files(id, name)",
      spaces: "drive",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (response.data.files && response.data.files.length > 0) {
      const folderId = response.data.files[0].id;
      if (folderId) return folderId;
    }

    const fileMetadata = {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: actualParentId ? [actualParentId] : [],
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
      supportsAllDrives: true,
    });

    if (!folder.data.id) {
      throw new Error("Failed to create folder in Google Drive");
    }

    return folder.data.id;
  }

  /**
   * Builds the GDrive folder hierarchy corresponding to the DB folder structure
   */
  private async getDriveFolderHierarchy(
    folderId: string,
    rootId: string,
  ): Promise<string> {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { parent: true },
    });

    if (!folder) {
      // Fallback: If folder not in DB, create a folder with the ID itself under root
      return await this.getOrCreateFolder(folderId, rootId);
    }

    // Build the path of folder names from root to this folder
    const path = [];
    let current: { id: string; name: string; parentId?: string | null } | null =
      folder;
    while (current) {
      path.unshift(current.name);
      if (current.parentId) {
        current = await prisma.folder.findUnique({
          where: { id: current.parentId },
        });
      } else {
        current = null;
      }
    }

    // Create/get folders recursively in GDrive
    let currentParentId = rootId;
    console.log(
      `GDrive: Building hierarchy for folder "${folder.name}" (${folderId})`,
    );
    for (const segment of path) {
      console.log(`GDrive: Processing path segment: "${segment}"`);
      currentParentId = await this.getOrCreateFolder(segment, currentParentId);
    }

    console.log(`GDrive: Final Target Folder ID: ${currentParentId}`);
    return currentParentId;
  }

  async upload(
    file: Buffer | ArrayBuffer,
    filePath: string,
  ): Promise<StorageResult> {
    try {
      const drive = await this.getDrive();
      const parts = filePath.split("/");
      const folderId = parts[0];
      const fileName = parts.slice(1).join("/");

      const rootId = await this.getOrCreateFolder(this.rootFolderName);
      const targetFolderId = await this.getDriveFolderHierarchy(
        folderId,
        rootId,
      );

      const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
      const media = {
        body: Readable.from(buffer),
        mimeType: "application/octet-stream", // Allow Drive to handle specific types if it can
      };

      const fileMetadata = {
        name: fileName,
        parents: [targetFolderId],
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id, webViewLink, webContentLink, thumbnailLink",
        supportsAllDrives: true,
      });

      return {
        fileId: response.data.id!,
        url: response.data.webContentLink || response.data.webViewLink || "",
        thumbnailUrl: response.data.thumbnailLink || undefined,
        storageType: "gdrive",
      };
    } catch (error) {
      console.error("GDrive upload error:", error);
      throw new Error(
        `GDrive upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async download(fileId: string): Promise<Buffer> {
    try {
      const drive = await this.getDrive();
      const response = await drive.files.get(
        { fileId, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer" },
      );
      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      console.error("GDrive download error:", error);
      throw error;
    }
  }

  async delete(fileId: string): Promise<void> {
    try {
      const drive = await this.getDrive();
      await drive.files.delete({ fileId, supportsAllDrives: true });
    } catch (error) {
      console.error("GDrive delete error:", error);
      throw error;
    }
  }

  async rename(
    fileId: string,
    newName: string,
  ): Promise<{ fileId: string; url?: string }> {
    try {
      const drive = await this.getDrive();
      await drive.files.update({
        fileId,
        requestBody: { name: newName },
        supportsAllDrives: true,
      });
      return { fileId };
    } catch (error) {
      console.error(
        "GDrive rename error:",
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  getPublicUrl(fileId: string): string {
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }
}
