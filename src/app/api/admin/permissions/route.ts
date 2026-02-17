import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  unauthorizedResponse,
  getAuthenticatedUser,
  forbiddenResponse,
} from "@/lib/auth";

/**
 * POST /api/admin/permissions
 * Body: { userId: string, folderId: string }
 *
 * GET /api/admin/permissions?folderId=...
 * Returns list of users with permission for a folder
 *
 * DELETE /api/admin/permissions?userId=...&folderId=...
 * Revokes permission
 */

export async function POST(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { userId, folderId } = body;

    if (!userId || !folderId) {
      return NextResponse.json(
        { error: "userId and folderId are required" },
        { status: 400 },
      );
    }

    // Check if folder exists and if sessionUser is owner or admin
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder.ownerId !== sessionUser.id && sessionUser.role !== "admin") {
      return forbiddenResponse();
    }

    const permission = await prisma.folderPermission.upsert({
      where: {
        userId_folderId: {
          userId,
          folderId,
        },
      },
      update: {},
      create: {
        userId,
        folderId,
      },
    });

    return NextResponse.json(permission);
  } catch (error) {
    console.error("Error granting permission:", error);
    return NextResponse.json(
      { error: "Failed to grant permission" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json(
        { error: "folderId is required" },
        { status: 400 },
      );
    }

    // Check if folder exists and if sessionUser has access
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        permissions: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder.ownerId !== sessionUser.id && sessionUser.role !== "admin") {
      return forbiddenResponse();
    }

    return NextResponse.json(folder.permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const folderId = searchParams.get("folderId");

    if (!userId || !folderId) {
      return NextResponse.json(
        { error: "userId and folderId are required" },
        { status: 400 },
      );
    }

    // Check if folder exists and if sessionUser is owner or admin
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder.ownerId !== sessionUser.id && sessionUser.role !== "admin") {
      return forbiddenResponse();
    }

    await prisma.folderPermission.delete({
      where: {
        userId_folderId: {
          userId,
          folderId,
        },
      },
    });

    return NextResponse.json({ message: "Permission revoked" });
  } catch (error) {
    console.error("Error revoking permission:", error);
    return NextResponse.json(
      { error: "Failed to revoke permission" },
      { status: 500 },
    );
  }
}
