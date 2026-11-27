import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, supabaseReady } from "@/lib/supabase/env";
import { canAccessPath } from "@/lib/rbac";
import { decodeProfile, PROFILE_COOKIE } from "@/lib/profile-cookie";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/uploads") ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$/i)
  ) {
    return NextResponse.next();
  }

  if (!supabaseReady) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isLoggedIn = !!session?.user;

  if (pathname.startsWith("/api/notifications/stream")) {
    if (!isLoggedIn) return new NextResponse("Unauthorized", { status: 401 });
    return response;
  }

  if (pathname === "/login") {
    // Hanya auto-redirect jika cookie profil valid — cegah loop login⇄app
    if (isLoggedIn) {
      const profile = await decodeProfile(request.cookies.get(PROFILE_COOKIE)?.value);
      if (profile && profile.id === session!.user.id) {
        return NextResponse.redirect(new URL(homeHint(profile.role), request.url));
      }
    }
    return response;
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isLoggedIn ? "/dashboard" : "/login", request.url));
  }

  if (!isLoggedIn) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const profile = await decodeProfile(request.cookies.get(PROFILE_COOKIE)?.value);
  if (profile && profile.id === session!.user.id && !canAccessPath(profile, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

function homeHint(role: string) {
  if (role === "admin_arsip") return "/surat";
  if (role === "admin_kepegawaian") return "/aktivitas";
  if (role === "pegawai") return "/aktivitas";
  if (role === "pimpinan") return "/disposisi";
  return "/dashboard";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
