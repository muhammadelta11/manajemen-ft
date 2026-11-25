"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  LayoutDashboard,
  Bell,
  FileText,
  Send,
  CalendarDays,
  Settings,
  Search,
  ChevronDown,
  Sun,
  FilePlus2,
  ClipboardList,
  CheckCircle2,
  Clock3,
  CircleAlert,
  Megaphone,
  ArrowUpRight,
  ArrowRight,
  History,
  Menu,
  X,
  LogOut,
  GraduationCap,
  UserRound,
  BookOpen,
  Users,
  Archive,
} from "lucide-react";
import type { AppRole } from "@/lib/roles";
import {
  NotificationToast,
  useNotificationStream,
} from "@/components/notification-realtime";
import "./manajemen-ft-dashboard.css";

export type MftStat = {
  label: string;
  value: string | number;
  delta: string;
  tone: "blue" | "green" | "purple" | "orange" | "teal";
  icon: "file" | "send" | "clipboard" | "check" | "bell";
};

export type MftActivity = {
  title: string;
  detail: string;
  time: string;
  tone: "green" | "blue" | "gray";
};

export type MftQuickAction = {
  label: string;
  desc: string;
  href: string;
  tone: "blue" | "green" | "purple" | "orange" | "teal";
  icon: "plus" | "file" | "send" | "calendar" | "bell" | "users" | "book" | "check";
};

type ShellProps = {
  user: { name: string; role: AppRole; isKaprodi: boolean };
  unreadCount?: number;
  children: React.ReactNode;
};

const iconMap = {
  file: FileText,
  send: Send,
  clipboard: ClipboardList,
  check: CheckCircle2,
  bell: Bell,
  plus: FilePlus2,
  calendar: CalendarDays,
  users: Users,
  book: BookOpen,
} as const;

function roleLabel(role: AppRole, isKaprodi: boolean) {
  if (role === "admin_arsip") return "Administrator";
  if (role === "pegawai" && isKaprodi) return "Kaprodi";
  const map: Record<AppRole, string> = {
    super_admin: "Super Admin",
    admin_arsip: "Administrator",
    admin_kepegawaian: "Admin Kepegawaian",
    pegawai: "Pegawai",
    pimpinan: "Pimpinan",
  };
  return map[role];
}

function navFor(role: AppRole, isKaprodi: boolean) {
  const base = [
    { label: "Beranda", href: "/dashboard", icon: LayoutDashboard },
    { label: "Notifikasi", href: "/notifikasi", icon: Bell },
  ];
  if (role === "admin_arsip") {
    return [
      ...base,
      { label: "Surat", href: "/surat", icon: FileText },
      { label: "Pantau", href: "/disposisi", icon: Send },
      { label: "Agenda", href: "/agenda", icon: CalendarDays },
      { label: "Pengaturan", href: "/profil", icon: Settings },
    ];
  }
  if (role === "super_admin") {
    return [
      ...base,
      { label: "Surat", href: "/surat", icon: FileText },
      { label: "Disposisi", href: "/disposisi", icon: Send },
      { label: "Aktivitas", href: "/aktivitas", icon: BookOpen },
      { label: "Pengguna", href: "/users", icon: Users },
      { label: "Pengaturan", href: "/master", icon: Settings },
    ];
  }
  if (role === "admin_kepegawaian") {
    return [
      ...base,
      { label: "Aktivitas", href: "/aktivitas", icon: BookOpen },
      { label: "Pegawai", href: "/pegawai", icon: Users },
      { label: "Laporan", href: "/laporan/kepegawaian", icon: Archive },
      { label: "Pengaturan", href: "/profil", icon: Settings },
    ];
  }
  if (role === "pimpinan") {
    return [
      ...base,
      { label: "Disposisi", href: "/disposisi", icon: Send },
      { label: "Surat", href: "/surat", icon: FileText },
      { label: "Kepegawaian", href: "/aktivitas", icon: BookOpen },
      { label: "Pengaturan", href: "/profil", icon: Settings },
    ];
  }
  const items = [
    ...base,
    { label: "Aktivitas", href: "/aktivitas", icon: BookOpen },
  ];
  if (isKaprodi) items.push({ label: "Validasi", href: "/validasi", icon: CheckCircle2 });
  items.push(
    { label: "Tugas saya", href: "/disposisi", icon: Send },
    { label: "Pengaturan", href: "/profil", icon: Settings },
  );
  return items;
}

