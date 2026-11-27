"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  getPushPublicKeyAction,
  removePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/app/actions/push";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushEnableCard({ compact = false }: { compact?: boolean }) {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState(
    () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);
    setReady(true);
    if (!ok) return;

    setPermission(Notification.permission);

    void getPushPublicKeyAction().then((r) => {
      setConfigured(r.configured);
      if (r.publicKey) setPublicKey(r.publicKey);
    });

    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => setSubscribed(false));
  }, []);

  function enable() {
    setMessage(null);
    start(async () => {
      const key = publicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
      if (!key) {
        setMessage(
          "VAPID public key belum di-set. Tambahkan NEXT_PUBLIC_VAPID_PUBLIC_KEY di Vercel/.env.local lalu redeploy.",
        );
        return;
      }
      if (!window.isSecureContext && location.hostname !== "localhost") {
        setMessage("Web Push membutuhkan HTTPS.");
        return;
      }

      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        /* sudah terdaftar */
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setMessage("Izin notifikasi ditolak di browser. Cek ikon gembok di address bar.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }

      const json = sub.toJSON();
      const result = await savePushSubscriptionAction({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
        userAgent: navigator.userAgent,
      });

      if (result.error) {
        setMessage(result.error);
        return;
      }
      setSubscribed(true);
      setConfigured(true);
      setMessage("Notifikasi web push aktif.");
    });
  }

  function disable() {
    setMessage(null);
    start(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMessage("Notifikasi web push dimatikan.");
    });
  }

  if (!ready) {
    return (
      <div id="push" className="space-y-3">
        <Button type="button" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat…
        </Button>
      </div>
    );
  }

  if (!supported) {
    return (
      <div id="push" className="space-y-2">
        <p className="text-sm text-[var(--muted)]">
          Browser ini tidak mendukung Web Push. Pakai Chrome/Edge (Android atau desktop) lewat HTTPS.
        </p>
      </div>
    );
  }

  return (
    <div id="push" className="space-y-3">
      {!compact ? (
        <p className="text-sm text-[var(--muted)]">
          Aktifkan agar pemberitahuan surat/disposisi/validasi muncul di perangkat, meski tab ditutup.
          {permission === "granted" && subscribed ? " Status: aktif." : null}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {!subscribed ? (
          <Button type="button" onClick={enable} disabled={pending} size={compact ? "sm" : "default"}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Aktifkan notifikasi push
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={disable}
            disabled={pending}
            size={compact ? "sm" : "default"}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
            Matikan push
          </Button>
        )}
      </div>
      {!publicKey && !configured ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Env VAPID belum terpasang di server. Isi NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY di
          Vercel, lalu Redeploy.
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-[var(--line)] bg-[var(--mist)] px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}
