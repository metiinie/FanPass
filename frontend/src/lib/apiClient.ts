import { auth } from "@/server/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Universal fetch client for communicating with the NestJS backend.
 * Automatically attaches the JWT if requireAuth is true.
 * Designed to be used safely in Next.js Server Components and Server Actions.
 */
export async function fetchBackend(endpoint: string, options: FetchOptions = {}) {
  const { requireAuth = true, headers, ...rest } = options;
  
  const customHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...((headers as Record<string, string>) || {}),
  };

  if (requireAuth) {
    const session = await auth();
    if (session?.accessToken) {
      customHeaders["Authorization"] = `Bearer ${session.accessToken}`;
    } else {
      throw new Error("Unauthorized: No access token found");
    }
  }

  const url = `${BACKEND_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const response = await fetch(url, {
    ...rest,
    headers: customHeaders,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `API error: ${response.status}`);
  }

  return response;
}
