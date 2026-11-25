"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, type SessionUser } from "@/lib/rbac";
import type { AppRole } from "@/lib/roles";
import type { UserRow } from "@/lib/types";
import { clearProfileCookie, setProfileCookie } from "@/lib/profile-cookie";

export type LoginState = {
  error?: string;
};

/** Dipanggil setelah login browser — set cookie profil + arahkan ke home role. */
export async function finalizeLoginAction(): Promise<LoginState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi login tidak ditemukan. Coba lagi." };
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, nama, email, role, is_kaprodi, prodi_id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || !(profile as UserRow).is_active) {
    await supabase.auth.signOut();
    await clearProfileCookie();
    return { error: "Akun tidak aktif atau profil belum tersedia." };
  }

  const p = profile as UserRow;
  const session: SessionUser = {
    id: p.id,
    name: p.nama,
    email: p.email,
    role: p.role as AppRole,
    isKaprodi: p.is_kaprodi,
    prodiId: p.prodi_id,
  };

  await setProfileCookie(session);
  redirect(homeForRole(session.role));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearProfileCookie();
  redirect("/login");
}
