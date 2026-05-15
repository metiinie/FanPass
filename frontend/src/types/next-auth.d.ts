import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      name: string;
      role: string;
      organizerId?: string;
    } & DefaultSession["user"];
    accessToken: string;
  }

  interface User extends DefaultUser {
    phone: string;
    role: string;
    organizerId?: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone: string;
    name: string;
    role: string;
    organizerId?: string;
    accessToken: string;
  }
}
