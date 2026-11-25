import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { canAccessPath, type SessionUser } from "@/lib/rbac";
import type { AppRole } from "@/lib/roles";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/notifications/stream")) {
    // Stream handles its own auth; avoid buffering EventSource through extra redirects.
    if (pathname.startsWith("/api/notifications/stream") && !isLoggedIn) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const u = req.auth!.user;
  const user: SessionUser = {
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    role: u.role as AppRole,
    isKaprodi: Boolean(u.isKaprodi),
    prodiId: u.prodiId ?? null,
  };

  if (!canAccessPath(user, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
