import { Link } from "react-router-dom";
import { useCursorPages } from "@/hooks/useCursorPages";
import { LoadMore } from "@/components/LoadMore";
import { format } from "date-fns";
import { Copy, Gift, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabEmpty } from "@/components/dashboard/StatusTabs";
import { useToast } from "@/hooks/use-toast";
import { vouchersApi, type MyVoucherDTO } from "@/lib/api/vouchers";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** The customer's gift cards and packages, with codes to copy and what's left. */
export const GiftCardsTab = ({ booking }: { booking: boolean }) => {
  const { toast } = useToast();
  const vouchersQuery = useCursorPages({
    queryKey: ["my-vouchers"],
    queryFn: ({ pageParam }) => vouchersApi.minePage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  });
  const data = vouchersQuery.data?.pages.flatMap((pg) => pg.items) ?? [];
  const isLoading = vouchersQuery.isLoading;
  const copy = (code: string) =>
    navigator.clipboard.writeText(code).then(
      () => toast({ title: "Code copied", description: booking ? "Paste it when you book or check out." : "Paste it at checkout." }),
      () => toast({ variant: "destructive", title: "Couldn't copy. Select the code and copy it instead." }),
    );

  const usable = (v: MyVoucherDTO) => v.status === "ACTIVE" && v.code;
  const ordered = [...data].sort((a, b) => Number(Boolean(usable(b))) - Number(Boolean(usable(a))));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gift cards{booking ? " and packages" : ""}</h2>
          <p className="text-sm text-muted-foreground">
            {booking ? "Use a code when you book or check out." : "Use a code at checkout."} Codes sent to your email show here too.
          </p>
        </div>
        <Button asChild>
          <Link to="/gift-cards">
            <Gift className="mr-2 h-4 w-4" /> Buy a gift card
          </Link>
        </Button>
      </div>

      {isLoading ? null : ordered.length === 0 ? (
        <TabEmpty
          icon={<Gift />}
          title="No gift cards yet"
          hint={booking ? "Buy one for someone special, or a package of sessions to save on your regular visits." : "Buy one for someone special."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ordered.map((v) => {
            const gift = v.kind === "GIFT_CARD";
            return (
              <div
                key={v.id}
                className={cn(
                  "rounded-2xl border p-5",
                  usable(v) ? "border-primary/40 bg-gradient-to-br from-primary/10 to-transparent" : "border-border bg-card opacity-75",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2 font-semibold">
                    {gift ? <Gift className="h-5 w-5 text-primary" /> : <Package className="h-5 w-5 text-primary" />}
                    {gift ? `${formatGHS(v.price)} gift card` : `${v.sessionsTotal} × ${v.serviceName ?? "sessions"}`}
                  </span>
                  {v.status === "USED" ? (
                    <Badge variant="secondary">Used up</Badge>
                  ) : v.sentTo ? (
                    <Badge variant="outline">Sent</Badge>
                  ) : null}
                </div>

                <p className="mt-3 text-2xl font-semibold tabular-nums">
                  {gift ? formatGHS(v.balance) : `${v.sessionsLeft} left`}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">{gift ? "left to spend" : `of ${v.sessionsTotal} sessions`}</span>
                </p>

                {v.from && <p className="mt-2 text-sm">From {v.from}</p>}
                {v.message && <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm italic">"{v.message}"</p>}
                {v.sentTo && <p className="mt-2 text-sm text-muted-foreground">You sent this to {v.sentTo}. They have the code.</p>}

                {v.code && (
                  <div className="mt-4 flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-dashed border-border bg-background px-3 py-2 font-mono text-sm tracking-wider">{v.code}</code>
                    <Button variant="outline" size="icon" aria-label="Copy code" onClick={() => copy(v.code!)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {usable(v) && !gift && v.serviceId && (
                  <Button asChild variant="link" className="mt-2 h-auto px-0">
                    <Link to={`/book?service=${v.serviceId}`}>Book a session</Link>
                  </Button>
                )}
                <p className="mt-3 text-xs text-muted-foreground">Bought {format(new Date(v.createdAt), "d MMM yyyy")}</p>
              </div>
            );
          })}
        </div>
      )}
      <LoadMore query={vouchersQuery} />
    </div>
  );
};
