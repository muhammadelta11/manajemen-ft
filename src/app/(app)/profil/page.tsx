import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { PushEnableCard } from "@/components/push-enable";

export const instant = false;

export default async function ProfilPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akun"
        title="Pengaturan"
        description="Profil akun dan preferensi notifikasi"
      />
      <section className="panel max-w-xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Nama</p>
        <p className="mt-1 text-lg font-semibold">{user.name}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Email
        </p>
        <p className="mt-1">{user.email}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Peran
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{user.role}</Badge>
          {user.isKaprodi ? (
            <Badge className="border-amber-200 bg-amber-50 text-amber-900">Kaprodi</Badge>
          ) : null}
        </div>
      </section>

      <section id="push" className="panel max-w-xl scroll-mt-24 p-6">
        <h2 className="text-lg font-semibold">Notifikasi web push</h2>
        <div className="mt-3">
          <PushEnableCard />
        </div>
      </section>
    </div>
  );
}
