import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudioContentDTO } from "@/lib/api";
import {
  SITE_TEMPLATES,
  STUDIO_TYPES,
  studioTypeOf,
  templateOf,
  type SiteTemplate,
  type StudioType,
} from "@/lib/studioTemplates";
import { SHOP_CATEGORIES } from "@/lib/shopCategories";
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
  // A Zuri Storefront picks what it sells; the shop design follows from that.
  shop?: boolean;
}) => {
  if (shop)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your shop</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us what you sell and we'll fill in wording that fits. Anything you write below replaces it.
          </p>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="shop-category">What do you sell?</Label>
            <Select value={value.shopCategory ?? "other"} onValueChange={(v) => onChange({ ...value, shopCategory: v })}>
              <SelectTrigger id="shop-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOP_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        <div className="max-w-sm space-y-2">
          <Label htmlFor="studio-type">What kind of studio are you?</Label>
          <Select value={type} onValueChange={(v) => onChange({ ...value, studioType: v as StudioType })}>
            <SelectTrigger id="studio-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STUDIO_TYPES) as StudioType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {STUDIO_TYPES[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
