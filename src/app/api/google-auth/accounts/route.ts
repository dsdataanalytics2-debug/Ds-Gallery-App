import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/google-auth/accounts
 * Returns all connected Google accounts (no tokens exposed).
 */
export async function GET() {
  try {
    const accounts = await prisma.googleAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        tenantId: true, // Included tenantId
        email: true,
        displayName: true,
        picture: true,
        isActive: true,
        rootFolderId: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ accounts });
  } catch (err) {
    console.error("Error fetching accounts:", err);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}
