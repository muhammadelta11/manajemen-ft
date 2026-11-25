import {
  ManajemenFTHome,
  type MftActivity,
  type MftQuickAction,
  type MftStat,
} from "@/components/ManajemenFTDashboard";
import { requireUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/lib/rbac";

export default async function DashboardPage() {
  // requireUser di-cache bersama layout — tidak dobel round-trip
  const user = await requireUser();
  const data = await buildDashboard(user);
  return (
    <ManajemenFTHome
      primaryCta={data.primaryCta}
      stats={data.stats}
      quickActions={data.quickActions}
      activities={data.activities}
      attentionText={data.attentionText}
    />
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

async function buildDashboard(user: SessionUser) {
  const admin = createAdminClient();

  const [{ count: notifUnread }, { data: recent }] = await Promise.all([
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
    admin
      .from("notifications")
      .select("judul, pesan, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const tones: MftActivity["tone"][] = ["green", "blue", "gray"];
  const activities: MftActivity[] =
    recent && recent.length > 0
      ? recent.map((n, i) => ({
          title: n.judul,
          detail: n.pesan,
          time: relativeTime(n.created_at),
          tone: tones[i % tones.length],
        }))
      : [
          {
            title: "Sistem siap digunakan",
            detail: "Manajemen FT · Supabase",
            time: "baru saja",
            tone: "green",
          },
        ];

  const unread = notifUnread ?? 0;

  if (user.role === "admin_arsip" || user.role === "super_admin") {
    const [masuk, keluar, menunggu, openDisp] = await Promise.all([
      admin.from("surat").select("id", { count: "exact", head: true }).eq("jenis_surat", "masuk").is("deleted_at", null),
      admin.from("surat").select("id", { count: "exact", head: true }).eq("jenis_surat", "keluar").is("deleted_at", null),
      admin.from("surat").select("id", { count: "exact", head: true }).eq("status", "menunggu_disposisi").is("deleted_at", null),
      admin.from("disposisi").select("id", { count: "exact", head: true }).in("status_tindak_lanjut", ["belum", "proses"]),
    ]);

    const stats: MftStat[] = [
      { label: "Surat Masuk", value: masuk.count ?? 0, delta: "Arsip masuk", icon: "file", tone: "blue" },
      { label: "Surat Keluar", value: keluar.count ?? 0, delta: "Arsip keluar", icon: "send", tone: "green" },
      { label: "Menunggu Disposisi", value: menunggu.count ?? 0, delta: "Perlu ditindaklanjuti", icon: "clipboard", tone: "purple" },
      { label: "Disposisi Belum Selesai", value: openDisp.count ?? 0, delta: "Perlu perhatian", icon: "check", tone: "orange" },
      { label: "Notifikasi Baru", value: unread, delta: unread ? "Belum dibaca" : "Tidak ada baru", icon: "bell", tone: "teal" },
    ];

    const quickActions: MftQuickAction[] =
      user.role === "admin_arsip"
        ? [
            { label: "Catat Surat", desc: "Input surat masuk", href: "/surat/baru", icon: "plus", tone: "blue" },
            { label: "Daftar Surat", desc: "Kelola arsip surat", href: "/surat", icon: "file", tone: "green" },
            { label: "Pantau Disposisi", desc: "Lacak proses surat", href: "/disposisi", icon: "send", tone: "purple" },
            { label: "Agenda & Ekspor", desc: "Jadwal dan laporan", href: "/agenda", icon: "calendar", tone: "orange" },
            { label: "Notifikasi", desc: "Pusat pemberitahuan", href: "/notifikasi", icon: "bell", tone: "teal" },
          ]
        : [
            { label: "Pengguna", desc: "Kelola akun", href: "/users", icon: "users", tone: "blue" },
            { label: "Daftar Surat", desc: "Arsip surat", href: "/surat", icon: "file", tone: "green" },
            { label: "Disposisi", desc: "Pantau disposisi", href: "/disposisi", icon: "send", tone: "purple" },
            { label: "Pengaturan", desc: "Master data", href: "/master", icon: "calendar", tone: "orange" },
            { label: "Notifikasi", desc: "Pusat pemberitahuan", href: "/notifikasi", icon: "bell", tone: "teal" },
          ];

    return {
      primaryCta: user.role === "admin_arsip" ? "/surat/baru" : "/users",
      stats,
      quickActions,
      activities,
      attentionText: `${openDisp.count ?? 0} disposisi belum selesai`,
    };
  }

  return {
    primaryCta: "/aktivitas",
    stats: [
      { label: "Notifikasi Baru", value: unread, delta: unread ? "Belum dibaca" : "Tidak ada baru", icon: "bell" as const, tone: "teal" as const },
    ],
    quickActions: [
      { label: "Aktivitas", desc: "Tridarma", href: "/aktivitas", icon: "book" as const, tone: "green" as const },
      { label: "Notifikasi", desc: "Pemberitahuan", href: "/notifikasi", icon: "bell" as const, tone: "teal" as const },
    ],
    activities,
    attentionText: "Pantau notifikasi dan tugas Anda",
  };
}
