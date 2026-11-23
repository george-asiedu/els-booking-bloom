import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";
import { formatGHS } from "@/lib/currency";
import { processingFeeFor } from "@/lib/fees";
import { cn } from "@/lib/utils";

type Payer = "CUSTOMER" | "BUSINESS";
interface FeeSettings {
  payer: Payer;
  feePercent: number;
}

const EXAMPLE = 200;

/**
 * Who pays Paystack's processing fee on customer payments: the customer (added
 * at checkout) or the business (taken from what it receives). Shown with a
 * worked example so the choice is concrete.
 */
export const FeePayerCard = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["fee-payer"],
    queryFn: async () => (await apiRequest<{ data: FeeSettings }>("/studio/fee-payer", { auth: true })).data,
  });
  const save = useMutation({
    mutationFn: async (payer: Payer) =>
      (await apiRequest<{ data: FeeSettings }>("/studio/fee-payer", { method: "PUT", auth: true, body: { payer } })).data,
    onSuccess: (d) => {
      qc.setQueryData(["fee-payer"], d);
      // Checkout reads it from the studio's public settings.
      qc.invalidateQueries({ queryKey: ["studio-config"] });
      toast({
        title: "Saved",
        description: d.payer === "CUSTOMER" ? "Customers now pay the processing fee at checkout." : "Your business now pays the processing fee.",
      });
    },
    onError: (e) => toast({ variant: "destructive", title: "Couldn't save", description: e instanceof Error ? e.message : undefined }),
  });

  const pct = data?.feePercent ?? 1.95;
  const customerFee = processingFeeFor(EXAMPLE, { customerPaysFee: true, processingFeePercent: pct });
  const businessFee = Math.round(EXAMPLE * pct) / 100;
  const options: { key: Payer; title: string; text: string; customerPays: number; youGet: number }[] = [
    {
      key: "CUSTOMER",
      title: "Customers pay it",
      text: "The fee is added at checkout as a separate line. You receive the full price.",
      customerPays: EXAMPLE + customerFee,
      youGet: EXAMPLE,
    },
    {
      key: "BUSINESS",
      title: "My business pays it",
      text: "Customers pay exactly the price. The fee comes out of what you receive.",
      customerPays: EXAMPLE,
      youGet: EXAMPLE - businessFee,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5 text-primary" />
          Payment processing fee
        </CardTitle>
        <CardDescription>
          Paystack charges {pct}% on each online payment. Choose who pays it. The example is a {formatGHS(EXAMPLE)} sale, before the platform's commission.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <div role="radiogroup" aria-label="Who pays the processing fee" className="grid gap-3 sm:grid-cols-2">
            {options.map((o) => {
              const on = data?.payer === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={save.isPending}
                  onClick={() => !on && save.mutate(o.key)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    on ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", on ? "border-primary" : "border-muted-foreground/50")}>
                      {on && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="font-medium">{o.title}</span>
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground">{o.text}</span>
                  <span className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-lg bg-muted px-2.5 py-2">
                      <span className="block text-muted-foreground">Customer pays</span>
                      <span className="block font-semibold tabular-nums text-foreground">{formatGHS(o.customerPays)}</span>
                    </span>
                    <span className="rounded-lg bg-muted px-2.5 py-2">
                      <span className="block text-muted-foreground">You receive</span>
                      <span className="block font-semibold tabular-nums text-foreground">{formatGHS(o.youGet)}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
