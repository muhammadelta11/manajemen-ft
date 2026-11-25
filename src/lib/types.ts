import type { AppRole } from "@/lib/roles";

export type UserRow = {
  id: string;
  nama: string;
  email: string;
  nidn_nip: string;
  role: AppRole;
  jenis_pegawai: "dosen" | "tendik" | null;
  jabatan_struktural: "dekan" | "wd1" | "wd2" | "wd3" | null;
  prodi_id: string | null;
  is_kaprodi: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SuratRow = {
  id: string;
  jenis_surat: "masuk" | "keluar";
  kategori_surat_id: string | null;
  nomor_surat: string;
  tahun_nomor: number;
  tanggal_surat: string;
  tanggal_terima_kirim: string;
  asal_tujuan: string;
  perihal: string;
  ringkasan: string | null;
  butuh_disposisi: boolean;
  file_arsip_key: string | null;
  file_arsip_mime: string | null;
  file_arsip_size: number | null;
  file_arsip_checksum: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DisposisiRow = {
  id: string;
  surat_id: string;
  parent_disposisi_id: string | null;
  depth: number;
  dari_user_id: string;
  tujuan_user_id: string;
  tujuan_jabatan: string | null;
  catatan_disposisi: string;
  batas_waktu: string | null;
  status_tindak_lanjut: string;
  catatan_tindak_lanjut: string | null;
  selesai_at: string | null;
  created_at: string;
};

export type AktivitasRow = {
  id: string;
  user_id: string;
  prodi_id: string;
  kategori: string;
  judul_kegiatan: string;
  tanggal_kegiatan: string;
  semester_id: string | null;
  peran: string;
  deskripsi: string | null;
  bukti_file_key: string | null;
  bukti_file_mime: string | null;
  bukti_file_size: number | null;
  bukti_url: string | null;
  status_validasi: string;
  catatan_validator: string | null;
  divalidasi_oleh: string | null;
  divalidasi_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  tipe: string;
  judul: string;
  pesan: string;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
};
