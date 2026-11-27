import { notFound } from "next/navigation";
import { ajukanAktivitasAction } from "@/app/actions/aktivitas";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

export default async function AktivitasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: aktivitas } = await admin
    .from("aktivitas_pegawai")
    .select("*, pegawai:user_id(nama), prodi:prodi_id(nama_prodi)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!aktivitas) notFound();

  const { data: logs } = await admin
    .from("aktivitas_validasi_log")
    .select("*, validator:validator_id(nama)")
    .eq("aktivitas_id", id)
    .order("created_at", { ascending: true });

  const canAjukan =
    user.id === aktivitas.user_id && ["draft", "revisi"].includes(aktivitas.status_validasi);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">{aktivitas.kategori}</p>
        <h1 className="text-3xl font-bold">{aktivitas.judul_kegiatan}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge className="bg-teal-100 text-teal-900">{aktivitas.status_validasi}</Badge>
          <Badge>{aktivitas.peran}</Badge>
        </div>
      </div>

      <section className="grid gap-3 rounded-xl border border-stone-200 bg-white/80 p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-stone-500">Pegawai</p>
          <p>{(aktivitas.pegawai as { nama?: string } | null)?.nama}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-stone-500">Prodi</p>
          <p>{(aktivitas.prodi as { nama_prodi?: string } | null)?.nama_prodi}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-stone-500">Tanggal</p>
          <p>{formatDate(aktivitas.tanggal_kegiatan)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-stone-500">Bukti URL</p>
          <p className="break-all">{aktivitas.bukti_url ?? "—"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs uppercase text-stone-500">Deskripsi</p>
          <p>{aktivitas.deskripsi ?? "—"}</p>
        </div>
        {aktivitas.catatan_validator ? (
          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-stone-500">Catatan validator</p>
            <p>{aktivitas.catatan_validator}</p>
          </div>
        ) : null}
      </section>

      {canAjukan ? (
        <form action={ajukanAktivitasAction}>
          <input type="hidden" name="id" value={aktivitas.id} />
          <SubmitButton pendingLabel="Mengajukan…">Ajukan ke Kaprodi</SubmitButton>
        </form>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white/80 p-5">
        <h2 className="text-xl font-bold">Riwayat validasi</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(logs ?? []).map((log) => (
            <li key={log.id} className="rounded-lg border border-stone-100 bg-stone-50 p-3">
              <div className="flex flex-wrap gap-2">
                <Badge>
                  {log.dari_status} → {log.ke_status}
                </Badge>
                <span className="text-stone-500">
                  {(log.validator as { nama?: string } | null)?.nama ?? "sistem"}
                </span>
                <span className="text-stone-400">{formatDate(log.created_at)}</span>
              </div>
              {log.catatan ? <p className="mt-1">{log.catatan}</p> : null}
            </li>
          ))}
          {(logs ?? []).length === 0 ? <li className="text-stone-500">Belum ada log.</li> : null}
        </ul>
      </section>
    </div>
  );
}
