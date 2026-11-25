import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, supabaseReady } from "@/lib/supabase/env";
import { canAccessPath, type SessionUser } from "@/lib/rbac";
import type { AppRole } from "@/lib/roles";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next();
  }

  if (!supabaseReady) {
    if (pathname !== "/login" && !pathname.startsWith("/api")) {
      // Tanpa env Supabase, arahkan ke login agar jelas
    }
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
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  if (pathname.startsWith("/api/notifications/stream")) {
    if (!isLoggedIn) return new NextResponse("Unauthorized", { status: 401 });
    return response;
  }

  if (pathname === "/login") {
    if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", request.url));
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

  // Profil untuk RBAC path
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    "";
  if (serviceKey) {
    const admin = createAdmin(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile } = await admin
      .from("users")
      .select("id, nama, email, role, is_kaprodi, prodi_id")
      .eq("id", user!.id)
      .maybeSingle();

    if (profile) {
      const sessionUser: SessionUser = {
        id: profile.id,
        name: profile.nama,
        email: profile.email,
        role: profile.role as AppRole,
        isKaprodi: Boolean(profile.is_kaprodi),
        prodiId: profile.prodi_id ?? null,
      };
      if (!canAccessPath(sessionUser, pathname)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
