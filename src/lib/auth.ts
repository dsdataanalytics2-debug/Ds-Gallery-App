import { NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function verifyAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    // Check for query param token (needed for direct downloads/previews)
    try {
      const { searchParams } = new URL(request.url);
      token = searchParams.get("token") || undefined;
    } catch {
      // Invalid URL
    }
  }

  if (!token) {
    return false;
  }

  // Simple check for our demo token
  // In a real app, verify JWT here
  const isAuthorized = token === "mock-jwt-token-for-demo" || token.length > 10; // Basic length check for real JWTs

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
    } catch {
      return null;
    }
  }
  return null;
}

export function unauthorizedResponse(request?: Request) {
  const headers: Record<string, string> = {};
  if (request) {
    request.headers.forEach((v, k) => {
      headers[k] = v;
    });
  }
  return NextResponse.json(
    {
      error: "Unauthorized access",
      headers: request ? headers : undefined,
      message: "Missing or invalid Authorization header",
    },
    { status: 401 },
  );
}

export function forbiddenResponse(request?: Request) {
  const headers: Record<string, string> = {};
  if (request) {
    request.headers.forEach((v, k) => {
      headers[k] = v;
    });
  }
  return NextResponse.json(
    {
      error: "Forbidden: Admin access required",
      headers: request ? headers : undefined,
    },
    { status: 403 },
  );
}
