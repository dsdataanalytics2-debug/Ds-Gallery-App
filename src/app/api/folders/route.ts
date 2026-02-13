import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse();
  try {
    const folders = await prisma.folder.findMany({
      include: {
        _count: {
          select: { media: true },
        },
        media: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            thumbnailUrl: true,
            cdnUrl: true,
          },
          // Removed take: 4 to fetch all media for accurate stats counting
          // Limited fields keep the payload size reasonable
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(folders);
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
  if (!verifyAuth(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const { name, description, tags, productCategory } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        description,
        tags: tags || [],
        productCategory,
      },
    });

    return NextResponse.json(folder);
  } catch (error: any) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      {
        error: "Failed to create folder",
        message: error.message,
        details: error,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