export function ManajemenFTHome({
  primaryCta = "/surat/baru",
  stats,
  quickActions,
  activities,
  attentionText = "Disposisi belum selesai — pantau segera",
}: {
  primaryCta?: string;
  stats: MftStat[];
  quickActions: MftQuickAction[];
  activities: MftActivity[];
  attentionText?: string;
}) {
  return (
    <>
      <section className="mft-hero">
        <div className="mft-hero-copy">
          <span className="mft-eyebrow">
            <span className="mft-eyebrow-bar" aria-hidden /> RUANG KERJA
          </span>
          <h1>
            Selamat datang di
            <br />
            <em>Manajemen FT</em>
          </h1>
          <p>
            Sistem informasi terpadu untuk mendukung
            <br className="mft-desktop-break" /> pengelolaan administrasi Fakultas Teknik.
          </p>
          <Link className="mft-primary-button" href={primaryCta}>
            Mulai Sekarang <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mft-hero-art" aria-hidden="true">
          <div className="mft-hero-orb mft-orb-one" />
          <div className="mft-hero-orb mft-orb-two" />
          <div className="mft-building">
            <div className="mft-building-roof" />
            <div className="mft-building-sign">
              FAKULTAS TEKNIK
              <br />
              <b>UNWAHAS</b>
            </div>
            <div className="mft-building-windows" />
          </div>
          <div className="mft-hero-trees">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="mft-hero-dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="mft-stats-grid">
        {stats.map(({ label, value, delta, icon, tone }) => {
          const Icon = iconMap[icon];
          return (
            <article className="mft-stat-card" key={label}>
              <div className={`mft-stat-icon ${tone}`}>
                <Icon size={20} />
              </div>
              <div className="mft-stat-info">
                <span className="mft-stat-label">{label}</span>
                <strong>{value}</strong>
                <small className={tone === "orange" ? "warning" : ""}>{delta}</small>
              </div>
              <div className={`mft-stat-spark ${tone}`}>
                <svg viewBox="0 0 110 36" preserveAspectRatio="none">
                  <path d="M0 30 C18 30 19 18 34 20 S49 5 63 13 S83 31 110 9" />
                </svg>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mft-dashboard-grid">
        <div className="mft-left-column">
          <section className="mft-panel mft-quick-panel">
            <div className="mft-panel-heading">
              <div className="mft-heading-icon">
                <History size={20} />
              </div>
              <div>
                <h2>Akses Cepat</h2>
                <p>Menu yang sering digunakan</p>
              </div>
              <Link className="mft-text-link" href={quickActions[0]?.href ?? "/dashboard"}>
                Lihat semua <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="mft-quick-grid">
              {quickActions.map(({ label, desc, href, icon, tone }) => {
                const Icon = iconMap[icon];
                return (
                  <Link className={`mft-quick-item ${tone}`} key={label} href={href}>
                    <span className={`mft-quick-icon ${tone}`}>
                      <Icon size={22} />
                    </span>
                    <strong>{label}</strong>
                    <small>{desc}</small>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mft-panel mft-announcement-panel">
            <div className="mft-panel-heading">
              <div className="mft-heading-icon">
                <Megaphone size={20} />
              </div>
              <div>
                <h2>Pengumuman</h2>
                <p>Informasi penting seputar Fakultas Teknik</p>
              </div>
              <span className="mft-text-link">
                Lihat semua <ArrowUpRight size={15} />
              </span>
            </div>
            <article className="mft-announcement">
              <div className="mft-announcement-thumb">
                <GraduationCap size={36} />
                <span>FT</span>
              </div>
              <div className="mft-announcement-body">
                <span className="mft-pill">Informasi</span>
                <h3>Jadwal Wisuda Universitas Wahid Hasyim Tahun 2026</h3>
                <p>
                  Berikut jadwal pelaksanaan wisuda tahun 2026 yang dapat diakses melalui portal resmi
                  kampus.
                </p>
                <div className="mft-announcement-meta">
                  <span>
                    <CalendarDays size={13} />
                    17 Nov 2026
                  </span>
                  <span>
                    <Clock3 size={13} />
                    08.30 WIB
                  </span>
                </div>
              </div>
            </article>
          </section>
        </div>

        <div className="mft-right-column">
          <section className="mft-panel mft-activity-panel">
            <div className="mft-panel-heading">
              <div className="mft-heading-icon">
                <History size={20} />
              </div>
              <div>
                <h2>Aktivitas Terbaru</h2>
                <p>Ringkasan aktivitas sistem</p>
              </div>
              <Link className="mft-text-link" href="/notifikasi">
                Detail <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="mft-timeline">
              {activities.map((item) => (
                <article className="mft-activity" key={`${item.title}-${item.time}`}>
                  <span className={`mft-timeline-dot ${item.tone}`} />
                  <div className="mft-activity-copy">
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <time>{item.time}</time>
                </article>
              ))}
            </div>
          </section>

          <section className="mft-promo">
            <div className="mft-promo-content">
              <span>BERSAMA MEMBANGUN</span>
              <h2>
                Fakultas Teknik
                <br />
                <b>yang Unggul</b>
              </h2>
              <p>Inovasi · Kolaborasi · Prestasi</p>
              <Link className="mft-primary-button light" href={primaryCta}>
                Selengkapnya <ArrowRight size={15} />
              </Link>
            </div>
            <div className="mft-promo-art">
              <div className="mft-promo-building" />
            </div>
          </section>

          <section className="mft-mini-summary">
            <div className="mft-mini-icon">
              <CircleAlert size={18} />
            </div>
            <div>
              <strong>Perlu perhatian</strong>
              <p>{attentionText}</p>
            </div>
            <Link href="/disposisi" aria-label="Lihat disposisi">
              <ArrowRight size={17} />
            </Link>
          </section>
        </div>
      </section>

      <footer className="mft-footer">
        © 2026 Manajemen FT <span>Universitas Wahid Hasyim</span>
      </footer>
    </>
  );
}

export default function ManajemenFTDashboard({
  user,
  unreadCount = 0,
  children,
}: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navItems = useMemo(() => navFor(user.role, user.isKaprodi), [user.role, user.isKaprodi]);
  const { unread, toast, dismissToast } = useNotificationStream(unreadCount);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>(".mft-search input");
        el?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mft-nav-open", mobileOpen);
    return () => document.body.classList.remove("mft-nav-open");
  }, [mobileOpen]);

  return (
    <main className="mft-shell">
      <aside className={`mft-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="mft-brand">
          <div className="mft-brand-mark">
            <GraduationCap size={27} />
          </div>
          <div>
            <span>Fakultas Teknik</span>
            <strong>Manajemen FT</strong>
            <small>Universitas Wahid Hasyim</small>
          </div>
          <button
            className="mft-close-sidebar"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mft-nav">
          <p className="mft-nav-caption">MENU UTAMA</p>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            const showCount = href === "/notifikasi" && unread > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`mft-nav-item ${active ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
                {showCount ? <b className="mft-nav-count">{unread > 99 ? "99+" : unread}</b> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mft-sidebar-bottom">
          <div className="mft-user-card">
            <div className="mft-avatar">
              <UserRound size={20} />
            </div>
            <div className="mft-user-meta">
              <strong>{user.name}</strong>
              <span>{roleLabel(user.role, user.isKaprodi)}</span>
            </div>
            <form action={logoutAction}>
              <button aria-label="Keluar" className="mft-logout" type="submit">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          className="mft-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup navigasi"
          type="button"
        />
      ) : null}

      <section className="mft-main">
        <header className="mft-topbar">
          <button
            className="mft-mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
            type="button"
          >
            <Menu size={21} />
          </button>
          <div className="mft-search" role="search">
            <Search size={19} aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  const hit = navItems.find((n) =>
                    n.label.toLowerCase().includes(search.trim().toLowerCase()),
                  );
                  if (hit) router.push(hit.href);
                }
              }}
              placeholder="Cari menu, surat, atau informasi..."
              aria-label="Cari menu, surat, atau informasi"
            />
            <kbd>Ctrl K</kbd>
          </div>
          <div className="mft-topbar-actions">
            <Link href="/notifikasi" className="mft-icon-button" aria-label="Notifikasi">
              <Bell size={19} />
              {unread > 0 ? <span className="mft-notif-dot" aria-hidden /> : null}
            </Link>
            <button className="mft-icon-button mft-theme-button" aria-label="Tema" type="button">
              <Sun size={19} />
            </button>
            <button className="mft-profile" type="button" onClick={() => router.push("/profil")}>
              <span className="mft-profile-avatar">
                <UserRound size={18} />
              </span>
              <span>{user.name}</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <div className="mft-content">{children}</div>
      </section>

      <nav className="mft-bottom-nav" aria-label="Menu bawah">
        {navItems.slice(0, 4).map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          const showCount = href === "/notifikasi" && unread > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`mft-bottom-item ${active ? "active" : ""}`}
            >
              <span className="mft-bottom-icon">
                <Icon size={20} strokeWidth={1.9} />
                {showCount ? (
                  <b className="mft-bottom-badge">{unread > 99 ? "99+" : unread}</b>
                ) : null}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="mft-bottom-item"
          onClick={() => setMobileOpen(true)}
          aria-label="Menu lainnya"
        >
          <span className="mft-bottom-icon">
            <Menu size={20} strokeWidth={1.9} />
          </span>
          <span>Lainnya</span>
        </button>
      </nav>

      <NotificationToast message={toast} onClose={dismissToast} />
    </main>
  );
}
