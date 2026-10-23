import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, CalendarClock, Clock, CreditCard, Download, Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadBookingDocument, type DocumentBrand } from "@/lib/receipt";
import type { AppointmentDTO } from "@/lib/api";
import { statusColors, statusLabels } from "./accountFormat";
import { ListSkeleton, LoadMore, PaymentBadge } from "./AccountParts";

const ServiceLine = ({ apt }: { apt: AppointmentDTO }) => (
  <div>
    <h3 className="font-semibold text-foreground">{apt.services?.name || "Service"}</h3>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{format(new Date(`${apt.appointment_date}T00:00:00`), "MMM d, yyyy")}</span>
      <span>•</span>
      <span>{apt.appointment_time}</span>
    </div>
  </div>
);

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
}: AppointmentsTabProps) => (
  <>
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Appointments</h2>
      {loading ? (
        <ListSkeleton />
      ) : upcoming.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No upcoming appointments</p>
            <Button asChild>
              <Link to="/book">Book Now</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcoming.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <ServiceLine apt={apt} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={statusColors[apt.status]}>
                      {statusLabels[apt.status] ?? apt.status}
                    </Badge>
                    <PaymentBadge apt={apt} />
                    <Button size="sm" variant="outline" onClick={() => downloadBookingDocument(apt, brand)}>
                      <Download className="h-4 w-4 mr-1" />
                      Booking document
                    </Button>
                    {apt.status !== "cancelled" && apt.status !== "completed" && (
                      <Button size="sm" variant="outline" onClick={() => onReschedule(apt)}>
                        <CalendarClock className="h-4 w-4 mr-1" />
                        {apt.status === "pending_reschedule" ? "Change again" : "Reschedule"}
                      </Button>
                    )}
                    {apt.payment && apt.payment.status !== "paid" && apt.status !== "cancelled" && (
                      <Button size="sm" onClick={() => onPay(apt)} disabled={payingId === apt.id}>
                        {payingId === apt.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-1" />
                        )}
                        Pay now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <LoadMore query={pager} label="Load more appointments" />
    </div>

    {past.length > 0 && (
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Past Appointments</h2>
        <div className="space-y-4">
          {past.slice(0, 5).map((apt) => (
            <Card key={apt.id} className="opacity-75">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <ServiceLine apt={apt} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[apt.status]}>
                      {statusLabels[apt.status] ?? apt.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => downloadBookingDocument(apt, brand)}>
                      <Download className="h-4 w-4 mr-1" />
                      Document
                    </Button>
                    {reviewsEnabled && apt.status === "completed" && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to={`/review?appointment=${apt.id}${
                            apt.services?.id ? `&service=${apt.services.id}` : ""
                          }`}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Leave a review
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )}
  </>
);
