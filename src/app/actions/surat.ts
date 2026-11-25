"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { canCreateDisposisi, canManageSurat } from "@/lib/rbac";
import { storeFile } from "@/lib/storage";
import { notifyUser, notifyUsers } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DisposisiRow, SuratRow } from "@/lib/types";

function parseDate(value: FormDataEntryValue | null) {
  return String(value ?? "");
}

export async function createSuratAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageSurat(user.role)) throw new Error("Tidak diizinkan.");

  const jenisSurat = String(formData.get("jenisSurat") ?? "") as "masuk" | "keluar";
  const nomorSurat = String(formData.get("nomorSurat") ?? "").trim();
  const perihal = String(formData.get("perihal") ?? "").trim();
  const asalTujuan = String(formData.get("asalTujuan") ?? "").trim();
  const ringkasan = String(formData.get("ringkasan") ?? "").trim() || null;
  const kategoriSuratId = String(formData.get("kategoriSuratId") ?? "") || null;
  const tanggalSurat = parseDate(formData.get("tanggalSurat"));
  const tanggalTerimaKirim = parseDate(formData.get("tanggalTerimaKirim"));
  const butuhDisposisi =
    jenisSurat === "masuk" && formData.get("butuhDisposisi") === "on";

  if (!nomorSurat || !perihal || !asalTujuan) {
    throw new Error("Nomor, perihal, dan asal/tujuan wajib diisi.");
  }

  const tahunNomor = new Date(tanggalSurat).getFullYear();
  let fileMeta: Awaited<ReturnType<typeof storeFile>> | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    fileMeta = await storeFile("surat", file);
  }

  const status =
    jenisSurat === "masuk" && butuhDisposisi ? "menunggu_disposisi" : "tercatat";

  const admin = createAdminClient();
  const { data: surat, error } = await admin
    .from("surat")
    .insert({
      jenis_surat: jenisSurat,
      kategori_surat_id: kategoriSuratId,
      nomor_surat: nomorSurat,
      tahun_nomor: tahunNomor,
      tanggal_surat: tanggalSurat,
      tanggal_terima_kirim: tanggalTerimaKirim,
      asal_tujuan: asalTujuan,
      perihal,
      ringkasan,
      butuh_disposisi: butuhDisposisi,
      status,
      created_by: user.id,
      file_arsip_key: fileMeta?.key ?? null,
      file_arsip_mime: fileMeta?.mime ?? null,
      file_arsip_size: fileMeta?.size ?? null,
      file_arsip_checksum: fileMeta?.checksum ?? null,
    })
    .select("id")
    .single();

  if (error || !surat) throw new Error(error?.message ?? "Gagal menyimpan surat.");

  if (status === "menunggu_disposisi") {
    const { data: pimpinan } = await admin
      .from("users")
      .select("id")
      .eq("role", "pimpinan")
      .eq("is_active", true);
    await notifyUsers(
      (pimpinan ?? []).map((p) => p.id),
      {
        tipe: "surat_menunggu_disposisi",
        judul: "Surat menunggu disposisi",
        pesan: `${nomorSurat} — ${perihal}`,
        linkPath: `/surat/${surat.id}`,
      },
    );
  }

  revalidatePath("/surat");
  revalidatePath("/disposisi");
  return surat.id as string;
}

export async function createDisposisiAction(formData: FormData) {
  const user = await requireUser();
  if (!canCreateDisposisi(user.role)) throw new Error("Tidak diizinkan.");

  const suratId = String(formData.get("suratId") ?? "");
  const tujuanUserId = String(formData.get("tujuanUserId") ?? "");
  const catatanDisposisi = String(formData.get("catatanDisposisi") ?? "").trim();
  const tujuanJabatan = String(formData.get("tujuanJabatan") ?? "").trim() || null;
  const batasWaktuRaw = String(formData.get("batasWaktu") ?? "");
  const batasWaktu = batasWaktuRaw || null;

  if (!suratId || !tujuanUserId || !catatanDisposisi) {
    throw new Error("Penerima dan catatan disposisi wajib.");
  }

  const admin = createAdminClient();
  const { data: surat } = await admin
    .from("surat")
    .select("*")
    .eq("id", suratId)
    .is("deleted_at", null)
    .maybeSingle();

  const s = surat as SuratRow | null;
  if (!s || s.jenis_surat !== "masuk") {
    throw new Error("Surat tidak valid untuk disposisi.");
  }
  if (!["menunggu_disposisi", "didisposisi", "ditindaklanjuti"].includes(s.status)) {
    throw new Error("Status surat tidak menerima disposisi.");
  }

  const { error: dErr } = await admin.from("disposisi").insert({
    surat_id: suratId,
    dari_user_id: user.id,
    tujuan_user_id: tujuanUserId,
    tujuan_jabatan: tujuanJabatan,
    catatan_disposisi: catatanDisposisi,
    batas_waktu: batasWaktu,
    depth: 1,
    status_tindak_lanjut: "belum",
  });
  if (dErr) throw new Error(dErr.message);

  await admin.from("surat").update({ status: "didisposisi" }).eq("id", suratId);

  await notifyUser({
    userId: tujuanUserId,
    tipe: "disposisi_baru",
    judul: "Disposisi baru",
    pesan: catatanDisposisi.slice(0, 200),
    linkPath: `/disposisi`,
  });

  revalidatePath(`/surat/${suratId}`);
  revalidatePath("/disposisi");
}

export async function updateTindakLanjutAction(formData: FormData) {
  const user = await requireUser();
  const disposisiId = String(formData.get("disposisiId") ?? "");
  const status = String(formData.get("statusTindakLanjut") ?? "") as "proses" | "selesai";
  const catatan = String(formData.get("catatanTindakLanjut") ?? "").trim() || null;

  const admin = createAdminClient();
  const { data: disposisi } = await admin
    .from("disposisi")
    .select("*")
    .eq("id", disposisiId)
    .maybeSingle();

  const d = disposisi as DisposisiRow | null;
  if (!d) throw new Error("Disposisi tidak ditemukan.");
  if (d.tujuan_user_id !== user.id && user.role !== "super_admin") {
    throw new Error("Hanya penerima disposisi yang dapat memperbarui tindak lanjut.");
  }

  await admin
    .from("disposisi")
    .update({
      status_tindak_lanjut: status,
      catatan_tindak_lanjut: catatan,
      selesai_at: status === "selesai" ? new Date().toISOString() : null,
    })
    .eq("id", disposisiId);

  if (status === "selesai") {
    const { count } = await admin
      .from("disposisi")
      .select("id", { count: "exact", head: true })
      .eq("surat_id", d.surat_id)
      .in("status_tindak_lanjut", ["belum", "proses", "diteruskan"]);
    await admin
      .from("surat")
      .update({ status: count === 0 ? "selesai" : "ditindaklanjuti" })
      .eq("id", d.surat_id);
  } else {
    await admin.from("surat").update({ status: "ditindaklanjuti" }).eq("id", d.surat_id);
  }

  revalidatePath("/disposisi");
  revalidatePath(`/surat/${d.surat_id}`);
}
