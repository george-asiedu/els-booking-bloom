import { useEffect, useId, useState } from "react";
import { format, parseISO } from "date-fns";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryDTO, GalleryImageDTO } from "@/lib/api";
import { videoEmbedUrl } from "@/lib/video";

export const GalleryMedia = ({
  item,
  className,
  interactive = false,
}: {
  item: GalleryImageDTO;
  className?: string;
  // Controls and embeds only where someone can actually use them (the
  // drawer); grid tiles stay still and cheap.
  interactive?: boolean;
}) => {
  if (item.media_type === "video" && item.external_video) {
    return interactive ? (
      <iframe
        src={videoEmbedUrl(item.image_url) ?? undefined}
        title={item.title || "Gallery video"}
        className={className}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    ) : (
      <div className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${className ?? ""}`}>
        {/youtu/i.test(item.image_url) ? "YouTube video" : "TikTok video"}
      </div>
    );
  }
  if (item.media_type === "video") {
    return (
      <video
        src={item.image_url}
        className={className}
        muted
        playsInline
        controls={interactive}
        preload="metadata"
      />
    );
  }
  return <img src={item.image_url} alt={item.title} className={className} loading="lazy" />;
};

const kindOf = (item: GalleryImageDTO) =>
  item.media_type === "image"
    ? "Image"
    : item.external_video
      ? /youtu/i.test(item.image_url)
        ? "YouTube video"
        : "TikTok video"
      : "Uploaded video";

/**
 * Side drawer for one gallery item: a large preview, its details, and the
 * things an admin can change (title, category, whether the public sees it).
 */
export const GalleryItemSheet = ({
  item,
  categories,
  saving,
  onClose,
  onSave,
  onDelete,
}: {
  item: GalleryImageDTO | null;
  categories: CategoryDTO[];
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, patch: { title?: string; category?: string; active?: boolean }) => void;
  onDelete: (id: string) => void;
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState(true);
  const ids = useId();

  // Start from the item each time a different one is opened.
  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setCategory(item.category);
    setActive(item.active);
  }, [item]);

  if (!item) {
    return (
      <Sheet open={false} onOpenChange={onClose}>
        <SheetContent />
      </Sheet>
    );
  }

  const cat = categories.find((c) => c.slug === category);
  const patch = {
    ...(title.trim() !== item.title ? { title: title.trim() } : {}),
    ...(category !== item.category ? { category } : {}),
    ...(active !== item.active ? { active } : {}),
  };
  const dirty = Object.keys(patch).length > 0;
  const publicNow = active && cat?.active !== false;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-4 text-left">
          <SheetTitle className="truncate pr-6">{item.title || "Untitled"}</SheetTitle>
          <SheetDescription>
            {kindOf(item)} · added {format(parseISO(item.created_at), "d MMM yyyy")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="overflow-hidden rounded-lg border bg-muted">
            <GalleryMedia
              item={item}
              interactive
              className={
                item.external_video ? "aspect-video w-full" : "max-h-[50vh] w-full object-contain"
              }
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor={`${ids}-active`} className="text-sm font-medium">
                Show on your site
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {publicNow
                  ? "Customers can see this in your gallery."
                  : !active
                    ? "Hidden. Only you can see it here."
                    : `Its category "${cat?.name ?? category}" is hidden, so customers won't see it until you show the category.`}
              </p>
            </div>
            <Switch id={`${ids}-active`} checked={active} onCheckedChange={setActive} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${ids}-title`}>Title</Label>
            <Input
              id={`${ids}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Elegant French tips"
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${ids}-category`}>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id={`${ids}-category`}>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                    {!c.active ? " (hidden)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Type</dt>
            <dd>{kindOf(item)}</dd>
            <dt className="text-muted-foreground">Added</dt>
            <dd>{format(parseISO(item.created_at), "d MMMM yyyy, h:mm a")}</dd>
            <dt className="text-muted-foreground">File</dt>
            <dd className="min-w-0">
              <a
                href={item.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Open original <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </dd>
          </dl>
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-2 border-t px-6 py-4 sm:justify-between">
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!dirty || saving} onClick={() => onSave(item.id, patch)}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
