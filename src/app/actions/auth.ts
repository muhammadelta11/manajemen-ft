"use server";

import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/rbac";
import type { AppRole } from "@/lib/roles";
import { clearProfileCookie, setProfileCookie } from "@/lib/profile-cookie";

const ROLES: AppRole[] = [
  "super_admin",
  "admin_arsip",
  "admin_kepegawaian",
  "pegawai",
  "pimpinan",
];

/** Set cookie profil setelah login browser — tanpa redirect (client yang navigasi). */
export async function seedProfileCookieAction(input: {
  id: string;
  name: string;
  email: string;
  role: string;
  isKaprodi: boolean;
  prodiId: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id || session.user.id !== input.id) {
    return { error: "Sesi login tidak valid." };
  }

  if (!ROLES.includes(input.role as AppRole)) {
    return { error: "Role tidak dikenal." };
  }

  // Ambil profil dari DB sekali (sumber kebenaran), bukan percaya payload client mentah
  const { data: profile } = await supabase
    .from("users")
    .select("id, nama, email, role, is_kaprodi, prodi_id, is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return { error: "Akun tidak aktif atau profil belum tersedia." };
  }

  const user: SessionUser = {
    id: profile.id,
    name: profile.nama,
    email: profile.email,
    role: profile.role as AppRole,
    isKaprodi: Boolean(profile.is_kaprodi),
    prodiId: profile.prodi_id ?? null,
  };

  await setProfileCookie(user);
  return {};
}

export async function clearSessionAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearProfileCookie();
}
