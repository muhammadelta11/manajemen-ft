import { cache } from "react";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/lib/types";
import type { AppRole } from "@/lib/roles";
import { decodeProfile, PROFILE_COOKIE, setProfileCookie } from "@/lib/profile-cookie";
import { cookies } from "next/headers";

function toSessionUser(p: UserRow): SessionUser {
  return {
    id: p.id,
    name: p.nama,
    email: p.email,
    role: p.role as AppRole,
    isKaprodi: p.is_kaprodi,
    prodiId: p.prodi_id,
  };
}

/** Satu kali per request RSC (layout + page share hasil). */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  // Cookie profil (diisi saat login) — hindari query users bila masih valid
  const jar = await cookies();
  const cached = decodeProfile(jar.get(PROFILE_COOKIE)?.value);
  if (cached && cached.id === user.id) {
    return cached;
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, nama, email, role, is_kaprodi, prodi_id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || !(profile as UserRow).is_active) {
    redirect("/login");
  }

  const session = toSessionUser(profile as UserRow);
  try {
    await setProfileCookie(session);
  } catch {
    // Server Component kadang read-only untuk cookie
  }
  return session;
});

export const getOptionalUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const jar = await cookies();
    const cached = decodeProfile(jar.get(PROFILE_COOKIE)?.value);
    if (cached && cached.id === user.id) return cached;

    const { data: profile } = await supabase
      .from("users")
      .select("id, nama, email, role, is_kaprodi, prodi_id, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !(profile as UserRow).is_active) return null;
    return toSessionUser(profile as UserRow);
  } catch {
    return null;
  }
});
