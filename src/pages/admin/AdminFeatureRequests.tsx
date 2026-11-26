import { useEffect, useRef, useState } from "react";
import { useCursorPages } from "@/hooks/useCursorPages";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadMore } from "@/components/LoadMore";
import { ImagePlus, Loader2, Lightbulb, Send, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { featureRequestsApi } from "@/lib/api";
import { uploadStudioMedia } from "@/lib/api/core";
import { STATUS_META } from "@/lib/featureRequestFormat";
import { useToast } from "@/hooks/use-toast";

const AdminFeatureRequests = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 5;

  // Small previews of the chosen pictures; released when they change.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const ok = [...picked].filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 10 * 1024 * 1024);
    if (ok.length < picked.length) toast({ variant: "destructive", title: "Some files were skipped", description: "Use JPG, PNG or WebP pictures up to 10 MB each." });
    const next = [...files, ...ok].slice(0, MAX_IMAGES);
    if (files.length + ok.length > MAX_IMAGES) toast({ title: `You can attach up to ${MAX_IMAGES} pictures` });
    setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  };

  const requestsQuery = useCursorPages({
    queryKey: ["feature-requests"],
    queryFn: ({ pageParam }) => featureRequestsApi.listPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  });
  const requests = requestsQuery.data?.pages.flatMap((pg) => pg.items) ?? [];
  const isLoading = requestsQuery.isLoading;

  const mutation = useMutation({
    mutationFn: async () => {
      // Pictures go up first, then the request carries their addresses.
      const images = await Promise.all(files.map((f) => uploadStudioMedia(f, "requests")));
      return featureRequestsApi.create({ title, description, images });
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      toast({
        title: "Request submitted",
        description: "Thanks — we'll review it and update its status here.",
      });
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Couldn't submit",
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => featureRequestsApi.withdraw(id),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      queryClient.invalidateQueries({ queryKey: ["studio-billing"] });
      toast({ title: "Request withdrawn", description: r.message });
    },
    onError: (err) =>
      toast({ variant: "destructive", title: "Couldn't withdraw", description: err instanceof Error ? err.message : "Please try again." }),
  });

  const canSubmit =
    title.trim().length >= 3 && description.trim().length >= 5 && !mutation.isPending;

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Lightbulb className="h-6 w-6 text-primary" />
            Feature requests
          </h1>
          <p className="text-muted-foreground">
            Suggest a feature or improvement. We'll review each request and keep
            its status up to date below. Building a feature may carry a one-off
            fee. We'll tell you the amount, and it's added to your next renewal.
            You can withdraw a request before work starts and any fee is removed.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request a feature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fr-title">Title</Label>
              <Input
                id="fr-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Gift cards"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr-desc">Description</Label>
              <Textarea
                id="fr-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you'd like and why it would help your studio."
                rows={4}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label>Pictures (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Show what you mean: a screenshot, a sketch or an example from another app. Up to {MAX_IMAGES}, JPG, PNG or WebP.
              </p>
              <div className="flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={src} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                    <img src={src} alt={`Attached picture ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove picture ${i + 1}`}
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 shadow"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {files.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-accent"
                  >
                    <ImagePlus className="h-5 w-5" /> Add
                  </button>
                )}
              </div>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit request
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Your requests
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                You haven't submitted any requests yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <Card key={r.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {r.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {r.description}
                        </p>
                        {!!r.images?.length && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {r.images.map((src, i) => (
                              <a key={src} href={src} target="_blank" rel="noreferrer" aria-label={`Open picture ${i + 1}`}>
                                <img src={src} alt="" className="h-14 w-14 rounded-md border border-border object-cover" loading="lazy" />
                              </a>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(r.createdAt), "MMM d, yyyy")}
                        </p>
                        {r.feeAmount != null && r.status !== "DECLINED" && (
                          <p className="mt-2 text-sm font-medium text-foreground">
                            {r.feeAmount > 0
                              ? `Fee: GHS ${r.feeAmount.toFixed(2)}, added to your next renewal${r.monthlyFee ? `, then GHS ${r.monthlyFee.toFixed(2)} a month added to your plan price` : ""}`
                              : r.monthlyFee
                                ? `GHS ${r.monthlyFee.toFixed(2)} a month, added to your plan price`
                                : "No fee for this one"}
                          </p>
                        )}
                        {(r.status === "NEW" || r.status === "PLANNED") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            disabled={withdraw.isPending}
                            onClick={() => withdraw.mutate(r.id)}
                          >
                            Withdraw request
                          </Button>
                        )}
                      </div>
                      <Badge className={STATUS_META[r.status].className}>
                        {STATUS_META[r.status].label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <LoadMore query={requestsQuery} label="Load more requests" />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFeatureRequests;
