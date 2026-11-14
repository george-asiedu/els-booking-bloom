import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AppointmentDetails } from "@/components/admin/RowDetails";
import { DashboardHeading, Panel } from "@/components/dashboard/KpiTile";
import { Button } from "@/components/ui/button";
import { appointmentsApi, type AppointmentDTO } from "@/lib/api";
import { cn } from "@/lib/utils";

const ymd = (d: Date) => format(d, "yyyy-MM-dd");

// One colour per status, used for the chip edge and the legend.
const STATUS: Record<AppointmentDTO["status"], { label: string; dot: string; chip: string }> = {
  pending: { label: "Pending", dot: "bg-amber-500", chip: "border-l-amber-500" },
  pending_reschedule: { label: "New time asked", dot: "bg-violet-500", chip: "border-l-violet-500" },
  confirmed: { label: "Confirmed", dot: "bg-emerald-500", chip: "border-l-emerald-500" },
  completed: { label: "Completed", dot: "bg-sky-500", chip: "border-l-sky-500" },
  cancelled: { label: "Cancelled", dot: "bg-muted-foreground/50", chip: "border-l-muted-foreground/50 opacity-60 line-through" },
};

/** "10:30 AM" or "14:00" → minutes, so a day's bookings sort by time. */
const minutes = (t: string) => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!m) return 0;
  const h = Number(m[1]);
  const meridiem = m[3]?.toLowerCase();
  // 24-hour as written; with AM/PM, 12 AM is 0 and 12 PM is 12.
  const hours = !meridiem ? h : (h % 12) + (meridiem === "pm" ? 12 : 0);
  return hours * 60 + Number(m[2]);
};

/** The studio's bookings on a month calendar, with the chosen day's agenda beside it. */
const AdminCalendar = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("date") ? parseISO(params.get("date")!) : new Date();
  const [month, setMonth] = useState(startOfMonth(initial));
  const [day, setDay] = useState(initial);
  const [open, setOpen] = useState<AppointmentDTO | null>(null);

  // The visible grid runs from the Monday before the 1st to the Sunday after the end.
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-calendar", ymd(gridStart), ymd(gridEnd)],
    queryFn: () => appointmentsApi.calendar(ymd(gridStart), ymd(gridEnd)),
  });

  const byDay = useMemo(() => {
    const m = new Map<string, AppointmentDTO[]>();
    for (const a of data) m.set(a.appointment_date, [...(m.get(a.appointment_date) ?? []), a]);
    for (const list of m.values()) list.sort((a, b) => minutes(a.appointment_time) - minutes(b.appointment_time));
    return m;
  }, [data]);

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const pick = (d: Date) => {
    setDay(d);
    if (!isSameMonth(d, month)) setMonth(startOfMonth(d));
    setParams({ date: ymd(d) }, { replace: true });
  };
  const agenda = byDay.get(ymd(day)) ?? [];
  const active = agenda.filter((a) => a.status !== "cancelled");

  return (
    <AdminLayout>
      <DashboardHeading
        title="Calendar"
        subtitle="Your bookings by day. Reminders reach your devices a day and an hour before each one when notifications are on."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => pick(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-semibold">{format(month, "MMMM yyyy")}</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const list = byDay.get(ymd(d)) ?? [];
              const selected = isSameDay(d, day);
              return (
                <button
                  key={ymd(d)}
                  type="button"
                  onClick={() => pick(d)}
                  className={cn(
                    "flex min-h-16 flex-col gap-1 border-b border-r border-border p-1.5 text-left transition-colors hover:bg-accent/50 md:min-h-28 [&:nth-child(7n)]:border-r-0",
                    !isSameMonth(d, month) && "bg-muted/40 text-muted-foreground",
                    selected && "bg-primary/10 ring-2 ring-inset ring-primary",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums",
                      isToday(d) && "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {format(d, "d")}
                  </span>
                  {/* Phones: a dot per booking. Wider: the first few as chips. */}
                  <span className="flex flex-wrap gap-0.5 md:hidden">
                    {list.slice(0, 4).map((a) => (
                      <span key={a.id} className={cn("h-1.5 w-1.5 rounded-full", STATUS[a.status].dot)} />
                    ))}
                  </span>
                  <span className="hidden min-w-0 flex-col gap-0.5 md:flex">
                    {list.slice(0, 3).map((a) => (
                      <span key={a.id} className={cn("truncate rounded border-l-2 bg-card px-1 py-0.5 text-[11px] leading-tight shadow-sm", STATUS[a.status].chip)}>
                        <span className="tabular-nums text-muted-foreground">{a.appointment_time}</span> {a.full_name}
                      </span>
                    ))}
                    {list.length > 3 && <span className="px-1 text-[11px] text-muted-foreground">+{list.length - 3} more</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-xs text-muted-foreground">
            {Object.values(STATUS).map((s) => (
              <span key={s.label} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", s.dot)} /> {s.label}
              </span>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="font-semibold">{format(day, "EEEE d MMMM")}</h2>
          <p className="text-sm text-muted-foreground">
            {active.length === 0 ? "Nothing booked." : `${active.length} ${active.length === 1 ? "booking" : "bookings"}`}
          </p>
          {agenda.length === 0 ? (
            <div className="mt-6 flex flex-col items-center py-8 text-center text-muted-foreground">
              <CalendarDays className="mb-3 h-10 w-10" />
              <p className="text-sm">A free day. Pick another date to see its bookings.</p>
            </div>
          ) : (
            <ol className="mt-4 space-y-2">
              {agenda.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(a)}
                    className={cn(
                      "w-full rounded-xl border border-border border-l-4 bg-card p-3 text-left transition-colors hover:bg-accent/50",
                      STATUS[a.status].chip,
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium tabular-nums">{a.appointment_time}</span>
                      <span className="text-xs text-muted-foreground">{STATUS[a.status].label}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm">{a.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.services?.name ?? "Appointment"}
                      {a.services?.duration ? ` · ${a.services.duration}` : ""}
                      {a.staff ? ` · with ${a.staff.name}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <AppointmentDetails item={open} onClose={() => setOpen(null)} />
    </AdminLayout>
  );
};

export default AdminCalendar;
