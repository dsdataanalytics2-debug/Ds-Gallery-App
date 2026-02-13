// Storage provider interface
export interface UploadResult {
  success: boolean;
  url: string;
  cdnUrl: string;
  thumbnailUrl?: string;
  publicId?: string;
  error?: string;
}

export interface UploadOptions {
  fileName: string;
  fileType: "image" | "video";
  folder?: string;
}

export interface StorageProvider {
  upload(file: File | Buffer, options: UploadOptions): Promise<UploadResult>;
  delete(url: string): Promise<void>;
  getUrl(path: string): string;
}

// Factory function to get the appropriate storage provider
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || "local";

  switch (provider.toLowerCase()) {
    case "cloudinary":
      // Dynamic import to avoid loading unnecessary code
      const { CloudinaryProvider } = require("./cloudinary");
      return new CloudinaryProvider();
    case "local":
    default:
      const { LocalStorageProvider } = require("./local");
      return new LocalStorageProvider();
  }
}
