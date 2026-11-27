import { notFound } from "next/navigation";
import { createDisposisiAction } from "@/app/actions/surat";
import { requireUser } from "@/lib/session";
import { canCreateDisposisi } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

export default async function SuratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: surat } = await admin
    .from("surat")
    .select("*, kategori:kategori_surat_id(nama), creator:created_by(nama)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!surat) notFound();

  const { data: disposisi } = await admin
    .from("disposisi")
    .select("*, dari:dari_user_id(nama), tujuan:tujuan_user_id(nama)")
    .eq("surat_id", id)
    .order("created_at", { ascending: true });

  const { data: penerima } = await admin
    .from("users")
    .select("id, nama, role")
    .eq("is_active", true)
    .in("role", ["pegawai", "admin_arsip", "admin_kepegawaian", "pimpinan"])
    .order("nama", { ascending: true });

  const showDisposisiForm =
    canCreateDisposisi(user.role) &&
    surat.jenis_surat === "masuk" &&
    ["menunggu_disposisi", "didisposisi", "ditindaklanjuti"].includes(surat.status);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">{surat.jenis_surat}</p>
        <h1 className="text-3xl font-bold">{surat.perihal}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{surat.nomor_surat}</Badge>
          <Badge className="bg-teal-100 text-teal-900">{surat.status}</Badge>
        </div>
      </div>

      <section className="grid gap-3 rounded-xl border border-stone-200 bg-white/80 p-5 text-sm sm:grid-cols-2">
        <Field label="Asal/tujuan" value={surat.asal_tujuan} />
        <Field label="Kategori" value={(surat.kategori as { nama?: string } | null)?.nama ?? "—"} />
        <Field label="Tanggal surat" value={formatDate(surat.tanggal_surat)} />
        <Field label="Tanggal terima/kirim" value={formatDate(surat.tanggal_terima_kirim)} />
        <Field label="Dicatat oleh" value={(surat.creator as { nama?: string } | null)?.nama ?? "—"} />
        <Field label="Berkas" value={surat.file_arsip_key ? "Tersimpan" : "Tidak ada"} />
        <div className="sm:col-span-2">
          <Field label="Ringkasan" value={surat.ringkasan ?? "—"} />
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white/80 p-5">
        <h2 className="text-xl font-bold">Riwayat disposisi</h2>
        <ul className="mt-3 space-y-3">
          {(disposisi ?? []).map((d) => (
            <li key={d.id} className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{(d.dari as { nama?: string } | null)?.nama}</span>
                <span className="text-stone-400">→</span>
                <span>{(d.tujuan as { nama?: string } | null)?.nama}</span>
                <Badge>{d.status_tindak_lanjut}</Badge>
              </div>
              <p className="mt-1 text-stone-700">{d.catatan_disposisi}</p>
              <p className="mt-1 text-xs text-stone-500">
                {formatDate(d.created_at)}
                {d.batas_waktu ? ` · batas ${formatDate(d.batas_waktu)}` : ""}
              </p>
            </li>
          ))}
          {(disposisi ?? []).length === 0 ? (
            <li className="text-sm text-stone-500">Belum ada disposisi.</li>
          ) : null}
        </ul>
      </section>

      {showDisposisiForm ? (
        <section className="rounded-xl border border-teal-800/20 bg-teal-50/50 p-5">
          <h2 className="text-xl font-bold">Buat disposisi</h2>
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
                {(penerima ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tujuanJabatan">Label jabatan (opsional)</Label>
              <Input id="tujuanJabatan" name="tujuanJabatan" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batasWaktu">Batas waktu</Label>
              <Input id="batasWaktu" name="batasWaktu" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catatanDisposisi">Catatan disposisi</Label>
              <Textarea id="catatanDisposisi" name="catatanDisposisi" required />
            </div>
            <SubmitButton pendingLabel="Mengirim…">Kirim disposisi</SubmitButton>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-0.5 text-stone-800">{value}</p>
    </div>
  );
}
