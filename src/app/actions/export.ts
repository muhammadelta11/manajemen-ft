"use server";

import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canManageSurat, canViewKepegawaian } from "@/lib/rbac";

export async function exportAgendaExcelAction(from: string, to: string) {
  const user = await requireUser();
  if (!canManageSurat(user.role) && user.role !== "pimpinan") {
    throw new Error("Tidak diizinkan.");
  }

  const rows = await prisma.surat.findMany({
    where: {
      deletedAt: null,
      tanggalSurat: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    orderBy: { tanggalSurat: "asc" },
  });

  const data = rows.map((s) => ({
    Jenis: s.jenisSurat,
    Nomor: s.nomorSurat,
    Tanggal: s.tanggalSurat.toISOString().slice(0, 10),
    "Asal/Tujuan": s.asalTujuan,
    Perihal: s.perihal,
    Status: s.status,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Agenda");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return {
    filename: `agenda-surat-${from}_${to}.xlsx`,
    base64: buffer.toString("base64"),
  };
}

export async function exportAktivitasExcelAction(from: string, to: string) {
  const user = await requireUser();
  if (!canViewKepegawaian(user.role)) throw new Error("Tidak diizinkan.");

  const where =
    user.role === "pegawai"
      ? { userId: user.id, deletedAt: null as Date | null }
      : { deletedAt: null as Date | null };

  const rows = await prisma.aktivitasPegawai.findMany({
    where: {
      ...where,
      tanggalKegiatan: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    include: { user: true, prodi: true },
    orderBy: { tanggalKegiatan: "asc" },
  });

  const data = rows.map((a) => ({
    Pegawai: a.user.name,
    Prodi: a.prodi.namaProdi,
    Kategori: a.kategori,
    Judul: a.judulKegiatan,
    Tanggal: a.tanggalKegiatan.toISOString().slice(0, 10),
    Peran: a.peran,
    Status: a.statusValidasi,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Aktivitas");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return {
    filename: `rekap-aktivitas-${from}_${to}.xlsx`,
    base64: buffer.toString("base64"),
  };
}
