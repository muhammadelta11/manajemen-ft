import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border border-[var(--line)] bg-[var(--mist)] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--ink-muted)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
