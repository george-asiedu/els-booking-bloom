import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, CalendarClock, CreditCard, Download, Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailsSheet } from "@/components/ui/details-sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagedList } from "@/hooks/usePagedList";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { downloadBookingDocument, type DocumentBrand } from "@/lib/receipt";
import type { AppointmentDTO } from "@/lib/api";
import { statusColors, statusLabels } from "./accountFormat";
import { ListSkeleton, LoadMore, PaymentBadge } from "./AccountParts";

const day = (apt: AppointmentDTO) => format(new Date(`${apt.appointment_date}T00:00:00`), "d MMM yyyy");

interface AppointmentsTabProps {
  upcoming: AppointmentDTO[];
  past: AppointmentDTO[];
  loading: boolean;
  pager: React.ComponentProps<typeof LoadMore>["query"];
  brand: DocumentBrand;
  reviewsEnabled: boolean;
  payingId: string | null;
  onPay: (apt: AppointmentDTO) => void;
  onReschedule: (apt: AppointmentDTO) => void;
}

/** One table of appointments; a row opens its details. */
const AppointmentTable = ({ rows, onOpen, faded }: { rows: AppointmentDTO[]; onOpen: (a: AppointmentDTO) => void; faded?: boolean }) => {
  const paged = usePagedList(rows, 10);
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.rows.map((apt) => (
            <TableRow key={apt.id} onOpen={() => onOpen(apt)} className={cn(faded && "text-muted-foreground")}>
              <TableCell className="font-medium text-foreground">{apt.services?.name || "Service"}</TableCell>
              <TableCell className="whitespace-nowrap">{day(apt)}</TableCell>
              <TableCell className="whitespace-nowrap">{apt.appointment_time}</TableCell>
              <TableCell>
                <Badge className={cn("whitespace-nowrap", statusColors[apt.status])}>{statusLabels[apt.status] ?? apt.status}</Badge>
              </TableCell>
              <TableCell><PaymentBadge apt={apt} /></TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">{formatGHS(apt.amount_due ?? apt.total_price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 pb-2">
        <TablePagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onPageChange={paged.setPage} noun="appointments" />
      </div>
    </Card>
  );
};

export const AppointmentsTab = ({
  upcoming,
  past,
  loading,
  pager,
  brand,
  reviewsEnabled,
  payingId,
  onPay,
  onReschedule,
}: AppointmentsTabProps) => {
  const [open, setOpen] = useState<AppointmentDTO | null>(null);
  const isUpcoming = open ? upcoming.some((a) => a.id === open.id) : false;
  const canChange = open && open.status !== "cancelled" && open.status !== "completed";
  const canPay = open?.payment && open.payment.status !== "paid" && open.status !== "cancelled";

  return (
    <>
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Upcoming appointments</h2>
        {loading ? (
          <ListSkeleton />
        ) : upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">No upcoming appointments</p>
              <Button asChild>
                <Link to="/book">Book now</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AppointmentTable rows={upcoming} onOpen={setOpen} />
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Past appointments</h2>
          <AppointmentTable rows={past} onOpen={setOpen} faded />
        </div>
      )}
      <LoadMore query={pager} label="Load more appointments" />

      {open && (
        <DetailsSheet
          open
          onClose={() => setOpen(null)}
          title={open.services?.name || "Appointment"}
          subtitle={`${day(open)} at ${open.appointment_time}`}
          badges={
            <>
              <Badge className={cn("whitespace-nowrap", statusColors[open.status])}>{statusLabels[open.status] ?? open.status}</Badge>
              <PaymentBadge apt={open} />
            </>
          }
          sections={[
            {
              title: "Booking",
              items: [
                { label: "Service", value: open.services?.name },
                { label: "Date", value: day(open) },
                { label: "Time", value: open.appointment_time },
                { label: "Booked on", value: format(new Date(open.created_at), "d MMM yyyy") },
                { label: "Notes", value: open.notes },
              ],
            },
            {
              title: "Price",
              items: [
                { label: "Price", value: formatGHS(open.total_price) },
                ...(open.discount_amount > 0 ? [{ label: "Discount", value: `-${formatGHS(open.discount_amount)}` }] : []),
                { label: "To pay", value: <span className="font-semibold">{formatGHS(open.amount_due ?? open.total_price)}</span> },
                ...(open.payment
                  ? [
                      { label: "Paid", value: open.payment.status === "paid" ? formatGHS(open.payment.amount) : "Not yet" },
                      { label: "Reference", value: open.payment.reference, mono: true },
                    ]
                  : []),
              ],
            },
          ]}
          footer={
            <div className="flex w-full flex-col gap-2">
              {canPay && (
                <Button onClick={() => onPay(open)} disabled={payingId === open.id}>
                  {payingId === open.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                  Pay now
                </Button>
              )}
              {isUpcoming && canChange && (
                <Button variant="outline" onClick={() => { onReschedule(open); setOpen(null); }}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {open.status === "pending_reschedule" ? "Change again" : "Reschedule"}
                </Button>
              )}
              {reviewsEnabled && open.status === "completed" && (
                <Button variant="outline" asChild>
                  <Link to={`/review?appointment=${open.id}${open.services?.id ? `&service=${open.services.id}` : ""}`}>
                    <Star className="mr-2 h-4 w-4" />
                    Leave a review
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => downloadBookingDocument(open, brand)}>
                <Download className="mr-2 h-4 w-4" />
                Booking document
              </Button>
            </div>
          }
        />
      )}
    </>
  );
};
