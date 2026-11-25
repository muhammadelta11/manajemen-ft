import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const informatika = await prisma.prodi.upsert({
    where: { kodeProdi: "IF" },
    update: {},
    create: { kodeProdi: "IF", namaProdi: "Informatika" },
  });
  const sipil = await prisma.prodi.upsert({
    where: { kodeProdi: "SI" },
    update: {},
    create: { kodeProdi: "SI", namaProdi: "Teknik Sipil" },
  });

  await prisma.kategoriSurat.upsert({
    where: { kode: "UMUM" },
    update: {},
    create: { kode: "UMUM", nama: "Surat Umum" },
  });
  await prisma.kategoriSurat.upsert({
    where: { kode: "AKD" },
    update: {},
    create: { kode: "AKD", nama: "Akademik" },
  });

  const tahun = await prisma.tahunAkademik.upsert({
    where: { kode: "2025/2026" },
    update: { isAktif: true },
    create: {
      kode: "2025/2026",
      tanggalMulai: new Date("2025-08-01"),
      tanggalSelesai: new Date("2026-07-31"),
      isAktif: true,
    },
  });

  const existingSemester = await prisma.semester.findFirst({
    where: { tahunAkademikId: tahun.id, jenis: "ganjil" },
  });
  if (!existingSemester) {
    await prisma.semester.create({
      data: {
        tahunAkademikId: tahun.id,
        jenis: "ganjil",
        label: "Ganjil 2025/2026",
        isAktif: true,
      },
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: "surat.nomor_format" },
    update: {},
    create: {
      key: "surat.nomor_format",
      value: { format: "SURAT/{JENIS}/{TAHUN}/{SEQ}" },
    },
  });

  type SeedUser = {
    email: string;
    name: string;
    nidnNip: string;
    role: Role;
    prodiId?: string;
    isKaprodi?: boolean;
    jenisPegawai?: "dosen" | "tendik";
    jabatanStruktural?: "dekan" | "wd1" | "wd2" | "wd3";
  };

  const users: SeedUser[] = [
    {
      email: "admin@fakultas.ac.id",
      name: "Super Admin",
      nidnNip: "SA-001",
      role: "super_admin",
    },
    {
      email: "arsip@fakultas.ac.id",
      name: "Admin Arsip",
      nidnNip: "AR-001",
      role: "admin_arsip",
    },
    {
      email: "kepegawaian@fakultas.ac.id",
      name: "Admin Kepegawaian",
      nidnNip: "KP-001",
      role: "admin_kepegawaian",
    },
    {
      email: "dekan@fakultas.ac.id",
      name: "Dekan FT",
      nidnNip: "DK-001",
      role: "pimpinan",
      jabatanStruktural: "dekan",
    },
    {
      email: "kaprodi.if@fakultas.ac.id",
      name: "Kaprodi Informatika",
      nidnNip: "KD-IF-001",
      role: "pegawai",
      prodiId: informatika.id,
      isKaprodi: true,
      jenisPegawai: "dosen",
    },
    {
      email: "dosen.if@fakultas.ac.id",
      name: "Dosen Informatika",
      nidnNip: "DS-IF-001",
      role: "pegawai",
      prodiId: informatika.id,
      jenisPegawai: "dosen",
    },
    {
      email: "tendik@fakultas.ac.id",
      name: "Tendik Fakultas",
      nidnNip: "TD-001",
      role: "pegawai",
      prodiId: sipil.id,
      jenisPegawai: "tendik",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash,
        role: u.role,
        nidnNip: u.nidnNip,
        prodiId: u.prodiId,
        isKaprodi: u.isKaprodi ?? false,
        jenisPegawai: u.jenisPegawai,
        jabatanStruktural: u.jabatanStruktural,
        isActive: true,
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        nidnNip: u.nidnNip,
        prodiId: u.prodiId,
        isKaprodi: u.isKaprodi ?? false,
        jenisPegawai: u.jenisPegawai,
        jabatanStruktural: u.jabatanStruktural,
        isActive: true,
      },
    });
  }

  console.log("Seed selesai. Password semua akun demo: Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
