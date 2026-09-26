import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Trash2,
  CalendarClock,
  Undo2,
  Replace,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appointmentsApi, AppointmentDTO } from "@/lib/api";
import { RefundDialog, type RefundTarget } from "@/components/admin/RefundDialog";
import { RescheduleDialog } from "@/components/admin/RescheduleDialog";
import { ChangeServiceDialog } from "@/components/admin/ChangeServiceDialog";
import { OnboardingBanner } from "@/components/admin/OnboardingBanner";
import { FilterBar } from "@/components/admin/FilterBar";
import { Input } from "@/components/ui/input";
import { whatsappLink } from "@/lib/whatsapp";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { useToast } from "@/hooks/use-toast";
import { useStudio } from "@/hooks/useStudio";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AppointmentStatus = AppointmentDTO["status"];
type Appointment = AppointmentDTO;

// Status-aware WhatsApp message the admin sends to the customer.
const buildWhatsappMessage = (a: Appointment, brand: string): string => {
  const svc = a.services?.name ?? "your service";
  const when = `${a.appointment_date} at ${a.appointment_time}`;
  switch (a.status) {
    case "confirmed":
      return `Hi ${a.full_name}, great news! Your ${svc} appointment on ${when} is confirmed. See you soon at ${brand}`;
    case "completed":
      return `Hi ${a.full_name}, thank you for visiting ${brand}. We'd love your feedback — leave us a review when you get a moment!`;
    case "cancelled":
      return `Hi ${a.full_name}, your ${svc} appointment on ${when} has been cancelled. Reach out anytime to reschedule.`;
    default:
      return `Hi ${a.full_name}, we've received your ${svc} request for ${when}. We'll confirm shortly — thank you for booking with ${brand}!`;
  }
};

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: AlertCircle },
  confirmed: { label: "Confirmed", variant: "default" as const, icon: CheckCircle },
  completed: { label: "Completed", variant: "outline" as const, icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle },
};

// Receipt message the admin sends to the customer on WhatsApp.
const buildReceiptMessage = (a: Appointment, brand: string): string => {
  const p = a.payment;
  if (!p) return "";
  const label = p.type === "partial" ? "Deposit paid" : "Amount paid";
  const balanceLine = p.balance > 0 ? `Balance due at studio: GHS ${p.balance}\n` : "";
  return (
    `Hi ${a.full_name}, here's your payment receipt from ${brand}:\n\n` +
    `Service: ${a.services?.name ?? "your service"}\n` +
    `Date: ${a.appointment_date} at ${a.appointment_time}\n` +
    `${label}: GHS ${p.amount}\n` +
    balanceLine +
    `Reference: ${p.reference ?? "—"}\n\n` +
    `Thank you!`
  );
};

