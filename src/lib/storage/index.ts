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
export async function getStorageProvider(
  type: "local" | "google-drive" = "local",
): Promise<StorageProvider> {
  switch (type) {
    case "google-drive":
      const { GoogleDriveProvider } = await import("./google-drive");
      return new GoogleDriveProvider();
    case "local":
    default:
      const { LocalStorageProvider } = await import("./local");
      return new LocalStorageProvider();
  }
}
