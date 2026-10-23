import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ArrowRight, Landmark, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { studioMoneyApi } from "@/lib/api";
import { formatGHS } from "@/lib/currency";

// Paystack's Mobile Money codes, in the words people use.
const PROVIDER: Record<string, string> = {
  MTN: "MTN Mobile Money",
  VOD: "Telecel Cash",
  ATL: "AirtelTigo Money",
  TGO: "AirtelTigo Money",
};

const day = (iso: string | null | undefined) => (iso ? format(parseISO(iso), "EEE d MMM") : null);

const Figure = ({ label, value, note }: { label: string; value: string; note?: string | null }) => (
  <div className="min-w-0">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
  </div>
);

/**
 * Where the studio's money is: what customers paid, what Paystack has sent to
 * the studio's own account, and what's on the way. Shown near the top of the
 * dashboard, because it's the first thing an owner wants to know.
 */
export const YourMoneyCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["studio-money"],
    queryFn: () => studioMoneyApi.get(),
    staleTime: 60_000,
  });

  const account = data?.payoutAccount;
  const accountName = account
    ? `${(account.provider && PROVIDER[account.provider]) || account.provider || "your account"}${account.number ? ` ${account.number}` : ""}`
    : null;
  const AccountIcon = account?.type === "bank" ? Landmark : Smartphone;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base">Your money</CardTitle>
        <Link to="/admin/transactions" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          All transactions <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Loader2 className="mx-auto my-6 h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-3 sm:divide-x">
              <Figure
                label="Received this month"
                value={formatGHS(data.received.thisMonth)}
                note={`${formatGHS(data.received.allTime)} all time${data.received.refunded ? ` · ${formatGHS(data.received.refunded)} refunded` : ""}`}
              />
              <div className="sm:pl-5">
                <Figure
                  label="Paid out to you"
                  value={data.payouts ? formatGHS(data.payouts.paidOut) : "—"}
                  note={
                    data.payouts?.last
                      ? `Last: ${formatGHS(data.payouts.last.amount)} on ${day(data.payouts.last.date)}`
                      : data.payouts
                        ? "No payouts yet"
                        : null
                  }
                />
              </div>
              <div className="sm:pl-5">
                <Figure
                  label="On its way"
                  value={data.payouts ? formatGHS(data.payouts.onTheWay) : "—"}
                  note={
                    data.payouts?.next
                      ? `Next payout ${day(data.payouts.next.date) ?? "soon"}`
                      : data.payouts
                        ? "Nothing waiting"
                        : null
                  }
                />
              </div>
            </div>

            {account ? (
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <AccountIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <p className="text-muted-foreground">
                  Customer payments go to your Paystack account, and Paystack sends them to{" "}
                  <span className="font-medium text-foreground">{accountName}</span>
                  {account.name ? ` (${account.name})` : ""}, usually the next working day, after
                  its fee.
                  {data.commissionPercent ? ` Zuri Studios keeps ${data.commissionPercent}% of each payment.` : ""}
                  {data.payoutsError ? " We couldn't load your payouts from Paystack just now; refresh to try again." : ""}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-sm">
                <p className="text-muted-foreground">
                  Add the Mobile Money or bank account you want to be paid into, so customers can
                  pay you online.
                </p>
                <Button size="sm" asChild>
                  <Link to="/admin/payments">Add payout account</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
