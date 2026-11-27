import { addDays, format } from "date-fns";
import { Label } from "@/components/ui/label";
import type { CommerceSettingsDTO } from "@/lib/api/commerce";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

export interface DeliveryPick {
  zoneId?: string;
  date?: string;
  window?: string;
}

/** Whether the customer still has to choose an area or a time. */
export const deliveryPickMissing = (s: CommerceSettingsDTO | undefined, p: DeliveryPick): string | null => {
  if (!s) return null;
  if (s.delivery_zones.length && !p.zoneId) return "Choose your delivery area.";
  if (s.delivery_slots.length && (!p.date || !p.window)) return "Choose a delivery day and time.";
  return null;
};

export const deliveryPickBody = (p: DeliveryPick) => ({
  deliveryZoneId: p.zoneId,
  deliveryDate: p.date,
  deliveryWindow: p.window,
});

const selectClass = "mt-2 h-10 w-full rounded-none border border-input bg-background px-3 text-sm";

/** Delivery area (sets the fee) and day + time window, when the shop offers them. */
export const DeliveryChoice = ({
  settings,
  value,
  onChange,
  labelClassName,
  notBefore,
}: {
  settings: CommerceSettingsDTO | undefined;
  value: DeliveryPick;
  onChange: (v: DeliveryPick) => void;
  labelClassName?: string;
  /** Pre-order items: the first day anything can be delivered (YYYY-MM-DD). */
  notBefore?: string | null;
}) => {
  if (!settings || (!settings.delivery_zones.length && !settings.delivery_slots.length)) return null;
  // Days start today, or on the pre-order's ready day when that is later.
  const start = notBefore && notBefore > format(new Date(), "yyyy-MM-dd") ? new Date(`${notBefore}T12:00:00`) : new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="space-y-4">
      {settings.delivery_zones.length > 0 && (
        <div>
          <Label htmlFor="dc-zone" className={labelClassName}>Delivery area *</Label>
          <select id="dc-zone" className={selectClass} value={value.zoneId ?? ""} onChange={(e) => onChange({ ...value, zoneId: e.target.value || undefined })}>
            <option value="">Choose your area</option>
            {settings.delivery_zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}: {z.fee > 0 ? formatGHS(z.fee) : "free"}
              </option>
            ))}
          </select>
        </div>
      )}
      {settings.delivery_slots.length > 0 && (
        <div>
          <span className={cn("text-sm font-medium", labelClassName)}>Delivery day and time *</span>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Delivery day">
            {days.map((d, i) => {
              const iso = format(d, "yyyy-MM-dd");
              const on = value.date === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onChange({ ...value, date: iso })}
                  className={cn("min-w-16 shrink-0 border px-2 py-1.5 text-center text-xs", on ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent")}
                >
                  <span className="block font-medium">{format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "Today" : format(d, "yyyy-MM-dd") === format(addDays(new Date(), 1), "yyyy-MM-dd") ? "Tomorrow" : format(d, "EEE")}</span>
                  <span className="block opacity-80">{format(d, "d MMM")}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Delivery time">
            {settings.delivery_slots.map((w) => {
              const on = value.window === w;
              return (
                <button
                  key={w}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onChange({ ...value, window: w })}
                  className={cn("border px-3 py-1.5 text-sm", on ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent")}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
