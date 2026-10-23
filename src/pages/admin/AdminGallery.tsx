import { useState, useRef } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, ImageIcon, Upload, EyeOff } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { galleryApi, categoriesApi, GalleryImageDTO } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { GalleryItemSheet, GalleryMedia } from "@/components/admin/GalleryItemSheet";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Visibility = "all" | "shown" | "hidden";

const AdminGallery = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const imagesQuery = useInfiniteQuery({
    queryKey: ["admin-gallery", "cursor-pages"],
    queryFn: ({ pageParam }) => galleryApi.listAllPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
  const images = imagesQuery.data?.pages.flatMap((page) => page.items);
  const isLoading = imagesQuery.isLoading;

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => categoriesApi.listAll(),
  });

  // Default to the studio's first category; ignore a stale selection.
  const selectedCategory = categories.some((c) => c.slug === category)
    ? category
    : categories[0]?.slug ?? "";

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      if (selectedFile) await galleryApi.upload(selectedFile, title, selectedCategory);
      else if (videoUrl.trim()) await galleryApi.addVideoLink(videoUrl.trim(), title, selectedCategory);
      else throw new Error("Choose a media file or enter a video link");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Image uploaded",
        description: "The image has been added to your gallery.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Edits from the drawer and the show/hide switches on each tile. The
  // switch flips at once and rolls back if the save fails.
  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { title?: string; category?: string; active?: boolean } }) =>
      galleryApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-gallery"] });
      const previous = queryClient.getQueryData(["admin-gallery", "cursor-pages"]);
      queryClient.setQueryData<typeof imagesQuery.data>(["admin-gallery", "cursor-pages"], (data) =>
        data && {
          ...data,
          pages: data.pages.map((pg) => ({
            ...pg,
            items: pg.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
          })),
        },
      );
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["admin-gallery", "cursor-pages"], ctx.previous);
      toast({ variant: "destructive", title: "Couldn't save", description: error.message });
    },
    onSuccess: (_saved, { patch }) => {
      const keys = Object.keys(patch);
      toast({
        title:
          keys.length === 1 && keys[0] === "active"
            ? patch.active
              ? "Shown on your site"
              : "Hidden from your site"
            : "Changes saved",
      });
      if (keys.some((k) => k !== "active")) setOpenId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await galleryApi.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      setDeleteId(null);
      setOpenId(null);
      toast({
        title: "Image deleted",
        description: "The image has been removed from your gallery.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setSelectedFile(null);
    setVideoUrl("");
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please choose a file under 100 MB.",
      });
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const shownCount = images?.filter((i) => i.active).length ?? 0;
  const hiddenCount = (images?.length ?? 0) - shownCount;
  const visible = images?.filter((i) =>
    visibility === "all" ? true : visibility === "shown" ? i.active : !i.active,
  );
  const openItem = images?.find((i) => i.id === openId) ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gallery</h1>
            <p className="text-muted-foreground">
              Your portfolio. Switch an item off to hide it from your site without deleting it.
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : images?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No media in your gallery</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Upload Your First Media
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div role="tablist" aria-label="Filter by visibility" className="inline-flex rounded-lg border bg-muted/40 p-1">
              {([
                ["all", "All", images?.length ?? 0],
                ["shown", "Shown", shownCount],
                ["hidden", "Hidden", hiddenCount],
              ] as const).map(([value, label, count]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={visibility === value}
                  onClick={() => setVisibility(value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    visibility === value
                      ? "bg-background font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label} <span className="tabular-nums text-muted-foreground">{count}</span>
                </button>
              ))}
            </div>

            {visible?.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {visibility === "hidden" ? "Nothing is hidden. Everything here shows on your site." : "Nothing is shown on your site right now."}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {visible?.map((image) => {
                  const cat = categoryBySlug.get(image.category);
                  const catHidden = cat?.active === false;
                  return (
                    <Card key={image.id} className="overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenId(image.id)}
                        className="relative block aspect-square w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        aria-label={`Open ${image.title || "gallery item"}`}
                      >
                        <GalleryMedia
                          item={image}
                          className={cn(
                            "h-full w-full object-cover transition-[opacity,transform] duration-200 hover:scale-[1.02]",
                            !image.active && "opacity-40 grayscale",
                          )}
                        />
                        {image.media_type === "video" && (
                          <span className="absolute left-2 top-2 rounded bg-foreground/70 px-1.5 py-0.5 text-[10px] font-medium text-background">
                            Video
                          </span>
                        )}
                        {!image.active && (
                          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-[11px] font-medium">
                            <EyeOff className="h-3 w-3" aria-hidden /> Hidden
                          </span>
                        )}
                      </button>
                      <CardContent className="space-y-2 p-3">
                        <button
                          type="button"
                          onClick={() => setOpenId(image.id)}
                          className="block w-full truncate text-left text-sm font-medium hover:underline"
                        >
                          {image.title || "Untitled"}
                        </button>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="truncate font-normal">
                            {cat?.name ?? image.category}
                          </Badge>
                          <Switch
                            checked={image.active}
                            onCheckedChange={(active) => updateMutation.mutate({ id: image.id, patch: { active } })}
                            aria-label={`${image.active ? "Hide" : "Show"} ${image.title || "this item"} on your site`}
                          />
                        </div>
                        {image.active && catHidden && (
                          <p className="text-xs text-muted-foreground">Category hidden, so not on your site</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
        {imagesQuery.hasNextPage && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => imagesQuery.fetchNextPage()} disabled={imagesQuery.isFetchingNextPage}>
              {imagesQuery.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load more media
            </Button>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Elegant French Tips"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-url">Or add a YouTube/TikTok link</Label>
              <Input id="video-url" type="url" value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); if (e.target.value) { setSelectedFile(null); setPreviewUrl(null); } }} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a category first" />
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
            <div className="space-y-2">
              <Label>Image or video</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  selectedFile?.type.startsWith("video/") ? (
                    <video
                      src={previewUrl}
                      className="max-h-48 mx-auto rounded-lg"
                      controls
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Upload className="h-8 w-8 mb-2" />
                    <p>Click to upload an image or video</p>
                    <p className="text-xs">JPG, PNG, WebP, AVIF, GIF, MP4, MOV or WebM up to 2 GB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={(!selectedFile && !videoUrl.trim()) || !selectedCategory || isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <GalleryItemSheet
        item={openItem}
        categories={categories}
        saving={updateMutation.isPending}
        onClose={() => setOpenId(null)}
        onSave={(id, patch) => updateMutation.mutate({ id, patch })}
        onDelete={(id) => setDeleteId(id)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from your gallery?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it for good. To take it off your site but keep it, switch it off instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminGallery;
