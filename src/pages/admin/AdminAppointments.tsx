import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Calendar, Phone, Mail, Clock, CheckCircle, XCircle, AlertCircle, Loader2, MessageCircle, Image as ImageIcon } from "lucide-react";
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
import { whatsappLink } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";

type AppointmentStatus = AppointmentDTO["status"];
type Appointment = AppointmentDTO;

// Status-aware WhatsApp message the admin sends to the customer.
const buildWhatsappMessage = (a: Appointment): string => {
  const svc = a.services?.name ?? "your service";
  const when = `${a.appointment_date} at ${a.appointment_time}`;
  switch (a.status) {
    case "confirmed":
      return `Hi ${a.full_name}, great news! Your ${svc} appointment on ${when} is confirmed ✅. See you soon at El's Beauty Studio 💅`;
    case "completed":
      return `Hi ${a.full_name}, thank you for visiting El's Beauty Studio 💖 We'd love your feedback — leave us a review when you get a moment!`;
    case "cancelled":
      return `Hi ${a.full_name}, your ${svc} appointment on ${when} has been cancelled. Reach out anytime to reschedule.`;
    default:
      return `Hi ${a.full_name}, we've received your ${svc} request for ${when}. We'll confirm shortly — thank you for booking with El's Beauty Studio!`;
  }
};

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: AlertCircle },
  confirmed: { label: "Confirmed", variant: "default" as const, icon: CheckCircle },
  completed: { label: "Completed", variant: "outline" as const, icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle },
};

const AdminAppointments = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: () => appointmentsApi.listAll(),
  });

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

  const filteredAppointments = appointments?.filter((apt) =>
    statusFilter === "all" ? true : apt.status === statusFilter
  );

  const stats = {
    total: appointments?.length ?? 0,
    pending: appointments?.filter((a) => a.status === "pending").length ?? 0,
    confirmed: appointments?.filter((a) => a.status === "confirmed").length ?? 0,
    completed: appointments?.filter((a) => a.status === "completed").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
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

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Appointments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                            <p className="text-sm text-muted-foreground">
                              GHS {appointment.services?.price}
                            </p>
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
                                buildWhatsappMessage(appointment),
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Notify
                            </a>
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
      </div>
    </AdminLayout>
  );
};

export default AdminAppointments;
