import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTindakLanjutAction } from "@/app/actions/surat";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const instant = false;

export default async function DisposisiPage() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: menunggu } = await admin
    .from("surat")
    .select("id, nomor_surat, perihal, tanggal_surat, status")
    .eq("status", "menunggu_disposisi")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: tugas } = await admin
    .from("disposisi")
    .select("*, surat:surat_id(id, nomor_surat, perihal), dari:dari_user_id(nama)")
    .eq("tujuan_user_id", user.id)
    .in("status_tindak_lanjut", ["belum", "proses"])
    .order("created_at", { ascending: false });

  const { data: pantauan } =
    user.role === "admin_arsip" || user.role === "super_admin"
      ? await admin
          .from("disposisi")
          .select(
            "*, surat:surat_id(nomor_surat, perihal), dari:dari_user_id(nama), tujuan:tujuan_user_id(nama)",
          )
          .order("created_at", { ascending: false })
          .limit(30)
      : { data: [] };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Persuratan" title="Disposisi" description="Antrean dan tindak lanjut" />

      {(user.role === "pimpinan" || user.role === "super_admin") && (
        <section className="panel p-5">
          <h2 className="text-xl font-bold">Menunggu disposisi</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(menunggu ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-0">
                <div>
                  <p className="font-medium">{s.perihal}</p>
                  <p className="text-[var(--muted)]">
                    {s.nomor_surat} · {formatDate(s.tanggal_surat)}
                  </p>
                </div>
                <Link href={`/surat/${s.id}`} className="font-semibold text-[var(--brand-deep)]">
                  Buka
                </Link>
              </li>
            ))}
            {(menunggu ?? []).length === 0 ? (
              <li className="text-[var(--muted)]">Tidak ada antrean.</li>
            ) : null}
          </ul>
        </section>
      )}

      <section className="panel p-5">
        <h2 className="text-xl font-bold">Tugas saya</h2>
        <ul className="mt-3 space-y-4">
          {(tugas ?? []).map((d) => (
            <li key={d.id} className="rounded-xl border border-[var(--line)] p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{d.status_tindak_lanjut}</Badge>
                <span className="font-medium">
                  {(d.surat as { perihal?: string } | null)?.perihal ?? "Surat"}
                </span>
              </div>
              <p className="mt-1 text-[var(--muted)]">
                Dari {(d.dari as { nama?: string } | null)?.nama} ·{" "}
                {(d.surat as { nomor_surat?: string } | null)?.nomor_surat}
              </p>
              <p className="mt-2">{d.catatan_disposisi}</p>
              <form action={updateTindakLanjutAction} className="mt-3 space-y-2">
                <input type="hidden" name="disposisiId" value={d.id} />
                <Label htmlFor={`catatan-${d.id}`}>Catatan tindak lanjut</Label>
                <Textarea id={`catatan-${d.id}`} name="catatanTindakLanjut" />
                <div className="flex gap-2">
                  <Button type="submit" name="statusTindakLanjut" value="proses" variant="secondary">
                    Proses
                  </Button>
                  <Button type="submit" name="statusTindakLanjut" value="selesai">
                    Selesai
                  </Button>
                </div>
              </form>
            </li>
          ))}
          {(tugas ?? []).length === 0 ? (
            <li className="text-[var(--muted)]">Tidak ada tugas terbuka.</li>
          ) : null}
        </ul>
      </section>

      {(user.role === "admin_arsip" || user.role === "super_admin") && (
        <section className="panel p-5">
          <h2 className="text-xl font-bold">Pantauan</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(pantauan ?? []).map((d) => (
              <li key={d.id} className="border-b py-2 last:border-0">
                <div className="flex flex-wrap gap-2">
                  <Badge>{d.status_tindak_lanjut}</Badge>
                  <span>{(d.surat as { nomor_surat?: string } | null)?.nomor_surat}</span>
                </div>
                <p className="text-[var(--muted)]">
                  {(d.dari as { nama?: string } | null)?.nama} →{" "}
                  {(d.tujuan as { nama?: string } | null)?.nama}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
