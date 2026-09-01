import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Quote, Star, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlatformLayout } from "./PlatformLayout";
import { platformApi } from "@/lib/platformApi";
import { useToast } from "@/hooks/use-toast";

const PlatformReviews = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["platform", "reviews"],
    queryFn: () => platformApi.listReviews(),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["platform", "reviews"] });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      platformApi.setReviewApproved(id, approved),
    onSuccess: invalidate,
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Update failed", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformApi.removeReview(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Testimonial removed" });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Delete failed", description: e.message }),
  });

  return (
    <PlatformLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
          <Quote className="h-6 w-6 text-primary" />
          Testimonials
        </h1>
        <p className="text-sm text-muted-foreground">
          Approve studio testimonials to feature them on the landing page.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No testimonials submitted yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < r.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm">“{r.content}”</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.authorName}
                      {r.authorRole ? ` · ${r.authorRole}` : ""}
                      {r.studioName ? ` · ${r.studioName}` : ""} ·{" "}
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`ap-${r.id}`} className="text-xs text-muted-foreground">
                        Featured
                      </Label>
                      <Switch
                        id={`ap-${r.id}`}
                        checked={r.approved}
                        onCheckedChange={(approved) =>
                          approveMutation.mutate({ id: r.id, approved })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(r.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PlatformLayout>
  );
};

export default PlatformReviews;
