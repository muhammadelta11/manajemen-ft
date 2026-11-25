"use server";

import { revalidatePath } from "next/cache";
import type { KategoriAktivitas, PeranAktivitas, StatusValidasi } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canManageAktivitasOwn, canValidateAktivitas } from "@/lib/rbac";
import { storeFile } from "@/lib/storage";
import { notifyUser } from "@/lib/notifications";

export async function createAktivitasAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageAktivitasOwn(user.role)) throw new Error("Tidak diizinkan.");
  if (!user.prodiId) throw new Error("Akun belum terhubung ke prodi.");

  const kategori = String(formData.get("kategori")) as KategoriAktivitas;
  const judulKegiatan = String(formData.get("judulKegiatan") ?? "").trim();
  const tanggalKegiatan = new Date(String(formData.get("tanggalKegiatan") ?? ""));
  const peran = String(formData.get("peran")) as PeranAktivitas;
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

  const statusValidasi: StatusValidasi = ajukan ? "menunggu" : "draft";

  const aktivitas = await prisma.aktivitasPegawai.create({
    data: {
      userId: user.id,
      prodiId: user.prodiId,
      kategori,
      judulKegiatan,
      tanggalKegiatan,
      semesterId,
      peran,
      deskripsi,
      buktiUrl,
      statusValidasi,
      buktiFileKey: fileMeta?.key,
      buktiFileMime: fileMeta?.mime,
      buktiFileSize: fileMeta?.size,
    },
  });

  if (ajukan) {
    await prisma.aktivitasValidasiLog.create({
      data: {
        aktivitasId: aktivitas.id,
        dariStatus: "draft",
        keStatus: "menunggu",
        validatorId: user.id,
        catatan: "Diajukan oleh pegawai",
      },
    });

    const kaprodi = await prisma.user.findMany({
      where: { isKaprodi: true, prodiId: user.prodiId, isActive: true },
      select: { id: true },
    });
    for (const k of kaprodi) {
      await notifyUser({
        userId: k.id,
        tipe: "aktivitas_menunggu",
        judul: "Aktivitas menunggu validasi",
        pesan: judulKegiatan,
        linkPath: "/validasi",
      });
    }
  }

  revalidatePath("/aktivitas");
  revalidatePath("/validasi");
  return aktivitas.id;
}

export async function ajukanAktivitasAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const aktivitas = await prisma.aktivitasPegawai.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!aktivitas) throw new Error("Aktivitas tidak ditemukan.");
  if (!["draft", "revisi"].includes(aktivitas.statusValidasi)) {
    throw new Error("Status tidak dapat diajukan.");
  }

  const dari = aktivitas.statusValidasi;
  await prisma.$transaction([
    prisma.aktivitasPegawai.update({
      where: { id },
      data: { statusValidasi: "menunggu", catatanValidator: null },
    }),
    prisma.aktivitasValidasiLog.create({
      data: {
        aktivitasId: id,
        dariStatus: dari,
        keStatus: "menunggu",
        validatorId: user.id,
        catatan: "Diajukan ulang",
      },
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

  const aktivitas = await prisma.aktivitasPegawai.findFirst({
    where: { id, deletedAt: null, statusValidasi: "menunggu" },
  });
  if (!aktivitas) throw new Error("Pengajuan tidak ditemukan.");
  if (aktivitas.prodiId !== user.prodiId) {
    throw new Error("Hanya boleh memvalidasi pegawai di prodi Anda.");
  }

  await prisma.$transaction([
    prisma.aktivitasPegawai.update({
      where: { id },
      data: {
        statusValidasi: keputusan,
        catatanValidator: catatan || null,
        divalidasiOlehId: user.id,
        divalidasiAt: new Date(),
      },
    }),
    prisma.aktivitasValidasiLog.create({
      data: {
        aktivitasId: id,
        dariStatus: "menunggu",
        keStatus: keputusan,
        validatorId: user.id,
        catatan: catatan || null,
      },
    }),
  ]);

  await notifyUser({
    userId: aktivitas.userId,
    tipe: "validasi_hasil",
    judul: keputusan === "disetujui" ? "Aktivitas disetujui" : "Aktivitas perlu revisi",
    pesan: catatan || aktivitas.judulKegiatan,
    linkPath: `/aktivitas/${id}`,
  });

  revalidatePath("/validasi");
  revalidatePath("/aktivitas");
}
