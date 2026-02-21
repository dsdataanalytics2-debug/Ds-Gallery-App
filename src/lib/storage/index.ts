export interface StorageResult {
  fileId: string;
  url: string;
  storageType: "local" | "gdrive" | "cloudinary";
  thumbnailUrl?: string;
}

export interface StorageProvider {
  upload(file: Buffer | ArrayBuffer, path: string): Promise<StorageResult>;
  download(fileId: string): Promise<Buffer>;
  delete(fileId: string): Promise<void>;
  rename(
    fileId: string,
    newName: string,
  ): Promise<{ fileId: string; url?: string }>;
  getPublicUrl?(fileId: string): string;
}

export async function getStorageProvider(
  type: string,
): Promise<StorageProvider> {
  if (type === "gdrive" || type === "google-drive") {
    const { GoogleDriveStorageProvider } = await import("./gdrive.provider");
    return new GoogleDriveStorageProvider();
  }

  const { LocalStorageProvider } = await import("./local.provider");
  return new LocalStorageProvider();
}
