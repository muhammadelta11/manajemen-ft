export const ROLES = [
  "super_admin",
  "admin_arsip",
  "admin_kepegawaian",
  "pegawai",
  "pimpinan",
] as const;

export type AppRole = (typeof ROLES)[number];
