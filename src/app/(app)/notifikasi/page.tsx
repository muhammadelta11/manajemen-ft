import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { PushEnableCard } from "@/components/push-enable";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

export default async function NotifikasiPage() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: items } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem"
        title="Notifikasi"
        description="Pemberitahuan in-app dan pengaturan web push"
      />

      <section className="panel max-w-2xl space-y-3 p-5">
        <h2 className="text-base font-semibold text-[var(--ink)]">Notifikasi web push</h2>
        <p className="text-sm text-[var(--muted)]">
          Aktifkan agar alert muncul di perangkat (Chrome/Edge · HTTPS). Juga tersedia di menu Akun /
          Pengaturan → Profil.
        </p>
        <PushEnableCard />
      </section>

      <ul className="space-y-2.5">
        {(items ?? []).map((n) => (
          <li key={n.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[var(--ink)]">{n.judul}</p>
              <Badge>{n.tipe}</Badge>
              {!n.read_at ? (
                <Badge className="border-amber-200 bg-amber-50 text-amber-900">baru</Badge>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{n.pesan}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted)]">
              <span>{formatDate(n.created_at)}</span>
              {n.link_path ? (
                <Link href={n.link_path} className="font-semibold text-[var(--brand-deep)] hover:underline">
                  Buka
                </Link>
              ) : null}
            </div>
          </li>
        ))}
        {(items ?? []).length === 0 ? (
          <li className="panel px-4 py-10 text-center text-sm text-[var(--muted)]">
            Belum ada notifikasi.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
