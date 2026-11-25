"use client";

import { useEffect, useState, useTransition } from "react";
import { finalizeLoginAction } from "@/app/actions/auth";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setEmail("arsip@fakultas.ac.id");
    setPassword("Password123!");
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createBrowserSupabase();
      if (!supabase) {
        setError("Konfigurasi Supabase belum siap. Cek .env.local / Vercel env.");
        return;
      }

      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signError) {
        setError("Email atau kata sandi salah.");
        return;
      }

      // Cookie sesi sudah di browser; finalize set profil + redirect server-side
      const result = await finalizeLoginAction();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@fakultas.ac.id"
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Kata sandi</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Memproses…" : "Masuk ke ruang kerja"}
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-[var(--muted)]">
        Demo Admin Arsip sudah terisi. Password:{" "}
        <code className="rounded bg-[var(--mist)] px-1.5 py-0.5">Password123!</code>
      </p>
    </form>
  );
}
