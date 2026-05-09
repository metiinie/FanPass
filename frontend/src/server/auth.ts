import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  phone: z.string().min(10, "Invalid phone number"),
  code: z.string().length(6, "Code must be 6 digits"),
});

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Invalid input.");
        }

        const { phone, code } = parsed.data;

        try {
          const res = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, code }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Invalid or expired OTP.");
          }

          // The backend returns user data + an accessToken
          return {
            id: data.user.id,
            phone: data.user.phone,
            name: data.user.name,
            role: data.user.role,
            organizerId: data.user.organizerId,
            accessToken: data.accessToken,
          };
        } catch (error: any) {
          throw new Error(error.message || "Failed to authenticate.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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
        session.user.id = token.id;
        session.user.phone = token.phone;
        session.user.name = token.name;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
        if (token.organizerId) session.user.organizerId = token.organizerId;
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
  secret: process.env.NEXTAUTH_SECRET,
});
