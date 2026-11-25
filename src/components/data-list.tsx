import { cn } from "@/lib/utils";

export function DataList({
  columns,
  children,
  empty,
  className,
}: {
  columns: { key: string; label: string; className?: string }[];
  children: React.ReactNode;
  empty?: React.ReactNode;
  className?: string;
}) {
  const template = columns.map(() => "minmax(0, 1fr)").join(" ");

  return (
    <div className={cn("panel overflow-hidden", className)}>
      <div
        className="border-b border-[var(--line)] bg-[var(--mist)] px-4 py-3"
        style={{ display: "grid", gridTemplateColumns: template, gap: "1rem" }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]",
              col.className,
            )}
          >
            {col.label}
          </div>
        ))}
      </div>
      <div className="divide-y divide-[var(--line)]">
        {children}
        {empty}
      </div>
    </div>
  );
}

export function DataListRow({
  columns,
  children,
  href,
  className,
}: {
  columns: number;
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const template = Array.from({ length: columns }, () => "minmax(0, 1fr)").join(" ");
  const style = { display: "grid", gridTemplateColumns: template, gap: "1rem" } as const;

  if (href) {
    return (
      <a
        href={href}
        style={style}
        className={cn(
          "px-4 py-3.5 text-sm transition hover:bg-[rgba(20,104,85,0.03)]",
          className,
        )}
      >
        {children}
      </a>
    );
  }

  return (
    <div style={style} className={cn("px-4 py-3.5 text-sm", className)}>
      {children}
    </div>
  );
}

export function DataListEmpty({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-[var(--muted)]">{children}</div>;
}
