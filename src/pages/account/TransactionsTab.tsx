import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Download, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailsSheet } from "@/components/ui/details-sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const paidOn = (apt: AppointmentDTO) => format(new Date(apt.payment?.paid_at || apt.created_at), "d MMM yyyy");

export const TransactionsTab = ({ transactions, loading, pager, brand }: TransactionsTabProps) => {
  const [open, setOpen] = useState<AppointmentDTO | null>(null);
  const receipt = (apt: AppointmentDTO) => {
    const data = receiptFromAppointment(apt);
    if (data) downloadReceipt(data, brand);
  };
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-foreground">Booking transactions</h2>
      {loading ? (
        <ListSkeleton />
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No transactions yet. Payments you make when booking will appear here.</p>
            <Button asChild>
              <Link to="/book">Book now</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right"><span className="sr-only">Receipt</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((apt) => {
                const p = apt.payment!;
                return (
                  <TableRow key={apt.id} onOpen={() => setOpen(apt)}>
                    <TableCell className="whitespace-nowrap">{paidOn(apt)}</TableCell>
                    <TableCell className="font-medium">{apt.services?.name || "Service"}</TableCell>
                    <TableCell>{p.type === "partial" ? "Deposit" : "Full payment"}</TableCell>
                    <TableCell><PaymentBadge apt={apt} /></TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">{formatGHS(p.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" disabled={p.status !== "paid"} onClick={() => receipt(apt)} title={p.status === "paid" ? "Download receipt" : "Receipt available after payment"}>
                        <Download className="mr-1 h-4 w-4" />
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      <LoadMore query={pager} label="Load more transactions" />

      {open?.payment && (
        <DetailsSheet
          open
          onClose={() => setOpen(null)}
          title={formatGHS(open.payment.amount)}
          subtitle={`${open.services?.name || "Service"} · ${paidOn(open)}`}
          badges={<PaymentBadge apt={open} />}
          sections={[
            {
              title: "Payment",
              items: [
                { label: "Type", value: open.payment.type === "partial" ? "Deposit" : "Full payment" },
                { label: "Amount", value: formatGHS(open.payment.amount) },
                ...(open.payment.type === "partial" ? [{ label: "Balance due", value: formatGHS(open.payment.balance) }] : []),
                { label: "Paid on", value: open.payment.paid_at ? format(new Date(open.payment.paid_at), "d MMM yyyy, HH:mm") : "Not yet" },
                { label: "Reference", value: open.payment.reference, mono: true },
              ],
            },
            {
              title: "Appointment",
              items: [
                { label: "Service", value: open.services?.name },
                { label: "Date", value: format(new Date(`${open.appointment_date}T00:00:00`), "d MMM yyyy") },
                { label: "Time", value: open.appointment_time },
                { label: "Price", value: formatGHS(open.total_price) },
              ],
            },
          ]}
          footer={
            <Button className="w-full" variant="outline" disabled={open.payment.status !== "paid"} onClick={() => receipt(open)}>
              <Download className="mr-2 h-4 w-4" />
              Download receipt
            </Button>
          }
        />
      )}
    </div>
  );
};
