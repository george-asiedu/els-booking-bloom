import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/apiClient";

interface Delivery {
  orderNumber: string;
  shop: string;
  customerName: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  eta: string | null;
  items: { name: string; quantity: number; size: string | null; color: string | null }[];
  status: string;
  failedReason: string | null;
}

const errText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Try again.");

/** The rider's page, opened from the link the shop sends. No account needed. */
const RiderDelivery = () => {
  const { token = "" } = useParams();
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");
  const [failing, setFailing] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["delivery", token],
    queryFn: async () => (await apiRequest<{ data: Delivery }>(`/delivery/${token}`)).data,
    retry: false,
  });
  const delivered = useMutation({
    mutationFn: () => apiRequest<{ message: string }>(`/delivery/${token}/delivered`, { method: "POST", body: { code } }),
    onSuccess: (r) => setDone(r.message),
  });
  const failed = useMutation({
    mutationFn: () => apiRequest<{ message: string }>(`/delivery/${token}/failed`, { method: "POST", body: { reason } }),
    onSuccess: (r) => setDone(r.message),
  });

  if (isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (error || !data)
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This link no longer works</h1>
        <p className="mt-2 text-muted-foreground">{errText(error)}. Ask the shop for a new link.</p>
      </main>
    );

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-8">
      <header>
        <p className="text-sm text-muted-foreground">{data.shop}</p>
        <h1 className="text-2xl font-semibold">Delivery for order {data.orderNumber}</h1>
        {data.eta && <p className="mt-1 text-sm">Expected: {data.eta}</p>}
      </header>

      {done ? (
        <section className="rounded-2xl border border-border p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="mt-3 font-medium">{done}</p>
        </section>
      ) : (
        <>
          <section className="space-y-3 rounded-2xl border border-border p-4">
            <p className="font-medium">{data.customerName ?? "Customer"}</p>
            {data.address && (
              <a className="flex gap-2 text-sm underline-offset-4 hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`} target="_blank" rel="noreferrer">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {data.address}
              </a>
            )}
            {data.note && <p className="rounded-lg bg-muted px-3 py-2 text-sm">Note: {data.note}</p>}
            {data.phone && (
              <Button asChild variant="outline" className="w-full">
                <a href={`tel:${data.phone}`}><Phone className="mr-2 h-4 w-4" /> Call {data.phone}</a>
              </Button>
            )}
          </section>

          <section className="rounded-2xl border border-border p-4">
            <h2 className="font-medium">In the bag</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {data.items.map((i, n) => (
                <li key={n}>{i.quantity} × {i.name}{[i.size, i.color].filter(Boolean).length ? ` (${[i.size, i.color].filter(Boolean).join(", ")})` : ""}</li>
              ))}
            </ul>
          </section>

          {!failing ? (
            <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); delivered.mutate(); }}>
              <Label htmlFor="code">Customer's 4-digit code</Label>
              <Input id="code" inputMode="numeric" maxLength={4} placeholder="0000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="h-12 text-center text-lg tracking-[0.5em]" />
              {delivered.error && <p className="text-sm text-destructive" role="alert">{errText(delivered.error)}</p>}
              <Button type="submit" className="h-12 w-full" disabled={code.length !== 4 || delivered.isPending}>
                {delivered.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm delivered
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setFailing(true)}>Couldn't deliver</Button>
            </form>
          ) : (
            <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); failed.mutate(); }}>
              <Label htmlFor="reason">What happened?</Label>
              <Textarea id="reason" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer not answering, wrong address" />
              {failed.error && <p className="text-sm text-destructive" role="alert">{errText(failed.error)}</p>}
              <Button type="submit" variant="destructive" className="w-full" disabled={failed.isPending}>
                {failed.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Report to the shop
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setFailing(false)}>Back</Button>
            </form>
          )}
        </>
      )}
    </main>
  );
};

export default RiderDelivery;
