import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  unauthorizedResponse,
  getAuthenticatedUser,
} from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { hasFolderAccess } from "@/lib/permission";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);

  try {
    const { id } = await params;
    const media = await prisma.media.findUnique({
      where: { id },
      include: { folder: true },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (!sessionUser) return unauthorizedResponse();

    // Check permission
    const allowed = await hasFolderAccess(sessionUser.id, media.folderId);
    if (!allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Log the download activity
    if (sessionUser) {
      await logActivity({
        userId: sessionUser!.id,
        userName: sessionUser!.name,
        action: "DOWNLOAD",
        mediaId: media.id,
        mediaName: media.fileName,
        fileType: media.fileType,
        folderId: media.folderId,
        folderName: media.folder.name,
      });
    }

    // Return the media data so the client can handle the actual download
    // Or we could redirect, but returning JSON is safer for the current client logic
    return NextResponse.json({
      url: media.cdnUrl,
      fileName: media.fileName,
    });
  } catch (error) {
    console.error("Error in download tracking:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 },
    );
  }
}
