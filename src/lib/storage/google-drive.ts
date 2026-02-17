import { google } from "googleapis";
import { StorageProvider, UploadResult, UploadOptions } from "./index";
import { Readable } from "stream";
import { getAuthenticatedOAuthClient } from "@/lib/oauth/token-storage";

export class GoogleDriveProvider implements StorageProvider {
  private folderId: string;

  constructor() {
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
  }

  private async getDriveClient() {
    const auth = await getAuthenticatedOAuthClient();
    return google.drive({ version: "v3", auth });
  }

  async upload(
    file: File | Buffer,
    options: UploadOptions,
  ): Promise<UploadResult> {
    try {
      const drive = await this.getDriveClient();
      const { fileName, fileType } = options;

      let mediaBody: any;
      if (Buffer.isBuffer(file)) {
        mediaBody = Readable.from(file);
      } else if (file instanceof Blob) {
        // Convert Blob/File to Buffer first (Node environment)
        const arrayBuffer = await file.arrayBuffer();
        mediaBody = Readable.from(Buffer.from(arrayBuffer));
      }

      const fileMetadata: any = {
        name: fileName,
      };

      // Set parent folder if specified (My Drive folder)
      if (this.folderId) {
        fileMetadata.parents = [this.folderId];
      }

      const media = {
        mimeType: fileType === "image" ? "image/jpeg" : "video/mp4", // Simplified
        body: mediaBody,
      };

      const uploadOptions: any = {
        requestBody: fileMetadata,
        media: media,
        fields: "id, webViewLink, webContentLink, thumbnailLink",
      };

      const response = await drive.files.create(uploadOptions);

      const fileId = response.data.id;

      // Make file publicly readable (optional, depends on use case)
      // await this.drive.permissions.create({
      //   fileId: fileId!,
      //   requestBody: {
      //     role: 'reader',
      //     type: 'anyone',
      //   },
      // });

      return {
        success: true,
        url: response.data.webViewLink || "",
        cdnUrl: response.data.webContentLink || "", // Download link
        thumbnailUrl: response.data.thumbnailLink || undefined,
        publicId: fileId || undefined,
      };
    } catch (error: any) {
      console.error("Google Drive upload error:", error);
      return {
        success: false,
        url: "",
        cdnUrl: "",
        error: error.message || "Google Drive upload failed",
      };
    }
  }

  async delete(fileId: string): Promise<void> {
    try {
      if (!fileId) return;

      const drive = await this.getDriveClient();

      await drive.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      console.error("Google Drive delete error:", error);
    }
  }

  getUrl(path: string): string {
    return path;
  }
}
