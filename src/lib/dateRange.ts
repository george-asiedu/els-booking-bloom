import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameYear,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";

// Date ranges for dashboards: presets, a custom range, the matching previous
// period, and how to bucket a range into chart bars.

export type RangePreset =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "last_month"
  | "this_year"
  | "all"
  | "custom";

export const PRESETS: { id: Exclude<RangePreset, "custom">; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "this_year", label: "This year" },
  { id: "all", label: "All time" },
];

export interface DateRangeValue {
  preset: RangePreset;
  // Only used for "custom"; both inclusive calendar days.
  from?: Date;
  to?: Date;
}

export interface ResolvedRange {
  from: Date; // start of the first day
  to: Date; // end of the last day
  label: string; // "Last 30 days"
  span: string; // "8 Sep – 7 Oct 2026"
}

/**
 * Turn a range choice into concrete start and end instants. "All time" starts
 * at the earliest date in the data (`earliest`), or today when there is none.
 */
export const resolveRange = (
  value: DateRangeValue,
  earliest: Date | null,
  now = new Date(),
): ResolvedRange => {
  const today = startOfDay(now);
  let from: Date;
  let to: Date = endOfDay(now);
  switch (value.preset) {
    case "today":
      from = today;
      break;
    case "7d":
      from = subDays(today, 6);
      break;
    case "30d":
      from = subDays(today, 29);
      break;
    case "90d":
      from = subDays(today, 89);
      break;
    case "this_month":
      from = startOfMonth(now);
      break;
    case "last_month":
      from = startOfMonth(subMonths(now, 1));
      to = endOfMonth(subMonths(now, 1));
      break;
    case "this_year":
      from = startOfYear(now);
      break;
    case "all":
      from = startOfDay(earliest ?? now);
      break;
    case "custom":
      from = startOfDay(value.from ?? today);
      to = endOfDay(value.to ?? value.from ?? now);
      break;
  }
  const label =
    value.preset === "custom"
      ? "Custom range"
      : PRESETS.find((p) => p.id === value.preset)!.label;
  return { from, to, label, span: formatSpan(from, to) };
};

/** "8 Sep – 7 Oct 2026", "7 Oct 2026", or "30 Dec 2025 – 5 Jan 2026". */
export const formatSpan = (from: Date, to: Date) => {
  if (differenceInCalendarDays(to, from) === 0) return format(from, "d MMM yyyy");
  return isSameYear(from, to)
    ? `${format(from, "d MMM")} – ${format(to, "d MMM yyyy")}`
    : `${format(from, "d MMM yyyy")} – ${format(to, "d MMM yyyy")}`;
};

/** The period of the same length immediately before `range`. */
export const previousPeriod = (range: ResolvedRange) => {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  return {
    from: startOfDay(subDays(range.from, days)),
    to: endOfDay(subDays(range.from, 1)),
    days,
  };
};

export type Bucket = "day" | "week" | "month";

/** Days up to a month, weeks up to six months, months beyond. */
export const bucketFor = (range: ResolvedRange): Bucket => {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  return days <= 31 ? "day" : days <= 183 ? "week" : "month";
};

export interface BucketSlot {
  key: string; // stable key for grouping
  start: Date;
  end: Date;
  axis: string; // short axis label
  full: string; // tooltip label
}

/** The chart bars for a range: one slot per day, week (Mon–Sun) or month. */
export const bucketSlots = (range: ResolvedRange, bucket: Bucket): BucketSlot[] => {
  const interval = { start: range.from, end: range.to };
  if (bucket === "day") {
    const short = differenceInCalendarDays(range.to, range.from) < 7;
    return eachDayOfInterval(interval).map((d) => ({
      key: format(d, "yyyy-MM-dd"),
      start: startOfDay(d),
      end: endOfDay(d),
      axis: short ? format(d, "EEE") : format(d, "d MMM"),
      full: format(d, "EEE d MMM yyyy"),
    }));
  }
  if (bucket === "week") {
    return eachWeekOfInterval(interval, { weekStartsOn: 1 }).map((w) => {
      // The first and last weeks are clipped to the range.
      const start = w < range.from ? range.from : w;
      const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
      const end = weekEnd > range.to ? range.to : weekEnd;
      return {
        key: format(w, "yyyy-'W'II"),
        start,
        end,
        axis: format(start, "d MMM"),
        full: `Week of ${formatSpan(start, end)}`,
      };
    });
  }
  return eachMonthOfInterval(interval).map((m) => {
    const start = m < range.from ? range.from : m;
    const end = endOfMonth(m) > range.to ? range.to : endOfMonth(m);
    return {
      key: format(m, "yyyy-MM"),
      start,
      end,
      axis: isSameYear(range.from, range.to) ? format(m, "MMM") : format(m, "MMM yy"),
      full: format(m, "MMMM yyyy"),
    };
  });
};

export const inRange = (d: Date, from: Date, to: Date) => d >= from && d <= to;

// ---- URL round-trip (so a refresh or shared link keeps the view) ----------

export const rangeToParams = (value: DateRangeValue): Record<string, string> =>
  value.preset === "custom" && value.from
    ? {
        range: "custom",
        from: format(value.from, "yyyy-MM-dd"),
        to: format(value.to ?? value.from, "yyyy-MM-dd"),
      }
    : { range: value.preset };

export const rangeFromParams = (
  params: URLSearchParams,
  fallback: DateRangeValue,
): DateRangeValue => {
  const preset = params.get("range") as RangePreset | null;
  if (preset === "custom") {
    const from = parseDay(params.get("from"));
    const to = parseDay(params.get("to"));
    return from ? { preset, from, to: to && to >= from ? to : from } : fallback;
  }
  return preset && PRESETS.some((p) => p.id === preset) ? { preset } : fallback;
};

const parseDay = (v: string | null) => {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
