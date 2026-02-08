import { NextRequest, NextResponse } from "next/server";
import { IncomingForm, File as FormidableFile } from "formidable";
import fs from "fs";
import { getStorageProvider } from "@/lib/storage";

// Disable body parser for multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Upload using storage provider
    const storage = getStorageProvider();
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

    return NextResponse.json({
      success: true,
      url: result.url,
      cdnUrl: result.cdnUrl,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
