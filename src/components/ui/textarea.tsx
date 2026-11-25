import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[96px] w-full rounded-xl border border-[var(--line-strong)] bg-white/80 px-3.5 py-2.5 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] placeholder:text-[var(--muted)]/70 transition focus-visible:border-[var(--brand)]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-glow)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
