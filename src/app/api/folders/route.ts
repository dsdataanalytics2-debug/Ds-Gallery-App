import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

    const where: Prisma.FolderWhereInput & { AND: Prisma.FolderWhereInput[] } =
      {
        AND: [],
      };

    // If not admin, restrict to owned or permitted folders
    // Plus any folders that are public (handled via ID injection to avoid Prisma sync issues)
    if (sessionUser.role !== "admin") {
      let publicFolderIds: string[] = [];
      try {
        const publicFolders =
          (await prisma.$queryRaw`SELECT id FROM "Folder" WHERE "isPublic" = true`) as {
            id: string;
          }[];
        publicFolderIds = publicFolders.map((f) => f.id);
      } catch (e: unknown) {
        const err = e as Error;
        console.warn(
          "Could not fetch public folders via raw SQL:",
          err.message,
        );
      }

      where.AND.push({
        OR: [
          { ownerId: sessionUser.id },
          { permissions: { some: { userId: sessionUser.id } } },
          { id: { in: publicFolderIds } },
        ],
      });
    }

    if (searchParams.get("isPublic") === "true") {
      where.AND.push({ isPublic: true });
    }

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
      folders.map(async (folder) => {
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
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error fetching folders:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch folders",
        details: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
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
    const {
      name,
      description,
      tags,
      productCategory,
      parentId,
      ownerId,
      isPublic,
    } = body;

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

    // Create the folder without isPublic first to avoid Prisma Client sync issues
    // We'll update it immediately after using raw SQL if needed
    const folder = await prisma.folder.create({
      data: {
        name,
        description,
        tags: tags || [],
        productCategory,
        isPublic: isPublic === true,
        parent: effectiveParentId
          ? { connect: { id: effectiveParentId } }
          : undefined,
        owner: effectiveOwnerId
          ? { connect: { id: effectiveOwnerId } }
          : undefined,
      },
    });

    // Update isPublic using raw SQL to bypass the outdated Prisma Client
    if (isPublic && folder.id) {
      try {
        await prisma.$executeRaw`UPDATE "Folder" SET "isPublic" = true WHERE id = ${folder.id}`;
        folder.isPublic = true;
      } catch (sqlError) {
        console.error("SQL Fallback Error:", sqlError);
      }
    }

    return NextResponse.json(folder);
  } catch (error: unknown) {
    const err = error as { code?: string; message: string; stack?: string };
    console.error("Error creating folder:", err);

    // Handle foreign key violation or missing record (stale user ID)
    if (err.code === "P2003" || err.code === "P2025") {
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
        message: err.message,
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}
