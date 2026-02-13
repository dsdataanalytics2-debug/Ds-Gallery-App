import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  unauthorizedResponse,
  forbiddenResponse,
  getAuthenticatedUser,
} from "@/lib/auth";

export async function GET(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  const user = getAuthenticatedUser(request);

  if (user?.role !== "admin") {
    return forbiddenResponse();
  }

  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100, // Limit to recent 100 for now
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity history" },
      { status: 500 },
    );
  }
}
