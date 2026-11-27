import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { uploadStudioMedia, type StudioContentDTO, type StudioFeatureCard } from "@/lib/api";
import { LANDING_LIMITS, landingDefaults, type LandingCopy } from "@/lib/landingDefaults";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = ["star", "clock", "heart", "sparkles", "award", "gem", "palette", "smile", "shield"];

type ImageField = "heroImageUrl" | "aboutImageUrl" | "ctaImageUrl";

interface EditorProps {
  value: StudioContentDTO;
  onChange: (next: StudioContentDTO) => void;
  studioName: string;
  onSave: () => void;
  saving: boolean;
}

const POLICY_FIELDS = [
  {
    field: "cancellationPolicy",
    label: "Cancellations and rescheduling",
    placeholder: "For example: Please give us 24 hours' notice to cancel or move your appointment. A deposit is not returned for a no-show.",
    hint: "How much notice you need, and what happens to a deposit.",
  },
  {
    field: "refundPolicy",
    label: "Refunds and returns",
    placeholder: "For example: Unused products can be returned within 7 days with the receipt. Services are not refunded once done.",
    hint: "When you refund, how, and how long it takes. You pay refunds yourself, by Mobile Money, cash or bank.",
  },
  {
    field: "deliveryPolicy",
    label: "Delivery and collection",
    placeholder: "For example: We deliver within Accra in 1 to 2 days. You can also collect from our studio.",
    hint: "Areas, fees and times for delivery, and how collection works. Only needed if you sell products.",
  },
] as const;

/** One text slot. Blank shows the default, which doubles as the placeholder. */
const TextSlot = ({
  field,
  label,
  hint,
  multiline,
  value,
  defaults,
  onChange,
}: {
  field: keyof LandingCopy;
  label: string;
  hint?: string;
  multiline?: boolean;
  value: string | null;
  defaults: LandingCopy;
  onChange: (v: string) => void;
}) => {
  const id = `landing-${field}`;
  const max = LANDING_LIMITS[field];
  const length = value?.length ?? 0;
  const Field = multiline ? Textarea : Input;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <span
          className={cn(
            "text-xs tabular-nums",
            length > max * 0.9 ? "text-amber-600" : "text-muted-foreground",
          )}
        >
          {length}/{max}
        </span>
      </div>
      <Field
        id={id}
        value={value ?? ""}
        maxLength={max}
        placeholder={defaults[field]}
        onChange={(e) => onChange(e.target.value)}
        {...(multiline ? { rows: 3 } : {})}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};

const ImageSlot = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "That isn't an image", description: "Choose a JPG, PNG or WebP file." });
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadStudioMedia(file, "studio"));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-md border bg-muted">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
              Using the default
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
              <ImagePlus className="mr-2 h-4 w-4" />
              {value ? "Replace" : "Upload"}
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
};

const MAX_CAROUSEL = 5;

