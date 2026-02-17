import { NextResponse } from "next/server";
import { disconnectOAuth } from "@/lib/oauth/token-storage";

export async function POST() {
  try {
    await disconnectOAuth();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting OAuth:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 },
    );
  }
}
