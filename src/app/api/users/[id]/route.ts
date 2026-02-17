import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  getAuthenticatedUser,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const userRole = request.headers.get("x-user-role");
  if (userRole !== "admin") return forbiddenResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role } = body;

    const user = await prisma.user.update({
      where: { id },
      data: { name, role },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const userRole = request.headers.get("x-user-role");
  if (userRole !== "admin") return forbiddenResponse();

  try {
    const { id } = await params;
    const sessionUser = getAuthenticatedUser(request);

    // Safety Net: Re-assign all folders owned by this user to the current admin
    // before deleting the user. This prevents orphaned folders/assets.
    if (sessionUser) {
      await prisma.folder.updateMany({
        where: { ownerId: id },
        data: { ownerId: sessionUser.id },
      });
      console.log(
        `Safety Net: Folders owned by user ${id} transferred to admin ${sessionUser.id}`,
      );
    }

    // Also delete any folder permissions granted to this user
    await prisma.folderPermission.deleteMany({
      where: { userId: id },
    });

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "User deleted successfully and folders preserved.",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
