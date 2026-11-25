import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Password123!";

async function upsertProdi(kode, nama) {
  const { data: existing } = await admin.from("prodi").select("id").eq("kode_prodi", kode).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await admin
    .from("prodi")
    .insert({ kode_prodi: kode, nama_prodi: nama })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureAuthUser(email, name) {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  const found = listed?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) return found.id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) throw error;
  return data.user.id;
}

async function upsertProfile(row) {
  const { error } = await admin.from("users").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

async function main() {
  const ifId = await upsertProdi("IF", "Informatika");
  await upsertProdi("SI", "Teknik Sipil");

  const { data: kat } = await admin.from("kategori_surat").select("id").eq("kode", "UMUM").maybeSingle();
  if (!kat) {
    await admin.from("kategori_surat").insert([
      { kode: "UMUM", nama: "Surat Umum" },
      { kode: "AKD", nama: "Akademik" },
    ]);
  }

  const { data: tahunExisting } = await admin
    .from("tahun_akademik")
    .select("id")
    .eq("kode", "2025/2026")
    .maybeSingle();
  let tahunId = tahunExisting?.id;
  if (!tahunId) {
    const { data: tahun, error } = await admin
      .from("tahun_akademik")
      .insert({
        kode: "2025/2026",
        tanggal_mulai: "2025-08-01",
        tanggal_selesai: "2026-07-31",
        is_aktif: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    tahunId = tahun.id;
    await admin.from("semester").insert({
      tahun_akademik_id: tahunId,
      jenis: "ganjil",
      label: "Ganjil 2025/2026",
      is_aktif: true,
    });
  }

  await admin.from("system_settings").upsert({
    key: "surat.nomor_format",
    value: { format: "SURAT/{JENIS}/{TAHUN}/{SEQ}" },
  });

  const seeds = [
    { email: "admin@fakultas.ac.id", nama: "Super Admin", nidn_nip: "SA-001", role: "super_admin" },
    { email: "arsip@fakultas.ac.id", nama: "Admin Arsip", nidn_nip: "AR-001", role: "admin_arsip" },
    {
      email: "kepegawaian@fakultas.ac.id",
      nama: "Admin Kepegawaian",
      nidn_nip: "KP-001",
      role: "admin_kepegawaian",
    },
    {
      email: "dekan@fakultas.ac.id",
      nama: "Dekan FT",
      nidn_nip: "DK-001",
      role: "pimpinan",
      jabatan_struktural: "dekan",
    },
    {
      email: "kaprodi.if@fakultas.ac.id",
      nama: "Kaprodi Informatika",
      nidn_nip: "KD-IF-001",
      role: "pegawai",
      prodi_id: ifId,
      is_kaprodi: true,
      jenis_pegawai: "dosen",
    },
    {
      email: "dosen.if@fakultas.ac.id",
      nama: "Dosen Informatika",
      nidn_nip: "DS-IF-001",
      role: "pegawai",
      prodi_id: ifId,
      jenis_pegawai: "dosen",
    },
    {
      email: "tendik@fakultas.ac.id",
      nama: "Tendik FT",
      nidn_nip: "TD-001",
      role: "pegawai",
      jenis_pegawai: "tendik",
    },
  ];

  for (const s of seeds) {
    const id = await ensureAuthUser(s.email, s.nama);
    await upsertProfile({
      id,
      nama: s.nama,
      email: s.email,
      nidn_nip: s.nidn_nip,
      role: s.role,
      prodi_id: s.prodi_id ?? null,
      is_kaprodi: s.is_kaprodi ?? false,
      jenis_pegawai: s.jenis_pegawai ?? null,
      jabatan_struktural: s.jabatan_struktural ?? null,
      is_active: true,
    });
    console.log("ok", s.email);
  }

  console.log("\nSeed selesai. Password semua akun:", PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
