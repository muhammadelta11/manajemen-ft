"use client";

import { useActionState, useEffect, useState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Fill demo credentials after mount so password managers can't mutate SSR HTML.
  useEffect(() => {
    setEmail("arsip@fakultas.ac.id");
    setPassword("Password123!");
  }, []);

  return (
    <form action={action} className="mt-7 space-y-4">
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

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
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
