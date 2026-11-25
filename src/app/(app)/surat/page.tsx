import Link from "next/link";
import { requireUser } from "@/lib/session";
import { canManageSurat } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataList, DataListEmpty, DataListRow } from "@/components/data-list";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

const COLUMNS = [
  { key: "nomor", label: "Nomor" },
  { key: "perihal", label: "Perihal" },
  { key: "tanggal", label: "Tanggal" },
  { key: "status", label: "Status" },
];

export default async function SuratListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;
  const query = q?.trim();
  const admin = createAdminClient();

  let req = admin
    .from("surat")
    .select("id, nomor_surat, perihal, tanggal_surat, status")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (query) {
    req = req.or(`nomor_surat.ilike.%${query}%,perihal.ilike.%${query}%,asal_tujuan.ilike.%${query}%`);
  }

  const { data: surat } = await req;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Persuratan"
        title="Surat"
        description="Arsip surat masuk & keluar fakultas"
        actions={
          canManageSurat(user.role) ? (
            <Link
              href="/surat/baru"
              className="inline-flex h-11 items-center rounded-xl bg-[var(--brand-deep)] px-5 text-sm font-semibold text-white"
            >
              Catat surat
            </Link>
          ) : null
        }
      />

      <form className="panel flex gap-2 p-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Cari nomor, perihal, asal/tujuan…"
          className="h-11 flex-1 rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
        />
        <button type="submit" className="h-11 rounded-xl bg-[var(--mist)] px-4 text-sm font-semibold">
          Cari
        </button>
      </form>

      <DataList columns={COLUMNS}>
        {(surat ?? []).map((s) => (
          <DataListRow key={s.id} columns={4} href={`/surat/${s.id}`}>
            <span>{s.nomor_surat}</span>
            <span>{s.perihal}</span>
            <span>{formatDate(s.tanggal_surat)}</span>
            <Badge>{s.status}</Badge>
          </DataListRow>
        ))}
        {(surat ?? []).length === 0 ? <DataListEmpty>Belum ada surat.</DataListEmpty> : null}
      </DataList>
    </div>
  );
}
