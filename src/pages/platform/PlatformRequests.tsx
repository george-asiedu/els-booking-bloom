import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformLayout } from "./PlatformLayout";
import { platformApi } from "@/lib/platformApi";
import { FeatureRequestStatus } from "@/lib/api";
import { STATUS_META } from "@/pages/admin/AdminFeatureRequests";
import { useToast } from "@/hooks/use-toast";

const STATUSES: FeatureRequestStatus[] = [
  "NEW",
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "DECLINED",
];

const PlatformRequests = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FeatureRequestStatus | "ALL">("ALL");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["platform", "feature-requests", filter],
    queryFn: () =>
      platformApi.listFeatureRequests(filter === "ALL" ? undefined : filter),
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: FeatureRequestStatus;
    }) => platformApi.updateFeatureRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["platform", "feature-requests"],
      });
      toast({ title: "Status updated" });
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  return (
    <PlatformLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
          <Lightbulb className="h-6 w-6 text-primary" />
          Feature requests
        </h1>
        <p className="text-sm text-muted-foreground">
          What studios are asking for across the platform.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("ALL")}
        >
          All
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {STATUS_META[s].label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No feature requests{filter === "ALL" ? "" : " in this status"} yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {r.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {r.studio ? `${r.studio.name} · /${r.studio.slug}` : "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {format(new Date(r.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Select
                      value={r.status}
                      onValueChange={(v) =>
                        mutation.mutate({
                          id: r.id,
                          status: v as FeatureRequestStatus,
                        })
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_META[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

export default PlatformRequests;
