import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  unauthorizedResponse,
  getAuthenticatedUser,
} from "@/lib/auth";

// GET /api/folders/[id]/permissions - List all users who have access
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse(request);
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse(request);

  try {
    const { id: folderId } = await params;

    // 1. Fetch folder to check ownership
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { ownerId: true },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // 2. Security: Only owner or admin can see the full permission list
    if (folder.ownerId !== sessionUser.id && sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const permissions = await prisma.folderPermission.findMany({
      where: { folderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(permissions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/folders/[id]/permissions - Add a user to permissions (Share)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse(request);
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse(request);

  try {
    const { id: folderId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // 1. Check ownership
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { ownerId: true },
    });

    if (!folder)
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });

    if (folder.ownerId !== sessionUser.id && sessionUser.role !== "admin") {
      return NextResponse.json(
        { error: "Only the owner can share this folder" },
        { status: 403 },
      );
    }

    // 2. Cannot share with the owner themselves
    if (folder.ownerId === userId) {
      return NextResponse.json(
        { error: "User is already the owner" },
        { status: 400 },
      );
    }

    // 3. Create permission
    const permission = await prisma.folderPermission.upsert({
      where: {
        userId_folderId: { userId, folderId },
      },
      update: {},
      create: { userId, folderId },
    });

    return NextResponse.json(permission);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/folders/[id]/permissions - Remove a user from permissions (Unshare)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse(request);
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse(request);

  try {
    const { id: folderId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // 1. Check folder
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { ownerId: true },
    });

    if (!folder)
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });

    // 2. Security: Owner, Admin, or the User themselves (unsharing themselves)
    const isOwner = folder.ownerId === sessionUser.id;
    const isAdmin = sessionUser.role === "admin";
    const isSelf = sessionUser.id === userId;

    if (!isOwner && !isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Delete permission
    await prisma.folderPermission.deleteMany({
      where: { userId, folderId },
    });

    return NextResponse.json({ message: "Access revoked successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
