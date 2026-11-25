"use server";

import { revalidatePath } from "next/cache";
import { JenisSurat, SuratStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canCreateDisposisi, canManageSurat } from "@/lib/rbac";
import { storeFile } from "@/lib/storage";
import { notifyUser, notifyUsers } from "@/lib/notifications";

function parseDate(value: FormDataEntryValue | null) {
  const s = String(value ?? "");
  return new Date(s);
}

export async function createSuratAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageSurat(user.role)) throw new Error("Tidak diizinkan.");

  const jenisSurat = String(formData.get("jenisSurat")) as JenisSurat;
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

  const tahunNomor = tanggalSurat.getFullYear();
  let fileMeta: Awaited<ReturnType<typeof storeFile>> | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    fileMeta = await storeFile("surat", file);
  }

  const status: SuratStatus =
    jenisSurat === "masuk" && butuhDisposisi ? "menunggu_disposisi" : "tercatat";

  const surat = await prisma.surat.create({
    data: {
      jenisSurat,
      kategoriSuratId,
      nomorSurat,
      tahunNomor,
      tanggalSurat,
      tanggalTerimaKirim,
      asalTujuan,
      perihal,
      ringkasan,
      butuhDisposisi,
      status,
      createdById: user.id,
      fileArsipKey: fileMeta?.key,
      fileArsipMime: fileMeta?.mime,
      fileArsipSize: fileMeta?.size,
      fileArsipChecksum: fileMeta?.checksum,
    },
  });

  if (status === "menunggu_disposisi") {
    const pimpinan = await prisma.user.findMany({
      where: { role: "pimpinan", isActive: true },
      select: { id: true },
    });
    await notifyUsers(
      pimpinan.map((p) => p.id),
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
  return surat.id;
}

export async function createDisposisiAction(formData: FormData) {
  const user = await requireUser();
  if (!canCreateDisposisi(user.role)) throw new Error("Tidak diizinkan.");

  const suratId = String(formData.get("suratId") ?? "");
  const tujuanUserId = String(formData.get("tujuanUserId") ?? "");
  const catatanDisposisi = String(formData.get("catatanDisposisi") ?? "").trim();
  const tujuanJabatan = String(formData.get("tujuanJabatan") ?? "").trim() || null;
  const batasWaktuRaw = String(formData.get("batasWaktu") ?? "");
  const batasWaktu = batasWaktuRaw ? new Date(batasWaktuRaw) : null;

  if (!suratId || !tujuanUserId || !catatanDisposisi) {
    throw new Error("Penerima dan catatan disposisi wajib.");
  }

  const surat = await prisma.surat.findFirst({
    where: { id: suratId, deletedAt: null },
  });
  if (!surat || surat.jenisSurat !== "masuk") {
    throw new Error("Surat tidak valid untuk disposisi.");
  }
  if (!["menunggu_disposisi", "didisposisi", "ditindaklanjuti"].includes(surat.status)) {
    throw new Error("Status surat tidak menerima disposisi.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.disposisi.create({
      data: {
        suratId,
        dariUserId: user.id,
        tujuanUserId,
        tujuanJabatan,
        catatanDisposisi,
        batasWaktu,
        depth: 1,
        statusTindakLanjut: "belum",
      },
    });
    await tx.surat.update({
      where: { id: suratId },
      data: { status: "didisposisi" },
    });
  });

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
  const status = String(formData.get("statusTindakLanjut") ?? "") as
    | "proses"
    | "selesai";
  const catatan = String(formData.get("catatanTindakLanjut") ?? "").trim() || null;

  const disposisi = await prisma.disposisi.findUnique({ where: { id: disposisiId } });
  if (!disposisi) throw new Error("Disposisi tidak ditemukan.");
  if (disposisi.tujuanUserId !== user.id && user.role !== "super_admin") {
    throw new Error("Hanya penerima disposisi yang dapat memperbarui tindak lanjut.");
  }

  await prisma.disposisi.update({
    where: { id: disposisiId },
    data: {
      statusTindakLanjut: status,
      catatanTindakLanjut: catatan,
      selesaiAt: status === "selesai" ? new Date() : null,
    },
  });

  if (status === "selesai") {
    const open = await prisma.disposisi.count({
      where: {
        suratId: disposisi.suratId,
        statusTindakLanjut: { in: ["belum", "proses", "diteruskan"] },
      },
    });
    if (open === 0) {
      await prisma.surat.update({
        where: { id: disposisi.suratId },
        data: { status: "selesai" },
      });
    } else {
      await prisma.surat.update({
        where: { id: disposisi.suratId },
        data: { status: "ditindaklanjuti" },
      });
    }
  } else {
    await prisma.surat.update({
      where: { id: disposisi.suratId },
      data: { status: "ditindaklanjuti" },
    });
  }

  revalidatePath("/disposisi");
  revalidatePath(`/surat/${disposisi.suratId}`);
}
