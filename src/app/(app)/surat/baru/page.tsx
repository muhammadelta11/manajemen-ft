import { redirect } from "next/navigation";
import { createSuratAction } from "@/app/actions/surat";
import { requireUser } from "@/lib/session";
import { canManageSurat } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const instant = false;

export default async function SuratBaruPage() {
  const user = await requireUser();
  if (!canManageSurat(user.role)) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: kategori } = await admin
    .from("kategori_surat")
    .select("id, nama")
    .eq("is_active", true)
    .order("nama", { ascending: true });

  async function action(formData: FormData) {
    "use server";
    const id = await createSuratAction(formData);
    redirect(`/surat/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">Catat surat</h1>
        <p className="text-sm text-stone-600">Metadata surat masuk atau keluar + arsip digital</p>
      </div>

      <form action={action} className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="jenisSurat">Jenis</Label>
            <select
              id="jenisSurat"
              name="jenisSurat"
              className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
              defaultValue="masuk"
            >
              <option value="masuk">Masuk</option>
              <option value="keluar">Keluar</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kategoriSuratId">Kategori</Label>
            <select
              id="kategoriSuratId"
              name="kategoriSuratId"
              className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
            >
              <option value="">—</option>
              {(kategori ?? []).map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nomorSurat">Nomor surat</Label>
          <Input id="nomorSurat" name="nomorSurat" required placeholder="SURAT/M/2026/000001" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tanggalSurat">Tanggal surat</Label>
            <Input id="tanggalSurat" name="tanggalSurat" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tanggalTerimaKirim">Tanggal terima/kirim</Label>
            <Input id="tanggalTerimaKirim" name="tanggalTerimaKirim" type="date" required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="asalTujuan">Asal / tujuan</Label>
          <Input id="asalTujuan" name="asalTujuan" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="perihal">Perihal</Label>
          <Input id="perihal" name="perihal" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ringkasan">Ringkasan</Label>
          <Textarea id="ringkasan" name="ringkasan" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="file">Berkas (PDF/JPG/PNG, maks 10 MB)</Label>
          <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="butuhDisposisi" defaultChecked className="rounded border-stone-300" />
          Butuh disposisi pimpinan (untuk surat masuk)
        </label>
        <Button type="submit">Simpan</Button>
      </form>
    </div>
  );
}
