import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lightbulb, Send } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  featureRequestsApi,
  FeatureRequestStatus,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const STATUS_META: Record<
  FeatureRequestStatus,
  { label: string; className: string }
> = {
  NEW: {
    label: "New",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  PLANNED: {
    label: "Planned",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  IN_PROGRESS: {
    label: "In progress",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  DONE: {
    label: "Done",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  DECLINED: {
    label: "Declined",
    className: "bg-muted text-muted-foreground",
  },
};

const AdminFeatureRequests = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["feature-requests"],
    queryFn: () => featureRequestsApi.list(),
  });

  const mutation = useMutation({
    mutationFn: () => featureRequestsApi.create({ title, description }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
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
            its status up to date below.
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
                        <p className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(r.createdAt), "MMM d, yyyy")}
                        </p>
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFeatureRequests;
