import prisma from "./prisma";

export type AuditAction = "UPLOAD" | "DELETE" | "DOWNLOAD";

interface AuditLogParams {
  userId: string;
  userName?: string | null;
  action: AuditAction;
  mediaId?: string;
  mediaName?: string;
  fileType?: string;
  folderId?: string;
  folderName?: string;
}

export async function logActivity(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        mediaId: params.mediaId,
        mediaName: params.mediaName,
        fileType: params.fileType,
        folderId: params.folderId,
        folderName: params.folderName,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
