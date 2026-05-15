import { auth } from "@/server/auth";
import { Session } from "next-auth";

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
    let token: string | undefined;

    if (typeof window !== "undefined") {
      // Client-side: use getSession from next-auth/react
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      token = (session as Session | null)?.accessToken;
    } else {
      // Server-side: use auth() from our server config
      const session = await auth();
      token = session?.accessToken;
    }

    if (token) {
      customHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      throw new Error("Unauthorized: No access token found. Please log in again.");
    }
  }

  const url = `${BACKEND_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const response = await fetch(url, {
    ...rest,
    headers: customHeaders,
  });

  const json = await response.json();
  
  if (!response.ok || json.success === false) {
    throw new Error(json.message || `API error: ${response.status}`);
  }

  return json.data;
}
