import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Sparkles, Wand2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStudio } from "@/hooks/useStudio";
import {
  categoriesApi,
  galleryApi,
  imageMakerApi,
  productsApi,
  servicesApi,
  studioAdminApi,
  type GeneratedImageDTO,
  type ImagePurpose,
  type ImageStyle,
} from "@/lib/api";
import { SHOP_CATEGORIES } from "@/lib/shopCategories";
import { STUDIO_TYPES, studioTypeOf } from "@/lib/studioTemplates";
import { cn } from "@/lib/utils";

const PURPOSES: { id: ImagePurpose; label: string; text: string; needs?: "booking" | "commerce" | "gallery" }[] = [
  { id: "hero", label: "Homepage photo", text: "The big photo at the top of your website" },
  { id: "gallery", label: "Gallery picture", text: "Show off your work and your space", needs: "gallery" },
  { id: "service", label: "Service picture", text: "A photo for one of your services", needs: "booking" },
  { id: "product", label: "Product picture", text: "A clean photo for something you sell", needs: "commerce" },
];

const STYLES: { id: ImageStyle; label: string }[] = [
  { id: "natural", label: "Natural" },
  { id: "bright", label: "Bright and clean" },
  { id: "bold", label: "Bold" },
  { id: "minimal", label: "Calm and simple" },
];

/** Starting points, so nobody faces an empty box. */
const ideasFor = (purpose: ImagePurpose, what: string): string[] => {
  switch (purpose) {
    case "hero":
      return [
        `A stylish, welcoming ${what} interior with soft daylight and plants`,
        `A smiling woman enjoying a visit to a ${what}`,
        `Close-up of beautiful finished work at a ${what}`,
      ];
    case "gallery":
      return [
        `Detailed close-up of fresh, neat work from a ${what}`,
        `A tidy workstation at a ${what}, ready for the next client`,
        `Before an evening out: a happy client after a ${what} visit`,
      ];
    case "service":
      return [
        `A professional at work in a ${what}, focused and careful`,
        `The finished result of a treatment at a ${what}, close-up`,
      ];
    case "product":
      return [
        `A product bottle on a marble surface with soft shadows`,
        `Neatly folded items on a plain light background`,
        `A gift box with tissue paper, top-down view`,
      ];
  }
};

/**
 * The image maker: describe a picture, we make it, and it goes straight onto
 * the website (homepage photo, gallery, a service or a product).
 */
