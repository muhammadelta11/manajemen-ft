"use server";

import * as XLSX from "xlsx";
import { requireUser } from "@/lib/session";
import { canManageSurat, canViewKepegawaian } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

export async function exportAgendaExcelAction(from: string, to: string) {
  const user = await requireUser();
  if (!canManageSurat(user.role) && user.role !== "pimpinan") {
    throw new Error("Tidak diizinkan.");
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("surat")
    .select("*")
    .is("deleted_at", null)
    .gte("tanggal_surat", from)
    .lte("tanggal_surat", to)
    .order("tanggal_surat", { ascending: true });

  const data = (rows ?? []).map((s) => ({
    Jenis: s.jenis_surat,
    Nomor: s.nomor_surat,
    Tanggal: String(s.tanggal_surat).slice(0, 10),
    "Asal/Tujuan": s.asal_tujuan,
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

  const admin = createAdminClient();
  let query = admin
    .from("aktivitas_pegawai")
    .select("*, users:user_id(nama), prodi:prodi_id(nama_prodi)")
    .is("deleted_at", null)
    .gte("tanggal_kegiatan", from)
    .lte("tanggal_kegiatan", to)
    .order("tanggal_kegiatan", { ascending: true });

  if (user.role === "pegawai") {
    query = query.eq("user_id", user.id);
  }

  const { data: rows } = await query;

  const data = (rows ?? []).map((a) => ({
    Pegawai: (a.users as { nama?: string } | null)?.nama ?? "",
    Prodi: (a.prodi as { nama_prodi?: string } | null)?.nama_prodi ?? "",
    Kategori: a.kategori,
    Judul: a.judul_kegiatan,
    Tanggal: String(a.tanggal_kegiatan).slice(0, 10),
    Peran: a.peran,
    Status: a.status_validasi,
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
