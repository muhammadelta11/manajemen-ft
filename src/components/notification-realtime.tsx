"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type Payload = {
  unread: number;
  latestId: string | null;
  latestTitle: string | null;
  latestAt: string | null;
};

export function useNotificationStream(initialUnread: number) {
  const [unread, setUnread] = useState(initialUnread);
  const [toast, setToast] = useState<string | null>(null);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    const connect = () => {
      if (!alive) return;
      es = new EventSource("/api/notifications/stream");

      es.addEventListener("notifications", (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as Payload;
          setUnread(data.unread);
          if (data.latestId && lastId.current && data.latestId !== lastId.current && data.unread > 0) {
            setToast(data.latestTitle ?? "Notifikasi baru");
            window.setTimeout(() => setToast(null), 4500);
          }
          if (data.latestId) lastId.current = data.latestId;
          if (!lastId.current && data.latestId) lastId.current = data.latestId;
        } catch {
          /* ignore malformed */
        }
      });

      es.onerror = () => {
        es?.close();
        retry = setTimeout(connect, 8000);
      };
    };

    // Tunda SSE agar tidak bersaing dengan navigasi/login pertama
    const start = window.setTimeout(connect, 1200);
    return () => {
      alive = false;
      window.clearTimeout(start);
      es?.close();
      if (retry) clearTimeout(retry);
    };
  }, []);

  return { unread, toast, dismissToast: () => setToast(null) };
}

export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brass)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ink)]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function NotificationToast({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  if (!message) return null;
  return (
    <div className="fixed bottom-28 right-4 z-[60] max-w-sm animate-fade-up md:bottom-6">
      <div className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-white shadow-[0_20px_50px_-20px_rgba(7,21,18,0.65)]">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brass)]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brass)]">
            Notifikasi baru
          </p>
          <p className="mt-1 truncate text-sm">{message}</p>
          <Link
            href="/notifikasi"
            className="mt-2 inline-block text-xs font-semibold text-white/80 underline-offset-2 hover:underline"
            onClick={onClose}
          >
            Lihat semua
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn("text-white/50 hover:text-white")}
          aria-label="Tutup"
        >
          ×
        </button>
      </div>
    </div>
  );
}
