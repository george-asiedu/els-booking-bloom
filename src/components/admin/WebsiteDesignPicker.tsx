import { Label } from "@/components/ui/label";
import { ShopCategoryPicker, StudioTypePicker } from "@/components/ShopCategoryPicker";
import type { ShopCategoryId } from "@/lib/shopCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudioContentDTO } from "@/lib/api";
import {
  SITE_TEMPLATES,
  studioTypeOf,
  templateOf,
  type SiteTemplate,
  type StudioType,
} from "@/lib/studioTemplates";
import { cn } from "@/lib/utils";

// A tiny drawing of each layout, so owners can tell them apart at a glance.
const Thumb = ({ t }: { t: SiteTemplate }) => (
  <div className="aspect-[4/3] w-full overflow-hidden rounded-md border bg-background p-1.5">
    {t === "minimal" ? (
      <div className="grid h-full grid-cols-2 gap-1.5">
        <div className="flex flex-col justify-center gap-1">
          <div className="h-1.5 w-4/5 rounded bg-foreground/70" />
          <div className="h-1.5 w-3/5 rounded bg-foreground/40" />
          <div className="mt-1 h-2 w-2/5 rounded bg-primary" />
        </div>
        <div className="rounded bg-muted-foreground/30" />
      </div>
    ) : (
      <div className="relative h-full rounded bg-muted-foreground/40">
        <div className="absolute left-2 top-1/3 space-y-1">
          <div className={cn("h-1.5 w-10 rounded", t === "bold" ? "bg-white" : "bg-white/90")} />
          <div className="h-1.5 w-7 rounded bg-white/60" />
          <div className="mt-1 h-2 w-5 rounded bg-primary" />
        </div>
        {t === "bold" && <div className="absolute inset-x-2 bottom-1 h-2.5 rounded bg-foreground" />}
      </div>
    )}
  </div>
);

/**
 * The kind of studio (sets the website's default wording) and its layout.
 * Part of the landing content, saved with it.
 */
export const WebsiteDesignPicker = ({
  value,
  onChange,
  shop = false,
}: {
  value: StudioContentDTO;
  onChange: (next: StudioContentDTO) => void;
  // A Zuri Stores picks what it sells; the shop design follows from that.
  shop?: boolean;
}) => {
  if (shop)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your shop</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us everything you sell. Your main kind sets the wording and design; anything you write below replaces it.
          </p>
        </CardHeader>
        <CardContent>
          <ShopCategoryPicker
            value={(value.shopCategories?.length ? value.shopCategories : value.shopCategory ? [value.shopCategory] : []) as ShopCategoryId[]}
            onChange={(next) => onChange({ ...value, shopCategories: next, shopCategory: next[0] ?? null })}
          />
        </CardContent>
      </Card>
    );
  const type = studioTypeOf(value.studioType);
  const template = templateOf(value.siteTemplate);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your website</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pick what you do and a design. We'll fill in wording that fits; anything you write
          below replaces it.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>What does your studio do?</Label>
          <StudioTypePicker
            value={(value.studioTypes?.length ? value.studioTypes : value.studioType ? [type] : []) as StudioType[]}
            onChange={(next) => onChange({ ...value, studioTypes: next, studioType: next[0] ?? null })}
          />
        </div>
        <div className="space-y-2">
          <Label>Design</Label>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Website design">
            {(Object.keys(SITE_TEMPLATES) as SiteTemplate[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={template === t}
                onClick={() => onChange({ ...value, siteTemplate: t })}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  template === t ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40",
                )}
              >
                <Thumb t={t} />
                <p className="mt-2 text-sm font-semibold">{SITE_TEMPLATES[t].label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{SITE_TEMPLATES[t].description}</p>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
