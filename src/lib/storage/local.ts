import fs from "fs";
import path from "path";
import { StorageProvider, UploadResult, UploadOptions } from "./index";

export class LocalStorageProvider implements StorageProvider {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = process.env.UPLOADS_DIR || "public/uploads";
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = [
      path.join(process.cwd(), this.uploadsDir),
      path.join(process.cwd(), this.uploadsDir, "images"),
      path.join(process.cwd(), this.uploadsDir, "videos"),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async upload(
    fileBuffer: Buffer,
    options: UploadOptions,
  ): Promise<UploadResult> {
    try {
      const { fileName, fileType } = options;

      // Generate unique filename to prevent collisions
      const timestamp = Date.now();
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueFileName = `${timestamp}-${sanitizedName}`;

      // Determine subdirectory based on file type
      const subDir = fileType === "image" ? "images" : "videos";
      const relativePath = path.join("uploads", subDir, uniqueFileName);
      const fullPath = path.join(process.cwd(), "public", relativePath);

      // Write file to disk
      await fs.promises.writeFile(fullPath, fileBuffer);

      // Return URLs
      const url = `/${relativePath.replace(/\\/g, "/")}`;

      return {
        success: true,
        url,
        cdnUrl: url,
      };
    } catch (error) {
      console.error("Local upload error:", error);
      return {
        success: false,
        url: "",
        cdnUrl: "",
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async delete(url: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), "public", url);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  getUrl(filePath: string): string {
    return filePath.startsWith("/") ? filePath : `/${filePath}`;
  }
}
