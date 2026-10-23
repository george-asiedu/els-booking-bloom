import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DetailsSheet } from "@/components/ui/details-sheet";
import type { EarningEntry, EarningPurpose } from "@/lib/platformApi";
import { PURPOSE_HELP, PURPOSE_LABEL } from "@/lib/earnings";
import { formatGHS } from "@/lib/currency";

export const PurposeBadge = ({ purpose }: { purpose: EarningPurpose }) => (
  <Badge variant={purpose === "COMMISSION" ? "outline" : "secondary"} className="whitespace-nowrap font-medium">
    {PURPOSE_LABEL[purpose]}
  </Badge>
);

/** The drawer for one earning: which studio, what for, and the reference. */
export const EarningDetails = ({ entry, onClose }: { entry: EarningEntry | null; onClose: () => void }) => (
  <DetailsSheet
    open={Boolean(entry)}
    onClose={onClose}
    title={entry ? formatGHS(entry.amount) : ""}
    subtitle={entry?.description}
    badges={entry && (
      <>
        <PurposeBadge purpose={entry.purpose} />
        {entry.estimated && <Badge variant="outline">Estimated</Badge>}
      </>
    )}
    sections={
      entry
        ? [
            {
              items: [
                {
                  label: "Studio",
                  value: entry.studio ? (
                    <Link to={`/platform/studios/${entry.studio.id}`} className="text-primary hover:underline">
                      {entry.studio.name}
                    </Link>
                  ) : null,
                },
                { label: "What for", value: PURPOSE_LABEL[entry.purpose] },
                { label: "Amount", value: formatGHS(entry.amount) },
                { label: entry.purpose === "COMMISSION" ? "Month" : "Paid on", value: entry.purpose === "COMMISSION" ? entry.detail.month : format(parseISO(entry.date), "d MMM yyyy, h:mm a") },
                ...(entry.plan
                  ? [{ label: "Plan", value: `${entry.plan === "PREMIUM" ? "Premium" : "Standard"}${entry.cadence ? ` · ${entry.cadence === "YEARLY" ? "Yearly" : "Monthly"}` : ""}` }]
                  : []),
                ...(entry.detail.coverageMonths ? [{ label: "Covers", value: `${entry.detail.coverageMonths} months` }] : []),
                ...(entry.purpose === "COMMISSION"
                  ? [
                      { label: "Customer payments that month", value: formatGHS(entry.detail.customerPayments ?? 0) },
                      { label: "Commission rate", value: `${entry.detail.ratePercent}%` },
                    ]
                  : []),
                ...(entry.reference ? [{ label: "Reference", value: entry.reference, mono: true }] : []),
              ],
            },
            { content: <p className="rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">{PURPOSE_HELP[entry.purpose]}</p> },
          ]
        : []
    }
  />
);
