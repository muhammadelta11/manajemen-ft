import { redirect } from "next/navigation";
import { validateAktivitasAction } from "@/app/actions/aktivitas";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canValidateAktivitas } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const instant = false;

export default async function ValidasiPage() {
  const user = await requireUser();
  if (!canValidateAktivitas(user)) redirect("/dashboard");

  const rows = await prisma.aktivitasPegawai.findMany({
    where: {
      prodiId: user.prodiId!,
      statusValidasi: "menunggu",
      deletedAt: null,
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">Validasi aktivitas</h1>
        <p className="text-sm text-stone-600">Pengajuan pegawai di program studi Anda</p>
      </div>

      <div className="space-y-4">
        {rows.map((a) => (
          <div key={a.id} className="rounded-xl border border-stone-200 bg-white/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium">{a.judulKegiatan}</h2>
              <Badge>{a.kategori}</Badge>
            </div>
            <p className="mt-1 text-sm text-stone-600">
              {a.user.name} · {formatDate(a.tanggalKegiatan)} · peran {a.peran}
            </p>
            {a.deskripsi ? <p className="mt-2 text-sm">{a.deskripsi}</p> : null}

            <form action={validateAktivitasAction} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={a.id} />
              <Textarea name="catatan" placeholder="Catatan (wajib untuk revisi)" />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" name="keputusan" value="disetujui">
                  Setujui
                </Button>
                <Button type="submit" name="keputusan" value="revisi" variant="secondary">
                  Minta revisi
                </Button>
              </div>
            </form>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="text-sm text-stone-500">Tidak ada pengajuan menunggu.</p>
        ) : null}
      </div>
    </div>
  );
}
