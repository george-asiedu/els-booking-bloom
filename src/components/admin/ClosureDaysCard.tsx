import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarOff, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";

interface Closure {
  id: string;
  date: string;
  reason: string | null;
}

/** One-off days the studio is closed (holidays, training), on top of its weekly hours. */
export const ClosureDaysCard = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: closures = [], isLoading } = useQuery({
    queryKey: ["closures"],
    queryFn: async () => (await apiRequest<{ data: Closure[] }>("/business-hours/closures")).data,
  });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const add = useMutation({
    mutationFn: () => apiRequest<{ message: string }>("/business-hours/closures", { method: "POST", auth: true, body: { from, to: to || from, reason } }),
    onSuccess: (r) => {
      toast({ title: r.message, description: "Customers can't book those days." });
      setFrom("");
      setTo("");
      setReason("");
      qc.invalidateQueries({ queryKey: ["closures"] });
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't add it" }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiRequest(`/business-hours/closures/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["closures"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarOff className="h-5 w-5 text-primary" />
          Closed days
        </CardTitle>
        <CardDescription>Holidays and other days you're closed. Customers can't book them.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cl-from">From</Label>
            <Input id="cl-from" type="date" value={from} min={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-to">To (optional)</Label>
            <Input id="cl-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-reason">Reason (shown to customers)</Label>
            <Input id="cl-reason" maxLength={80} placeholder="e.g. Christmas" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button type="submit" disabled={!from || add.isPending}>
            {add.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add
          </Button>
        </form>
        {isLoading ? null : closures.length === 0 ? (
          <p className="text-sm text-muted-foreground">No closed days coming up.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            {closures.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>
                  {format(parseISO(c.date), "EEEE d MMMM yyyy")}
                  {c.reason && <span className="text-muted-foreground"> · {c.reason}</span>}
                </span>
                <Button variant="ghost" size="icon" aria-label="Remove closed day" onClick={() => remove.mutate(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
