import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  try {
    const { searchParams } = new URL(request.url);
    const folderIds = searchParams.get("folderIds")?.split(",").filter(Boolean);
    const type = searchParams.get("type"); // image | video
    const query = searchParams.get("q");

    const where: any = {};
    if (folderIds && folderIds.length > 0) {
      where.folderId = { in: folderIds };
    }
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
  if (!verifyAuth(request)) return unauthorizedResponse();
  try {
    const body = await request.json();

    // Validate folder exists
    if (!body.folderId) {
      return NextResponse.json(
        { error: "folderId is required" },
        { status: 400 },
      );
    }

    const folder = await prisma.folder.findUnique({
      where: { id: body.folderId },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found in database", folderId: body.folderId },
        { status: 400 },
      );
    }

    try {
      const media = await (prisma.media as any).create({
        data: {
          folderId: body.folderId,
          fileName: body.fileName,
          fileType: body.fileType,
          fileFormat: body.fileFormat,
          fileSize: body.fileSize ? Math.floor(Number(body.fileSize)) : 0,
          storagePath: body.storagePath,
          cdnUrl: body.cdnUrl,
        },
      });

      const responseMedia = {
        ...media,
      };

      return NextResponse.json(responseMedia);
    } catch (prismaError: any) {
      console.error("Prisma Create Error:", prismaError);
      return NextResponse.json(
        {
          error: "Failed to create media",
          details: prismaError.message,
          code: prismaError.code,
          meta: prismaError.meta,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error creating media entry:", error);
    return NextResponse.json(
      { error: "Failed to create media" },
      { status: 500 },
    );
  }
}
