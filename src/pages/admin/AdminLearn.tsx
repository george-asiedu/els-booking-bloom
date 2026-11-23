import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Check, ExternalLink, GraduationCap, Loader2, Video } from "lucide-react";
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
  requests: TrainingRequest[];
}

interface Module {
  title: string;
  minutes: number;
  why: string;
  steps: { text: string; to?: string }[];
}

// The free online course: short, in the order a new business needs it.
const modules = (shop: boolean, bookings: boolean): Module[] => [
  {
    title: "Make it yours",
    minutes: 10,
    why: "Customers should see your name, colours and photos from the first visit.",
    steps: [
      { text: "Add your logo and pick your colours", to: "/admin/appearance" },
      { text: "Fill in your contact details and opening hours", to: "/admin/contact" },
      ...(bookings ? [{ text: "Set the days and hours you take bookings", to: "/admin/hours" }] : []),
    ],
  },
  ...(bookings
    ? [
        {
          title: "Add what you offer",
          minutes: 15,
          why: "Customers can only book what's listed, with a price and how long it takes.",
          steps: [
            { text: "Add your services with price and duration", to: "/admin/services" },
            { text: "Add your team if you have more than one person", to: "/admin/staff" },
            { text: "Upload photos of your work to the gallery", to: "/admin/gallery" },
          ],
        },
      ]
    : []),
  ...(shop
    ? [
        {
          title: "Set up your shop",
          minutes: 15,
          why: "Products need photos, prices and stock so customers can order with confidence.",
          steps: [
            { text: "Add your products with photos, sizes and colours", to: "/admin/products" },
            { text: "Choose pickup or delivery, and set delivery areas and times", to: "/admin/commerce" },
            { text: "Try a coupon or schedule a sale", to: "/admin/sales" },
          ],
        },
      ]
    : []),
  {
    title: "Get paid",
    minutes: 10,
    why: "Money goes straight to your own account. Set it up once and it just works.",
    steps: [
      { text: "Connect your payout account", to: "/admin/payments" },
      { text: "Decide whether customers or you cover the card and Mobile Money fee", to: "/admin/payments" },
      { text: "Bill a walk-in with a payment link and QR code", to: "/admin/bills" },
    ],
  },
  {
    title: "Run your day",
    minutes: 10,
    why: "Know what's coming, move orders along and tell customers without typing messages.",
    steps: [
      ...(bookings ? [{ text: "Confirm bookings and use the calendar", to: "/admin/appointments" }] : []),
      ...(shop ? [{ text: "Move an order from paid to delivered", to: "/admin/orders" }] : []),
      { text: "Turn on notifications on your phone and install the app", to: "/admin/security" },
      { text: "Check what's selling in Analytics", to: "/admin/analytics" },
    ],
  },
];

/** Free online training for every business, and a way to ask for in-person training. */
const AdminLearn = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { features } = useStudio();
  const [form, setForm] = useState({ preferredDate: "", location: "", notes: "" });
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("zuri-learn") ?? "{}");
    } catch {
      return {};
    }
  });
  const mark = (key: string) => {
    const next = { ...done, [key]: !done[key] };
    setDone(next);
    try {
      localStorage.setItem("zuri-learn", JSON.stringify(next));
    } catch {
      /* private mode: progress just isn't remembered */
    }
  };

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

  const list = modules(Boolean(features?.commerce), features?.booking !== false);
  const total = list.reduce((s, m) => s + m.steps.length, 0);
  const finished = list.reduce((s, m, i) => s + m.steps.filter((_, j) => done[`${i}-${j}`]).length, 0);
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

          {list.map((m, i) => (
            <Panel key={m.title}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold">{m.title}</h2>
                <span className="text-xs text-muted-foreground">about {m.minutes} min</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.why}</p>
              <ul className="mt-3 space-y-2">
                {m.steps.map((s, j) => {
                  const key = `${i}-${j}`;
                  return (
                    <li key={key} className="flex items-start gap-3 text-sm">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={Boolean(done[key])}
                        aria-label={`Mark done: ${s.text}`}
                        onClick={() => mark(key)}
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${done[key] ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                      >
                        {done[key] && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <span className={done[key] ? "text-muted-foreground line-through" : ""}>
                        {s.to ? <Link to={s.to} className="underline-offset-4 hover:underline">{s.text}</Link> : s.text}
                      </span>
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
            ) : data?.liveUrl ? (
              <>
                {data.liveNote && <p className="mt-3 text-sm font-medium">{data.liveNote}</p>}
                <Button asChild className="mt-3 w-full">
                  <a href={data.liveUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Join the session</a>
                </Button>
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
