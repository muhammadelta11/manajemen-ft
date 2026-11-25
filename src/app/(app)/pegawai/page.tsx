import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

export default async function PegawaiPage() {
  const user = await requireUser();
  if (!["super_admin", "admin_kepegawaian", "pimpinan"].includes(user.role)) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: pegawai } = await admin
    .from("users")
    .select("id, nama, email, nidn_nip, jenis_pegawai, is_kaprodi, prodi:prodi_id(nama_prodi)")
    .eq("role", "pegawai")
    .eq("is_active", true)
    .order("nama", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kepegawaian" title="Pegawai" description="Dosen dan tendik aktif" />
      <ul className="space-y-2">
        {(pegawai ?? []).map((p) => (
          <li key={p.id} className="panel p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{p.nama}</p>
              {p.jenis_pegawai ? <Badge>{p.jenis_pegawai}</Badge> : null}
              {p.is_kaprodi ? <Badge>Kaprodi</Badge> : null}
            </div>
            <p className="mt-1 text-[var(--muted)]">
              {p.email} · {p.nidn_nip}
              {p.prodi && !Array.isArray(p.prodi) && (p.prodi as { nama_prodi?: string }).nama_prodi
                ? ` · ${(p.prodi as { nama_prodi: string }).nama_prodi}`
                : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
