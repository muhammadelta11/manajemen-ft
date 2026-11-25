import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canManageSurat } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataList, DataListEmpty, DataListRow } from "@/components/data-list";

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

  const surat = await prisma.surat.findMany({
    where: {
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { nomorSurat: { contains: query, mode: "insensitive" } },
              { perihal: { contains: query, mode: "insensitive" } },
              { asalTujuan: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

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
              className="inline-flex h-11 items-center rounded-xl bg-[var(--brand-deep)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(13,74,60,0.7)] transition hover:bg-[var(--brand)]"
            >
              Catat surat
            </Link>
          ) : null
        }
      />

      <form className="animate-fade-up-delay-1 panel flex gap-2 p-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Cari nomor, perihal, asal/tujuan…"
          className="h-11 flex-1 rounded-xl border-0 bg-transparent px-3 text-sm outline-none placeholder:text-[var(--muted)]"
        />
        <button
          type="submit"
          className="h-11 rounded-xl bg-[var(--mist)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-[#e3ebe8]"
        >
          Cari
        </button>
      </form>

      <div className="animate-fade-up-delay-2">
        <DataList columns={COLUMNS}>
          {surat.map((s) => (
            <DataListRow key={s.id} columns={4}>
              <div>
                <Link
                  href={`/surat/${s.id}`}
                  className="font-semibold text-[var(--brand-deep)] hover:underline"
                >
                  {s.nomorSurat}
                </Link>
                <div className="mt-0.5 text-xs text-[var(--muted)]">{s.jenisSurat}</div>
              </div>
              <div className="text-[var(--ink)]">{s.perihal}</div>
              <div className="text-[var(--muted)]">{formatDate(s.tanggalSurat)}</div>
              <div>
                <Badge>{s.status}</Badge>
              </div>
            </DataListRow>
          ))}
          {surat.length === 0 ? <DataListEmpty>Belum ada surat.</DataListEmpty> : null}
        </DataList>
      </div>
    </div>
  );
}
