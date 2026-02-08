import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const type = searchParams.get("type"); // image | video
    const query = searchParams.get("q");

    const where: any = {};
    if (folderId) where.folderId = folderId;
    if (type) where.fileType = type;
    if (query) {
      where.OR = [
        { fileName: { contains: query, mode: "insensitive" } },
        { tags: { has: query } },
      ];
    }

    const media = await prisma.media.findMany({
      where,
      include: {
        folder: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const media = await prisma.media.create({
      data: body,
    });
    return NextResponse.json(media);
  } catch (error) {
    console.error("Error creating media entry:", error);
    return NextResponse.json(
      { error: "Failed to create media" },
      { status: 500 },
    );
  }
}
