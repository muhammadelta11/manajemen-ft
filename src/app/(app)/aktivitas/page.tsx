import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataList, DataListEmpty, DataListRow } from "@/components/data-list";

export const instant = false;

const COLUMNS = [
  { key: "judul", label: "Judul" },
  { key: "pegawai", label: "Pegawai" },
  { key: "kategori", label: "Kategori" },
  { key: "status", label: "Status" },
];

export default async function AktivitasPage() {
  const user = await requireUser();

  const where =
    user.role === "pegawai"
      ? { userId: user.id, deletedAt: null }
      : { deletedAt: null };

  const rows = await prisma.aktivitasPegawai.findMany({
    where,
    include: {
      user: { select: { name: true } },
      prodi: { select: { namaProdi: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kepegawaian"
        title="Aktivitas Tridarma"
        description={
          user.role === "pimpinan"
            ? "Tampilan view-only untuk pimpinan"
            : "Pengajaran, penelitian, dan pengabdian"
        }
        actions={
          user.role === "pegawai" ? (
            <Link
              href="/aktivitas/baru"
              className="inline-flex h-11 items-center rounded-xl bg-[var(--brand-deep)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(13,74,60,0.7)] transition hover:bg-[var(--brand)]"
            >
              Input aktivitas
            </Link>
          ) : null
        }
      />

      <div className="animate-fade-up-delay-1">
        <DataList columns={COLUMNS}>
          {rows.map((a) => (
            <DataListRow key={a.id} columns={4}>
              <div>
                <Link
                  href={`/aktivitas/${a.id}`}
                  className="font-semibold text-[var(--brand-deep)] hover:underline"
                >
                  {a.judulKegiatan}
                </Link>
                <div className="mt-0.5 text-xs text-[var(--muted)]">
                  {formatDate(a.tanggalKegiatan)}
                </div>
              </div>
              <div>
                <div className="text-[var(--ink)]">{a.user.name}</div>
                <div className="text-xs text-[var(--muted)]">{a.prodi.namaProdi}</div>
              </div>
              <div className="text-[var(--muted)]">{a.kategori}</div>
              <div>
                <Badge>{a.statusValidasi}</Badge>
              </div>
            </DataListRow>
          ))}
          {rows.length === 0 ? <DataListEmpty>Belum ada aktivitas.</DataListEmpty> : null}
        </DataList>
      </div>
    </div>
  );
}
