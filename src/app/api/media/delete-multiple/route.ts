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
    const { mediaIds } = await request.json();

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: "No mediaIds provided" },
        { status: 400 },
      );
    }

    const mediaItems = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
    });

    if (mediaItems.length === 0) {
      return NextResponse.json({ error: "No media found" }, { status: 404 });
    }

    // Permission check
    const folderIds = Array.from(new Set(mediaItems.map((m) => m.folderId)));
    const isAdmin = sessionUser.role === "admin";

    if (!isAdmin) {
      for (const folderId of folderIds) {
        // Only allow owners to delete multiple items from a folder
        // hasFolderAccess might return true for public folders, but we want to restrict deletion
        const folder = await prisma.folder.findUnique({
          where: { id: folderId },
          select: { ownerId: true },
        });

        if (!folder || folder.ownerId !== sessionUser.id) {
          return NextResponse.json(
            { error: `Access denied to delete items in folder: ${folderId}` },
            { status: 403 },
          );
        }
      }
    }

    for (const item of mediaItems) {
      try {
        const storage = await getStorageProvider(item.storageType);
        const fileIdToDelete = item.storageFileId || item.storagePath;

        if (fileIdToDelete) {
          console.log(
            `Deleting file from ${item.storageType}:`,
            fileIdToDelete,
          );
          await storage.delete(fileIdToDelete);
        }
      } catch (storageError) {
        console.error(
          `Failed to delete file from storage: ${item.id}`,
          storageError,
        );
        // Continue deleting others from DB even if output cleanup fails
      }

      // Delete from DB
      await prisma.media.delete({
        where: { id: item.id },
      });
    }

    return NextResponse.json({ success: true, count: mediaItems.length });
  } catch (error: any) {
    console.error("Multiple delete error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process multiple delete" },
      { status: 500 },
    );
  }
}
