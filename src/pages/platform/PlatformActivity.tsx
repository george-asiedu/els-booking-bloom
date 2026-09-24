import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformLayout } from "./PlatformLayout";
import { platformApi } from "@/lib/platformApi";

const METHODS = ["ALL", "GET", "POST", "PATCH", "PUT", "DELETE"];
const STATUSES = ["ALL", "2xx", "3xx", "4xx", "5xx"];

const PlatformActivity = () => {
  const [studioId, setStudioId] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [previousCursors, setPreviousCursors] = useState<string[]>([]);
  const statusCode = status === "ALL" ? undefined : Number(`${status[0]}00`);
  const studiosQuery = useQuery({
    queryKey: ["platform", "studios"],
    queryFn: () => platformApi.listStudios(),
  });
  const activityQuery = useQuery({
    queryKey: ["platform", "activity", studioId, method, status, cursor],
    queryFn: () =>
      platformApi.listActivityLogs({
        limit: 50,
        ...(cursor ? { cursor } : {}),
        ...(studioId !== "ALL" ? { studioId } : {}),
        ...(method !== "ALL" ? { method } : {}),
        ...(statusCode !== undefined ? { statusCode } : {}),
      }),
  });

  const studioNames = useMemo(
    () => new Map((studiosQuery.data ?? []).map((studio) => [studio.id, studio.name])),
    [studiosQuery.data],
  );
  const resetPage = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCursor(undefined);
    setPreviousCursors([]);
  };
  const page = activityQuery.data;

  return (
    <PlatformLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
            <Activity className="h-6 w-6 text-primary" /> Platform activity
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            API request health across all studios. Business actions remain in the audit log.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={studioId} onValueChange={(value) => resetPage(setStudioId, value)}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All studios</SelectItem>
              {(studiosQuery.data ?? []).map((studio) => (
                <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={method} onValueChange={(value) => resetPage(setMethod, value)}>
            <SelectTrigger className="w-full sm:w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{METHODS.map((item) => <SelectItem key={item} value={item}>{item === "ALL" ? "All methods" : item}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => resetPage(setStatus, value)}>
            <SelectTrigger className="w-full sm:w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item === "ALL" ? "All status" : item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {activityQuery.isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : activityQuery.isError ? (
        <Card><CardContent className="py-12 text-center text-sm text-destructive">Could not load platform activity.</CardContent></Card>
      ) : !page?.data.length ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No API activity recorded yet.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {page.data.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-start gap-x-3 gap-y-2 px-4 py-3">
                <Badge variant={entry.statusCode >= 500 ? "destructive" : entry.statusCode >= 400 ? "secondary" : "outline"}>
                  {entry.statusCode}
                </Badge>
                <Badge variant="outline">{entry.method}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="break-all font-mono text-xs sm:text-sm">{entry.route}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.studioId ? studioNames.get(entry.studioId) ?? "Studio" : "Platform"}
                    {entry.actorRole ? ` · ${entry.actorRole.toLowerCase()}` : " · unauthenticated"}
                    {entry.actorId ? ` · ${entry.actorId}` : ""}
                    {` · ${entry.durationMs} ms`}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground" title={entry.userAgent ?? undefined}>
                    Request {entry.requestId}{entry.userAgent ? ` · ${entry.userAgent}` : ""}
                  </p>
                </div>
                <time className="text-xs text-muted-foreground" title={new Date(entry.createdAt).toLocaleString()}>
                  {format(new Date(entry.createdAt), "MMM d, HH:mm:ss")}
                </time>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={previousCursors.length === 0 || activityQuery.isFetching}
          onClick={() => {
            const prior = previousCursors[previousCursors.length - 1];
            setPreviousCursors((items) => items.slice(0, -1));
            setCursor(prior);
          }}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!page?.pagination.hasMore || activityQuery.isFetching}
          onClick={() => {
            if (!page?.pagination.nextCursor) return;
            setPreviousCursors((items) => [...items, cursor ?? ""]);
            setCursor(page.pagination.nextCursor);
          }}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </PlatformLayout>
  );
};

export default PlatformActivity;
