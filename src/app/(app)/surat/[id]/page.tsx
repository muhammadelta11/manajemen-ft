import { notFound } from "next/navigation";
import { createDisposisiAction } from "@/app/actions/surat";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canCreateDisposisi } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const instant = false;

export default async function SuratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const surat = await prisma.surat.findFirst({
    where: { id, deletedAt: null },
    include: {
      kategori: true,
      createdBy: { select: { name: true } },
      disposisi: {
        orderBy: { createdAt: "asc" },
        include: {
          dariUser: { select: { name: true } },
          tujuanUser: { select: { name: true } },
        },
      },
    },
  });
  if (!surat) notFound();

  const penerima = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["pegawai", "admin_arsip", "admin_kepegawaian", "pimpinan"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  const showDisposisiForm =
    canCreateDisposisi(user.role) &&
    surat.jenisSurat === "masuk" &&
    ["menunggu_disposisi", "didisposisi", "ditindaklanjuti"].includes(surat.status);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">{surat.jenisSurat}</p>
        <h1 className="font-display text-3xl">{surat.perihal}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{surat.nomorSurat}</Badge>
          <Badge className="bg-teal-100 text-teal-900">{surat.status}</Badge>
        </div>
      </div>

      <section className="grid gap-3 rounded-xl border border-stone-200 bg-white/80 p-5 text-sm sm:grid-cols-2">
        <Field label="Asal/tujuan" value={surat.asalTujuan} />
        <Field label="Kategori" value={surat.kategori?.nama ?? "—"} />
        <Field label="Tanggal surat" value={formatDate(surat.tanggalSurat)} />
        <Field label="Tanggal terima/kirim" value={formatDate(surat.tanggalTerimaKirim)} />
        <Field label="Dicatat oleh" value={surat.createdBy.name} />
        <Field label="Berkas" value={surat.fileArsipKey ? "Tersimpan" : "Tidak ada"} />
        <div className="sm:col-span-2">
          <Field label="Ringkasan" value={surat.ringkasan ?? "—"} />
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white/80 p-5">
        <h2 className="font-display text-xl">Riwayat disposisi</h2>
        <ul className="mt-3 space-y-3">
          {surat.disposisi.map((d) => (
            <li key={d.id} className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{d.dariUser.name}</span>
                <span className="text-stone-400">→</span>
                <span>{d.tujuanUser.name}</span>
                <Badge>{d.statusTindakLanjut}</Badge>
              </div>
              <p className="mt-1 text-stone-700">{d.catatanDisposisi}</p>
              <p className="mt-1 text-xs text-stone-500">
                {formatDate(d.createdAt)}
                {d.batasWaktu ? ` · batas ${formatDate(d.batasWaktu)}` : ""}
              </p>
            </li>
          ))}
          {surat.disposisi.length === 0 ? (
            <li className="text-sm text-stone-500">Belum ada disposisi.</li>
          ) : null}
        </ul>
      </section>

      {showDisposisiForm ? (
        <section className="rounded-xl border border-teal-800/20 bg-teal-50/50 p-5">
          <h2 className="font-display text-xl">Buat disposisi</h2>
          <form action={createDisposisiAction} className="mt-4 space-y-3">
            <input type="hidden" name="suratId" value={surat.id} />
            <div className="space-y-1.5">
              <Label htmlFor="tujuanUserId">Penerima</Label>
              <select
                id="tujuanUserId"
                name="tujuanUserId"
                required
                className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
              >
                <option value="">Pilih penerima…</option>
                {penerima.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tujuanJabatan">Label jabatan (opsional)</Label>
              <Input id="tujuanJabatan" name="tujuanJabatan" placeholder="mis. WD I / Kaprodi Informatika" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batasWaktu">Batas waktu</Label>
              <Input id="batasWaktu" name="batasWaktu" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catatanDisposisi">Catatan instruksi</Label>
              <Textarea id="catatanDisposisi" name="catatanDisposisi" required />
            </div>
            <Button type="submit">Kirim disposisi</Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-0.5 text-stone-900">{value}</p>
    </div>
  );
}
