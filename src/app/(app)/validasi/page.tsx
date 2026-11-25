import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateAktivitasAction } from "@/app/actions/aktivitas";
import { createAdminClient } from "@/lib/supabase/admin";
import { canValidateAktivitas } from "@/lib/rbac";

export const instant = false;

export default async function ValidasiPage() {
  const user = await requireUser();
  if (!canValidateAktivitas(user)) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: antrean } = await admin
    .from("aktivitas_pegawai")
    .select("*, pegawai:user_id(nama)")
    .eq("prodi_id", user.prodiId!)
    .eq("status_validasi", "menunggu")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kepegawaian" title="Validasi aktivitas" description="Antrean Kaprodi" />
      <ul className="space-y-4">
        {(antrean ?? []).map((a) => (
          <li key={a.id} className="panel p-4 text-sm">
            <p className="font-semibold">{a.judul_kegiatan}</p>
            <p className="text-[var(--muted)]">
              {(a.pegawai as { nama?: string } | null)?.nama} · {a.kategori} ·{" "}
              {formatDate(a.tanggal_kegiatan)}
            </p>
            <form action={validateAktivitasAction} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={a.id} />
              <Label htmlFor={`catatan-${a.id}`}>Catatan</Label>
              <Textarea id={`catatan-${a.id}`} name="catatan" />
              <div className="flex gap-2">
                <Button type="submit" name="keputusan" value="disetujui">
                  Setujui
                </Button>
                <Button type="submit" name="keputusan" value="revisi" variant="secondary">
                  Minta revisi
                </Button>
              </div>
            </form>
          </li>
        ))}
        {(antrean ?? []).length === 0 ? (
          <li className="text-[var(--muted)]">Tidak ada pengajuan menunggu.</li>
        ) : null}
      </ul>
    </div>
  );
}
