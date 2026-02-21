import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";
import {
  verifyAuth,
  getAuthenticatedUser,
  unauthorizedResponse,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = (formData.get("fileName") as string) || file.name;
    const storageType = (formData.get("storageType") as string) || "local";
    const folderId = (formData.get("folderId") as string) || "unsorted"; // Default folder if not provided

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = await getStorageProvider(storageType);

    // Use the new path structure: folderId/fileName
    const storageResult = await storage.upload(
      buffer,
      `${folderId}/${Date.now()}_${fileName}`,
    );

    // Handle optional thumbnail if provided
    let thumbnailUrl = null;
    let thumbnailFileId = null;

    const thumbnailFile = formData.get("thumbnail") as File;
    if (thumbnailFile) {
      const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const thumbResult = await storage.upload(
        thumbBuffer,
        `${folderId}/thumb_${Date.now()}_${fileName.split(".")[0]}.jpg`,
      );
      thumbnailUrl = thumbResult.url;
      thumbnailFileId = thumbResult.fileId;
    }

    return NextResponse.json({
      success: true,
      url: storageResult.url,
      cdnUrl: storageResult.url,
      publicId: storageResult.fileId,
      thumbnailUrl: thumbnailUrl,
      thumbnailPublicId: thumbnailFileId,
      storageType: storageResult.storageType,
    });
  } catch (error: any) {
    console.error("Upload error detail:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file" },
      { status: 500 },
    );
  }
}
