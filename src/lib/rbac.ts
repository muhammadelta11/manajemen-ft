import type { AppRole } from "@/lib/roles";

export type SessionUser = {
  id: string;
  role: AppRole;
  isKaprodi: boolean;
  prodiId: string | null;
  name: string;
  email: string;
};

const ROLE_HOME: Record<AppRole, string> = {
  super_admin: "/dashboard",
  admin_arsip: "/surat",
  admin_kepegawaian: "/aktivitas",
  pegawai: "/aktivitas",
  pimpinan: "/disposisi",
};

export function homeForRole(role: AppRole) {
  return ROLE_HOME[role] ?? "/dashboard";
}

/** Route prefixes allowed per role (coarse middleware gate). */
export function canAccessPath(user: SessionUser, pathname: string): boolean {
  if (pathname.startsWith("/login") || pathname === "/") return true;
  if (pathname.startsWith("/profil") || pathname.startsWith("/notifikasi") || pathname.startsWith("/dashboard")) {
    return true;
  }

  const { role, isKaprodi } = user;

  if (pathname.startsWith("/master") || pathname.startsWith("/users") || pathname.startsWith("/audit")) {
    return role === "super_admin";
  }

  if (pathname.startsWith("/surat") || pathname.startsWith("/agenda")) {
    return role === "super_admin" || role === "admin_arsip" || role === "pimpinan";
  }

  if (pathname.startsWith("/disposisi")) {
    return (
      role === "super_admin" ||
      role === "admin_arsip" ||
      role === "pimpinan" ||
      role === "pegawai" ||
      role === "admin_kepegawaian"
    );
  }

  if (pathname.startsWith("/validasi")) {
    return role === "pegawai" && isKaprodi;
  }

  if (pathname.startsWith("/pegawai") || pathname.startsWith("/laporan/kepegawaian")) {
    return role === "super_admin" || role === "admin_kepegawaian" || role === "pimpinan";
  }

  if (pathname.startsWith("/aktivitas")) {
    return (
      role === "super_admin" ||
      role === "admin_kepegawaian" ||
      role === "pegawai" ||
      role === "pimpinan"
    );
  }

  return true;
}

export function canManageSurat(role: AppRole) {
  return role === "super_admin" || role === "admin_arsip";
}

export function canCreateDisposisi(role: AppRole) {
  return role === "pimpinan" || role === "super_admin";
}

export function canManageAktivitasOwn(role: AppRole) {
  return role === "pegawai";
}

export function canValidateAktivitas(user: SessionUser) {
  return user.role === "pegawai" && user.isKaprodi && !!user.prodiId;
}

export function canViewKepegawaian(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "admin_kepegawaian" ||
    role === "pimpinan" ||
    role === "pegawai"
  );
}
