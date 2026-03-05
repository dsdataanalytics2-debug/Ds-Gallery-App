import prisma from "./prisma";

/**
 * Checks if a user has access to a specific folder.
 * A user has access if:
 * 1. The folder is public.
 * 2. They are the owner of the folder.
 * 3. They have an explicit FolderPermission for the folder.
 * 4. They have access to any ancestor (parent, grandparent, ...) folder — inherited access.
 *
 * @param userId The ID of the user
 * @param folderId The ID of the folder
 * @returns Promise<boolean>
 */
export async function hasFolderAccess(
  userId: string,
  folderId: string,
): Promise<boolean> {
  if (!userId || !folderId) return false;

  // Walk up the folder hierarchy checking access at each level
  let currentFolderId: string | null = folderId;

  while (currentFolderId) {
    let folder: {
      id: string;
      ownerId: string | null;
      isPublic: boolean;
      parentId: string | null;
    } | null = null;

    try {
      const results: {
        ownerId: string | null;
        isPublic: boolean;
        id: string;
        parentId: string | null;
      }[] = await prisma.$queryRaw`
        SELECT "ownerId", "isPublic", "id", "parentId"
        FROM "Folder"
        WHERE id = ${currentFolderId}
      `;
      folder = results[0] || null;
    } catch (e) {
      console.warn("Permission check raw SQL fallback:", e);
      folder = (await prisma.folder.findUnique({
        where: { id: currentFolderId },
        select: {
          id: true,
          ownerId: true,
          isPublic: true,
          parentId: true,
        },
      })) as {
        id: string;
        ownerId: string | null;
        isPublic: boolean;
        parentId: string | null;
      } | null;
    }

    if (!folder) return false;

    // 1. Check public access
    if (folder.isPublic) return true;

    // 2. Check ownership
    if (folder.ownerId === userId) return true;

    // 3. Check explicit permission on this folder
    const permission = await prisma.folderPermission.findUnique({
      where: {
        userId_folderId: {
          userId,
          folderId: currentFolderId,
        },
      },
    });

    if (permission) return true;

    // 4. Move up to parent folder to check inherited access
    currentFolderId = folder.parentId;
  }

  return false;
}
