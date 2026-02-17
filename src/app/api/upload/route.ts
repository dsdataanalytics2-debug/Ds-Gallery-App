import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";

// Helper to parse form data from NextRequest
async function parseForm(
  req: NextRequest,
): Promise<{ fields: any; files: any }> {
  const formData = await req.formData();
  const fields: any = {};
  const files: any = {};

  formData.forEach((value, key) => {
    if (value instanceof File) {
      if (!files[key]) files[key] = [];
      files[key].push(value);
    } else {
      fields[key] = value;
    }
  });

  return { fields, files };
}

export async function POST(request: NextRequest) {
  try {
    const { fields, files } = await parseForm(request);

    if (!files.file || files.file.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const file = files.file[0] as File;
    const fileName = fields.fileName || file.name;
    const fileType = (fields.fileType ||
      (file.type.startsWith("image") ? "image" : "video")) as "image" | "video";

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storageType = (fields.storageType || "local") as
      | "local"
      | "google-drive";

    // Upload using storage provider
    const storage = await getStorageProvider(storageType);
    const result = await storage.upload(buffer, {
      fileName,
      fileType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 500 },
      );
    }

    // Handle optional thumbnail if provided (Local storage fallback)
    let finalThumbnailUrl = result.thumbnailUrl;
    let thumbnailPublicId = undefined;

    if (files.thumbnail && files.thumbnail.length > 0) {
      const thumbFile = files.thumbnail[0] as File;
      const thumbBuffer = Buffer.from(await thumbFile.arrayBuffer());
      const thumbResult = await storage.upload(thumbBuffer, {
        fileName: `thumb_${fileName.split(".")[0]}_${Date.now()}.jpg`,
        fileType: "image",
      });
      if (thumbResult.success) {
        finalThumbnailUrl = thumbResult.cdnUrl;
        thumbnailPublicId = thumbResult.publicId;
      }
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      cdnUrl: result.cdnUrl,
      thumbnailUrl: finalThumbnailUrl,
      publicId: result.publicId,
      thumbnailPublicId: thumbnailPublicId,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error message:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file" },
      { status: 500 },
    );
  }
}
