import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clearDriveClientCache } from "@/lib/gdrive-client";

/**
 * POST /api/google-auth/accounts/[id]/switch
 * Sets the specified account as active, all others inactive.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const account = await prisma.googleAccount.findUnique({ where: { id } });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Atomic transaction: deactivate all, then activate selected
    await prisma.$transaction([
      prisma.googleAccount.updateMany({ data: { isActive: false } }),
      prisma.googleAccount.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    // Clear the client cache to force fresh client creation with updated state
    clearDriveClientCache();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Switch account error:", err);
    return NextResponse.json(
      { error: "Failed to switch account" },
      { status: 500 },
    );
  }
}
