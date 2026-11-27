import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarPlus, Check, ExternalLink, GraduationCap, Loader2, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading, Panel } from "@/components/dashboard/KpiTile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStudio } from "@/hooks/useStudio";
import { apiRequest } from "@/lib/apiClient";
import { formatGHS } from "@/lib/currency";
import { learnModules as modules, type Step } from "@/lib/learnSteps";
import { downloadIcs } from "@/lib/calendarFile";

interface TrainingRequest {
  id: string;
  status: "NEW" | "SCHEDULED" | "DONE" | "DECLINED";
  preferredDate: string | null;
  scheduledFor: string | null;
  feeAmount: number | null;
  createdAt: string;
}
interface Info {
  liveUrl: string | null;
  liveNote: string | null;
  // The next session (null when none is set or it has passed).
  liveAt: string | null;
  liveMinutes: number;
  liveReserved: boolean;
  googleCalendarUrl: string | null;
  requests: TrainingRequest[];
}

/** Free online training for every business, and a way to ask for in-person training. */
const AdminLearn = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { features } = useStudio();
  const [form, setForm] = useState({ preferredDate: "", location: "", notes: "" });
  const [asking, setAsking] = useState(false);
  // A step is only crossed out when the API finds the work on this account.
  const steps = useQuery({
    queryKey: ["training-steps"],
    queryFn: async () =>
      (await apiRequest<{ data: Record<string, { done: boolean; missing: string }> }>("/training/steps", { auth: true })).data,
  });
  const [checking, setChecking] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const verify = async (step: Step) => {
    setChecking(step.id);
    try {
      const fresh = (await steps.refetch()).data;
      const r = fresh?.[step.id];
      if (r?.done) toast({ title: "Well done", description: step.text });
      else toast({ variant: "destructive", title: "Not finished yet", description: r?.missing ?? "We could not find this on your account yet." });
    } finally {
      setChecking(null);
    }
  };
  const isDone = (id: string) => Boolean(steps.data?.[id]?.done);

  const info = useQuery({ queryKey: ["training"], queryFn: async () => (await apiRequest<{ data: Info }>("/training", { auth: true })).data });
  const request = useMutation({
    mutationFn: () => apiRequest<{ message: string }>("/training/requests", { method: "POST", auth: true, body: form }),
    onSuccess: (r) => {
      toast({ title: "Request sent", description: r.message });
      setAsking(false);
      setForm({ preferredDate: "", location: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["training"] });
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't send the request" }),
  });

  const reserve = useMutation({
    mutationFn: () => apiRequest<{ message: string }>("/training/live/reserve", { method: "POST", auth: true }),
    onSuccess: (r) => {
      toast({ title: "Spot reserved", description: r.message });
      qc.invalidateQueries({ queryKey: ["training"] });
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't reserve your spot" }),
  });
  const cancelSpot = useMutation({
    mutationFn: () => apiRequest<{ message: string }>("/training/live/reserve", { method: "DELETE", auth: true }),
    onSuccess: () => {
      toast({ title: "Your spot was cancelled" });
      qc.invalidateQueries({ queryKey: ["training"] });
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't cancel" }),
  });

  const list = modules(Boolean(features?.commerce), features?.booking !== false);
  const total = list.reduce((s, m) => s + m.steps.length, 0);
  const finished = list.reduce((s, m) => s + m.steps.filter((st) => isDone(st.id)).length, 0);
  const data = info.data;

  return (
    <AdminLayout>
      <DashboardHeading
        title="Learn Zuri"
        subtitle="Free online training so you can run everything yourself. Work through the steps in your own time, join a live session, or ask for someone to train you in person."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Your progress</h2>
              <span className="text-sm tabular-nums text-muted-foreground">{finished} of {total} steps</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={finished} aria-valuemin={0} aria-valuemax={total} aria-label="Training progress">
              <div className="h-full rounded-full bg-primary" style={{ width: `${total ? (finished / total) * 100 : 0}%` }} />
            </div>
          </Panel>

          {list.map((m) => (
            <Panel key={m.title}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold">{m.title}</h2>
                <span className="text-xs text-muted-foreground">about {m.minutes} min</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.why}</p>
              <ul className="mt-3 space-y-3">
                {m.steps.map((s) => {
                  const done = isDone(s.id);
                  return (
                    <li key={s.id} className="flex items-start gap-3 text-sm">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={`Check this step: ${s.text}`}
                        disabled={checking === s.id}
                        onClick={() => (done ? undefined : verify(s))}
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${done ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                      >
                        {checking === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : null}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button type="button" className={`text-left font-medium ${done ? "text-muted-foreground line-through" : ""}`} onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>
                          {s.text}
                        </button>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.what}</p>
                        {open === s.id && !done && (
                          <div className="mt-2 rounded-lg bg-muted/50 p-3 text-xs">
                            <p><span className="font-medium">What to do:</span> {s.doThis}</p>
                            {s.to && <Link to={s.to} className="mt-1.5 inline-block font-medium text-primary underline-offset-4 hover:underline">Take me there</Link>}
                            <p className="mt-1.5 text-muted-foreground">Then tick the box. We check your account, and it is only crossed out when the work is really there.</p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
        </div>

        <div className="space-y-4">
          <Panel>
            <h2 className="flex items-center gap-2 font-semibold"><Video className="h-4 w-4" /> Live online session</h2>
            <p className="mt-1 text-sm text-muted-foreground">Free for everyone. Bring your questions and follow along.</p>
            {info.isLoading ? (
              <Loader2 className="mt-3 h-5 w-5 animate-spin text-muted-foreground" />
            ) : data?.liveUrl || data?.liveAt ? (
              <>
                {data.liveAt && (
                  <p className="mt-3 text-sm font-semibold">
                    {format(parseISO(data.liveAt), "EEEE d MMMM, h:mm a")}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">(your time)</span>
                  </p>
                )}
                {data.liveNote && <p className="mt-1 text-sm font-medium">{data.liveNote}</p>}
                {data.liveAt &&
                  (data.liveReserved ? (
                    <div className="mt-3 space-y-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
                      <p className="flex items-center gap-1.5 text-sm font-medium"><Check className="h-4 w-4 text-emerald-600" /> Your spot is reserved</p>
                      <p className="text-xs text-muted-foreground">We emailed you a calendar invite and sent a notification.</p>
                      <div className="flex flex-wrap gap-2">
                        {data.googleCalendarUrl && (
                          <Button asChild size="sm" variant="outline">
                            <a href={data.googleCalendarUrl} target="_blank" rel="noreferrer"><CalendarPlus className="mr-1.5 h-4 w-4" /> Google Calendar</a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadIcs({
                              title: "Zuri live training",
                              start: parseISO(data.liveAt as string),
                              minutes: data.liveMinutes,
                              description: `Free live online training with Zuri.${data.liveNote ? ` ${data.liveNote}` : ""}`,
                              url: data.liveUrl,
                              fileName: "zuri-live-training.ics",
                            })
                          }
                        >
                          <CalendarPlus className="mr-1.5 h-4 w-4" /> Apple / Outlook
                        </Button>
                        <Button size="sm" variant="ghost" disabled={cancelSpot.isPending} onClick={() => cancelSpot.mutate()}>Cancel my spot</Button>
                      </div>
                    </div>
                  ) : (
                    <Button className="mt-3 w-full" disabled={reserve.isPending} onClick={() => reserve.mutate()}>
                      {reserve.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />} Reserve my spot
                    </Button>
                  ))}
                {data.liveUrl && (
                  <Button asChild variant={data.liveAt ? "outline" : "default"} className="mt-3 w-full">
                    <a href={data.liveUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Join the session</a>
                  </Button>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">The next session will be posted here. Meanwhile the steps on the left cover the same ground.</p>
            )}
          </Panel>

          <Panel>
            <h2 className="flex items-center gap-2 font-semibold"><GraduationCap className="h-4 w-4" /> In-person training</h2>
            <p className="mt-1 text-sm text-muted-foreground">Someone sits with you and your team. This one has a fee: we tell you the amount first, and it's added to your next renewal.</p>
            {!asking ? (
              <Button variant="outline" className="mt-3 w-full" onClick={() => setAsking(true)}>Ask for in-person training</Button>
            ) : (
              <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); request.mutate(); }}>
                <div className="space-y-1.5">
                  <Label htmlFor="tr-date">When would suit you?</Label>
                  <Input id="tr-date" value={form.preferredDate} maxLength={80} placeholder="e.g. a weekday morning next week" onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tr-loc">Where?</Label>
                  <Input id="tr-loc" value={form.location} maxLength={200} placeholder="Your shop or studio address" onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tr-notes">Anything you want to focus on?</Label>
                  <Textarea id="tr-notes" rows={3} value={form.notes} maxLength={500} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={request.isPending}>{request.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send request</Button>
                  <Button type="button" variant="ghost" onClick={() => setAsking(false)}>Cancel</Button>
                </div>
              </form>
            )}
            {!!data?.requests.length && (
              <ul className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
                {data.requests.map((r) => (
                  <li key={r.id}>
                    <p className="font-medium">
                      {r.status === "NEW" ? "Waiting for us" : r.status === "SCHEDULED" ? "Scheduled" : r.status === "DONE" ? "Done" : "Not available"}
                      {r.scheduledFor && ` · ${format(parseISO(r.scheduledFor), "EEE d MMM")}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.feeAmount != null ? (r.feeAmount > 0 ? `Fee ${formatGHS(r.feeAmount)}, on your next renewal` : "No fee") : "Fee to be confirmed"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLearn;
