import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { Flame, Loader2, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading, Panel } from "@/components/dashboard/KpiTile";
import { TabEmpty } from "@/components/dashboard/StatusTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface Sale {
  id: string;
  name: string;
  percentOff: number;
  startsOn: string;
  endsOn: string;
  weekdays: number[];
  banner: boolean;
  active: boolean;
  status: "off" | "ended" | "today" | "upcoming" | "between";
  days: string[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS: Record<Sale["status"], { label: string; className: string }> = {
  today: { label: "On today", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300" },
  upcoming: { label: "Coming up", className: "bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-300" },
  between: { label: "Between sale days", className: "bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-300" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground" },
  off: { label: "Switched off", className: "bg-muted text-muted-foreground" },
};

const ymd = (d: Date) => format(d, "yyyy-MM-dd");

/** Black Friday: the Friday after the fourth Thursday of November. */
const blackFriday = (year: number) => {
  const nov1 = new Date(year, 10, 1);
  const firstThursday = 1 + ((4 - nov1.getDay() + 7) % 7);
  return new Date(year, 10, firstThursday + 21 + 1);
};
/** This year's, or next year's once it has passed. */
const nextBlackFriday = () => {
  const now = new Date();
  const bf = blackFriday(now.getFullYear());
  return bf >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? bf : blackFriday(now.getFullYear() + 1);
};

const daysOf = (from: string, to: string, weekdays: number[]) => {
  if (!from || !to || to < from) return [];
  const out: string[] = [];
  for (let d = parseISO(from); ymd(d) <= to && out.length < 20; d = addDays(d, 1)) if (weekdays.includes(d.getDay())) out.push(ymd(d));
  return out;
};

const AdminSales = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const bf = nextBlackFriday();
  const [form, setForm] = useState({ name: "Black Friday", percentOff: "20", startsOn: ymd(addDays(bf, -14)), endsOn: ymd(bf), weekdays: [5], banner: true });

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => (await apiRequest<{ data: Sale[] }>("/sales", { auth: true })).data,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["sales"] });
  const fail = (e: unknown) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Something went wrong" });

  const create = useMutation({
    mutationFn: () => apiRequest("/sales", { method: "POST", auth: true, body: { ...form, percentOff: Number(form.percentOff) } }),
    onSuccess: () => {
      refresh();
      toast({ title: "Sale scheduled", description: "Prices and the banner change by themselves on the sale days." });
    },
    onError: fail,
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => apiRequest(`/sales/${id}`, { method: "PATCH", auth: true, body: { active } }),
    onSuccess: refresh,
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiRequest(`/sales/${id}`, { method: "DELETE", auth: true }),
    onSuccess: refresh,
    onError: fail,
  });

  const preview = useMemo(() => daysOf(form.startsOn, form.endsOn, form.weekdays), [form.startsOn, form.endsOn, form.weekdays]);
  const flip = (d: number) =>
    setForm({ ...form, weekdays: form.weekdays.includes(d) ? form.weekdays.filter((x) => x !== d) : [...form.weekdays, d].sort() });

  return (
    <AdminLayout>
      <DashboardHeading
        title="Sales"
        subtitle="Schedule a sale like Black Friday. On the days you pick, products drop in price by themselves and a banner shows on your shop. The next day they go back."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-3">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : sales.length === 0 ? (
            <TabEmpty icon={<Flame />} title="No sales scheduled" hint="Set one up on the right. Black Friday is filled in for you." />
          ) : (
            sales.map((s) => (
              <Panel key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{s.name}</h2>
                      <Badge variant="outline">{s.percentOff}% off</Badge>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS[s.status].className)}>{STATUS[s.status].label}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(parseISO(s.startsOn), "d MMM")} to {format(parseISO(s.endsOn), "d MMM yyyy")} · {s.weekdays.map((d) => DAYS[d]).join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sale days: {s.days.length ? s.days.map((d) => format(parseISO(d), "EEE d MMM")).join(", ") : "none"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={s.active} onCheckedChange={(active) => toggle.mutate({ id: s.id, active })} aria-label={`${s.name} on or off`} />
                    <Button variant="ghost" size="icon" aria-label={`Delete ${s.name}`} onClick={() => confirm(`Delete ${s.name}? Prices go back to normal.`) && remove.mutate(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Panel>
            ))
          )}
        </div>

        <Panel className="h-fit">
          <h2 className="font-semibold">Schedule a sale</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="sale-name">Name</Label>
              <Input id="sale-name" maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-pct">Discount (%)</Label>
              <Input id="sale-pct" type="number" min={1} max={90} step="0.5" className="w-28" value={form.percentOff} onChange={(e) => setForm({ ...form, percentOff: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sale-from">From</Label>
                <Input id="sale-from" type="date" value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sale-to">To</Label>
                <Input id="sale-to" type="date" value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Days of the week</Label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Days of the week">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={form.weekdays.includes(i)}
                    onClick={() => flip(i)}
                    className={cn("h-9 min-w-11 rounded-md border px-2 text-sm", form.weekdays.includes(i) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent")}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {preview.length ? `Sale days: ${preview.map((d) => format(parseISO(d), "EEE d MMM")).join(", ")}` : "Pick dates and at least one day to see the sale days."}
              <br />
              Products where you've set your own sale price keep it.
            </p>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="sale-banner" className="font-normal">Show a banner on sale days</Label>
              <Switch id="sale-banner" checked={form.banner} onCheckedChange={(banner) => setForm({ ...form, banner })} />
            </div>
            <Button type="submit" className="w-full" disabled={create.isPending || !form.name.trim() || preview.length === 0}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule sale
            </Button>
          </form>
        </Panel>
      </div>
    </AdminLayout>
  );
};

export default AdminSales;
