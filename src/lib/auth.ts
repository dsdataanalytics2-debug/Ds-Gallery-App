import { NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function verifyAuth(request: Request, requiredRole?: string) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];
  // Simple check for our demo token
  const isAuthorized = token === "mock-jwt-token-for-demo";

  if (!isAuthorized) return false;

  // In a real app, we'd decode the JWT here.
  // For demo, we assume role check passes if authenticated for now,
  // but we should check headers or similar for the role during testing.
  return true;
}

export function getAuthenticatedUser(request: Request): AuthUser | null {
  // In our demo, we're passing user info in headers or it's stored in local storage
  // For the API to be stateless, we should ideally decode the token.
  // For this mock implementation, we'll look for custom headers if present.
  const userJson = request.headers.get("x-user-data");
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: "Forbidden: Admin access required" },
    { status: 403 },
  );
}
