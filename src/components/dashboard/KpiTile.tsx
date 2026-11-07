import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "amber" | "green" | "blue" | "rose" | "violet";

// Soft tinted cards (light: pastel; dark: a faint tint on the dark surface).
const TONES: Record<Tone, string> = {
  amber: "bg-[hsl(var(--tile-amber))]",
  green: "bg-[hsl(var(--tile-green))]",
  blue: "bg-[hsl(var(--tile-blue))]",
  rose: "bg-[hsl(var(--tile-rose))]",
  violet: "bg-[hsl(var(--tile-violet))]",
};

/** Change against a previous figure, as a small up/down chip. */
export const Change = ({ now, before }: { now: number; before: number }) => {
  if (!before) return null;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium", up ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
      {up ? <ArrowUpRight className="h-3 w-3" aria-hidden /> : <ArrowDownRight className="h-3 w-3" aria-hidden />}
      {Math.abs(pct)}%
    </span>
  );
};

/** One headline number on a dashboard. */
export const KpiTile = ({
  label,
  value,
  tone = "amber",
  hint,
  change,
  icon,
  to,
  children,
}: {
  label: string;
  value: string;
  tone?: Tone;
  hint?: ReactNode;
  change?: ReactNode;
  icon?: ReactNode;
  to?: string;
  children?: ReactNode;
}) => {
  const body = (
    <div className={cn("flex h-full flex-col rounded-2xl p-5 transition-transform", TONES[tone], to && "hover:-translate-y-0.5")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground/75">{label}</p>
        {icon && <span className="text-foreground/60">{icon}</span>}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight md:text-3xl">{value}</p>
      {(change || hint) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground/65">
          {change}
          {hint}
        </div>
      )}
      {children && <div className="mt-auto pt-3">{children}</div>}
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{body}</Link>
  ) : (
    body
  );
};

/** "Welcome back" heading row with optional actions on the right. */
export const DashboardHeading = ({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

/** A white panel for charts, lists and tables. */
export const Panel = ({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={cn("rounded-2xl border border-border bg-card p-5", className)}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h2 className="font-semibold">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);
