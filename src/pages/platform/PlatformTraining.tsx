import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { platformRequest } from "@/lib/platformApi";
import { PlatformLayout } from "./PlatformLayout";

interface Row {
  id: string;
  status: "NEW" | "SCHEDULED" | "DONE" | "DECLINED";
  preferredDate: string | null;
  location: string | null;
  notes: string | null;
  feeAmount: number | null;
  scheduledFor: string | null;
  createdAt: string;
  studio: { id: string; name: string; slug: string } | null;
}
interface Payload {
  data: Row[];
  settings: { liveUrl: string | null; liveNote: string | null };
}
const LABEL: Record<Row["status"], string> = { NEW: "New", SCHEDULED: "Scheduled", DONE: "Done", DECLINED: "Declined" };

/** Free live session details, and in-person training requests with their fees. */
const PlatformTraining = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["platform-training"], queryFn: () => platformRequest<Payload>("/training") });
  const [live, setLive] = useState<{ liveUrl: string; liveNote: string } | null>(null);
  const [edits, setEdits] = useState<Record<string, { fee?: string; date?: string }>>({});
  const refresh = () => qc.invalidateQueries({ queryKey: ["platform-training"] });
  const fail = (e: unknown) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Something went wrong" });

  const saveLive = useMutation({
    mutationFn: () => platformRequest("/training/settings", { method: "PATCH", body: live ?? {} }),
    onSuccess: () => { toast({ title: "Live session saved", description: "Every business sees it on their Learn page." }); refresh(); },
    onError: fail,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => platformRequest(`/training/${id}`, { method: "PATCH", body }),
    onSuccess: () => { toast({ title: "Updated", description: "The business has been told." }); refresh(); },
    onError: fail,
  });

  const s = live ?? { liveUrl: data?.settings.liveUrl ?? "", liveNote: data?.settings.liveNote ?? "" };

  return (
    <PlatformLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold"><GraduationCap className="h-6 w-6 text-primary" /> Training</h1>
        <p className="text-sm text-muted-foreground">Online training is free. In-person training is a request with a fee you set, added to the business's next bill.</p>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Free live online session</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="live-url">Join link (https)</Label>
            <Input id="live-url" value={s.liveUrl} placeholder="https://meet.google.com/…" onChange={(e) => setLive({ ...s, liveUrl: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="live-note">When it runs</Label>
            <Input id="live-note" value={s.liveNote} maxLength={200} placeholder="Every Tuesday at 4 pm" onChange={(e) => setLive({ ...s, liveNote: e.target.value })} />
          </div>
          <Button onClick={() => saveLive.mutate()} disabled={saveLive.isPending || !live}>
            {saveLive.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
          </Button>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">In-person requests</h2>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : !data?.data.length ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No requests yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.data.map((r) => {
            const e = edits[r.id] ?? {};
            return (
              <Card key={r.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{r.studio?.name ?? "Unknown"} <span className="text-xs font-normal text-muted-foreground">/{r.studio?.slug}</span></p>
                      <p className="text-sm text-muted-foreground">
                        {[r.preferredDate && `Prefers: ${r.preferredDate}`, r.location && `At: ${r.location}`].filter(Boolean).join(" · ") || "No details given"}
                      </p>
                      {r.notes && <p className="mt-1 text-sm">{r.notes}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">Asked {format(parseISO(r.createdAt), "d MMM yyyy")}</p>
                    </div>
                    <Select value={r.status} onValueChange={(status) => update.mutate({ id: r.id, body: { status } })}>
                      <SelectTrigger className="w-36" aria-label="Status"><SelectValue /></SelectTrigger>
                      <SelectContent>{(Object.keys(LABEL) as Row["status"][]).map((k) => <SelectItem key={k} value={k}>{LABEL[k]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      const body: Record<string, unknown> = {};
                      if (e.fee !== undefined && e.fee !== "") body.feeAmount = Number(e.fee);
                      if (e.date) { body.scheduledFor = e.date; if (r.status === "NEW") body.status = "SCHEDULED"; }
                      if (Object.keys(body).length) update.mutate({ id: r.id, body });
                    }}
                  >
                    <div className="space-y-1">
                      <Label htmlFor={`fee-${r.id}`} className="text-xs">Fee (GHS)</Label>
                      <Input id={`fee-${r.id}`} type="number" min={0} step="0.01" className="h-9 w-28" placeholder={r.feeAmount != null ? String(r.feeAmount) : "e.g. 300"} value={e.fee ?? ""} onChange={(ev) => setEdits({ ...edits, [r.id]: { ...e, fee: ev.target.value } })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`date-${r.id}`} className="text-xs">Date</Label>
                      <Input id={`date-${r.id}`} type="date" className="h-9 w-40" value={e.date ?? (r.scheduledFor ? r.scheduledFor.slice(0, 10) : "")} onChange={(ev) => setEdits({ ...edits, [r.id]: { ...e, date: ev.target.value } })} />
                    </div>
                    <Button type="submit" size="sm" variant="outline" disabled={update.isPending}>Save and tell them</Button>
                    {r.feeAmount != null && <span className="text-xs text-muted-foreground">{r.feeAmount > 0 ? `Fee GHS ${r.feeAmount.toFixed(2)}` : "Free"}</span>}
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PlatformLayout>
  );
};

export default PlatformTraining;
