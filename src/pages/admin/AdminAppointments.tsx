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
  MoreHorizontal,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { whatsappLink } from "@/lib/whatsapp";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
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
import { formatGHS } from "@/lib/currency";
import { DateRangeField } from "@/components/admin/DateRangeFilter";

type AppointmentStatus = AppointmentDTO["status"];
type Appointment = AppointmentDTO;

// WhatsApp messages from the studio to the customer. The studio only messages
// at two points: when it confirms a booking and when the visit is done. Each
// opens WhatsApp with the text filled in; the admin still presses send.
const firstName = (a: Appointment) => a.full_name.trim().split(/\s+/)[0] || a.full_name;
const visitDate = (a: Appointment) =>
  `${format(parseISO(a.appointment_date), "EEEE d MMMM")} at ${a.appointment_time}`;

const confirmationMessage = (a: Appointment, brand: string) => {
  const balance =
    a.payment && a.payment.balance > 0
      ? `\n\nBalance to pay at the studio: ${formatGHS(a.payment.balance)}.`
      : "";
  return (
    `Hi ${firstName(a)}, your ${a.services?.name ?? "appointment"} at ${brand} is confirmed ` +
    `for ${visitDate(a)}.${balance}\n\nSee you then!`
  );
};

const thankYouMessage = (a: Appointment, brand: string) =>
  `Hi ${firstName(a)}, thank you for visiting ${brand}. We hope you love your ` +
  `${a.services?.name ?? "new look"}. We'd be glad to hear how it went, and to see you again soon.`;

const receiptMessage = (a: Appointment, brand: string) => {
  const p = a.payment!;
  return (
    `Hi ${firstName(a)}, here's your payment receipt from ${brand}:\n\n` +
    `Service: ${a.services?.name ?? "Appointment"}\n` +
    `Date: ${visitDate(a)}\n` +
    `${p.type === "partial" ? "Deposit paid" : "Amount paid"}: ${formatGHS(p.amount)}\n` +
    (p.balance > 0 ? `Balance due at the studio: ${formatGHS(p.balance)}\n` : "") +
    `Reference: ${p.reference ?? "-"}\n\nThank you!`
  );
};

/**
 * The WhatsApp messages the studio can send for this booking right now: none
 * until it's confirmed, and none if the customer's number can't be reached on
 * WhatsApp.
 */
const customerMessages = (a: Appointment, brand: string) => {
  if (a.status !== "confirmed" && a.status !== "completed") return [];
  const main =
    a.status === "confirmed"
      ? { label: "Send confirmation", text: confirmationMessage(a, brand) }
      : { label: "Send thank-you", text: thankYouMessage(a, brand) };
  const mainHref = whatsappLink(a.phone, main.text);
  if (!mainHref) return [];
  const out = [{ label: main.label, href: mainHref }];
  if (a.payment?.status === "paid") {
    out.push({ label: "Send receipt", href: whatsappLink(a.phone, receiptMessage(a, brand))! });
  }
  return out;
};

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: AlertCircle },
  // A customer moved the booking and the studio hasn't approved the new time.
  // Missing before, so the page crashed on the first such booking.
  pending_reschedule: { label: "New time requested", variant: "secondary" as const, icon: CalendarClock },
  confirmed: { label: "Confirmed", variant: "default" as const, icon: CheckCircle },
  completed: { label: "Completed", variant: "outline" as const, icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle },
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
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      // Confirming or completing is when the customer should hear from the
      // studio, so offer the message right here.
      const updated = appointments?.find((a) => a.id === id);
      const message = updated
        ? customerMessages({ ...updated, status }, studioName)[0]
        : undefined;
      toast({
        title: `Marked as ${statusConfig[status].label.toLowerCase()}`,
        description: message
          ? `Let ${updated!.full_name} know on WhatsApp.`
          : "The appointment status has been updated.",
        action: message ? (
          <ToastAction altText={`${message.label} on WhatsApp`} asChild>
            <a href={message.href} target="_blank" rel="noopener noreferrer">
              <WhatsappIcon className="mr-1.5 h-4 w-4 text-[#1da851]" />
              {message.label}
            </a>
          </ToastAction>
        ) : undefined,
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
              <SelectItem value="pending_reschedule">New time requested</SelectItem>
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
          <DateRangeField
            from={aFrom}
            to={aTo}
            onChange={(f, t) => {
              setAFrom(f);
              setATo(t);
            }}
          />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments?.map((appointment) => {
                  const StatusIcon = statusConfig[appointment.status].icon;
                  const messages = customerMessages(appointment, studioName);
                  const canChange =
                    appointment.status !== "cancelled" && appointment.status !== "completed";
                  const canRefund = Boolean(
                    appointment.payment?.id &&
                      (appointment.payment.status === "paid" ||
                        appointment.payment.status === "partially_refunded"),
                  );
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
                                  {formatGHS(appointment.total_price)}
                                </span>
                                <span className="ml-2 font-medium text-foreground">
                                  {formatGHS(appointment.amount_due)}
                                </span>
                                <span className="ml-1 text-xs text-green-600">
                                  (−{formatGHS(appointment.discount_amount)} • {appointment.points_redeemed} pts)
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {formatGHS(appointment.total_price)}
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
                                  {formatGHS(p.amount)}
                                  {p.balance > 0 && ` · ${formatGHS(p.balance)} due`}
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
                        {/* Status stays one click away; everything else lives in
                            the menu, so every row is the same height. */}
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={appointment.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({
                                id: appointment.id,
                                status: value as AppointmentStatus,
                              })
                            }
                          >
                            <SelectTrigger
                              className="h-9 w-[150px]"
                              aria-label={`Status for ${appointment.full_name}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="pending_reschedule">New time requested</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                aria-label={`More actions for ${appointment.full_name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {messages.map((m) => (
                                <DropdownMenuItem key={m.label} asChild>
                                  <a href={m.href} target="_blank" rel="noopener noreferrer">
                                    <WhatsappIcon className="mr-2 h-4 w-4 text-[#1da851]" />
                                    {m.label} on WhatsApp
                                  </a>
                                </DropdownMenuItem>
                              ))}
                              {messages.length > 0 && (canChange || canRefund) && (
                                <DropdownMenuSeparator />
                              )}
                              {canChange && (
                                  <>
                                    <DropdownMenuItem onSelect={() => setPendingReschedule(appointment)}>
                                      <CalendarClock className="mr-2 h-4 w-4" />
                                      Reschedule
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setChangingService(appointment)}>
                                      <Replace className="mr-2 h-4 w-4" />
                                      Change service
                                    </DropdownMenuItem>
                                  </>
                                )}
                              {canRefund && (
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      setPendingRefund({
                                        kind: "payment",
                                        id: appointment.payment!.id!,
                                        paid: appointment.payment!.amount,
                                        alreadyRefunded: appointment.payment!.refunded_amount ?? 0,
                                        label: `${appointment.full_name} — ${appointment.services?.name ?? "booking"}`,
                                      })
                                    }
                                  >
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Refund
                                  </DropdownMenuItem>
                                )}
                              {(messages.length > 0 || canChange || canRefund) && (
                                <DropdownMenuSeparator />
                              )}
                              <DropdownMenuItem
                                onSelect={() => setPendingDelete(appointment)}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete booking
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
