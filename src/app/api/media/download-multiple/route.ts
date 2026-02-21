import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import {
  verifyAuth,
  getAuthenticatedUser,
  unauthorizedResponse,
} from "@/lib/auth";
import { hasFolderAccess } from "@/lib/permission";
import archiver from "archiver";
import { PassThrough } from "stream";

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse();

  try {
    const { mediaIds } = await request.json();

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: "No mediaIds provided" },
        { status: 400 },
      );
    }

    const mediaItems = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
      include: { folder: true },
    });

    if (mediaItems.length === 0) {
      return NextResponse.json({ error: "No media found" }, { status: 404 });
    }

    // Permission check: Verify access for all folders involved
    const folderIds = Array.from(new Set(mediaItems.map((m) => m.folderId)));
    for (const folderId of folderIds) {
      const allowed = await hasFolderAccess(sessionUser.id, folderId);
      if (!allowed) {
        return NextResponse.json(
          { error: `Access denied to folder: ${folderId}` },
          { status: 403 },
        );
      }
    }

    // Create a pass-through stream for the ZIP
    const stream = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("ZIP Archive error:", err);
      stream.destroy(err);
    });

    archive.pipe(stream);

    // Process files and add to ZIP
    // We run this in a "fire and forget" or background way while streaming
    const processFiles = async () => {
      try {
        for (const item of mediaItems) {
          const storage = await getStorageProvider((item as any).storageType);
          const buffer = await storage.download((item as any).storageFileId);
          archive.append(buffer, { name: (item as any).fileName });
        }
        await archive.finalize();
      } catch (error) {
        console.error("Error processing files for ZIP:", error);
        archive.abort();
      }
    };

    processFiles();

    // Return the stream as a response
    return new Response(stream as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="ds_gallery_export_${Date.now()}.zip"`,
      },
    });
  } catch (error: any) {
    console.error("Multiple download error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process multiple download" },
      { status: 500 },
    );
  }
}
