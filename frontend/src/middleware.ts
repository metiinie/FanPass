import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAuthRoute = nextUrl.pathname.startsWith("/login");
  const isOrganizerRoute = nextUrl.pathname.startsWith("/dashboard");
  const isStaffRoute = nextUrl.pathname.startsWith("/scan");

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "ORGANIZER") {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
      if (role === "STAFF") {
        return NextResponse.redirect(new URL("/scan", nextUrl));
      }
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return null;
  }

  if (!isLoggedIn && (isOrganizerRoute || isStaffRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isOrganizerRoute && role !== "ORGANIZER") {
    return NextResponse.redirect(new URL("/scan", nextUrl)); // Redirect to what they have access to
  }

  if (isStaffRoute && role !== "STAFF") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return null;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
