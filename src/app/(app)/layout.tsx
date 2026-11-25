import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

/** Auth + Prisma runtime data — allow blocking until Cache Components adopted fully. */
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <AppShell
      user={{ name: user.name, role: user.role, isKaprodi: user.isKaprodi }}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
