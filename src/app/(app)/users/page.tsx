import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

export default async function UsersPage() {
  const user = await requireUser();
  if (user.role !== "super_admin") redirect("/dashboard");

  const admin = createAdminClient();
  const { data: users } = await admin
    .from("users")
    .select("id, nama, email, role, nidn_nip, is_kaprodi, is_active, prodi:prodi_id(nama_prodi)")
    .order("nama", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Sistem" title="Pengguna" description="Akun yang terhubung ke Supabase Auth" />
      <ul className="space-y-2">
        {(users ?? []).map((u) => (
          <li key={u.id} className="panel flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div>
              <p className="font-semibold">{u.nama}</p>
              <p className="text-[var(--muted)]">
                {u.email} · {u.nidn_nip}
                {(u.prodi as { nama_prodi?: string } | null)?.nama_prodi
                  ? ` · ${(u.prodi as { nama_prodi?: string }).nama_prodi}`
                  : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge>{u.role}</Badge>
              {u.is_kaprodi ? <Badge>Kaprodi</Badge> : null}
              {!u.is_active ? <Badge className="bg-red-50 text-red-700">nonaktif</Badge> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
