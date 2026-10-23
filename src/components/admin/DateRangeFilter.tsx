import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  PRESETS,
  formatSpan,
  resolveRange,
  type DateRangeValue,
  type RangePreset,
  type ResolvedRange,
} from "@/lib/dateRange";

const Row = ({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    role="option"
    aria-selected={selected}
    onClick={onClick}
    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
  >
    <span className={cn(selected && "font-semibold")}>{children}</span>
    {selected && <Check className="h-4 w-4 stroke-[3]" aria-hidden />}
  </button>
);

/**
 * The shared popover: presets as a list (nobody wants to fight a calendar for
 * "last 30 days"), then a custom range behind the footer. The trigger always
 * shows the dates in force, not just a name.
 */
const RangePopover = ({
  label,
  detail,
  selected,
  presets,
  anyLabel,
  current,
  onPreset,
  onAny,
  onCustom,
}: {
  label: string;
  detail?: string;
  selected: RangePreset | "any" | null;
  presets: typeof PRESETS;
  anyLabel?: string;
  current?: { from: Date; to: Date };
  onPreset: (preset: Exclude<RangePreset, "custom">) => void;
  onAny?: () => void;
  onCustom: (from: Date, to: Date) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const isMobile = useIsMobile();

  const openChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Reopen on the list, with the calendar ready on the current range.
      setCustom(false);
      setDraft(current ? { from: current.from, to: current.to } : undefined);
    }
  };
  const done = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 justify-between gap-2 font-normal">
          <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="font-medium">{label}</span>
          {detail && <span className="hidden text-muted-foreground sm:inline">{detail}</span>}
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        {!custom ? (
          <div className="w-56 py-1" role="listbox" aria-label="Date range">
            {anyLabel && onAny && (
              <Row selected={selected === "any"} onClick={() => done(onAny)}>
                {anyLabel}
              </Row>
            )}
            {presets.map((p) => (
              <Row key={p.id} selected={selected === p.id} onClick={() => done(() => onPreset(p.id))}>
                {p.label}
              </Row>
            ))}
            <div className="mt-1 border-t pt-1">
              <Row selected={selected === "custom"} onClick={() => setCustom(true)}>
                Custom range…
              </Row>
            </div>
          </div>
        ) : (
          <div>
            <Calendar
              mode="range"
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={isMobile ? 1 : 2}
              defaultMonth={draft?.from}
              initialFocus
            />
            <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
              <p className="text-sm text-muted-foreground tabular-nums">
                {draft?.from ? formatSpan(draft.from, draft.to ?? draft.from) : "Pick a start date"}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCustom(false)}>
                  Back
                </Button>
                <Button
                  size="sm"
                  disabled={!draft?.from}
                  onClick={() => done(() => onCustom(draft!.from!, draft!.to ?? draft!.from!))}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

/** For dashboards: always some range (presets include "All time"). */
export const DateRangeFilter = ({
  value,
  resolved,
  onChange,
}: {
  value: DateRangeValue;
  resolved: ResolvedRange;
  onChange: (value: DateRangeValue) => void;
}) => (
  <RangePopover
    label={resolved.label}
    detail={resolved.span}
    selected={value.preset}
    presets={PRESETS}
    current={{ from: resolved.from, to: resolved.to }}
    onPreset={(preset) => onChange({ preset })}
    onCustom={(from, to) => onChange({ preset: "custom", from, to })}
  />
);

const toDay = (d: Date) => format(d, "yyyy-MM-dd");
const fromDay = (s: string) => new Date(`${s}T00:00:00`);

/**
 * For list filters that hold "yyyy-MM-dd" strings (empty = no limit): one
 * picker in place of two unlabelled date inputs. A preset becomes concrete
 * dates; "Any date" clears both.
 */
export const DateRangeField = ({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) => {
  // Which preset produced the current dates, for the label; anything set
  // another way reads as a custom range.
  const [preset, setPreset] = useState<RangePreset | null>(null);
  const hasRange = Boolean(from || to);
  const span = hasRange
    ? formatSpan(fromDay(from || to), fromDay(to || from))
    : undefined;
  const selected: RangePreset | "any" = !hasRange ? "any" : preset ?? "custom";
  const presetLabel = PRESETS.find((p) => p.id === selected)?.label;

  return (
    <RangePopover
      label={!hasRange ? "Any date" : presetLabel ?? span!}
      detail={presetLabel ? span : undefined}
      selected={selected}
      // "All time" means the same as "Any date" here.
      presets={PRESETS.filter((p) => p.id !== "all")}
      anyLabel="Any date"
      current={hasRange ? { from: fromDay(from || to), to: fromDay(to || from) } : undefined}
      onAny={() => {
        setPreset(null);
        onChange("", "");
      }}
      onPreset={(id) => {
        const r = resolveRange({ preset: id }, null);
        setPreset(id);
        onChange(toDay(r.from), toDay(r.to));
      }}
      onCustom={(f, t) => {
        setPreset("custom");
        onChange(toDay(f), toDay(t));
      }}
    />
  );
};
