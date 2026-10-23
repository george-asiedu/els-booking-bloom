import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";
import { formatGHS } from "@/lib/currency";
import { transactionsApi, type AppointmentDTO } from "@/lib/api";

// ---- colour roles ------------------------------------------------------------
// Validated with the dataviz palette checker against the card surfaces
// (#ffffff light, #25181d dark): every adjacent pair clears the colour-blind
// and normal-vision floors. Some light steps sit under 3:1 on white, so every
// doughnut carries visible labels with counts (never colour alone).
const VIZ = {
  light: {
    line: "#2a78d6",
    categorical: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"],
    other: "#a8a6a0",
    status: { completed: "#0ca30c", confirmed: "#2a78d6", waiting: "#eda100", cancelled: "#d03b3b" },
    surface: "#ffffff",
    grid: "#ebe7e8",
    axis: "#8a8487",
  },
  dark: {
    line: "#3987e5",
    categorical: ["#3987e5", "#d95926", "#199e70", "#c98500"],
    other: "#6b6466",
    status: { completed: "#0ca30c", confirmed: "#3987e5", waiting: "#c98500", cancelled: "#d03b3b" },
    surface: "#25181d",
    grid: "#3a2c31",
    axis: "#9a9195",
  },
} as const;

const useViz = () => VIZ[useTheme().theme === "dark" ? "dark" : "light"];

const compactGHS = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(Math.round(v));

// ---- shared pieces -------------------------------------------------------------

const ChartTip = ({
  active,
  payload,
  label,
  format: fmt,
}: {
  active?: boolean;
  payload?: { value: number; payload: { full?: string } }[];
  label?: string;
  format: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground">{payload[0].payload.full ?? label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {fmt(payload[0].value)}
      </p>
    </div>
  );
};

