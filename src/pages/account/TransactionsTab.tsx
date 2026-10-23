import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Download, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatGHS } from "@/lib/currency";
import { downloadReceipt, receiptFromAppointment, type DocumentBrand } from "@/lib/receipt";
import type { AppointmentDTO } from "@/lib/api";
import { ListSkeleton, LoadMore, PaymentBadge } from "./AccountParts";

interface TransactionsTabProps {
  // Appointments that have a payment record, newest first.
  transactions: AppointmentDTO[];
  loading: boolean;
  pager: React.ComponentProps<typeof LoadMore>["query"];
  brand: DocumentBrand;
}

export const TransactionsTab = ({ transactions, loading, pager, brand }: TransactionsTabProps) => (
  <div>
    <h2 className="text-xl font-semibold text-foreground mb-4">Booking Transactions</h2>
    {loading ? (
      <ListSkeleton />
    ) : transactions.length === 0 ? (
      <Card>
        <CardContent className="py-8 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No transactions yet. Payments you make when booking will appear here.
          </p>
          <Button asChild>
            <Link to="/book">Book Now</Link>
          </Button>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-4">
        {transactions.map((apt) => {
          const p = apt.payment!;
          const isPaid = p.status === "paid";
          return (
            <Card key={apt.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {apt.services?.name || "Service"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                        <span>{format(new Date(p.paid_at || apt.created_at), "MMM d, yyyy")}</span>
                        <span>•</span>
                        <span>{p.type === "partial" ? "Deposit" : "Full payment"}</span>
                      </div>
                      {p.reference && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                          {p.reference}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="font-bold text-foreground tabular-nums">{formatGHS(p.amount)}</p>
                      <PaymentBadge apt={apt} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!isPaid}
                      title={isPaid ? "Download receipt" : "Receipt available after payment"}
                      onClick={() => {
                        const data = receiptFromAppointment(apt);
                        if (data) downloadReceipt(data, brand);
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Receipt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    )}
    <LoadMore query={pager} label="Load more transactions" />
  </div>
);
