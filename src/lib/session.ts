import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRow } from "@/lib/types";
import type { AppRole } from "@/lib/roles";

export async function requireUser(): Promise<SessionUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("users")
    .select("id, nama, email, role, is_kaprodi, prodi_id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || !(profile as UserRow).is_active) {
    redirect("/login");
  }

  const p = profile as UserRow;
  return {
    id: p.id,
    name: p.nama,
    email: p.email,
    role: p.role as AppRole,
    isKaprodi: p.is_kaprodi,
    prodiId: p.prodi_id,
  };
}

export async function getOptionalUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("id, nama, email, role, is_kaprodi, prodi_id, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !(profile as UserRow).is_active) return null;
    const p = profile as UserRow;
    return {
      id: p.id,
      name: p.nama,
      email: p.email,
      role: p.role as AppRole,
      isKaprodi: p.is_kaprodi,
      prodiId: p.prodi_id,
    };
  } catch {
    return null;
  }
}
