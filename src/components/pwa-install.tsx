"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mft_pwa_dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}

/** Banner rekomendasi pasang aplikasi (Chrome/Edge Android & desktop). */
export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    if (isIos && isSafari) {
      const t = window.setTimeout(() => setIosHint(true), 1800);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBip);
        window.clearTimeout(t);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setIosHint(false);
    setDeferred(null);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!visible && !iosHint) return null;

  return (
    <div
      className="mft-pwa-banner"
      role="dialog"
      aria-label="Pasang aplikasi Manajemen FT"
    >
      <div className="mft-pwa-banner-copy">
        <strong>Pasang Manajemen FT</strong>
        <span>
          {iosHint
            ? "Di Safari: Share → Add to Home Screen untuk akses cepat seperti aplikasi."
            : "Pasang ke perangkat agar dibuka lebih cepat, tanpa bilah browser."}
        </span>
      </div>
      <div className="mft-pwa-banner-actions">
        {deferred ? (
          <button type="button" className="mft-pwa-install" onClick={() => void install()}>
            <Download size={16} />
            Pasang
          </button>
        ) : null}
        <button type="button" className="mft-pwa-dismiss" onClick={dismiss} aria-label="Tutup">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
