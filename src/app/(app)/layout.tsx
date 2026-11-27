import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { getUserFromCookie, requireUser } from "@/lib/session";

export const instant = false;

/**
 * Prefer cookie (cepat). Jika cookie hilang/lama tapi sesi masih valid,
 * requireUser mengisi ulang cookie — hindari blank/redirect loop.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = (await getUserFromCookie()) ?? (await requireUser());

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
