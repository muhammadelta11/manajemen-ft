import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/lib/types";
import type { AppRole } from "@/lib/roles";
import { decodeProfile, PROFILE_COOKIE, setProfileCookie } from "@/lib/profile-cookie";

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

/**
 * Fast path: cookie profil bertanda tangan + JWT lokal (getSession).
 * Tidak memanggil Auth API / tabel users kecuali cookie hilang.
 */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const jar = await cookies();
  const cached = await decodeProfile(jar.get(PROFILE_COOKIE)?.value);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (cached && session?.user?.id === cached.id) {
    return cached;
  }

  let userId = session?.user?.id;
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;
  }
  if (!userId) redirect("/login");

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, nama, email, role, is_kaprodi, prodi_id, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile || !(profile as UserRow).is_active) {
    redirect("/login");
  }

  const sessionUser = toSessionUser(profile as UserRow);
  try {
    await setProfileCookie(sessionUser);
  } catch {
    /* read-only cookies di sebagian RSC */
  }
  return sessionUser;
});

/** Hanya baca cookie — untuk shell layout (0 round-trip DB/Auth). */
export const getUserFromCookie = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  return decodeProfile(jar.get(PROFILE_COOKIE)?.value);
});

export const getOptionalUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const jar = await cookies();
    const cached = await decodeProfile(jar.get(PROFILE_COOKIE)?.value);
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (cached && session?.user?.id === cached.id) return cached;
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("id, nama, email, role, is_kaprodi, prodi_id, is_active")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!profile || !(profile as UserRow).is_active) return null;
    return toSessionUser(profile as UserRow);
  } catch {
    return null;
  }
});
