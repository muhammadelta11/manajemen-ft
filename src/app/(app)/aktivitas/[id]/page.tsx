import { notFound } from "next/navigation";
import { ajukanAktivitasAction } from "@/app/actions/aktivitas";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const instant = false;

export default async function AktivitasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const aktivitas = await prisma.aktivitasPegawai.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { name: true } },
      prodi: true,
      validasiLogs: {
        orderBy: { createdAt: "asc" },
        include: { validator: { select: { name: true } } },
      },
    },
  });
  if (!aktivitas) notFound();

  const canAjukan =
    user.id === aktivitas.userId && ["draft", "revisi"].includes(aktivitas.statusValidasi);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">{aktivitas.kategori}</p>
        <h1 className="font-display text-3xl">{aktivitas.judulKegiatan}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge className="bg-teal-100 text-teal-900">{aktivitas.statusValidasi}</Badge>
          <Badge>{aktivitas.peran}</Badge>
        </div>
      </div>

      <section className="grid gap-3 rounded-xl border border-stone-200 bg-white/80 p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-stone-500">Pegawai</p>
          <p>{aktivitas.user.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-stone-500">Prodi</p>
          <p>{aktivitas.prodi.namaProdi}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-stone-500">Tanggal</p>
          <p>{formatDate(aktivitas.tanggalKegiatan)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-stone-500">Bukti URL</p>
          <p className="break-all">{aktivitas.buktiUrl ?? "—"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs uppercase text-stone-500">Deskripsi</p>
          <p>{aktivitas.deskripsi ?? "—"}</p>
        </div>
        {aktivitas.catatanValidator ? (
          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-stone-500">Catatan validator</p>
            <p>{aktivitas.catatanValidator}</p>
          </div>
        ) : null}
      </section>

      {canAjukan ? (
        <form action={ajukanAktivitasAction}>
          <input type="hidden" name="id" value={aktivitas.id} />
          <Button type="submit">Ajukan ke Kaprodi</Button>
        </form>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white/80 p-5">
        <h2 className="font-display text-xl">Riwayat validasi</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {aktivitas.validasiLogs.map((log) => (
            <li key={log.id} className="rounded-lg border border-stone-100 bg-stone-50 p-3">
              <div className="flex flex-wrap gap-2">
                <Badge>
                  {log.dariStatus} → {log.keStatus}
                </Badge>
                <span className="text-stone-500">{log.validator?.name ?? "sistem"}</span>
                <span className="text-stone-400">{formatDate(log.createdAt)}</span>
              </div>
              {log.catatan ? <p className="mt-1">{log.catatan}</p> : null}
            </li>
          ))}
          {aktivitas.validasiLogs.length === 0 ? (
            <li className="text-stone-500">Belum ada log.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
