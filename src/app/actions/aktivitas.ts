"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { canManageAktivitasOwn, canValidateAktivitas } from "@/lib/rbac";
import { storeFile } from "@/lib/storage";
import { notifyUser, notifyUsers } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AktivitasRow } from "@/lib/types";

export async function createAktivitasAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageAktivitasOwn(user.role)) throw new Error("Tidak diizinkan.");
  if (!user.prodiId) throw new Error("Akun belum terhubung ke prodi.");

  const kategori = String(formData.get("kategori") ?? "");
  const judulKegiatan = String(formData.get("judulKegiatan") ?? "").trim();
  const tanggalKegiatan = String(formData.get("tanggalKegiatan") ?? "");
  const peran = String(formData.get("peran") ?? "");
  const deskripsi = String(formData.get("deskripsi") ?? "").trim() || null;
  const buktiUrl = String(formData.get("buktiUrl") ?? "").trim() || null;
  const semesterId = String(formData.get("semesterId") ?? "") || null;
  const ajukan = formData.get("ajukan") === "on";

  if (!judulKegiatan) throw new Error("Judul kegiatan wajib.");

  let fileMeta: Awaited<ReturnType<typeof storeFile>> | null = null;
  const file = formData.get("buktiFile");
  if (file instanceof File && file.size > 0) {
    fileMeta = await storeFile("bukti-aktivitas", file);
  }

  const statusValidasi = ajukan ? "menunggu" : "draft";
  const admin = createAdminClient();

  const { data: aktivitas, error } = await admin
    .from("aktivitas_pegawai")
    .insert({
      user_id: user.id,
      prodi_id: user.prodiId,
      kategori,
      judul_kegiatan: judulKegiatan,
      tanggal_kegiatan: tanggalKegiatan,
      semester_id: semesterId,
      peran,
      deskripsi,
      bukti_url: buktiUrl,
      status_validasi: statusValidasi,
      bukti_file_key: fileMeta?.key ?? null,
      bukti_file_mime: fileMeta?.mime ?? null,
      bukti_file_size: fileMeta?.size ?? null,
    })
    .select("id")
    .single();

  if (error || !aktivitas) throw new Error(error?.message ?? "Gagal menyimpan.");

  if (ajukan) {
    const [{ data: kaprodi }] = await Promise.all([
      admin
        .from("users")
        .select("id")
        .eq("is_kaprodi", true)
        .eq("prodi_id", user.prodiId)
        .eq("is_active", true),
      admin.from("aktivitas_validasi_log").insert({
        aktivitas_id: aktivitas.id,
        dari_status: "draft",
        ke_status: "menunggu",
        validator_id: user.id,
        catatan: "Diajukan oleh pegawai",
      }),
    ]);

    await notifyUsers(
      (kaprodi ?? []).map((k) => k.id),
      {
        tipe: "aktivitas_menunggu",
        judul: "Aktivitas menunggu validasi",
        pesan: judulKegiatan,
        linkPath: "/validasi",
      },
    );
  }

  revalidatePath("/aktivitas");
  revalidatePath("/validasi");
  return aktivitas.id as string;
}

export async function ajukanAktivitasAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();

  const { data: aktivitas } = await admin
    .from("aktivitas_pegawai")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  const a = aktivitas as AktivitasRow | null;
  if (!a) throw new Error("Aktivitas tidak ditemukan.");
  if (!["draft", "revisi"].includes(a.status_validasi)) {
    throw new Error("Status tidak dapat diajukan.");
  }

  await Promise.all([
    admin
      .from("aktivitas_pegawai")
      .update({ status_validasi: "menunggu", catatan_validator: null })
      .eq("id", id),
    admin.from("aktivitas_validasi_log").insert({
      aktivitas_id: id,
      dari_status: a.status_validasi,
      ke_status: "menunggu",
      validator_id: user.id,
      catatan: "Diajukan ulang",
    }),
  ]);

  revalidatePath("/aktivitas");
  revalidatePath("/validasi");
}

export async function validateAktivitasAction(formData: FormData) {
  const user = await requireUser();
  if (!canValidateAktivitas(user)) throw new Error("Tidak diizinkan.");

  const id = String(formData.get("id") ?? "");
  const keputusan = String(formData.get("keputusan") ?? "") as "disetujui" | "revisi";
  const catatan = String(formData.get("catatan") ?? "").trim();

  if (keputusan === "revisi" && !catatan) {
    throw new Error("Catatan wajib saat meminta revisi.");
  }

  const admin = createAdminClient();
  const { data: aktivitas } = await admin
    .from("aktivitas_pegawai")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .eq("status_validasi", "menunggu")
    .maybeSingle();

  const a = aktivitas as AktivitasRow | null;
  if (!a) throw new Error("Pengajuan tidak ditemukan.");
  if (a.prodi_id !== user.prodiId) {
    throw new Error("Hanya boleh memvalidasi pegawai di prodi Anda.");
  }

  await Promise.all([
    admin
      .from("aktivitas_pegawai")
      .update({
        status_validasi: keputusan,
        catatan_validator: catatan || null,
        divalidasi_oleh: user.id,
        divalidasi_at: new Date().toISOString(),
      })
      .eq("id", id),
    admin.from("aktivitas_validasi_log").insert({
      aktivitas_id: id,
      dari_status: "menunggu",
      ke_status: keputusan,
      validator_id: user.id,
      catatan: catatan || null,
    }),
    notifyUser({
      userId: a.user_id,
      tipe: "validasi_hasil",
      judul: keputusan === "disetujui" ? "Aktivitas disetujui" : "Aktivitas perlu revisi",
      pesan: catatan || a.judul_kegiatan,
      linkPath: `/aktivitas/${id}`,
    }),
  ]);

  revalidatePath("/validasi");
  revalidatePath("/aktivitas");
}
