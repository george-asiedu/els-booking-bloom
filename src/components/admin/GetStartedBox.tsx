import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, Rocket, X } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { useStudio } from "@/hooks/useStudio";
import { learnModules } from "@/lib/learnSteps";

const KEY = "zuri-get-started";
type Saved = { hidden?: boolean; collapsed?: boolean };
const read = (): Saved => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
};
const write = (v: Saved) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* private mode: the choice just isn't remembered */
  }
};

/**
 * A "Get started" box in the corner of the dashboard, like cloud consoles
 * show on a first visit: the next few things to do, with progress. Steps tick
 * only when the API finds the work on the account (same checks as Learn), so
 * it is honest, and it disappears once everything is done.
 */
export const GetStartedBox = () => {
  const { features } = useStudio();
  const [saved, setSaved] = useState<Saved>(read);
  useEffect(() => write(saved), [saved]);

  const steps = useQuery({
    queryKey: ["training-steps"],
    queryFn: async () =>
      (await apiRequest<{ data: Record<string, { done: boolean }> }>("/training/steps", { auth: true })).data,
    staleTime: 60_000,
  });

  const all = learnModules(Boolean(features?.commerce), features?.booking !== false).flatMap((m) => m.steps);
  const done = (id: string) => Boolean(steps.data?.[id]?.done);
  const finished = all.filter((s) => done(s.id)).length;
  // Show the next 5 things still to do, so the box stays short.
  const next = all.filter((s) => !done(s.id)).slice(0, 5);

  if (saved.hidden || !steps.data || next.length === 0) return null;
  const pct = Math.round((finished / all.length) * 100);

  return (
    <aside
      aria-label="Get started with Zuri"
      className="fixed bottom-20 right-3 z-40 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl lg:bottom-4 lg:right-4"
    >
      <div className="flex items-center gap-2 border-b border-border bg-primary/10 px-4 py-3">
        <Rocket className="h-4 w-4 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Get started with Zuri</p>
          <p className="text-xs text-muted-foreground">{finished} of {all.length} done</p>
        </div>
        <button
          type="button"
          aria-label={saved.collapsed ? "Expand" : "Collapse"}
          aria-expanded={!saved.collapsed}
          className="rounded p-1 hover:bg-accent"
          onClick={() => setSaved({ ...saved, collapsed: !saved.collapsed })}
        >
          {saved.collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button
          type="button"
          aria-label="Hide for now"
          className="rounded p-1 hover:bg-accent"
          onClick={() => setSaved({ ...saved, hidden: true })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1 bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      {!saved.collapsed && (
        <>
          <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto">
            {next.map((s) => (
              <li key={s.id}>
                <Link to={s.to ?? "/admin/learn"} className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent/50">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border">
                    <Check className="h-3 w-3 opacity-0" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{s.text}</span>
                    <span className="block text-xs text-muted-foreground">{s.what}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/admin/learn" className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-accent/50">
            Open the full guide
          </Link>
        </>
      )}
    </aside>
  );
};
