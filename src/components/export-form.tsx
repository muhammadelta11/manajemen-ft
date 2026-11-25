"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Exporter = (
  from: string,
  to: string,
) => Promise<{ filename: string; base64: string }>;

export function ExportForm({
  label,
  exporter,
}: {
  label: string;
  exporter: Exporter;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onExport() {
    setError(null);
    if (!from || !to) {
      setError("Isi rentang tanggal.");
      return;
    }
    start(async () => {
      try {
        const result = await exporter(from, to);
        const bytes = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        setError("Gagal mengekspor.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white/80 p-5">
      <h2 className="font-display text-xl">{label}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Dari</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Sampai</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <Button className="mt-4" type="button" onClick={onExport} disabled={pending}>
        {pending ? "Menyiapkan…" : "Unduh Excel"}
      </Button>
    </div>
  );
}
