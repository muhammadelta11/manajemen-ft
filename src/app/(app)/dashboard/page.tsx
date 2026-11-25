import {
  ManajemenFTHome,
  type MftActivity,
  type MftQuickAction,
  type MftStat,
} from "@/components/ManajemenFTDashboard";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { SessionUser } from "@/lib/rbac";

export const instant = false;

export default async function DashboardPage() {
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

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

async function buildDashboard(user: SessionUser) {
  const notifUnread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  const recent = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const fallbackActivities: MftActivity[] = [
    {
      title: "Surat keluar berhasil dikirim",
      detail: "Surat No. SK/FT/2026/1120",
      time: "2 menit lalu",
      tone: "green",
    },
    {
      title: "Disposisi baru dari Dekan",
      detail: "Untuk: Bagian Akademik",
      time: "35 menit lalu",
      tone: "blue",
    },
    {
      title: "Agenda rapat fakultas",
      detail: "Hari ini, 09.00 WIB · Ruang Sidang",
      time: "1 jam lalu",
      tone: "gray",
    },
  ];

  const tones: MftActivity["tone"][] = ["green", "blue", "gray"];
  const activities: MftActivity[] =
    recent.length > 0
      ? recent.map((n, i) => ({
          title: n.judul,
          detail: n.pesan,
          time: relativeTime(n.createdAt),
          tone: tones[i % tones.length],
        }))
      : fallbackActivities;

  if (user.role === "admin_arsip" || user.role === "super_admin") {
    const [masuk, keluar, menungguDisposisi, disposisiOpen] = await Promise.all([
      prisma.surat.count({ where: { deletedAt: null, jenisSurat: "masuk" } }),
      prisma.surat.count({ where: { deletedAt: null, jenisSurat: "keluar" } }),
      prisma.surat.count({ where: { deletedAt: null, status: "menunggu_disposisi" } }),
      prisma.disposisi.count({
        where: { statusTindakLanjut: { in: ["belum", "proses"] } },
      }),
    ]);

    const stats: MftStat[] = [
      {
        label: "Surat Masuk",
        value: masuk,
        delta: "+0 minggu ini",
        icon: "file",
        tone: "blue",
      },
      {
        label: "Surat Keluar",
        value: keluar,
        delta: "+0 minggu ini",
        icon: "send",
        tone: "green",
      },
      {
        label: "Menunggu Disposisi",
        value: menungguDisposisi,
        delta: "Perlu ditindaklanjuti",
        icon: "clipboard",
        tone: "purple",
      },
      {
        label: "Disposisi Belum Selesai",
        value: disposisiOpen,
        delta: disposisiOpen > 0 ? "Perlu perhatian" : "Semua selesai",
        icon: "check",
        tone: "orange",
      },
      {
        label: "Notifikasi Baru",
        value: notifUnread,
        delta: notifUnread > 0 ? "Belum dibaca" : "Tidak ada baru",
        icon: "bell",
        tone: "teal",
      },
    ];

    const quickActions: MftQuickAction[] =
      user.role === "admin_arsip"
        ? [
            {
              label: "Catat Surat",
              desc: "Input surat masuk",
              href: "/surat/baru",
              icon: "plus",
              tone: "blue",
            },
            {
              label: "Daftar Surat",
              desc: "Kelola arsip surat",
              href: "/surat",
              icon: "file",
              tone: "green",
            },
            {
              label: "Pantau Disposisi",
              desc: "Lacak proses surat",
              href: "/disposisi",
              icon: "send",
              tone: "purple",
            },
            {
              label: "Agenda & Ekspor",
              desc: "Jadwal dan laporan",
              href: "/agenda",
              icon: "calendar",
              tone: "orange",
            },
            {
              label: "Notifikasi",
              desc: "Pusat pemberitahuan",
              href: "/notifikasi",
              icon: "bell",
              tone: "teal",
            },
          ]
        : [
            {
              label: "Pengguna",
              desc: "Kelola akun sistem",
              href: "/users",
              icon: "users",
              tone: "blue",
            },
            {
              label: "Daftar Surat",
              desc: "Kelola arsip surat",
              href: "/surat",
              icon: "file",
              tone: "green",
            },
            {
              label: "Disposisi",
              desc: "Lacak proses surat",
              href: "/disposisi",
              icon: "send",
              tone: "purple",
            },
            {
              label: "Pengaturan",
              desc: "Master data",
              href: "/master",
              icon: "calendar",
              tone: "orange",
            },
            {
              label: "Notifikasi",
              desc: "Pusat pemberitahuan",
              href: "/notifikasi",
              icon: "bell",
              tone: "teal",
            },
          ];

    return {
      primaryCta: user.role === "admin_arsip" ? "/surat/baru" : "/users",
      stats,
      quickActions,
      activities,
      attentionText:
        disposisiOpen > 0
          ? `${disposisiOpen} disposisi belum selesai`
          : "Tidak ada disposisi tertunda",
    };
  }

  if (user.role === "pimpinan") {
    const menunggu = await prisma.surat.count({
      where: { deletedAt: null, status: "menunggu_disposisi" },
    });
    return {
      primaryCta: "/disposisi",
      stats: [
        {
          label: "Menunggu Disposisi",
          value: menunggu,
          delta: "Perlu ditindaklanjuti",
          icon: "clipboard" as const,
          tone: "purple" as const,
        },
        {
          label: "Notifikasi Baru",
          value: notifUnread,
          delta: notifUnread > 0 ? "Belum dibaca" : "Tidak ada baru",
          icon: "bell" as const,
          tone: "teal" as const,
        },
      ],
      quickActions: [
        {
          label: "Antrean Disposisi",
          desc: "Tinjau & disposisikan",
          href: "/disposisi",
          icon: "send" as const,
          tone: "purple" as const,
        },
        {
          label: "Lihat Surat",
          desc: "Arsip surat",
          href: "/surat",
          icon: "file" as const,
          tone: "green" as const,
        },
        {
          label: "Kepegawaian",
          desc: "Aktivitas pegawai",
          href: "/aktivitas",
          icon: "book" as const,
          tone: "blue" as const,
        },
        {
          label: "Notifikasi",
          desc: "Pusat pemberitahuan",
          href: "/notifikasi",
          icon: "bell" as const,
          tone: "teal" as const,
        },
      ],
      activities,
      attentionText:
        menunggu > 0 ? `${menunggu} surat menunggu disposisi` : "Antrean disposisi kosong",
    };
  }

  if (user.role === "admin_kepegawaian") {
    const pegawai = await prisma.user.count({ where: { role: "pegawai", isActive: true } });
    return {
      primaryCta: "/pegawai",
      stats: [
        {
          label: "Pegawai",
          value: pegawai,
          delta: "Aktif di fakultas",
          icon: "clipboard" as const,
          tone: "blue" as const,
        },
        {
          label: "Notifikasi Baru",
          value: notifUnread,
          delta: notifUnread > 0 ? "Belum dibaca" : "Tidak ada baru",
          icon: "bell" as const,
          tone: "teal" as const,
        },
      ],
      quickActions: [
        {
          label: "Profil Pegawai",
          desc: "Data kepegawaian",
          href: "/pegawai",
          icon: "users" as const,
          tone: "blue" as const,
        },
        {
          label: "Aktivitas",
          desc: "Tridarma pegawai",
          href: "/aktivitas",
          icon: "book" as const,
          tone: "green" as const,
        },
        {
          label: "Laporan",
          desc: "Ekspor kepegawaian",
          href: "/laporan/kepegawaian",
          icon: "file" as const,
          tone: "orange" as const,
        },
        {
          label: "Notifikasi",
          desc: "Pusat pemberitahuan",
          href: "/notifikasi",
          icon: "bell" as const,
          tone: "teal" as const,
        },
      ],
      activities,
      attentionText: "Pantau validasi aktivitas pegawai",
    };
  }

  const aktivitasSaya = await prisma.aktivitasPegawai.count({
    where: { userId: user.id, deletedAt: null },
  });
  return {
    primaryCta: "/aktivitas/baru",
    stats: [
      {
        label: "Aktivitas Saya",
        value: aktivitasSaya,
        delta: "Tridarma tercatat",
        icon: "check" as const,
        tone: "green" as const,
      },
      {
        label: "Notifikasi Baru",
        value: notifUnread,
        delta: notifUnread > 0 ? "Belum dibaca" : "Tidak ada baru",
        icon: "bell" as const,
        tone: "teal" as const,
      },
    ],
    quickActions: [
      {
        label: "Input Aktivitas",
        desc: "Catat kegiatan baru",
        href: "/aktivitas/baru",
        icon: "plus" as const,
        tone: "blue" as const,
      },
      {
        label: "Aktivitas Saya",
        desc: "Riwayat tridarma",
        href: "/aktivitas",
        icon: "book" as const,
        tone: "green" as const,
      },
      {
        label: "Tugas Disposisi",
        desc: "Tindak lanjut surat",
        href: "/disposisi",
        icon: "send" as const,
        tone: "purple" as const,
      },
      {
        label: "Notifikasi",
        desc: "Pusat pemberitahuan",
        href: "/notifikasi",
        icon: "bell" as const,
        tone: "teal" as const,
      },
    ],
    activities,
    attentionText: "Cek tugas disposisi yang perlu tindak lanjut",
  };
}
