import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow = "Modul",
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-fade-up flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-5",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brass)]">
          {eyebrow}
        </p>
        <h1 className="font-display mt-1.5 text-3xl tracking-tight text-[var(--ink)] md:text-[2.15rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
