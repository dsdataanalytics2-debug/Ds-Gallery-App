import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * DELETE /api/google-auth/accounts/[id]
 * - Blocks deletion if media files reference this account (409 Conflict).
 * - Promotes the next available account to active if this was active.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const account = await prisma.googleAccount.findUnique({ where: { id } });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Block if media files reference this account
    const mediaCount = await prisma.media.count({
      where: { googleAccountId: id },
    });
    if (mediaCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot remove this account — ${mediaCount} file${mediaCount === 1 ? "" : "s"} ${mediaCount === 1 ? "is" : "are"} stored here. Delete or reassign those files first.`,
          mediaCount,
        },
        { status: 409 },
      );
    }

    await prisma.googleAccount.delete({ where: { id } });

    // If deleted account was active, promote the oldest remaining account
    if (account.isActive) {
      const next = await prisma.googleAccount.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await prisma.googleAccount.update({
          where: { id: next.id },
          data: { isActive: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Disconnect account error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 },
    );
  }
}
