import Link from "next/link";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataList, DataListEmpty, DataListRow } from "@/components/data-list";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

const COLUMNS = [
  { key: "judul", label: "Kegiatan" },
  { key: "kategori", label: "Kategori" },
  { key: "tanggal", label: "Tanggal" },
  { key: "status", label: "Status" },
];

export default async function AktivitasPage() {
  const user = await requireUser();
  const admin = createAdminClient();

  let query = admin
    .from("aktivitas_pegawai")
    .select("id, judul_kegiatan, kategori, tanggal_kegiatan, status_validasi, user_id")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (user.role === "pegawai") {
    query = query.eq("user_id", user.id);
  }

  const { data: rows } = await query;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kepegawaian"
        title="Aktivitas"
        description="Catatan Tridarma pegawai"
        actions={
          user.role === "pegawai" ? (
            <Link
              href="/aktivitas/baru"
              className="inline-flex h-11 items-center rounded-xl bg-[var(--brand-deep)] px-5 text-sm font-semibold text-white"
            >
              Input aktivitas
            </Link>
          ) : null
        }
      />

      <DataList columns={COLUMNS}>
        {(rows ?? []).map((a) => (
          <DataListRow key={a.id} columns={4} href={`/aktivitas/${a.id}`}>
            <span>{a.judul_kegiatan}</span>
            <span>{a.kategori}</span>
            <span>{formatDate(a.tanggal_kegiatan)}</span>
            <Badge>{a.status_validasi}</Badge>
          </DataListRow>
        ))}
        {(rows ?? []).length === 0 ? <DataListEmpty>Belum ada aktivitas.</DataListEmpty> : null}
      </DataList>
    </div>
  );
}
