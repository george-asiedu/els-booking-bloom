import { Check, Droplets, Eye, Flower2, Hand, Palette, Scissors, Sparkles, Store, Waves, type LucideIcon } from "lucide-react";
import { SHOP_CATEGORIES, type ShopCategoryId } from "@/lib/shopCategories";
import { STUDIO_TYPES, type StudioType } from "@/lib/studioTemplates";
import { cn } from "@/lib/utils";

/** Most kinds a business can pick (the API keeps the same limit). */
const MAX_KINDS = 6;

interface KindOption<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

/**
 * Pick every kind of thing a business does or sells. The first one picked is
 * the main one: it sets the website's design and wording, and is marked
 * "Main". Tapping a picked kind removes it; the next one then becomes main.
 */
const KindPicker = <T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  noun,
  className,
}: {
  options: readonly KindOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  ariaLabel: string;
  /** What the picks are, for the hint: "everything you sell". */
  noun: string;
  className?: string;
}) => {
  const full = value.length >= MAX_KINDS;
  const toggle = (id: T) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : full ? value : [...value, id]);

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={ariaLabel}>
        {options.map((c) => {
          const picked = value.includes(c.id);
          const main = value[0] === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="checkbox"
              aria-checked={picked}
              disabled={!picked && full}
              onClick={() => toggle(c.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                picked ? "border-primary bg-accent font-medium" : "border-border hover:border-primary/40",
              )}
            >
              <c.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1">{c.label}</span>
              {picked && (
                <span className="flex shrink-0 items-center gap-1">
                  {main && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                      Main
                    </span>
                  )}
                  <Check className="h-4 w-4 text-primary" aria-hidden />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
        {value.length === 0
          ? `Pick ${noun}, up to ${MAX_KINDS}.`
          : `${value.length} picked${full ? " (the most you can pick)" : ""}. Your first pick, marked Main, sets your website's design and wording. All of them help customers find you on the Zuri marketplace.`}
      </p>
    </div>
  );
};

/** Every kind of product a shop sells (clothing, phones, skincare...). */
export const ShopCategoryPicker = (props: {
  value: ShopCategoryId[];
  onChange: (next: ShopCategoryId[]) => void;
  className?: string;
}) => <KindPicker options={SHOP_CATEGORIES} ariaLabel="What you sell" noun="everything you sell" {...props} />;

const STUDIO_ICONS: Record<StudioType, LucideIcon> = {
  hair: Scissors,
  braids: Waves,
  nails: Hand,
  "lashes-brows": Eye,
  makeup: Palette,
  "skin-spa": Droplets,
  barber: Scissors,
  wellness: Flower2,
  general: Sparkles,
};
const STUDIO_OPTIONS: KindOption<StudioType>[] = (Object.keys(STUDIO_TYPES) as StudioType[]).map((t) => ({
  id: t,
  label: STUDIO_TYPES[t].label,
  icon: STUDIO_ICONS[t] ?? Store,
}));

/** Every kind of service a studio offers (hair, nails, lashes...). */
export const StudioTypePicker = (props: {
  value: StudioType[];
  onChange: (next: StudioType[]) => void;
  className?: string;
}) => <KindPicker options={STUDIO_OPTIONS} ariaLabel="What your studio does" noun="everything your studio does" {...props} />;
