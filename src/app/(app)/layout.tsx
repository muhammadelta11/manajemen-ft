import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { getUserFromCookie } from "@/lib/session";

export const instant = false;

/**
 * Shell hanya dari cookie profil (tanpa query notifikasi/DB).
 * Badge unread diisi SSE di client → navigasi menu tidak menunggu server.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromCookie();
  if (!user) redirect("/login");

  return (
    <AppShell
      user={{ name: user.name, role: user.role, isKaprodi: user.isKaprodi }}
      unreadCount={0}
    >
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </AppShell>
  );
}

function PageFallback() {
  return (
    <div className="animate-pulse space-y-4 p-1">
      <div className="h-8 w-48 rounded-lg bg-black/5" />
      <div className="h-28 rounded-2xl bg-black/5" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-24 rounded-2xl bg-black/5" />
        <div className="h-24 rounded-2xl bg-black/5" />
        <div className="h-24 rounded-2xl bg-black/5" />
      </div>
    </div>
  );
}
