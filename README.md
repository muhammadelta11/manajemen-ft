# Manajemen FT — Persuratan & Kepegawaian

Sistem informasi fakultas untuk **persuratan + disposisi digital** dan **aktivitas Tridarma**.

Stack: **Next.js · Supabase (Auth + Postgres) · MinIO/local upload · Excel export**.

## Setup (mirip companyprofile)

1. Buat **project Supabase baru** (jangan pakai project app lain).
2. SQL Editor → jalankan isi file [`supabase/schema.sql`](./supabase/schema.sql).
3. Env lokal:

```bash
cp .env.example .env.local
```

Isi dari **Project Settings → API**:

| Variabel | Sumber |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (server only) |

4. Install & seed:

```bash
npm install
npm run db:seed
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Vercel

Root Directory: **kosong** (repo root).

Environment Variables: sama seperti `.env.local`, plus:

- `AUTH_URL` = `https://your-app.vercel.app`

Tidak perlu Prisma Postgres Vercel. Cukup Supabase.

## Akun demo (password: `Password123!`)

| Email | Role |
|-------|------|
| `admin@fakultas.ac.id` | Super Admin |
| `arsip@fakultas.ac.id` | Admin Arsip |
| `kepegawaian@fakultas.ac.id` | Admin Kepegawaian |
| `dekan@fakultas.ac.id` | Pimpinan |
| `kaprodi.if@fakultas.ac.id` | Kaprodi |
| `dosen.if@fakultas.ac.id` | Pegawai |
| `tendik@fakultas.ac.id` | Tendik |

## Storage

- Dev: kosongkan `MINIO_*` → folder `uploads/`
- Produksi: isi endpoint S3-compatible
