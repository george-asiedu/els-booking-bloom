import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatGHS } from "@/lib/currency";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/ledgerFormat";
import type { LedgerEntryDTO, LedgerStatus, LedgerSummaryDTO } from "@/lib/api";

export const StatusBadge = ({ status }: { status: LedgerStatus }) => (
  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
);

/**
 * Signed amount. A DEBIT is money leaving the studio (a subscription renewal),
 * so it shows with a minus and a downward arrow; a CREDIT is money coming in.
 * A non-successful entry is greyed out — it did not move money.
 */
export const AmountCell = ({ entry }: { entry: LedgerEntryDTO }) => {
  const isDebit = entry.direction === "DEBIT";
  const settled = entry.status === "SUCCESS";
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium tabular-nums ${
        !settled
          ? "text-muted-foreground line-through"
          : isDebit
            ? "text-destructive"
            : "text-foreground"
      }`}
    >
      {settled &&
        (isDebit ? (
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden />
        ))}
      {isDebit ? "−" : ""}
      {formatGHS(entry.amount)}
    </span>
  );
};

export const SummaryCards = ({
  summary,
  loading,
}: {
  summary?: LedgerSummaryDTO;
  loading?: boolean;
}) => {
  const tiles: { label: string; value: string; hint?: string; tone?: string }[] =
    [
      {
        label: "Received",
        value: summary ? formatGHS(summary.received) : "—",
        hint: summary ? `${summary.transactions} successful` : undefined,
      },
      {
        label: "Refunded",
        value: summary ? formatGHS(summary.refunded) : "—",
      },
      {
        label: "Net",
        value: summary ? formatGHS(summary.net) : "—",
        hint: "Received minus refunds",
      },
      {
        label: "Paid out",
        value: summary ? formatGHS(summary.paidOut) : "—",
        hint: "Subscriptions & fees",
      },
      {
        label: "Pending",
        value: summary ? formatGHS(summary.pending) : "—",
        tone: "text-muted-foreground",
      },
      {
        label: "Didn't go through",
        value: summary ? formatGHS(summary.failed) : "—",
        tone: "text-muted-foreground",
        hint: "Not counted as income",
      },
    ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p
              className={`mt-1 text-lg font-semibold tabular-nums ${t.tone ?? ""}`}
            >
              {loading ? "…" : t.value}
            </p>
            {t.hint ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t.hint}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
