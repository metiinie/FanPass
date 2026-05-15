import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Invalid input.");
        }

        const { email, password } = parsed.data;

        try {
          const res = await fetch(`${BACKEND_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const responseData = await res.json();

          if (!res.ok) {
            throw new Error(responseData.message || "Invalid credentials.");
          }

          // In standardized API, the actual payload is inside `data`
          const payload = responseData.data || responseData;

          return {
            id: payload.user.id,
            phone: payload.user.phone,
            email: payload.user.email,
            name: payload.user.name,
            role: payload.user.role,
            organizerId: payload.user.organizerId,
            accessToken: payload.accessToken,
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error("[AUTH] Authorize Error:", errorMessage);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.phone = user.phone;
        token.name = user.name as string;
        token.role = user.role;
        token.accessToken = user.accessToken;
        if (user.organizerId) token.organizerId = user.organizerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        if (token.accessToken) session.accessToken = token.accessToken as string;
        if (token.organizerId) session.user.organizerId = token.organizerId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