const AdminImages = () => {
  const { features, config } = useStudio();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const shop = features.booking === false;
  const what = shop
    ? (SHOP_CATEGORIES.find((c) => c.id === config?.shopCategory)?.label.toLowerCase() ?? "shop")
    : STUDIO_TYPES[studioTypeOf(config?.content?.studioType)].label.toLowerCase();

  const purposes = PURPOSES.filter((p) => !p.needs || features[p.needs] !== false);
  const [purpose, setPurpose] = useState<ImagePurpose>(shop ? "product" : "hero");
  const [style, setStyle] = useState<ImageStyle>("natural");
  const [prompt, setPrompt] = useState("");
  const [using, setUsing] = useState<GeneratedImageDTO | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["image-maker"], queryFn: () => imageMakerApi.list() });
  const make = useMutation({
    mutationFn: () => imageMakerApi.generate({ prompt: prompt.trim(), purpose, style }),
    onSuccess: (img) => {
      queryClient.invalidateQueries({ queryKey: ["image-maker"] });
      setUsing(img);
    },
    onError: (err) =>
      toast({ variant: "destructive", title: "No picture made", description: err instanceof Error ? err.message : "Please try again." }),
  });

  const left = data ? Math.max(0, data.limit - data.used) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Image maker</h1>
          <p className="text-muted-foreground">
            Not sure which photos to use? Describe one and we'll make it for your website.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data?.enabled ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              The image maker isn't switched on yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="space-y-6 p-5 md:p-6">
                <div className="space-y-2">
                  <Label>What is it for?</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="What the picture is for">
                    {purposes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={purpose === p.id}
                        onClick={() => setPurpose(p.id)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          purpose === p.id ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40",
                        )}
                      >
                        <p className="text-sm font-semibold">{p.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.text}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image-prompt">Describe the picture</Label>
                  <Textarea
                    id="image-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, 400))}
                    rows={3}
                    placeholder="For example: a bright, modern salon with gold mirrors and green plants"
                  />
                  <div className="flex flex-wrap gap-2">
                    {ideasFor(purpose, what).map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        onClick={() => setPrompt(idea)}
                        className="rounded-full border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                      >
                        <Sparkles className="mr-1 inline h-3 w-3" aria-hidden />
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Look</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((s) => (
                      <Button
                        key={s.id}
                        type="button"
                        size="sm"
                        variant={style === s.id ? "default" : "outline"}
                        onClick={() => setStyle(s.id)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => make.mutate()} disabled={make.isPending || prompt.trim().length < 3 || left === 0}>
                    {make.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {make.isPending ? "Making your picture…" : "Make picture"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {make.isPending
                      ? "This takes up to a minute."
                      : left === 0
                        ? "You've used all your pictures this month."
                        : `${left} of ${data.limit} left this month`}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your pictures</CardTitle>
              </CardHeader>
              <CardContent>
                {data.images.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Pictures you make appear here, ready to use.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {data.images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setUsing(img)}
                        className="group overflow-hidden rounded-lg border text-left"
                      >
                        <img src={img.url} alt={img.prompt} loading="lazy" className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]" />
                        <p className="line-clamp-2 p-2 text-xs text-muted-foreground">{img.prompt}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <UseImageDialog image={using} onClose={() => setUsing(null)} />
    </AdminLayout>
  );
};

/** Put a picture to work: homepage photo, gallery, a service or a product. */
const UseImageDialog = ({ image, onClose }: { image: GeneratedImageDTO | null; onClose: () => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState("");
  const purpose = image?.purpose;

  const services = useQuery({ queryKey: ["admin-services-all"], queryFn: () => servicesApi.listAll(), enabled: purpose === "service" });
  const products = useQuery({ queryKey: ["dashboard-products"], queryFn: () => productsApi.listAll(), enabled: purpose === "product" });
  const categories = useQuery({ queryKey: ["admin-categories-all"], queryFn: () => categoriesApi.listAll(), enabled: purpose === "gallery" });
  const options =
    purpose === "service"
      ? (services.data ?? []).map((s) => ({ id: s.id, name: s.name }))
      : purpose === "product"
        ? (products.data ?? []).map((p) => ({ id: p.id, name: p.name }))
        : purpose === "gallery"
          ? (categories.data ?? []).map((c) => ({ id: c.slug, name: c.name }))
          : [];

  const apply = useMutation({
    mutationFn: async () => {
      if (!image) return;
      if (image.purpose === "hero") await studioAdminApi.updateContent({ heroImageUrl: image.url });
      else if (image.purpose === "gallery") await galleryApi.addImageUrl(image.url, "", target);
      else if (image.purpose === "service") await servicesApi.update(target, { imageUrl: image.url });
      else await productsApi.update(target, { imageUrl: image.url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Picture added", description: "It's on your website now." });
      setTarget("");
      onClose();
    },
    onError: (err) =>
      toast({ variant: "destructive", title: "Couldn't add the picture", description: err instanceof Error ? err.message : "Please try again." }),
  });

  const label =
    purpose === "service" ? "Which service?" : purpose === "product" ? "Which product?" : "Which gallery category?";
  const action =
    purpose === "hero" ? "Use as homepage photo" : purpose === "gallery" ? "Add to gallery" : purpose === "service" ? "Use for this service" : "Use for this product";

  return (
    <Dialog open={!!image} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your picture</DialogTitle>
          <DialogDescription className="line-clamp-2">{image?.prompt}</DialogDescription>
        </DialogHeader>
        {image && <img src={image.url} alt={image.prompt} className="max-h-[50vh] w-full rounded-lg object-contain bg-muted" />}
        {purpose !== "hero" && (
          <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder={options.length ? "Choose one" : "Nothing to choose yet"} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          {image && (
            <Button variant="outline" asChild>
              <a href={image.url} download target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" /> Download
              </a>
            </Button>
          )}
          <Button onClick={() => apply.mutate()} disabled={apply.isPending || (purpose !== "hero" && !target)}>
            {apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminImages;
