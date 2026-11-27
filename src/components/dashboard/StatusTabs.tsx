import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatusTab<K extends string> {
  key: K;
  label: string;
  count?: number;
}

/** A row of status tabs with counts; the caller renders the matching rows. */
export function StatusTabs<K extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: StatusTab<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  // "All" always comes first, wherever the tabs are used.
  const isAll = (t: StatusTab<K>) => t.label.trim().toLowerCase() === "all" || String(t.key).toLowerCase() === "all";
  const ordered = [...tabs.filter(isAll), ...tabs.filter((t) => !isAll(t))];
  return (
    // overflow-y-hidden: with only overflow-x set the browser adds a vertical scrollbar (the little up and down arrows).
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      {ordered.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs tabular-nums",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Empty state shown inside a tab with no rows. */
export const TabEmpty = ({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
    <span className="mb-3 text-muted-foreground [&_svg]:h-10 [&_svg]:w-10">{icon}</span>
    <p className="font-medium text-foreground">{title}</p>
    {hint && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
