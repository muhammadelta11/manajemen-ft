import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const admin = createAdminClient();
  const { count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <AppShell
      user={{ name: user.name, role: user.role, isKaprodi: user.isKaprodi }}
      unreadCount={count ?? 0}
    >
      {children}
    </AppShell>
  );
}
