import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log("Attempting to delete media with ID:", id);

    const existing = await prisma.media.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    await prisma.media.delete({
      where: { id },
    });

    console.log("Media deleted successfully:", id);
    return NextResponse.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Error deleting media:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: "Failed to delete media",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
