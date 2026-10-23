import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGHS } from "@/lib/currency";
import type { AppointmentDTO } from "@/lib/api";

// Small payment badge for an appointment's payment state.
export const PaymentBadge = ({ apt }: { apt: AppointmentDTO }) => {
  const p = apt.payment;
  if (!p || p.status === "pending") {
    return <Badge variant="secondary">Payment pending</Badge>;
  }
  if (p.status === "paid") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        {p.type === "partial" ? `Deposit paid · ${formatGHS(p.balance)} due` : "Paid"}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">{p.status === "failed" ? "Payment failed" : "Refunded"}</Badge>
  );
};

export const LoadMore = ({
  query,
  label,
}: {
  query: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown };
  label: string;
}) =>
  query.hasNextPage ? (
    <div className="mt-4 text-center">
      <Button
        variant="outline"
        onClick={() => query.fetchNextPage()}
        disabled={query.isFetchingNextPage}
      >
        {query.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {label}
      </Button>
    </div>
  ) : null;

export const ListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2].map((i) => (
      <Skeleton key={i} className="h-24 w-full" />
    ))}
  </div>
);
