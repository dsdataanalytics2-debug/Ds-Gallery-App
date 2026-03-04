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
    const folderIds = Array.from(
      new Set(mediaItems.map((m) => m.folderId).filter(Boolean)),
    );
    const isAdmin =
      sessionUser.role === "ADMIN" || sessionUser.role === "admin";

    for (const folderId of folderIds) {
      const allowed =
        isAdmin || (await hasFolderAccess(sessionUser.id, folderId as string));
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
          const m = item as {
            storageType: string;
            storageFileId: string;
            googleAccountId?: string | null;
            fileName: string;
          };
          const storage = await getStorageProvider(m.storageType);
          const buffer = await storage.download(
            m.storageFileId,
            m.googleAccountId || undefined,
          );
          archive.append(buffer, { name: m.fileName });
        }
        await archive.finalize();
      } catch (error) {
        console.error("Error processing files for ZIP:", error);
        archive.abort();
      }
    };

    processFiles();

    // Return the stream as a response
    return new Response(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="ds_gallery_export_${Date.now()}.zip"`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Multiple download error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process multiple download" },
      { status: 500 },
    );
  }
}