const AdminAppointments = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pendingDelete, setPendingDelete] = useState<AppointmentDTO | null>(
    null,
  );
  const [pendingReschedule, setPendingReschedule] =
    useState<AppointmentDTO | null>(null);
  const [pendingRefund, setPendingRefund] = useState<RefundTarget | null>(null);
  const [changingService, setChangingService] =
    useState<AppointmentDTO | null>(null);
  const [aSearch, setASearch] = useState("");
  const [aPayment, setAPayment] = useState("all");
  const [aFrom, setAFrom] = useState("");
  const [aTo, setATo] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { name: studioName } = useStudio();

  const appointmentsQuery = useInfiniteQuery({
    queryKey: ["admin-appointments", "cursor-pages"],
    queryFn: ({ pageParam }) => appointmentsApi.listAllPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
  const appointments = appointmentsQuery.data?.pages.flatMap((page) => page.items);
  const isLoading = appointmentsQuery.isLoading;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      await appointmentsApi.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast({
        title: "Status updated",
        description: "The appointment status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Hard delete, distinct from setting status to "cancelled": this removes the
  // booking record entirely, so it's behind a confirmation.
  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      setPendingDelete(null);
      toast({
        title: "Booking deleted",
        description: "The booking has been permanently removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Couldn't delete the booking",
        description: error.message,
      });
    },
  });

  const q = aSearch.trim().toLowerCase();
  const filteredAppointments = (appointments ?? []).filter((apt) => {
    if (statusFilter !== "all" && apt.status !== statusFilter) return false;
    if (q) {
      const hay = `${apt.full_name ?? ""} ${apt.phone ?? ""} ${apt.email ?? ""} ${apt.services?.name ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (aPayment !== "all") {
      const ps = apt.payment?.status ?? "none";
      if (aPayment === "unpaid" && apt.payment) return false;
      if (aPayment !== "unpaid" && ps !== aPayment) return false;
    }
    if (aFrom && apt.appointment_date < aFrom) return false;
    if (aTo && apt.appointment_date > aTo) return false;
    return true;
  });
  const aFiltersActive =
    statusFilter !== "all" || q !== "" || aPayment !== "all" || aFrom !== "" || aTo !== "";
  const clearA = () => {
    setStatusFilter("all");
    setASearch("");
    setAPayment("all");
    setAFrom("");
    setATo("");
  };

  const stats = {
    total: appointments?.length ?? 0,
    pending: appointments?.filter((a) => a.status === "pending").length ?? 0,
    confirmed: appointments?.filter((a) => a.status === "confirmed").length ?? 0,
    completed: appointments?.filter((a) => a.status === "completed").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <OnboardingBanner />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage your appointment bookings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <FilterBar
          search={aSearch}
          onSearch={setASearch}
          searchPlaceholder="Search name, phone, service…"
          onClear={clearA}
          active={aFiltersActive}
          count={filteredAppointments.length}
        >
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={aPayment} onValueChange={setAPayment}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Payment pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="unpaid">No payment</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={aFrom} onChange={(e) => setAFrom(e.target.value)} className="w-[150px]" title="From date" />
          <Input type="date" value={aTo} onChange={(e) => setATo(e.target.value)} className="w-[150px]" title="To date" />
        </FilterBar>

        {/* Appointments Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAppointments?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No appointments found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments?.map((appointment) => {
                  const StatusIcon = statusConfig[appointment.status].icon;
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{appointment.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {appointment.phone}
                          </div>
                          {appointment.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {appointment.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {appointment.design_image_url && (
                            <a
                              href={appointment.design_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View design reference"
                            >
                              <img
                                src={appointment.design_image_url}
                                alt="Design reference"
                                className="w-12 h-12 rounded object-cover border border-border"
                              />
                            </a>
                          )}
                          <div>
                            <p className="font-medium">{appointment.services?.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {appointment.services?.duration}
                            </div>
                            {appointment.discount_amount > 0 ? (
                              <div className="text-sm">
                                <span className="text-muted-foreground line-through">
                                  GHS {appointment.total_price}
                                </span>
                                <span className="ml-2 font-medium text-foreground">
                                  GHS {appointment.amount_due}
                                </span>
                                <span className="ml-1 text-xs text-green-600">
                                  (-GHS {appointment.discount_amount} • {appointment.points_redeemed} pts)
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                GHS {appointment.total_price}
                              </p>
                            )}
                            {appointment.notes && (
                              <p className="text-xs text-muted-foreground mt-1 max-w-[200px] line-clamp-2">
                                “{appointment.notes}”
                              </p>
                            )}
                            {appointment.design_image_url && (
                              <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                                <ImageIcon className="h-3 w-3" /> Design attached
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {format(parseISO(appointment.appointment_date), "MMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.appointment_time}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[appointment.status].variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[appointment.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const p = appointment.payment;
                          if (!p || p.status === "pending") {
                            return (
                              <Badge variant="secondary">Payment pending</Badge>
                            );
                          }
                          if (p.status === "paid") {
                            return (
                              <div className="space-y-0.5">
                                <Badge className="bg-green-600 hover:bg-green-600">
                                  {p.type === "partial" ? "Deposit paid" : "Paid"}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  GHS {p.amount}
                                  {p.balance > 0 && ` · GHS ${p.balance} due`}
                                </p>
                              </div>
                            );
                          }
                          return (
                            <Badge variant="destructive">
                              {p.status === "failed" ? "Failed" : "Refunded"}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Select
                            value={appointment.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({
                                id: appointment.id,
                                status: value as AppointmentStatus,
                              })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="w-32 border-[#25D366] text-[#1da851] hover:bg-[#25D366]/10"
                          >
                            <a
                              href={whatsappLink(
                                appointment.phone,
                                buildWhatsappMessage(appointment, studioName),
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <WhatsappIcon className="h-4 w-4 mr-1" />
                              Notify
                            </a>
                          </Button>
                          {appointment.payment?.status === "paid" && (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="w-32 border-[#25D366] text-[#1da851] hover:bg-[#25D366]/10"
                            >
                              <a
                                href={whatsappLink(
                                  appointment.phone,
                                  buildReceiptMessage(appointment, studioName),
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <WhatsappIcon className="h-4 w-4 mr-1" />
                                Send receipt
                              </a>
                            </Button>
                          )}
                          {appointment.status !== "cancelled" &&
                          appointment.status !== "completed" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-32"
                              onClick={() => setPendingReschedule(appointment)}
                            >
                              <CalendarClock className="mr-1 h-4 w-4" />
                              Reschedule
                            </Button>
                          ) : null}
                          {appointment.status !== "cancelled" &&
                          appointment.status !== "completed" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-32"
                              onClick={() => setChangingService(appointment)}
                            >
                              <Replace className="mr-1 h-4 w-4" />
                              Change service
                            </Button>
                          ) : null}
                          {appointment.payment?.id &&
                          (appointment.payment.status === "paid" ||
                            appointment.payment.status ===
                              "partially_refunded") ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-32"
                              onClick={() =>
                                setPendingRefund({
                                  kind: "payment",
                                  id: appointment.payment!.id!,
                                  paid: appointment.payment!.amount,
                                  alreadyRefunded:
                                    appointment.payment!.refunded_amount ?? 0,
                                  label: `${appointment.full_name} — ${appointment.services?.name ?? "booking"}`,
                                })
                              }
                            >
                              <Undo2 className="mr-1 h-4 w-4" />
                              Refund
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-32 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setPendingDelete(appointment)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
        {appointmentsQuery.hasNextPage && (
          <div className="text-center">
            <Button variant="outline" onClick={() => appointmentsQuery.fetchNextPage()} disabled={appointmentsQuery.isFetchingNextPage}>
              {appointmentsQuery.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load more appointments
            </Button>
          </div>
        )}
      </div>

      <RescheduleDialog
        appointment={pendingReschedule}
        onOpenChange={(o) => !o && setPendingReschedule(null)}
      />
      <ChangeServiceDialog
        appointment={changingService}
        onOpenChange={(o) => !o && setChangingService(null)}
      />
      <RefundDialog
        target={pendingRefund}
        onOpenChange={(o) => !o && setPendingRefund(null)}
        invalidateKeys={["admin-appointments", "admin-ledger"]}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.full_name}'s booking will be permanently removed. This can't be undone — if you only want to call it off, set the status to "cancelled" instead so the record is kept.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Keep booking
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AdminLayout>
  );
};

export default AdminAppointments;
