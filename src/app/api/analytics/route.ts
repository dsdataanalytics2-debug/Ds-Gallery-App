import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Basic counts
    const totalMedia = await prisma.media.count();
    const imageCount = await prisma.media.count({
      where: { fileType: "image" },
    });
    const videoCount = await prisma.media.count({
      where: { fileType: "video" },
    });

    // 2. Storage usage
    const storageStats = await prisma.media.aggregate({
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
        createdAt: {
          gte: firstDayThisMonth,
        },
      },
    });

    const countLastMonth = await prisma.media.count({
      where: {
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

    // 4. Recent activity
    const recentActivity = await prisma.media.findMany({
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
