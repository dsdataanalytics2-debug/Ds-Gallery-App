import { v2 as cloudinary } from "cloudinary";
import { StorageProvider, UploadResult, UploadOptions } from "./index";

export class CloudinaryProvider implements StorageProvider {
  constructor() {
    // Configure Cloudinary with environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(
    fileBuffer: Buffer,
    options: UploadOptions,
  ): Promise<UploadResult> {
    try {
      const { fileName, fileType } = options;

      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: fileType === "video" ? "video" : "image",
            folder: `ds-gallery/${fileType}s`,
            public_id: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
            use_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        uploadStream.end(fileBuffer);
      });

      return {
        success: true,
        url: result.secure_url,
        cdnUrl: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return {
        success: false,
        url: "",
        cdnUrl: "",
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary delete error:", error);
    }
  }

  getUrl(path: string): string {
    return path;
  }
}
