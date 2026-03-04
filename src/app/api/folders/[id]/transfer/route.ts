import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  unauthorizedResponse,
  getAuthenticatedUser,
} from "@/lib/auth";

import { logActivity } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse(request);
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse(request);

  try {
    const { id: folderId } = await params;
    const { newOwnerId } = await request.json();

    if (!newOwnerId) {
      return NextResponse.json(
        { error: "newOwnerId is required" },
        { status: 400 },
      );
    }

    // 1. Fetch current folder to check permissions
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { ownerId: true, name: true },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // 2. Security Check: Only the current owner or an Admin can transfer
    const isOwner = folder.ownerId === sessionUser.id;
    const isAdmin = sessionUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You do not have permission to transfer this collection",
        },
        { status: 403 },
      );
    }

    // 3. Verify new owner exists
    const newOwner = await prisma.user.findUnique({
      where: { id: newOwnerId },
      select: { id: true, name: true, email: true },
    });

    if (!newOwner) {
      return NextResponse.json(
        { error: "New owner user not found" },
        { status: 404 },
      );
    }

    // 4. Define recursive function to update all subfolders
    const transferFolderRecursively = async (currentFolderId: string) => {
      // Update the folder itself
      await prisma.folder.update({
        where: { id: currentFolderId },
        data: { ownerId: newOwnerId },
      });

      // Find children
      const children = await prisma.folder.findMany({
        where: { parentId: currentFolderId },
        select: { id: true },
      });

      // Recurse for each child
      for (const child of children) {
        await transferFolderRecursively(child.id);
      }
    };

    // 5. Perform recursive transfer
    await transferFolderRecursively(folderId);

    // 6. Log the activity
    await logActivity({
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: "TRANSFER",
      folderId: folderId,
      folderName: folder.name,
    });

    return NextResponse.json({
      message: "Ownership transferred successfully (including subfolders)",
      folder: { id: folderId, name: folder.name, ownerId: newOwnerId },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Transfer Error:", err);
    return NextResponse.json(
      { error: "Failed to transfer ownership", message: err.message },
      { status: 500 },
    );
  }
}
