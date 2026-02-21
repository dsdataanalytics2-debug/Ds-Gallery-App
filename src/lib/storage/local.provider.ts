import fs from "fs";
import path from "path";
import { StorageProvider, StorageResult } from "./index";

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(
    file: Buffer | ArrayBuffer,
    filePath: string,
  ): Promise<StorageResult> {
    try {
      // filePath should be folderId/fileName
      const fullPath = path.join(this.baseDir, filePath);
      const parentDir = path.dirname(fullPath);

      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
      await fs.promises.writeFile(fullPath, buffer);

      const relativePath = `/uploads/${filePath.replace(/\\/g, "/")}`;

      return {
        fileId: relativePath, // Local path is used as fileId
        url: relativePath,
        storageType: "local",
      };
    } catch (error) {
      console.error("Local upload error:", error);
      throw new Error(
        `Local upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async download(fileId: string): Promise<Buffer> {
    try {
      // fileId is /uploads/folderId/fileName
      const relativePath = fileId.startsWith("/uploads/")
        ? fileId.substring(9)
        : fileId;
      const fullPath = path.join(this.baseDir, relativePath);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
      }

      return await fs.promises.readFile(fullPath);
    } catch (error) {
      console.error("Local download error:", error);
      throw error;
    }
  }

  async delete(fileId: string): Promise<void> {
    try {
      const relativePath = fileId.startsWith("/uploads/")
        ? fileId.substring(9)
        : fileId;
      const fullPath = path.join(this.baseDir, relativePath);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      console.error("Local delete error:", error);
      throw error;
    }
  }

  async rename(
    fileId: string,
    newName: string,
  ): Promise<{ fileId: string; url: string }> {
    try {
      const relativePath = fileId.startsWith("/uploads/")
        ? fileId.substring(9)
        : fileId;
      const oldPath = path.join(this.baseDir, relativePath);
      const parentDir = path.dirname(oldPath);
      const sanitizedNewName = newName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const newPath = path.join(parentDir, sanitizedNewName);

      if (fs.existsSync(oldPath)) {
        await fs.promises.rename(oldPath, newPath);

        const newRelativeDir = path.dirname(relativePath);
        const newFileId = `/uploads/${path.join(newRelativeDir, sanitizedNewName).replace(/\\/g, "/")}`;

        return {
          fileId: newFileId,
          url: newFileId,
        };
      } else {
        throw new Error(`File not found for rename: ${oldPath}`);
      }
    } catch (error) {
      console.error("Local rename error:", error);
      throw error;
    }
  }
}
