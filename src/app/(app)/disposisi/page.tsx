import Link from "next/link";
import { updateTindakLanjutAction } from "@/app/actions/surat";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DataList, DataListRow } from "@/components/data-list";
import { PageHeader } from "@/components/page-header";

export const instant = false;

export default async function DisposisiPage() {
  const user = await requireUser();

  const [antreanSurat, tugasSaya, pantau] = await Promise.all([
    user.role === "pimpinan" || user.role === "super_admin"
      ? prisma.surat.findMany({
          where: { deletedAt: null, status: "menunggu_disposisi" },
          orderBy: { createdAt: "asc" },
          take: 20,
        })
      : Promise.resolve([]),
    prisma.disposisi.findMany({
      where: {
        tujuanUserId: user.id,
        statusTindakLanjut: { in: ["belum", "proses"] },
      },
      include: {
        surat: true,
        dariUser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    user.role === "admin_arsip" || user.role === "super_admin"
      ? prisma.disposisi.findMany({
          where: { statusTindakLanjut: { in: ["belum", "proses"] } },
          include: {
            surat: true,
            tujuanUser: { select: { name: true } },
            dariUser: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Persuratan"
        title="Disposisi"
        description="Antrean pimpinan, tugas penerima, dan pantauan arsip"
      />

      {(user.role === "pimpinan" || user.role === "super_admin") && (
        <section className="space-y-3">
          <h2 className="font-display text-xl">Menunggu disposisi</h2>
          <div className="space-y-2">
            {antreanSurat.map((s) => (
              <Link
                key={s.id}
                href={`/surat/${s.id}`}
                className="block rounded-xl border border-stone-200 bg-white/80 p-4 hover:border-teal-700/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.nomorSurat}</span>
                  <Badge>{s.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-stone-700">{s.perihal}</p>
              </Link>
            ))}
            {antreanSurat.length === 0 ? (
              <p className="text-sm text-stone-500">Tidak ada surat menunggu.</p>
            ) : null}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl">Tugas saya</h2>
        {tugasSaya.map((d) => (
          <div key={d.id} className="rounded-xl border border-stone-200 bg-white/80 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={`/surat/${d.suratId}`} className="font-medium text-teal-900 hover:underline">
                {d.surat.nomorSurat}
              </Link>
              <Badge>{d.statusTindakLanjut}</Badge>
              <span className="text-stone-500">dari {d.dariUser.name}</span>
            </div>
            <p className="mt-2 text-sm">{d.catatanDisposisi}</p>
            <p className="mt-1 text-xs text-stone-500">
              {formatDate(d.createdAt)}
              {d.batasWaktu ? ` · batas ${formatDate(d.batasWaktu)}` : ""}
            </p>
            <form action={updateTindakLanjutAction} className="mt-3 space-y-2">
              <input type="hidden" name="disposisiId" value={d.id} />
              <Textarea name="catatanTindakLanjut" placeholder="Catatan tindak lanjut (opsional)" />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" name="statusTindakLanjut" value="proses" variant="secondary">
                  Tandai proses
                </Button>
                <Button type="submit" name="statusTindakLanjut" value="selesai">
                  Selesai
                </Button>
              </div>
            </form>
          </div>
        ))}
        {tugasSaya.length === 0 ? (
          <p className="text-sm text-stone-500">Tidak ada tugas disposisi aktif.</p>
        ) : null}
      </section>

      {pantau.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl">Pantauan (Admin Arsip)</h2>
          <DataList
            columns={[
              { key: "surat", label: "Surat" },
              { key: "penerima", label: "Penerima" },
              { key: "status", label: "Status" },
              { key: "batas", label: "Batas" },
            ]}
          >
            {pantau.map((d) => (
              <DataListRow key={d.id} columns={4}>
                <div>
                  <Link
                    href={`/surat/${d.suratId}`}
                    className="font-semibold text-[var(--brand-deep)] hover:underline"
                  >
                    {d.surat.nomorSurat}
                  </Link>
                </div>
                <div>{d.tujuanUser.name}</div>
                <div>
                  <Badge>{d.statusTindakLanjut}</Badge>
                </div>
                <div className="text-[var(--muted)]">{formatDate(d.batasWaktu)}</div>
              </DataListRow>
            ))}
          </DataList>
        </section>
      ) : null}
    </div>
  );
}
