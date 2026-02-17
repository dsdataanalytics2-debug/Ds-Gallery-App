import { NextResponse } from "next/server";
import { isOAuthConnected } from "@/lib/oauth/token-storage";

export async function GET() {
  try {
    const connected = await isOAuthConnected();
    return NextResponse.json({ connected });
  } catch (error) {
    console.error("Error checking OAuth status:", error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
