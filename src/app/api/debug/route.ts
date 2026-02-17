import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const folders = await prisma.folder.findMany();
    // Count nulls, strings "null", undefined
    const analysis = folders.map((f: any) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      parentIdType: typeof f.parentId,
      isNull: f.parentId === null,
      isUndefined: f.parentId === undefined,
    }));

    return NextResponse.json({
      count: folders.length,
      analysis,
      raw: folders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