/** A single-series trend: 2px line, light area, hairline grid, end dot. */
const TrendChart = ({
  title,
  caption,
  data,
  format: fmt,
  axisFormat,
}: {
  title: string;
  caption: string;
  data: { label: string; full: string; value: number }[];
  format: (v: number) => string;
  axisFormat: (v: number) => string;
}) => {
  const viz = useViz();
  const gradientId = `fill-${title.replace(/\W/g, "")}`;
  const lastIndex = data.length - 1;
  const empty = data.every((d) => d.value === 0);
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{caption}</p>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            Nothing to show yet.
          </p>
        ) : (
          <div className="h-[220px]" role="img" aria-label={`${title}. ${caption}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={viz.line} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={viz.line} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={viz.grid} strokeWidth={1} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: viz.axis, fontSize: 12 }}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: viz.axis, fontSize: 12 }}
                  tickFormatter={axisFormat}
                  width={44}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTip format={fmt} />}
                  cursor={{ stroke: viz.axis, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={viz.line}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill={`url(#${gradientId})`}
                  isAnimationActive={false}
                  dot={(props: { cx?: number; cy?: number; index?: number }) =>
                    props.index === lastIndex ? (
                      <circle
                        key="end"
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={viz.line}
                        stroke={viz.surface}
                        strokeWidth={2}
                      />
                    ) : (
                      <g key={props.index} />
                    )
                  }
                  activeDot={{ r: 5, fill: viz.line, stroke: viz.surface, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* The same numbers as a table, for screen readers. */}
        <table className="sr-only">
          <caption>{title}</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.full}>
                <th scope="row">{d.full}</th>
                <td>{fmt(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

/** Part-to-whole (at most five segments), labelled with counts and shares. */
const Doughnut = ({
  title,
  caption,
  segments,
  centerLabel,
}: {
  title: string;
  caption: string;
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
}) => {
  const viz = useViz();
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((n, s) => n + s.value, 0);
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{caption}</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            No appointments this month yet.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-[168px] w-[168px] shrink-0" role="img" aria-label={`${title}: ${shown.map((s) => `${s.label} ${s.value}`).join(", ")}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shown}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="64%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    stroke={viz.surface}
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {shown.map((s) => (
                      <Cell key={s.label} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                          <p className="text-muted-foreground">{payload[0].name}</p>
                          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                            {payload[0].value} · {Math.round((Number(payload[0].value) / total) * 100)}%
                          </p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums">{total}</span>
                <span className="text-xs text-muted-foreground">{centerLabel}</span>
              </div>
            </div>
            <ul className="w-full min-w-0 space-y-2 text-sm">
              {shown.map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{s.label}</span>
                  <span className="shrink-0 tabular-nums font-medium">{s.value}</span>
                  <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
                    {Math.round((s.value / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ---- the dashboard's charts ------------------------------------------------------

export const DashboardCharts = ({ appointments }: { appointments: AppointmentDTO[] }) => {
  const viz = useViz();
  const now = useMemo(() => new Date(), []);

  // Money received per month, last 6 months (payments minus refunds).
  const months = useMemo(
    () => Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(now, 5 - i))),
    [now],
  );
  const monthly = useQueries({
    queries: months.map((m) => ({
      queryKey: ["dashboard-money-month", format(m, "yyyy-MM")],
      queryFn: () =>
        transactionsApi.summary({
          from: m.toISOString(),
          to: (m.getMonth() === now.getMonth() ? now : endOfMonth(m)).toISOString(),
        }),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const moneyData = months.map((m, i) => ({
    label: format(m, "MMM"),
    full: m.getMonth() === now.getMonth() ? `${format(m, "MMMM yyyy")} so far` : format(m, "MMMM yyyy"),
    value: monthly[i].data?.net ?? 0,
  }));
  const moneyReady = monthly.every((q) => !q.isLoading);

  // Bookings per week (Mon–Sun), last 12 weeks, by appointment date.
  const weekData = useMemo(() => {
    const first = startOfWeek(subWeeks(now, 11), { weekStartsOn: 1 });
    const weeks = eachWeekOfInterval({ start: first, end: now }, { weekStartsOn: 1 });
    const counts = new Map(weeks.map((w) => [w.getTime(), 0]));
    for (const a of appointments) {
      if (a.status === "cancelled") continue;
      const wk = startOfWeek(parseISO(a.appointment_date), { weekStartsOn: 1 }).getTime();
      if (counts.has(wk)) counts.set(wk, counts.get(wk)! + 1);
    }
    return weeks.map((w, i) => ({
      label: format(w, "d MMM"),
      full:
        i === weeks.length - 1
          ? `This week (from ${format(w, "d MMM")})`
          : `Week of ${format(w, "d MMM")} – ${format(endOfWeek(w, { weekStartsOn: 1 }), "d MMM")}`,
      value: counts.get(w.getTime()) ?? 0,
    }));
  }, [appointments, now]);

  // This month's appointments by status, and by service category.
  const thisMonth = useMemo(() => {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return appointments.filter((a) => {
      const d = parseISO(a.appointment_date);
      return d >= start && d <= end;
    });
  }, [appointments, now]);

  const statusSegments = [
    { label: "Completed", value: thisMonth.filter((a) => a.status === "completed").length, color: viz.status.completed },
    { label: "Confirmed", value: thisMonth.filter((a) => a.status === "confirmed").length, color: viz.status.confirmed },
    {
      label: "Waiting on you",
      value: thisMonth.filter((a) => a.status === "pending" || a.status === "pending_reschedule").length,
      color: viz.status.waiting,
    },
    { label: "Cancelled", value: thisMonth.filter((a) => a.status === "cancelled").length, color: viz.status.cancelled },
  ];

  const categorySegments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of thisMonth) {
      if (a.status === "cancelled") continue;
      const c = a.services?.category?.trim() || "Other";
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    // Four named slices at most; the rest fold into "Other" (never a 5th hue).
    const top = sorted.filter(([name]) => name !== "Other").slice(0, 4);
    const rest = sorted
      .filter(([name]) => !top.some(([t]) => t === name))
      .reduce((n, [, v]) => n + v, 0);
    const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/[-_]/g, " ");
    return [
      ...top.map(([name, value], i) => ({ label: pretty(name), value, color: viz.categorical[i] })),
      ...(rest ? [{ label: "Other", value: rest, color: viz.other }] : []),
    ];
  }, [thisMonth, viz]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {moneyReady ? (
          <TrendChart
            title="Money received"
            caption="Per month, last 6 months · payments minus refunds"
            data={moneyData}
            format={formatGHS}
            axisFormat={compactGHS}
          />
        ) : (
          <Card className="h-[318px] animate-pulse bg-muted/40" />
        )}
        <TrendChart
          title="Bookings"
          caption="Per week, last 12 weeks · excluding cancelled"
          data={weekData}
          format={(v) => `${v} ${v === 1 ? "booking" : "bookings"}`}
          axisFormat={(v) => String(v)}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Doughnut
          title="Appointments by status"
          caption={`${format(now, "MMMM")} · by appointment date`}
          segments={statusSegments}
          centerLabel="this month"
        />
        <Doughnut
          title="Bookings by category"
          caption={`${format(now, "MMMM")} · excluding cancelled`}
          segments={categorySegments}
          centerLabel="bookings"
        />
      </div>
    </div>
  );
};
