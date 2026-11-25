"use client";

import ManajemenFTDashboard from "@/components/ManajemenFTDashboard";
import type { AppRole } from "@/lib/roles";

/** App chrome — Manajemen FT UI kit (sidebar + topbar + content). */
export function AppShell({
  children,
  user,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  user: { name: string; role: AppRole; isKaprodi: boolean };
  unreadCount?: number;
}) {
  return (
    <ManajemenFTDashboard user={user} unreadCount={unreadCount}>
      {children}
    </ManajemenFTDashboard>
  );
}
