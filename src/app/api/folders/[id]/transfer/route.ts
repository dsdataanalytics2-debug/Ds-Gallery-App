import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  unauthorizedResponse,
  getAuthenticatedUser,
} from "@/lib/auth";

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
      select: { ownerId: true },
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
    });

    if (!newOwner) {
      return NextResponse.json(
        { error: "New owner user not found" },
        { status: 404 },
      );
    }

    // 4. Perform transfer
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: { ownerId: newOwnerId },
    });

    return NextResponse.json({
      message: "Ownership transferred successfully",
      folder: updatedFolder,
    });
  } catch (error: any) {
    console.error("Transfer Error:", error);
    return NextResponse.json(
      { error: "Failed to transfer ownership", message: error.message },
      { status: 500 },
    );
  }
}
