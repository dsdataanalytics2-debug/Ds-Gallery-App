import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  verifyAuth,
  unauthorizedResponse,
  getAuthenticatedUser,
} from "@/lib/auth";
import { hasFolderAccess } from "@/lib/permission";
import { getStorageProvider } from "@/lib/storage";
import { logActivity } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse();

  try {
    const { id } = await params;

    // Check permission - Admins have full access
    const isAdmin = sessionUser.role === "admin";
    const allowed = isAdmin || (await hasFolderAccess(sessionUser.id, id));

    if (!allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        media: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        children: {
          include: {
            _count: {
              select: { media: true },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "Failed to fetch folder" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const sessionUser = getAuthenticatedUser(request);
  if (!sessionUser) return unauthorizedResponse();

  try {
    const { id } = await params;

    // Only owner can update the folder (or we could check for a specific "manager" permission)
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder.ownerId !== sessionUser.id && sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { isPublic, ...restOfBody } = await request.json();
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: restOfBody as Prisma.FolderUpdateInput,
    });

    // Handle isPublic update via raw SQL to bypass Prisma Client sync issues
    if (isPublic !== undefined) {
      try {
        await prisma.$executeRaw`UPDATE "Folder" SET "isPublic" = ${!!isPublic} WHERE id = ${id}`;
        (
          updatedFolder as Prisma.FolderGetPayload<object> & {
            isPublic: boolean;
          }
        ).isPublic = !!isPublic;
      } catch (sqlError) {
        console.error("SQL Update Fallback Error:", sqlError);
      }
    }
    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
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
  if (!sessionUser) return unauthorizedResponse();

  try {
    const { id } = await params;

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        media: true,
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder.ownerId !== sessionUser.id && sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 1. Get all media in this folder AND subfolders recursively
    // Note: Since we are deleting the folder, we need to clean up all storage files.
    // We can use a recursive CTE or just fetch all media that have this folder as ancestor.
    // For simplicity, we'll fetch all media in this folder, and then recursively for children.

    const cleanupFolderStorage = async (folderId: string) => {
      // Get media in this folder — include googleAccountId for GDrive cleanup
      const mediaItems = await prisma.media.findMany({
        where: { folderId },
        select: {
          id: true,
          storageType: true,
          storageFileId: true,
          storagePath: true,
          googleAccountId: true,
        },
      });

      for (const item of mediaItems) {
        try {
          const storageProvider = await getStorageProvider(item.storageType);
          const fileIdToDelete = item.storageFileId || item.storagePath;
          if (fileIdToDelete) {
            // Pass googleAccountId so GDrive provider can authenticate the delete
            await storageProvider.delete(
              fileIdToDelete,
              item.googleAccountId || undefined,
            );
          }
        } catch (err) {
          console.error(`Failed to delete storage for media ${item.id}:`, err);
          // Continue with other files even if one fails
        }
      }

      // Get subfolders and recurse
      const subfolders = await prisma.folder.findMany({
        where: { parentId: folderId },
      });

      for (const sub of subfolders) {
        await cleanupFolderStorage(sub.id);
      }
    };

    await cleanupFolderStorage(id);

    // 2. Delete the folder record (Cascade handles DB-level media and subfolders)
    await prisma.folder.delete({
      where: { id },
    });

    // 3. Log the deletion activity
    if (sessionUser) {
      await logActivity({
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: "DELETE_FOLDER",
        folderId: id,
        folderName: folder.name,
      }).catch((err) => console.error("Failed to log folder deletion:", err));
    }

    return NextResponse.json({
      message: "Folder and contents deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}
