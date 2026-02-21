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
    const formData = await request.formData();
    const folderId = formData.get("folderId") as string;
    const storageType =
      (formData.get("storageType") as string) ||
      process.env.STORAGE_PROVIDER ||
      "local";

    if (!folderId) {
      return NextResponse.json(
        { error: "folderId is required" },
        { status: 400 },
      );
    }

    // Permission check
    const allowed = await hasFolderAccess(sessionUser.id, folderId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Access denied to folder" },
        { status: 403 },
      );
    }

    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const storage = await getStorageProvider(storageType);
    const uploadedMedia = [];
    const rollbackActions: Array<() => Promise<void>> = [];

    try {
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const fileType = file.type.startsWith("image") ? "image" : "video";
        const fileFormat = fileName.split(".").pop() || "";
        const fileSize = file.size;

        // Upload to storage
        // Path: folderId/fileName (LocalStorageProvider and GoogleDriveProvider use this)
        const storageResult = await storage.upload(
          buffer,
          `${folderId}/${Date.now()}_${fileName}`,
        );

        // Add to rollback queue
        rollbackActions.push(async () => {
          await storage.delete(storageResult.fileId);
        });

        // Save to Database
        const media = await prisma.media.create({
          data: {
            folderId,
            fileName,
            fileType,
            fileFormat,
            fileSize,
            storageType: storageResult.storageType,
            storageFileId: storageResult.fileId,
            cdnUrl: storageResult.url,
            storagePath: storageResult.url, // Legacy compatibility
          },
          include: { folder: true },
        });

        uploadedMedia.push(media);

        // Log activity
        await logActivity({
          userId: sessionUser.id,
          userName: sessionUser.name,
          action: "UPLOAD",
          mediaId: media.id,
          mediaName: media.fileName,
          fileType: media.fileType,
          folderId: media.folderId,
          folderName: media.folder.name,
        });
      }

      return NextResponse.json({
        success: true,
        count: uploadedMedia.length,
        media: uploadedMedia,
      });
    } catch (innerError) {
      // Rollback: delete uploaded files if DB or other error occurs
      console.error(
        "Error during multiple upload, rolling back...",
        innerError,
      );
      for (const rollback of rollbackActions) {
        try {
          await rollback();
        } catch (rollbackError) {
          console.error("Rollback failed for a file:", rollbackError);
        }
      }
      throw innerError;
    }
  } catch (error: any) {
    console.error("Multiple upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload multiple files" },
      { status: 500 },
    );
  }
}
