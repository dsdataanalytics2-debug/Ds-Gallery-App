import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  unauthorizedResponse,
  getAuthenticatedUser,
} from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse(request);
  try {
    const { searchParams } = new URL(request.url);
    const folderIds = searchParams.get("folderIds")?.split(",").filter(Boolean);
    const type = searchParams.get("type"); // image | video
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

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

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          folder: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.media.count({ where }),
    ]);

    return NextResponse.json({
      data: media,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch media",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse(request);
  const sessionUser = getAuthenticatedUser(request);
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
      const media = await prisma.media.create({
        data: {
          folderId: body.folderId,
          fileName: body.fileName || "Untitled",
          fileType: body.fileType || "image",
          fileFormat: body.fileFormat || "unknown",
          fileSize: body.fileSize ? Math.floor(Number(body.fileSize)) : 0,
          storagePath: body.storagePath || body.cdnUrl || "unknown",
          storageType: body.storageType || "local",
          publicId: body.publicId || null,
          cdnUrl: body.cdnUrl || "unknown",
          thumbnailUrl: body.thumbnailUrl || null,
          isCustomThumbnail: body.isCustomThumbnail || false,
          tags: body.tags || [],
          metadata: body.metadata || {},
        },
      });

      // Log the activity
      if (sessionUser) {
        await logActivity({
          userId: sessionUser.id,
          userName: sessionUser.name,
          action: "UPLOAD",
          mediaId: media.id,
          mediaName: media.fileName,
          fileType: media.fileType,
          folderId: folder.id,
          folderName: folder.name,
        });
      }

      return NextResponse.json(media);
    } catch (prismaError: any) {
      console.error("Prisma Create Error:", prismaError);
      return NextResponse.json(
        {
          error: "Failed to create media entry in database",
          details: prismaError.message,
          code: prismaError.code,
          meta: prismaError.meta,
          stack:
            process.env.NODE_ENV === "development"
              ? prismaError.stack
              : undefined,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("CRITICAL Error creating media entry:", error);
    return NextResponse.json(
      {
        error: "Failed to create media",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
