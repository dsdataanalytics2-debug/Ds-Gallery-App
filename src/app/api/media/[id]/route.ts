import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  unauthorizedResponse,
  getAuthenticatedUser,
} from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { getStorageProvider } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);

  try {
    const { id } = await params;
    console.log("Attempting to delete media with ID:", id);

    const existing = await prisma.media.findUnique({
      where: { id },
      include: { folder: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // 1. Delete from storage if storage provider is available
    try {
      const storageProvider = await getStorageProvider(existing.storageType);
      const fileIdToDelete = existing.storageFileId || existing.storagePath;
      if (fileIdToDelete) {
        console.log(
          `Deleting file from ${existing.storageType}:`,
          fileIdToDelete,
        );
        await storageProvider.delete(fileIdToDelete);
      }
    } catch (storageError) {
      console.error(
        "Storage deletion error (continuing with DB deletion):",
        storageError,
      );
      // We continue with DB deletion even if storage deletion fails,
      // otherwise user is stuck with a broken entry.
    }

    // 2. Log the activity before deletion
    if (sessionUser) {
      await logActivity({
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: "DELETE",
        mediaId: existing.id,
        mediaName: existing.fileName,
        fileType: existing.fileType,
        folderId: existing.folderId,
        folderName: existing.folder.name,
      });
    }

    await prisma.media.delete({
      where: { id },
    });

    console.log("Media deleted successfully:", id);
    return NextResponse.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      {
        error: "Failed to delete media",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
