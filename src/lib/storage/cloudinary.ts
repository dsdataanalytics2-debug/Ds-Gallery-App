import { v2 as cloudinary } from "cloudinary";
import { StorageProvider, StorageResult } from "./index";

export class CloudinaryProvider implements StorageProvider {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(
    fileBuffer: Buffer | ArrayBuffer,
    filePath: string,
  ): Promise<StorageResult> {
    try {
      // Path is usually folderId/filename
      const [folderId, fileName] = filePath.split("/");
      const buffer = Buffer.isBuffer(fileBuffer)
        ? fileBuffer
        : Buffer.from(fileBuffer as ArrayBuffer);

      const result = await new Promise<{
        public_id: string;
        secure_url: string;
      }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `ds-gallery/${folderId}`,
            public_id: fileName.replace(/\.[^/.]+$/, ""),
            use_filename: true,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error("Cloudinary upload result is empty"));
          },
        );
        uploadStream.end(buffer);
      });

      return {
        fileId: result.public_id,
        url: result.secure_url,
        storageType: "cloudinary",
        thumbnailUrl: result.secure_url.replace(/\.[^/.]+$/, ".jpg"),
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }

  async download(fileId: string): Promise<Buffer> {
    // Cloudinary usually serves via URL, but we need Buffer for ZIP
    const url = cloudinary.url(fileId);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(fileId: string): Promise<void> {
    await cloudinary.uploader.destroy(fileId);
  }

  async rename(
    fileId: string,
    newName: string,
  ): Promise<{ fileId: string; url: string }> {
    try {
      // fileId is usually 'ds-gallery/folderId/filename'
      const parts = fileId.split("/");
      // Replace the last part (filename) with the new name (minus extension for public_id)
      parts[parts.length - 1] = newName.replace(/\.[^/.]+$/, "");
      const newPublicId = parts.join("/");

      const result = await cloudinary.uploader.rename(fileId, newPublicId);
      return {
        fileId: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      console.error("Cloudinary rename error:", error);
      throw error;
    }
  }
}
