-- Jalankan di Supabase SQL Editor (project baru Manajemen FT)
-- Setelah ini: npm run db:seed

create extension if not exists "pgcrypto";

create type public.role as enum (
  'super_admin', 'admin_arsip', 'admin_kepegawaian', 'pegawai', 'pimpinan'
);
create type public.jenis_pegawai as enum ('dosen', 'tendik');
create type public.jabatan_struktural as enum ('dekan', 'wd1', 'wd2', 'wd3');
create type public.jenis_surat as enum ('masuk', 'keluar');
create type public.surat_status as enum (
  'tercatat', 'menunggu_disposisi', 'didisposisi', 'ditindaklanjuti', 'selesai', 'arsip'
);
create type public.disposisi_status as enum (
  'belum', 'proses', 'diteruskan', 'selesai', 'dibatalkan'
);
create type public.kategori_aktivitas as enum (
  'pengajaran', 'penelitian', 'pengabdian', 'administrasi'
);
create type public.peran_aktivitas as enum ('ketua', 'anggota', 'pengampu', 'lainnya');
create type public.status_validasi as enum (
  'draft', 'menunggu', 'revisi', 'disetujui', 'dibatalkan'
);
create type public.semester_jenis as enum ('ganjil', 'genap', 'pendek');

create table public.prodi (
  id uuid primary key default gen_random_uuid(),
  kode_prodi text not null unique,
  nama_prodi text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tahun_akademik (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  is_aktif boolean not null default false
);

create table public.semester (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik_id uuid not null references public.tahun_akademik(id),
  jenis public.semester_jenis not null,
  label text not null,
  is_aktif boolean not null default false
);

create table public.kategori_surat (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  deskripsi text,
  is_active boolean not null default true
);

-- Profil app; id = auth.users.id
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  email text not null unique,
  email_verified timestamptz,
  image text,
  nidn_nip text not null unique,
  role public.role not null,
  jenis_pegawai public.jenis_pegawai,
  jabatan_struktural public.jabatan_struktural,
  prodi_id uuid references public.prodi(id),
  is_kaprodi boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.surat (
  id uuid primary key default gen_random_uuid(),
  jenis_surat public.jenis_surat not null,
  kategori_surat_id uuid references public.kategori_surat(id),
  nomor_surat text not null,
  tahun_nomor int not null,
  tanggal_surat date not null,
  tanggal_terima_kirim date not null,
  asal_tujuan text not null,
  perihal text not null,
  ringkasan text,
  butuh_disposisi boolean not null default false,
  file_arsip_key text,
  file_arsip_mime text,
  file_arsip_size int,
  file_arsip_checksum text,
  status public.surat_status not null default 'tercatat',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (jenis_surat, tahun_nomor, nomor_surat)
);
create index surat_status_idx on public.surat(status);
create index surat_tanggal_idx on public.surat(tanggal_surat);

create table public.disposisi (
  id uuid primary key default gen_random_uuid(),
  surat_id uuid not null references public.surat(id),
  parent_disposisi_id uuid references public.disposisi(id),
  depth int not null default 1,
  dari_user_id uuid not null references public.users(id),
  tujuan_user_id uuid not null references public.users(id),
  tujuan_jabatan text,
  catatan_disposisi text not null,
  batas_waktu date,
  status_tindak_lanjut public.disposisi_status not null default 'belum',
  catatan_tindak_lanjut text,
  selesai_at timestamptz,
  created_at timestamptz not null default now()
);
create index disposisi_tujuan_status_idx on public.disposisi(tujuan_user_id, status_tindak_lanjut);

create table public.aktivitas_pegawai (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  prodi_id uuid not null references public.prodi(id),
  kategori public.kategori_aktivitas not null,
  judul_kegiatan text not null,
  tanggal_kegiatan date not null,
  semester_id uuid references public.semester(id),
  peran public.peran_aktivitas not null,
  deskripsi text,
  bukti_file_key text,
  bukti_file_mime text,
  bukti_file_size int,
  bukti_url text,
  status_validasi public.status_validasi not null default 'draft',
  catatan_validator text,
  divalidasi_oleh uuid references public.users(id),
  divalidasi_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index aktivitas_prodi_status_idx on public.aktivitas_pegawai(prodi_id, status_validasi);

create table public.aktivitas_validasi_log (
  id uuid primary key default gen_random_uuid(),
  aktivitas_id uuid not null references public.aktivitas_pegawai(id) on delete cascade,
  dari_status public.status_validasi not null,
  ke_status public.status_validasi not null,
  validator_id uuid references public.users(id),
  catatan text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tipe text not null,
  judul text not null,
  pesan text not null,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_read_idx on public.notifications(user_id, read_at);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users(id),
  aksi text not null,
  entitas text not null,
  entitas_id text,
  sebelum jsonb,
  sesudah jsonb,
  alasan text,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

-- RLS: app server pakai service role untuk data; anon/authenticated baca profil sendiri
alter table public.users enable row level security;
alter table public.prodi enable row level security;
alter table public.tahun_akademik enable row level security;
alter table public.semester enable row level security;
alter table public.kategori_surat enable row level security;
alter table public.surat enable row level security;
alter table public.disposisi enable row level security;
alter table public.aktivitas_pegawai enable row level security;
alter table public.aktivitas_validasi_log enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

create policy "users_select_own" on public.users for select to authenticated
  using (id = auth.uid());
create policy "notifications_own" on public.notifications for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Service role bypasses RLS (dipakai server actions setelah cek sesi)
