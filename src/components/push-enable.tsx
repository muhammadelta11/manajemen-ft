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

export function PushEnableCard() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);

    void getPushPublicKeyAction().then((r) => {
      setConfigured(r.configured);
      setPublicKey(r.publicKey);
    });

    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => setSubscribed(false));
  }, []);

  function enable() {
    setMessage(null);
    start(async () => {
      if (!configured || !publicKey) {
        setMessage("Web Push belum dikonfigurasi (VAPID key).");
        return;
      }
      if (!window.isSecureContext && location.hostname !== "localhost") {
        setMessage("Web Push membutuhkan HTTPS.");
        return;
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setMessage("Izin notifikasi ditolak di browser.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
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

  if (!supported) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Browser ini tidak mendukung Web Push. Gunakan Chrome/Edge di Android atau desktop (HTTPS).
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        Aktifkan agar pemberitahuan surat/disposisi/validasi muncul meski tab tidak terbuka.
        {permission === "granted" && subscribed ? " Status: aktif." : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {!subscribed ? (
          <Button type="button" onClick={enable} disabled={pending || !configured}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Aktifkan notifikasi push
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={disable} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
            Matikan push
          </Button>
        )}
      </div>
      {!configured ? (
        <p className="text-sm text-amber-800">
          Admin perlu mengisi NEXT_PUBLIC_VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY di env.
        </p>
      ) : null}
      {message ? <p className="text-sm text-[var(--ink)]">{message}</p> : null}
    </div>
  );
}
