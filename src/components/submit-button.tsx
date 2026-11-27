"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type Props = ButtonProps & {
  /** Teks saat idle */
  children: React.ReactNode;
  /** Teks saat pending (default: Memproses…) */
  pendingLabel?: string;
};

/** Tombol submit dengan indikator loading dari status form terdekat. */
export function SubmitButton({
  children,
  pendingLabel = "Memproses…",
  disabled,
  className,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  const busy = pending || Boolean(disabled);

  return (
    <Button type="submit" disabled={busy} aria-busy={pending} className={className} {...props}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