/** Up to five photos for a carousel: add, remove and put them in order. */
const PhotoCarouselSlot = ({ label, hint, value, onChange }: { label: string; hint: string; value: string[]; onChange: (urls: string[]) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const { toast } = useToast();

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_CAROUSEL - value.length;
    const images = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (images.length < files.length) toast({ title: images.length ? `Only ${room} more fit: the carousel holds ${MAX_CAROUSEL} photos` : "Use JPG, PNG or WebP photos" });
    setUploading(images.length);
    const added: string[] = [];
    for (const f of images) {
      try {
        added.push(await uploadStudioMedia(f, "studio"));
      } catch (error) {
        toast({ variant: "destructive", title: "A photo didn't upload", description: error instanceof Error ? error.message : "Please try again." });
      }
      setUploading((n) => n - 1);
    }
    if (added.length) onChange([...value, ...added]);
    setUploading(0);
    if (inputRef.current) inputRef.current.value = "";
  };
  const move = (i: number, by: number) => {
    const next = [...value];
    const j = i + by;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label>{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{value.length}/{MAX_CAROUSEL}</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {value.map((src, i) => (
          <div key={src} className="w-32 space-y-1">
            <div className="relative h-20 overflow-hidden rounded-md border bg-muted">
              <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold">First</span>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Move photo ${i + 1} later`} disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`u${i}`} className="flex h-20 w-32 items-center justify-center rounded-md border bg-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ))}
        {value.length + uploading < MAX_CAROUSEL && (
          <button type="button" onClick={() => inputRef.current?.click()} className="flex h-20 w-32 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent">
            <ImagePlus className="h-5 w-5" /> Add photos
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
};

const Section = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{title}</CardTitle>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

export const LandingContentEditor = ({ value, onChange, studioName, onSave, saving }: EditorProps) => {
  const defaults = landingDefaults(studioName);
  const set = (patch: Partial<StudioContentDTO>) => onChange({ ...value, ...patch });
  const text = (field: keyof LandingCopy) => ({
    field,
    value: value[field],
    defaults,
    onChange: (v: string) => set({ [field]: v } as Partial<StudioContentDTO>),
  });
  const image = (field: ImageField) => ({
    value: value[field],
    onChange: (url: string | null) => set({ [field]: url } as Partial<StudioContentDTO>),
  });

  const cards: StudioFeatureCard[] = value.featureCards ?? [];
  const setCards = (next: StudioFeatureCard[]) => set({ featureCards: next });
  const updateCard = (i: number, patch: Partial<StudioFeatureCard>) =>
    setCards(cards.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sections are listed in the order they appear on your page. Leave a box empty to use the
        wording shown in grey.{" "}
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
          Open your page <ExternalLink className="h-3 w-3" />
        </a>
      </p>

      <Section title="Top of the page" description="The first thing visitors see.">
        <TextSlot {...text("heroEyebrow")} label="Small line above the headline" />
        <TextSlot {...text("heroHeadline")} label="Headline" />
        <TextSlot {...text("heroSubtext")} label="Sentence under the headline" multiline />
        <PhotoCarouselSlot
          label="Photos at the top (up to 5)"
          hint="A wide photo works best (at least 1600px across). One photo is the background. Two or more make a carousel that fades from one to the next, in this order. None uses your newest gallery photos."
          value={value.heroImages?.length ? value.heroImages : value.heroImageUrl ? [value.heroImageUrl] : []}
          onChange={(urls) => set({ heroImages: urls, heroImageUrl: urls[0] ?? null })}
        />
      </Section>

      <Section title="About you" description="A short introduction. The text also appears in your site footer.">
        <TextSlot {...text("aboutHeading")} label="Heading" />
        <TextSlot {...text("aboutText")} label="About text" multiline />
        <ImageSlot
          {...image("aboutImageUrl")}
          label="Photo"
          hint="A portrait photo suits this spot: you, your team or your space."
        />
      </Section>

      <Section
        title="Highlights"
        description="Up to six short reasons to choose you. The section is hidden when you have none."
      >
        <TextSlot {...text("featuresHeading")} label="Heading" />
        <div className="space-y-3">
          {cards.map((card, i) => (
            <div key={i} className="grid grid-cols-[7rem_1fr_auto] items-start gap-2 rounded-md border p-2">
              <Select value={card.icon || "sparkles"} onValueChange={(v) => updateCard(i, { icon: v })}>
                <SelectTrigger aria-label="Icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((ic) => (
                    <SelectItem key={ic} value={ic}>
                      {ic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <Input
                  value={card.title}
                  maxLength={60}
                  onChange={(e) => updateCard(i, { title: e.target.value })}
                  placeholder="e.g. Same-week appointments"
                  aria-label="Highlight title"
                />
                <Input
                  value={card.description}
                  maxLength={160}
                  onChange={(e) => updateCard(i, { description: e.target.value })}
                  placeholder="One sentence explaining it"
                  aria-label="Highlight description"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCards(cards.filter((_, idx) => idx !== i))}
                aria-label="Remove highlight"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cards.length >= 6}
            onClick={() => setCards([...cards, { icon: "star", title: "", description: "" }])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add a highlight
          </Button>
        </div>
      </Section>

      <Section title="Section headings" description="The headings over your services, photos, reviews and contact details.">
        <TextSlot {...text("servicesHeading")} label="Services" />
        <TextSlot {...text("galleryHeading")} label="Gallery" />
        <TextSlot {...text("reviewsHeading")} label="Reviews" />
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label htmlFor="show-testimonials">Show reviews on the home page</Label>
            <p className="text-xs text-muted-foreground">Only approved reviews are ever shown.</p>
          </div>
          <Switch
            id="show-testimonials"
            checked={value.showTestimonials}
            onCheckedChange={(v) => set({ showTestimonials: v })}
          />
        </div>
        <TextSlot {...text("contactHeading")} label="Contact" />
      </Section>

      <Section
        title="Your policies"
        description="Customers see these on your Policies page and before they book or pay. Payments go straight to your own Paystack account, so any refund is made by you. Leave a box empty to show the standard wording."
      >
        {POLICY_FIELDS.map((p) => (
          <div key={p.field} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor={`policy-${p.field}`}>{p.label}</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{(value[p.field] ?? "").length}/1500</span>
            </div>
            <Textarea
              id={`policy-${p.field}`}
              rows={4}
              maxLength={1500}
              value={value[p.field] ?? ""}
              placeholder={p.placeholder}
              onChange={(e) => set({ [p.field]: e.target.value } as Partial<StudioContentDTO>)}
            />
            <p className="text-xs text-muted-foreground">{p.hint}</p>
          </div>
        ))}
      </Section>

      <Section title="Loyalty" description="Shown when loyalty points are switched on for your studio.">
        <TextSlot {...text("loyaltyHeading")} label="Heading" />
        <TextSlot {...text("loyaltyText")} label="Text" multiline />
      </Section>

      <Section title="Closing call to action" description="The full-width banner near the bottom of the page.">
        <TextSlot {...text("ctaHeading")} label="Heading" />
        <ImageSlot
          {...image("ctaImageUrl")}
          label="Background photo"
          hint="It sits under a dark overlay, so most photos work. Empty uses a gallery photo."
        />
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={onSave} disabled={saving} className="shadow-lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save landing page
        </Button>
      </div>
    </div>
  );
};
