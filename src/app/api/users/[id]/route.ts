import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
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

    // Prevent self-deletion if possible (logic would depend on current user ID)

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
