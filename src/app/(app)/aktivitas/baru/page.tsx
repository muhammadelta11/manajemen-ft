import { redirect } from "next/navigation";
import { createAktivitasAction } from "@/app/actions/aktivitas";
import { requireUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const instant = false;

export default async function AktivitasBaruPage() {
  const user = await requireUser();
  if (user.role !== "pegawai") redirect("/aktivitas");

  const admin = createAdminClient();
  const { data: semesters } = await admin
    .from("semester")
    .select("id, label")
    .order("label", { ascending: false })
    .limit(8);

  const { data: dbUser } = await admin
    .from("users")
    .select("jenis_pegawai")
    .eq("id", user.id)
    .maybeSingle();
  const isTendik = dbUser?.jenis_pegawai === "tendik";

  async function action(formData: FormData) {
    "use server";
    const id = await createAktivitasAction(formData);
    redirect(`/aktivitas/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">Input aktivitas</h1>
        <p className="text-sm text-stone-600">Simpan draft atau langsung ajukan ke Kaprodi</p>
      </div>

      <form action={action} className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="kategori">Kategori</Label>
          <select
            id="kategori"
            name="kategori"
            className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
            defaultValue={isTendik ? "pengabdian" : "pengajaran"}
          >
            {!isTendik ? (
              <>
                <option value="pengajaran">Pengajaran</option>
                <option value="penelitian">Penelitian</option>
              </>
            ) : null}
            <option value="pengabdian">Pengabdian</option>
            {isTendik ? <option value="administrasi">Administrasi</option> : null}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="judulKegiatan">Judul kegiatan</Label>
          <Input id="judulKegiatan" name="judulKegiatan" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tanggalKegiatan">Tanggal</Label>
            <Input id="tanggalKegiatan" name="tanggalKegiatan" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="peran">Peran</Label>
            <select
              id="peran"
              name="peran"
              className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
              defaultValue="anggota"
            >
              <option value="ketua">Ketua</option>
              <option value="anggota">Anggota</option>
              <option value="pengampu">Pengampu</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="semesterId">Semester</Label>
          <select
            id="semesterId"
            name="semesterId"
            className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
          >
            <option value="">—</option>
            {(semesters ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deskripsi">Deskripsi</Label>
          <Textarea id="deskripsi" name="deskripsi" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="buktiUrl">Tautan bukti (opsional)</Label>
          <Input id="buktiUrl" name="buktiUrl" type="url" placeholder="https://" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="buktiFile">Berkas bukti</Label>
          <Input id="buktiFile" name="buktiFile" type="file" accept=".pdf,.jpg,.jpeg,.png" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ajukan" className="rounded border-stone-300" />
          Langsung ajukan ke Kaprodi
        </label>
        <Button type="submit">Simpan</Button>
      </form>
    </div>
  );
}
