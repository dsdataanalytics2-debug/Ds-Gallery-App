import prisma from "./prisma";

/**
 * Checks if a user has access to a specific folder.
 * A user has access if:
 * 1. They are the owner of the folder.
 * 2. They have an explicit FolderPermission for the folder.
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

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { ownerId: true },
  });

  if (!folder) return false;

  // 1. Check ownership
  if (folder.ownerId === userId) return true;

  // 2. Check explicit permission
  const permission = await prisma.folderPermission.findUnique({
    where: {
      userId_folderId: {
        userId,
        folderId,
      },
    },
  });

  return !!permission;
}
