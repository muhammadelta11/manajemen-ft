"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { seedProfileCookieAction } from "@/app/actions/auth";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { homeForRole } from "@/lib/rbac";
import type { AppRole } from "@/lib/roles";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createBrowserSupabase();
      if (!supabase) {
        setError("Konfigurasi Supabase belum siap. Cek .env.local / Vercel env.");
        return;
      }

      const { data: authData, error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signError || !authData.user) {
        setError("Email atau kata sandi salah.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, nama, email, role, is_kaprodi, prodi_id, is_active")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || !profile || !profile.is_active) {
        await supabase.auth.signOut();
        setError("Akun tidak aktif atau profil belum tersedia.");
        return;
      }

      const seeded = await seedProfileCookieAction({
        id: profile.id,
        name: profile.nama,
        email: profile.email,
        role: profile.role,
        isKaprodi: Boolean(profile.is_kaprodi),
        prodiId: profile.prodi_id ?? null,
      });

      if (seeded.error) {
        setError(seeded.error);
        return;
      }

      const dest = homeForRole(profile.role as AppRole);
      router.replace(dest);
      router.refresh();
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

      <Button type="submit" className="w-full" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Memproses…
          </>
        ) : (
          "Masuk ke ruang kerja"
        )}
      </Button>
    </form>
  );
}
