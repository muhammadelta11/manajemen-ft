"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { canCreateDisposisi, canManageSurat } from "@/lib/rbac";
import { storeFile } from "@/lib/storage";
import { notifyUser, notifyUsers } from "@/lib/notifications";
import { uniqueIds, userIdsByRoles } from "@/lib/notify-targets";
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

  const ringkas = `${nomorSurat} — ${perihal}`;

  if (status === "menunggu_disposisi") {
    // Pimpinan: antrean disposisi; Super Admin: pantauan fakultas
    const targets = await userIdsByRoles(["pimpinan", "super_admin"], user.id);
    await notifyUsers(targets, {
      tipe: "surat_menunggu_disposisi",
      judul: "Surat menunggu disposisi",
      pesan: ringkas,
      linkPath: `/surat/${surat.id}`,
    });
  } else {
    // Surat tercatat (keluar / tanpa disposisi) → pantauan arsip & super admin lain
    const targets = await userIdsByRoles(["admin_arsip", "super_admin"], user.id);
    if (targets.length) {
      await notifyUsers(targets, {
        tipe: "surat_tercatat",
        judul: jenisSurat === "keluar" ? "Surat keluar tercatat" : "Surat tercatat",
        pesan: ringkas,
        linkPath: `/surat/${surat.id}`,
      });
    }
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

  const arsipIds = await userIdsByRoles(["admin_arsip", "super_admin"], user.id);
  const pantau = uniqueIds([tujuanUserId], arsipIds).filter((id) => id !== user.id);

  await Promise.all([
    admin.from("surat").update({ status: "didisposisi" }).eq("id", suratId),
    // Penerima (user spesifik)
    notifyUser({
      userId: tujuanUserId,
      tipe: "disposisi_baru",
      judul: "Disposisi baru untuk Anda",
      pesan: `${s.nomor_surat}: ${catatanDisposisi.slice(0, 160)}`,
      linkPath: `/disposisi`,
    }),
    // Admin Arsip / Super Admin pantau
    notifyUsers(
      pantau.filter((id) => id !== tujuanUserId),
      {
        tipe: "disposisi_dibuat",
        judul: "Disposisi dikirim pimpinan",
        pesan: `${s.nomor_surat} — ${s.perihal}`,
        linkPath: `/surat/${suratId}`,
      },
    ),
  ]);

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

  let suratStatus: string = "ditindaklanjuti";
  if (status === "selesai") {
    const { count } = await admin
      .from("disposisi")
      .select("id", { count: "exact", head: true })
      .eq("surat_id", d.surat_id)
      .in("status_tindak_lanjut", ["belum", "proses", "diteruskan"]);
    suratStatus = count === 0 ? "selesai" : "ditindaklanjuti";
    await admin.from("surat").update({ status: suratStatus }).eq("id", d.surat_id);
  } else {
    await admin.from("surat").update({ status: "ditindaklanjuti" }).eq("id", d.surat_id);
  }

  const { data: surat } = await admin
    .from("surat")
    .select("nomor_surat, perihal, created_by")
    .eq("id", d.surat_id)
    .maybeSingle();

  const label = surat
    ? `${surat.nomor_surat} — ${surat.perihal}`
    : "Disposisi surat";

  // Pimpinan pengirim (user spesifik)
  if (d.dari_user_id && d.dari_user_id !== user.id) {
    await notifyUser({
      userId: d.dari_user_id,
      tipe: status === "selesai" ? "disposisi_selesai" : "disposisi_proses",
      judul: status === "selesai" ? "Disposisi diselesaikan" : "Disposisi diproses",
      pesan: label,
      linkPath: `/surat/${d.surat_id}`,
    });
  }

  // Admin Arsip + Super Admin pantau progres (hindari dobel ke pimpinan pengirim)
  const pantau = (await userIdsByRoles(["admin_arsip", "super_admin"], user.id)).filter(
    (id) => id !== d.dari_user_id,
  );
  await notifyUsers(pantau, {
    tipe: status === "selesai" ? "disposisi_selesai" : "disposisi_proses",
    judul:
      suratStatus === "selesai"
        ? "Surat disposisi selesai"
        : status === "selesai"
          ? "Cabang disposisi selesai"
          : "Update tindak lanjut disposisi",
    pesan: label,
    linkPath: `/surat/${d.surat_id}`,
  });

  revalidatePath("/disposisi");
  revalidatePath(`/surat/${d.surat_id}`);
}
