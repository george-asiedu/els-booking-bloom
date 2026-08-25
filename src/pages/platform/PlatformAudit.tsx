import { useQuery } from "@tanstack/react-query";
import { Loader2, ScrollText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformLayout } from "./PlatformLayout";
import { platformApi } from "@/lib/platformApi";

const ACTION_LABEL: Record<string, string> = {
  "studio.provisioned": "Provisioned studio",
  "studio.updated": "Updated studio",
  "studio.status_changed": "Changed status",
  "studio.settings_updated": "Updated features",
  "studio.impersonated": "Entered studio",
  "studio.payout_connected": "Connected payout",
};

const summarize = (meta: Record<string, unknown> | null): string => {
  if (!meta) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
  }
  return parts.join(" · ");
};

const PlatformAudit = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["platform", "audit"],
    queryFn: () => platformApi.listAuditLogs(),
  });

  return (
    <PlatformLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
          <ScrollText className="h-6 w-6 text-primary" />
          Activity log
        </h1>
        <p className="text-sm text-muted-foreground">
          A trail of platform actions across all studios.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <Badge variant="secondary" className="mt-0.5 shrink-0">
                  {ACTION_LABEL[log.action] ?? log.action}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {summarize(log.metadata) || log.targetId || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.actorEmail} · {log.actorRole.toLowerCase()}
                  </p>
                </div>
                <span
                  className="shrink-0 text-xs text-muted-foreground"
                  title={new Date(log.createdAt).toLocaleString()}
                >
                  {formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PlatformLayout>
  );
};

export default PlatformAudit;
