import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  if (!verifyAuth(request)) return unauthorizedResponse(request);
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get("publicOnly") === "true";

    // 1. Basic counts
    const filterWhere: Prisma.MediaWhereInput = publicOnly
      ? { folder: { isPublic: true } }
      : {};

    const totalMedia = await prisma.media.count({ where: filterWhere });
    const imageCount = await prisma.media.count({
      where: { ...filterWhere, fileType: "image" },
    });
    const videoCount = await prisma.media.count({
      where: { ...filterWhere, fileType: "video" },
    });

    // 2. Storage usage (Public Only)
    const storageStats = await prisma.media.aggregate({
      where: filterWhere,
      _sum: {
        fileSize: true,
      },
    });
    const totalSizeBytes = storageStats._sum.fileSize || 0;

    // 3. Growth (this month vs last month)
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const countThisMonth = await prisma.media.count({
      where: {
        ...filterWhere,
        createdAt: {
          gte: firstDayThisMonth,
        },
      },
    });

    const countLastMonth = await prisma.media.count({
      where: {
        ...filterWhere,
        createdAt: {
          gte: firstDayLastMonth,
          lt: firstDayThisMonth,
        },
      },
    });

    let growthRate = 0;
    if (countLastMonth > 0) {
      growthRate = ((countThisMonth - countLastMonth) / countLastMonth) * 100;
    } else if (countThisMonth > 0) {
      growthRate = 100;
    }

    // 4. Recent activity (Public Only)
    const recentActivity = await prisma.media.findMany({
      where: filterWhere,
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      include: {
        folder: {
          select: {
            name: true,
          },
        },
      },
    });

    // 5. Folder distribution
    const folderStats = await prisma.folder.findMany({
      where: publicOnly ? { isPublic: true } : {},
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            media: true,
          },
        },
      },
      take: 5,
      orderBy: {
        media: {
          _count: "desc",
        },
      },
    });

    return NextResponse.json({
      summary: {
        totalMedia,
        imageCount,
        videoCount,
        totalSizeBytes,
        growthRate: growthRate.toFixed(1),
      },
      recentActivity,
      folderDistribution: folderStats,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
