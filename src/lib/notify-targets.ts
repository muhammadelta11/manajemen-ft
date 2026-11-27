import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/roles";

/** Ambil id user aktif per role (untuk fan-out notifikasi). */
export async function userIdsByRoles(roles: AppRole[], excludeId?: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .in("role", roles)
    .eq("is_active", true);
  const ids = (data ?? []).map((u) => u.id as string);
  return excludeId ? ids.filter((id) => id !== excludeId) : ids;
}

export async function kaprodiIdsForProdi(prodiId: string, excludeId?: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("is_kaprodi", true)
    .eq("prodi_id", prodiId)
    .eq("is_active", true);
  const ids = (data ?? []).map((u) => u.id as string);
  return excludeId ? ids.filter((id) => id !== excludeId) : ids;
}

export function uniqueIds(...groups: (string | null | undefined)[][]) {
  return [...new Set(groups.flat().filter((id): id is string => Boolean(id)))];
}
