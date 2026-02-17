import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyAuth,
  unauthorizedResponse,
  getAuthenticatedUser,
} from "@/lib/auth";

export async function GET(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse(request);
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const query = searchParams.get("q");
    const recursive = searchParams.get("recursive") === "true";
    const parentId = searchParams.get("parentId");
    const skip = (page - 1) * limit;

    const sessionUser = getAuthenticatedUser(request);
    if (!sessionUser) return unauthorizedResponse();

    const where: any = {
      AND: [
        {
          OR: [
            { ownerId: sessionUser.id },
            { permissions: { some: { userId: sessionUser.id } } },
          ],
        },
      ],
    };

    if (query) {
      where.AND.push({
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { productCategory: { contains: query, mode: "insensitive" } },
        ],
      });
    } else if (!recursive) {
      // If not searching and not recursive, apply hierarchy
      where.AND.push({ parentId: parentId || null });
    }

    const [folders, total] = await Promise.all([
      prisma.folder.findMany({
        where,
        include: {
          _count: {
            select: { media: true },
          },
          // CRITICAL FIX #5: Optimized query - load only first media for cover preview
          media: {
            take: 1,
            orderBy: { createdAt: "asc" }, // First uploaded = folder cover
            select: {
              thumbnailUrl: true,
              cdnUrl: true,
              fileType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.folder.count({ where }),
    ]);

    // CRITICAL FIX #4: Calculate separate image/video counts
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder: any) => {
        const [imageCount, videoCount] = await Promise.all([
          prisma.media.count({
            where: { folderId: folder.id, fileType: "image" },
          }),
          prisma.media.count({
            where: { folderId: folder.id, fileType: "video" },
          }),
        ]);

        return {
          ...folder,
          imageCount,
          videoCount,
        };
      }),
    );

    return NextResponse.json({
      data: foldersWithCounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch folders",
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
  if (!sessionUser) return unauthorizedResponse(request);

  try {
    const body = await request.json();
    const { name, description, tags, productCategory, parentId, ownerId } =
      body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const effectiveParentId =
      parentId === null || parentId === "null" || parentId === ""
        ? undefined
        : parentId;

    // Only admins can assign folders to other users
    const effectiveOwnerId =
      sessionUser.role === "admin" && ownerId ? ownerId : sessionUser.id;

    const folder = await prisma.folder.create({
      data: {
        name,
        description,
        tags: tags || [],
        productCategory,
        parentId: effectiveParentId,
        ownerId: effectiveOwnerId,
      } as any,
    });

    return NextResponse.json(folder);
  } catch (error: any) {
    console.error("Error creating folder:", error);

    // Handle foreign key violation (stale user ID)
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Session data mismatch",
          message:
            "Your user ID is not recognized by the database. Please log out and log in again to refresh your session.",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create folder",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
