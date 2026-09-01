import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star, Send, Quote } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { platformReviewsApi } from "@/lib/api";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import { PLATFORM } from "@/config/platform";

const AdminTestimonial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { name: studioName } = useStudio();

  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState(`Owner, ${studioName}`);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);

  const { data: mine = [], isLoading } = useQuery({
    queryKey: ["my-testimonials"],
    queryFn: () => platformReviewsApi.listMine(),
  });

  const mutation = useMutation({
    mutationFn: () =>
      platformReviewsApi.submit({ authorName, authorRole, content, rating }),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["my-testimonials"] });
      toast({
        title: "Thank you!",
        description: `We'll review it before featuring it on the ${PLATFORM.name} site.`,
      });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Couldn't submit",
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const canSubmit = authorName.trim().length >= 2 && content.trim().length >= 5;

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Quote className="h-6 w-6 text-primary" />
            Share your story
          </h1>
          <p className="text-muted-foreground">
            Enjoying {PLATFORM.name}? Leave a testimonial — once approved, it may
            be featured on our homepage.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your testimonial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)}>
                    <Star
                      className={`h-6 w-6 ${
                        n <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-name">Your name</Label>
              <Input id="t-name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-role">Role / studio (optional)</Label>
              <Input id="t-role" value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-content">Your testimonial</Label>
              <Textarea
                id="t-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                maxLength={400}
                placeholder={`What do you love about running your studio on ${PLATFORM.name}?`}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? null : mine.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Your submissions</h2>
            {mine.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="text-sm">“{t.content}”</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.authorName}
                    </p>
                  </div>
                  <Badge variant={t.approved ? "default" : "secondary"} className="shrink-0">
                    {t.approved ? "Featured" : "Pending review"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminTestimonial;
