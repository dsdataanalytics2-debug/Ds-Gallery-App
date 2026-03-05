import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import {
  verifyAuth,
  getAuthenticatedUser,
  unauthorizedResponse,
} from "@/lib/auth";
import { hasFolderAccess } from "@/lib/permission";
import { logActivity } from "@/lib/audit";

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
      include: { folder: true }, // Required for accurate audit log
    });

    if (mediaItems.length === 0) {
      return NextResponse.json({ error: "No media found" }, { status: 404 });
    }

    // Permission check
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

    const renamed = [];
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const index = i + 1;

      const m = item as {
        storageType: string;
        storageFileId?: string | null;
        storagePath?: string | null;
        googleAccountId?: string | null;
      };
      const storage = await getStorageProvider(m.storageType);

      const storageId = m.storageFileId || m.storagePath;
      if (!storageId) {
        throw new Error(`Media item ${item.id} has no valid storage ID`);
      }

      // Preserve original extension
      const extension = item.fileName.includes(".")
        ? item.fileName.substring(item.fileName.lastIndexOf("."))
        : "";

      const newFileName = `${baseName}_${index}${extension}`;

      // Rename in storage and get new mapping
      const result = await storage.rename(
        storageId,
        newFileName,
        m.googleAccountId || undefined,
      );

      // Update in DB
      try {
        const updated = await prisma.media.update({
          where: { id: item.id },
          data: {
            fileName: newFileName,
            storageFileId: result.fileId,
            cdnUrl: result.url || item.cdnUrl,
          },
        });

        if (sessionUser) {
          await logActivity({
            userId: sessionUser.id,
            userName: sessionUser.name,
            action: "RENAME",
            mediaId: updated.id,
            mediaName: updated.fileName,
            fileType: updated.fileType,
            folderId: item.folderId,
            folderName: item.folder?.name || "Unknown",
          });
        }

        renamed.push(updated);
      } catch (prismaError: unknown) {
        const pErr = prismaError as Error;
        console.error(
          `Prisma update FAILED for item ${item.id}:`,
          pErr.message,
        );
        throw pErr;
      }
    }

    return NextResponse.json({
      success: true,
      count: renamed.length,
      media: renamed,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Multiple rename error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process multiple rename" },
      { status: 500 },
    );
  }
}
