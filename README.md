# Manajemen FT — Persuratan & Kepegawaian

Sistem informasi fakultas untuk **persuratan + disposisi digital** dan **aktivitas Tridarma**, sesuai [PRD v1.1](./PRD_Sistem_Persuratan_dan_Kepegawaian_Fakultas_v1.1.md).

Stack MVP: **Next.js (App Router) · PostgreSQL · Prisma · Auth.js · MinIO/local upload · Excel export**.

## Prasyarat (Laragon)

1. Laragon dengan **PostgreSQL** aktif.
2. Node.js 20+ (sudah terpasang jika `node -v` jalan).
3. Buat database kosong:

```sql
CREATE DATABASE manajeman_ft;
```

Atau via psql:

```bash
psql -U postgres -c "CREATE DATABASE manajeman_ft;"
```

## Setup

```bash
cp .env.example .env
# edit DATABASE_URL & AUTH_SECRET di .env

npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Storage berkas

- **Tanpa MinIO:** biarkan `MINIO_*` kosong → file tersimpan di folder `uploads/`.
- **Dengan MinIO:** isi `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`.

## Akun demo (password: `Password123!`)

| Email | Role |
|-------|------|
| `admin@fakultas.ac.id` | Super Admin |
| `arsip@fakultas.ac.id` | Admin Arsip |
| `kepegawaian@fakultas.ac.id` | Admin Kepegawaian |
| `dekan@fakultas.ac.id` | Pimpinan (Dekan) |
| `kaprodi.if@fakultas.ac.id` | Pegawai + Kaprodi IF |
| `dosen.if@fakultas.ac.id` | Pegawai (dosen) |
| `tendik@fakultas.ac.id` | Pegawai (tendik) |

## Cakupan MVP (Fase 1)

- Auth + RBAC middleware
- CRUD surat + unggah berkas
- Disposisi 1 tingkat + tindak lanjut penerima
- Aktivitas Tridarma + validasi Kaprodi + log
- Notifikasi in-app
- Ekspor Excel agenda surat & rekap aktivitas

Belum di Fase 1: disposisi berantai, SSE, Web Push, PWA, PDF berkop (lihat PRD Fase 2–3).

## Skrip berguna

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Dev server |
| `npm run db:migrate` | Migrasi Prisma |
| `npm run db:seed` | Data demo |
| `npm run db:studio` | Prisma Studio |
