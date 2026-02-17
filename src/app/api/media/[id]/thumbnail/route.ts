import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse();

  try {
    const { id } = await params;
    const formData = await request.formData();
    const thumbnailFile = formData.get("thumbnail") as File;

    if (!thumbnailFile) {
      return NextResponse.json(
        { error: "No thumbnail provided" },
        { status: 400 },
      );
    }

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Upload to set storage provider
    const arrayBuffer = await thumbnailFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const storage = await getStorageProvider();

    // Use the original filename or similar for the thumbnail
    const result = await storage.upload(buffer, {
      fileName: `thumb_${media.fileName.split(".")[0]}_${Date.now()}.jpg`,
      fileType: "image",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 500 },
      );
    }

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        thumbnailUrl: result.cdnUrl,
        isCustomThumbnail: true,
      },
    });

    return NextResponse.json(updatedMedia);
  } catch (error: any) {
    console.error("Error updating thumbnail:", error);
    return NextResponse.json(
      {
        error: "Failed to update thumbnail",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
