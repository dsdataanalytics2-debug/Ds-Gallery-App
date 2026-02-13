import { NextResponse } from "next/server";

export function verifyAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];
  // Simple check for our demo token
  return token === "mock-jwt-token-for-demo";
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}
