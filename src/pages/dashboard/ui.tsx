import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent section header used by every dashboard section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-xl text-sm font-medium text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const TONES = {
  white: "bg-background text-foreground",
  orange: "bg-primary text-primary-foreground",
  yellow: "bg-accent text-accent-foreground",
  green: "bg-[#22c55e] text-foreground",
  dark: "bg-foreground text-background",
} as const;

/** Flat, hard-shadowed stat tile. */
export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "white",
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-2 border-foreground p-4 shadow-brutal-sm",
        TONES[tone],
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-widest opacity-70">
          {label}
        </p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums tracking-tight">
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs font-semibold opacity-70">{sub}</p> : null}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#ffcc00] text-foreground",
  approved: "bg-[#22c55e] text-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  present: "bg-primary text-primary-foreground",
  absent: "bg-foreground text-background",
  admin: "bg-primary text-primary-foreground",
  employee: "bg-background text-foreground",
  invited: "bg-accent text-accent-foreground",
};

/** Uppercase, bordered status chip. */
export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex border-2 border-foreground px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
        STATUS_STYLES[status] ?? "bg-secondary text-foreground",
        className,
      )}
    >
      {status}
    </span>
  );
}

/** Simple centered empty state for lists with no rows yet. */
export function EmptyState({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-foreground/30 bg-secondary/40 px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <p className="text-sm font-black uppercase tracking-widest">{title}</p>
      <p className="mt-1 max-w-sm text-sm font-medium text-muted-foreground">
        {text}
      </p>
    </div>
  );
}
