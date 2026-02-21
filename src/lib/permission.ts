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

  let folder: { id: string; ownerId: string | null; isPublic: boolean } | null =
    null;
  try {
    const results: { ownerId: string | null; isPublic: boolean; id: string }[] =
      await prisma.$queryRaw`SELECT "ownerId", "isPublic", "id" FROM "Folder" WHERE id = ${folderId}`;
    folder = results[0] || null;
  } catch (e) {
    console.warn("Permission check raw SQL fallback:", e);
    // Fallback to standard check if raw SQL fails for some reason
    folder = (await prisma.folder.findUnique({
      where: { id: folderId },
      select: {
        id: true,
        ownerId: true,
        isPublic: true,
      },
    })) as { id: string; ownerId: string | null; isPublic: boolean } | null;
  }

  if (!folder) return false;

  // 1. Check public access
  if (folder.isPublic) return true;

  // 2. Check ownership
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
