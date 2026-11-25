-- CreateEnum
CREATE TYPE "Role" AS ENUM ('super_admin', 'admin_arsip', 'admin_kepegawaian', 'pegawai', 'pimpinan');

-- CreateEnum
CREATE TYPE "JenisPegawai" AS ENUM ('dosen', 'tendik');

-- CreateEnum
CREATE TYPE "JabatanStruktural" AS ENUM ('dekan', 'wd1', 'wd2', 'wd3');

-- CreateEnum
CREATE TYPE "JenisSurat" AS ENUM ('masuk', 'keluar');

-- CreateEnum
CREATE TYPE "SuratStatus" AS ENUM ('tercatat', 'menunggu_disposisi', 'didisposisi', 'ditindaklanjuti', 'selesai', 'arsip');

-- CreateEnum
CREATE TYPE "DisposisiStatus" AS ENUM ('belum', 'proses', 'diteruskan', 'selesai', 'dibatalkan');

-- CreateEnum
CREATE TYPE "KategoriAktivitas" AS ENUM ('pengajaran', 'penelitian', 'pengabdian', 'administrasi');

-- CreateEnum
CREATE TYPE "PeranAktivitas" AS ENUM ('ketua', 'anggota', 'pengampu', 'lainnya');

-- CreateEnum
CREATE TYPE "StatusValidasi" AS ENUM ('draft', 'menunggu', 'revisi', 'disetujui', 'dibatalkan');

-- CreateEnum
CREATE TYPE "SemesterJenis" AS ENUM ('ganjil', 'genap', 'pendek');

-- CreateTable
CREATE TABLE "prodi" (
    "id" TEXT NOT NULL,
    "kode_prodi" TEXT NOT NULL,
    "nama_prodi" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prodi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahun_akademik" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "tanggal_mulai" DATE NOT NULL,
    "tanggal_selesai" DATE NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tahun_akademik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester" (
    "id" TEXT NOT NULL,
    "tahun_akademik_id" TEXT NOT NULL,
    "jenis" "SemesterJenis" NOT NULL,
    "label" TEXT NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori_surat" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "kategori_surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "nidn_nip" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "jenis_pegawai" "JenisPegawai",
    "jabatan_struktural" "JabatanStruktural",
    "prodi_id" TEXT,
    "is_kaprodi" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "surat" (
    "id" TEXT NOT NULL,
    "jenis_surat" "JenisSurat" NOT NULL,
    "kategori_surat_id" TEXT,
    "nomor_surat" TEXT NOT NULL,
    "tahun_nomor" INTEGER NOT NULL,
    "tanggal_surat" DATE NOT NULL,
    "tanggal_terima_kirim" DATE NOT NULL,
    "asal_tujuan" TEXT NOT NULL,
    "perihal" TEXT NOT NULL,
    "ringkasan" TEXT,
    "butuh_disposisi" BOOLEAN NOT NULL DEFAULT false,
    "file_arsip_key" TEXT,
    "file_arsip_mime" TEXT,
    "file_arsip_size" INTEGER,
    "file_arsip_checksum" TEXT,
    "status" "SuratStatus" NOT NULL DEFAULT 'tercatat',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disposisi" (
    "id" TEXT NOT NULL,
    "surat_id" TEXT NOT NULL,
    "parent_disposisi_id" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 1,
    "dari_user_id" TEXT NOT NULL,
    "tujuan_user_id" TEXT NOT NULL,
    "tujuan_jabatan" TEXT,
    "catatan_disposisi" TEXT NOT NULL,
    "batas_waktu" DATE,
    "status_tindak_lanjut" "DisposisiStatus" NOT NULL DEFAULT 'belum',
    "catatan_tindak_lanjut" TEXT,
    "selesai_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disposisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aktivitas_pegawai" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prodi_id" TEXT NOT NULL,
    "kategori" "KategoriAktivitas" NOT NULL,
    "judul_kegiatan" TEXT NOT NULL,
    "tanggal_kegiatan" DATE NOT NULL,
    "semester_id" TEXT,
    "peran" "PeranAktivitas" NOT NULL,
    "deskripsi" TEXT,
    "bukti_file_key" TEXT,
    "bukti_file_mime" TEXT,
    "bukti_file_size" INTEGER,
    "bukti_url" TEXT,
    "status_validasi" "StatusValidasi" NOT NULL DEFAULT 'draft',
    "catatan_validator" TEXT,
    "divalidasi_oleh" TEXT,
    "divalidasi_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "aktivitas_pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aktivitas_validasi_log" (
    "id" TEXT NOT NULL,
    "aktivitas_id" TEXT NOT NULL,
    "dari_status" "StatusValidasi" NOT NULL,
    "ke_status" "StatusValidasi" NOT NULL,
    "validator_id" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aktivitas_validasi_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "link_path" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitas_id" TEXT,
    "sebelum" JSONB,
    "sesudah" JSONB,
    "alasan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "prodi_kode_prodi_key" ON "prodi"("kode_prodi");

-- CreateIndex
CREATE UNIQUE INDEX "tahun_akademik_kode_key" ON "tahun_akademik"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "kategori_surat_kode_key" ON "kategori_surat"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nidn_nip_key" ON "users"("nidn_nip");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "surat_status_idx" ON "surat"("status");

-- CreateIndex
CREATE INDEX "surat_tanggal_surat_idx" ON "surat"("tanggal_surat");

-- CreateIndex
CREATE UNIQUE INDEX "surat_jenis_surat_tahun_nomor_nomor_surat_key" ON "surat"("jenis_surat", "tahun_nomor", "nomor_surat");

-- CreateIndex
CREATE INDEX "disposisi_tujuan_user_id_status_tindak_lanjut_idx" ON "disposisi"("tujuan_user_id", "status_tindak_lanjut");

-- CreateIndex
CREATE INDEX "aktivitas_pegawai_prodi_id_status_validasi_idx" ON "aktivitas_pegawai"("prodi_id", "status_validasi");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- AddForeignKey
ALTER TABLE "semester" ADD CONSTRAINT "semester_tahun_akademik_id_fkey" FOREIGN KEY ("tahun_akademik_id") REFERENCES "tahun_akademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_prodi_id_fkey" FOREIGN KEY ("prodi_id") REFERENCES "prodi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_kategori_surat_id_fkey" FOREIGN KEY ("kategori_surat_id") REFERENCES "kategori_surat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_surat_id_fkey" FOREIGN KEY ("surat_id") REFERENCES "surat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_parent_disposisi_id_fkey" FOREIGN KEY ("parent_disposisi_id") REFERENCES "disposisi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_dari_user_id_fkey" FOREIGN KEY ("dari_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_tujuan_user_id_fkey" FOREIGN KEY ("tujuan_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitas_pegawai" ADD CONSTRAINT "aktivitas_pegawai_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitas_pegawai" ADD CONSTRAINT "aktivitas_pegawai_prodi_id_fkey" FOREIGN KEY ("prodi_id") REFERENCES "prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitas_pegawai" ADD CONSTRAINT "aktivitas_pegawai_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitas_pegawai" ADD CONSTRAINT "aktivitas_pegawai_divalidasi_oleh_fkey" FOREIGN KEY ("divalidasi_oleh") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitas_validasi_log" ADD CONSTRAINT "aktivitas_validasi_log_aktivitas_id_fkey" FOREIGN KEY ("aktivitas_id") REFERENCES "aktivitas_pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitas_validasi_log" ADD CONSTRAINT "aktivitas_validasi_log_validator_id_fkey" FOREIGN KEY ("validator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
