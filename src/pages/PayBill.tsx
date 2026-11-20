import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/apiClient";
import { formatGHS } from "@/lib/currency";

interface PublicBill {
  number: string;
  business: string;
  customerName: string;
  customerEmail: string | null;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  processingFee: number;
  note: string | null;
  status: "UNPAID" | "PAID" | "VOID";
  paidAt: string | null;
}

/** Where a walk-in lands from the link or QR code on their bill. */
const PayBill = () => {
  const { token = "" } = useParams();
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref") ?? "";
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const bill = useQuery({
    queryKey: ["pay-bill", token],
    queryFn: async () => (await apiRequest<{ data: PublicBill }>(`/bills/pay/${token}`)).data,
    retry: false,
  });
  // Back from Paystack: check the payment, then show the receipt.
  const verify = useMutation({
    mutationFn: () => apiRequest(`/bills/pay/${token}/verify?reference=${encodeURIComponent(reference)}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ["pay-bill", token] }),
  });
  useEffect(() => {
    if (reference && bill.data?.status === "UNPAID" && !verify.isPending && !verify.isSuccess && !verify.isError) verify.mutate();
  }, [reference, bill.data?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = useMutation({
    mutationFn: async () =>
      (await apiRequest<{ data: { authorizationUrl: string } }>(`/bills/pay/${token}/start`, { method: "POST", body: { email: email || undefined } })).data,
    onSuccess: (d) => window.location.assign(d.authorizationUrl),
  });

  const b = bill.data;
  if (bill.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!b)
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This payment link isn't valid</h1>
        <p className="mt-2 text-muted-foreground">Check the link or ask the business for a new one.</p>
      </main>
    );

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-8">
      <header>
        <p className="text-sm text-muted-foreground">{b.business}</p>
        <h1 className="text-2xl font-semibold">Bill {b.number}</h1>
        <p className="text-sm text-muted-foreground">For {b.customerName}</p>
      </header>

      <section className="rounded-2xl border border-border p-4">
        <ul className="space-y-2 text-sm">
          {b.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4">
              <span>{i.name}{i.quantity > 1 && <span className="text-muted-foreground"> × {i.quantity}</span>}</span>
              <span className="tabular-nums">{formatGHS(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        {b.note && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">{b.note}</p>}
        {b.status === "UNPAID" && b.processingFee > 0 && (
          <p className="mt-3 flex justify-between text-sm text-muted-foreground"><span>Payment processing fee</span><span className="tabular-nums">{formatGHS(b.processingFee)}</span></p>
        )}
        <p className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-semibold">
          <span>{b.status === "PAID" ? "Total paid" : "Total"}</span>
          <span className="tabular-nums">{formatGHS(b.total + (b.status === "UNPAID" ? b.processingFee : 0))}</span>
        </p>
      </section>

      {b.status === "PAID" ? (
        <section className="rounded-2xl border border-border p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="mt-3 font-medium">Paid. Thank you!</p>
          <p className="text-sm text-muted-foreground">A receipt is on its way to your email.</p>
        </section>
      ) : b.status === "VOID" ? (
        <p className="rounded-2xl border border-border p-4 text-center text-sm text-muted-foreground">This bill was cancelled. Please ask {b.business} for a new one.</p>
      ) : (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); pay.mutate(); }}>
          {verify.isPending && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking your payment…</p>}
          {verify.isError && <p className="text-sm text-destructive" role="alert">{verify.error instanceof Error ? verify.error.message : "We couldn't confirm your payment yet."} You can try paying again below.</p>}
          {!b.customerEmail && (
            <div className="space-y-1.5">
              <Label htmlFor="pay-email">Your email, for the receipt</Label>
              <Input id="pay-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
          )}
          {pay.isError && <p className="text-sm text-destructive" role="alert">{pay.error instanceof Error ? pay.error.message : "Couldn't start the payment."}</p>}
          <Button type="submit" className="h-12 w-full" disabled={pay.isPending}>
            {pay.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay {formatGHS(b.total + b.processingFee)}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Pay by Mobile Money or card, secured by Paystack.</p>
        </form>
      )}
    </main>
  );
};

export default PayBill;
