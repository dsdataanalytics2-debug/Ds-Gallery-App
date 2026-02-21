import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import {
  verifyAuth,
  getAuthenticatedUser,
  unauthorizedResponse,
} from "@/lib/auth";
import { hasFolderAccess } from "@/lib/permission";

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse();

  try {
    const { mediaIds, baseName } = await request.json();

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: "No mediaIds provided" },
        { status: 400 },
      );
    }

    if (!baseName) {
      return NextResponse.json(
        { error: "baseName is required" },
        { status: 400 },
      );
    }

    const mediaItems = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
      orderBy: { createdAt: "asc" }, // Deterministic order for numbering
    });

    if (mediaItems.length === 0) {
      return NextResponse.json({ error: "No media found" }, { status: 404 });
    }

    console.log(
      `Starting sequential bulk rename for ${mediaItems.length} items with base: "${baseName}"`,
    );

    // Permission check
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

    const renamed = [];
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const index = i + 1;

      console.log(`Processing rename for item: ${item.id} (${item.fileName})`);
      const storage = await getStorageProvider((item as any).storageType);

      const storageId =
        (item as any).storageFileId || (item as any).storagePath;
      if (!storageId) {
        throw new Error(`Media item ${item.id} has no valid storage ID`);
      }

      // Preserve original extension
      const extension = item.fileName.includes(".")
        ? item.fileName.substring(item.fileName.lastIndexOf("."))
        : "";

      const newFileName = `${baseName}_${index}${extension}`;
      console.log(`Renaming in storage: ${storageId} -> ${newFileName}`);

      // Rename in storage and get new mapping
      const result = await storage.rename(storageId, newFileName);

      // Update in DB
      try {
        const updated = await prisma.media.update({
          where: { id: item.id },
          data: {
            fileName: newFileName,
            storageFileId: result.fileId,
            cdnUrl: result.url || item.cdnUrl,
          } as any,
        });
        renamed.push(updated);
      } catch (prismaError: any) {
        console.error(
          `Prisma update FAILED for item ${item.id}:`,
          prismaError.message,
        );
        throw prismaError;
      }
    }

    return NextResponse.json({
      success: true,
      count: renamed.length,
      media: renamed,
    });
  } catch (error: any) {
    console.error("Multiple rename error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process multiple rename" },
      { status: 500 },
    );
  }
}
