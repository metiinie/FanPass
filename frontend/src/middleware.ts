import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAuthRoute = nextUrl.pathname.startsWith("/login");
  const isOrganizerRoute = nextUrl.pathname.startsWith("/dashboard");
  const isStaffRoute = nextUrl.pathname.startsWith("/scan");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
      if (role === "ORGANIZER") return NextResponse.redirect(new URL("/dashboard", nextUrl));
      if (role === "STAFF") return NextResponse.redirect(new URL("/scan", nextUrl));
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return null;
  }

  if (!isLoggedIn && (isOrganizerRoute || isStaffRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAdminRoute && role !== "SUPER_ADMIN") {
    if (role === "ORGANIZER") return NextResponse.redirect(new URL("/dashboard", nextUrl));
    if (role === "STAFF") return NextResponse.redirect(new URL("/scan", nextUrl));
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (isOrganizerRoute && role !== "ORGANIZER") {
    if (role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    if (role === "STAFF") return NextResponse.redirect(new URL("/scan", nextUrl));
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (isStaffRoute && role !== "STAFF") {
    if (role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    if (role === "ORGANIZER") return NextResponse.redirect(new URL("/dashboard", nextUrl));
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return null;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
