import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, Clock, Loader2, Mail, Play, RefreshCw, Timer } from "lucide-react";
import { PlatformLayout } from "./PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { platformApi, type ScheduledJobDTO } from "@/lib/platformApi";

const ago = (iso: string | null) =>
  iso ? `${formatDistanceToNowStrict(new Date(iso))} ago` : "never";
const until = (iso: string | null) => {
  if (!iso) return null;
  const at = new Date(iso);
  return at.getTime() <= Date.now() ? "any moment now" : `in ${formatDistanceToNowStrict(at)}`;
};
const duration = (ms: number | null) =>
  ms === null ? null : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;

// "expiringSoon" → "Expiring soon"
const humanize = (key: string) => {
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** The numbers worth showing from a run's result, e.g. "Sent 3 · Skipped 1". */
const resultSummary = (result: Record<string, unknown> | null) => {
  if (!result) return [];
  return Object.entries(result).flatMap(([k, v]) => {
    if (typeof v === "number") return [{ label: humanize(k), value: v }];
    if (Array.isArray(v) && k === "errors") return [{ label: "Errors", value: v.length }];
    return [];
  });
};

const StatusLine = ({ job }: { job: ScheduledJobDTO }) => {
  if (job.running) {
    return (
      <span className="inline-flex items-center gap-1.5 text-primary">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Running now (started {ago(job.lastStartedAt)})
      </span>
    );
  }
  if (job.interrupted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        Last run was interrupted {ago(job.lastStartedAt)}. The server likely restarted mid-run.
      </span>
    );
  }
  if (!job.lastStatus) return <span>Hasn't run yet.</span>;
  const who = job.lastTrigger?.startsWith("manual:")
    ? ` (started by ${job.lastTrigger.slice("manual:".length)})`
    : "";
  return (
    <span>
      Last ran {ago(job.lastFinishedAt ?? job.lastStartedAt)}
      {who}
      {job.lastDurationMs !== null && <> · took {duration(job.lastDurationMs)}</>}
    </span>
  );
};

const JobCard = ({ job }: { job: ScheduledJobDTO }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const refresh = () => qc.invalidateQueries({ queryKey: ["platform-jobs"] });
  const onError = (error: Error) =>
    toast({ variant: "destructive", title: "That didn't work", description: error.message });

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => platformApi.setJobEnabled(job.key, enabled),
    onSuccess: (updated) => {
      toast({
        title: updated.enabled ? `${updated.label} is on` : `${updated.label} is paused`,
        description: updated.enabled
          ? "It will run on its usual schedule."
          : "It won't run until you switch it back on. You can still run it by hand.",
      });
      refresh();
    },
    onError,
  });

  const run = useMutation({
    mutationFn: () => platformApi.runJob(job.key),
    onSuccess: () => {
      toast({ title: `${job.label} started`, description: "Results appear here when it finishes." });
      refresh();
    },
    onError,
  });

  const summary = resultSummary(job.lastResult);
  const next = until(job.nextRunAt);

  return (
    <Card className={job.enabled ? undefined : "bg-muted/40"}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{job.label}</h2>
              {!job.enabled && <Badge variant="secondary">Paused</Badge>}
              {job.lastStatus === "FAILED" && !job.running && (
                <Badge variant="destructive">Last run failed</Badge>
              )}
            </div>
            <p className="max-w-prose text-sm text-muted-foreground">{job.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor={`job-${job.key}`} className="text-sm text-muted-foreground">
              {job.enabled ? "On" : "Off"}
            </label>
            <Switch
              id={`job-${job.key}`}
              checked={job.enabled}
              disabled={toggle.isPending}
              onCheckedChange={(v) => toggle.mutate(v)}
            />
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            {job.schedule} (UTC)
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Timer className="h-4 w-4 shrink-0" aria-hidden />
            {job.enabled ? `Next run ${next}` : "Won't run while paused"}
          </p>
        </div>

        <div className="rounded-md border bg-background/60 p-3 text-sm">
          <StatusLine job={job} />
          {summary.length > 0 && !job.running && (
            <p className="mt-1.5 tabular-nums text-muted-foreground">
              {summary.map((s) => `${s.label} ${s.value}`).join(" · ")}
            </p>
          )}
          {job.lastStatus === "FAILED" && job.lastError && !job.running && (
            <p className="mt-1.5 break-words text-destructive">{job.lastError}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            {job.runCount} runs · {job.failureCount} failed
            {job.updatedBy && <> · last changed by {job.updatedBy}</>}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={job.running || run.isPending}
            onClick={() => run.mutate()}
          >
            {run.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const EmailQueuePanel = () => {
  // Every refresh costs a few Redis commands, so this loads on demand rather
  // than on a timer.
  const query = useQuery({
    queryKey: ["platform-queues"],
    queryFn: () => platformApi.queues(),
    staleTime: Infinity,
  });
  const q = query.data?.data;
  const counts = q?.email?.counts;
  const failures = q?.email?.recentFailures ?? [];

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Mail className="h-4 w-4" aria-hidden />
            Email queue
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        {query.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : !q?.enabled ? (
          <p className="text-sm text-muted-foreground">
            No Redis is configured, so emails are sent straight away instead of being queued.
          </p>
        ) : (
          <>
            <p className="text-sm tabular-nums text-muted-foreground">
              {counts?.waiting ?? 0} waiting · {counts?.active ?? 0} sending ·{" "}
              {counts?.delayed ?? 0} retrying later · {counts?.failed ?? 0} failed
            </p>
            {failures.length > 0 && (
              <ul className="space-y-1">
                {failures.slice(0, 5).map((f, i) => (
                  <li key={f.id ?? i} className="truncate text-xs text-destructive" title={f.failedReason}>
                    {f.failedReason ?? "Unknown failure"}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const PlatformJobs = () => {
  const jobsQuery = useQuery({
    queryKey: ["platform-jobs"],
    queryFn: () => platformApi.jobs(),
    // Watch closely while something is running, otherwise check in now and then.
    refetchInterval: (query) =>
      query.state.data?.some((j) => j.running) ? 5_000 : 60_000,
  });
  const jobs = jobsQuery.data ?? [];

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-semibold">Background jobs</h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            The work that happens on a timer. Pausing a job stops its schedule, nothing else.
            Run now still works while a job is paused.
          </p>
        </div>

        {jobsQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : jobsQuery.isError ? (
          <Card>
            <CardContent className="p-5 text-sm text-destructive">
              Couldn't load jobs: {(jobsQuery.error as Error).message}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard key={job.key} job={job} />
            ))}
          </div>
        )}

        <EmailQueuePanel />
      </div>
    </PlatformLayout>
  );
};

export default PlatformJobs;
