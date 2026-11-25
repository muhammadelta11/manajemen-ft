import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

export const instant = false;

export default async function NotifikasiPage() {
  const user = await requireUser();

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem"
        title="Notifikasi"
        description="Pemberitahuan in-app dengan pembaruan real-time (SSE)"
      />

      <ul className="animate-fade-up-delay-1 space-y-2.5">
        {items.map((n) => (
          <li key={n.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[var(--ink)]">{n.judul}</p>
              <Badge>{n.tipe}</Badge>
              {!n.readAt ? (
                <Badge className="border-amber-200 bg-amber-50 text-amber-900">baru</Badge>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{n.pesan}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted)]">
              <span>{formatDate(n.createdAt)}</span>
              {n.linkPath ? (
                <Link
                  href={n.linkPath}
                  className="font-semibold text-[var(--brand-deep)] hover:underline"
                >
                  Buka
                </Link>
              ) : null}
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="panel px-4 py-10 text-center text-sm text-[var(--muted)]">
            Belum ada notifikasi.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
