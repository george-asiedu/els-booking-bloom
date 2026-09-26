import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appointmentsApi, servicesApi, type AppointmentDTO } from "@/lib/api";
import { formatGHS } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

/**
 * Swap the service on a booking.
 *
 * The preview here is advisory — the server re-prices, applies the loyalty cap
 * and decides whether money comes back or is still owed, then reports what it
 * did. We show its message rather than our own arithmetic, so the two can
 * never disagree in front of a customer.
 */
export const ChangeServiceDialog = ({
  appointment,
  onOpenChange,
}: {
  appointment: AppointmentDTO | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const [serviceId, setServiceId] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const servicesQuery = useQuery({
    queryKey: ["services-for-change"],
    queryFn: () => servicesApi.listAll(),
    enabled: !!appointment,
  });

  const services = (servicesQuery.data ?? []).filter(
    (s) => s.id !== appointment?.services?.id,
  );
  const chosen = services.find((s) => s.id === serviceId);

  const netPaid =
    appointment?.payment && appointment.payment.status !== "failed"
      ? appointment.payment.amount - (appointment.payment.refunded_amount ?? 0)
      : 0;
  const delta = chosen ? chosen.price - (appointment?.total_price ?? 0) : 0;

  const mutation = useMutation({
    mutationFn: () => {
      if (!appointment || !serviceId) throw new Error("Pick a service");
      return appointmentsApi.changeService(appointment.id, serviceId);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
      toast({ title: "Booking updated", description: res.message });
      setServiceId("");
      onOpenChange(false);
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Couldn't change the service",
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  return (
    <Dialog
      open={!!appointment}
      onOpenChange={(o) => {
        if (!o) setServiceId("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change the booked service</DialogTitle>
          <DialogDescription>
            {appointment
              ? `${appointment.full_name} — currently ${appointment.services?.name ?? "a service"} at ${formatGHS(appointment.total_price)}.`
              : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="cs-service">New service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger id="cs-service">
                <SelectValue
                  placeholder={
                    servicesQuery.isLoading ? "Loading…" : "Choose a service"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {formatGHS(s.price)} · {s.duration}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {chosen ? (
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <span>{appointment?.services?.name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span>{chosen.name}</span>
              </div>
              <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <dt>New price</dt>
                  <dd className="tabular-nums">{formatGHS(chosen.price)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Already paid</dt>
                  <dd className="tabular-nums">{formatGHS(netPaid)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Price change</dt>
                  <dd className="tabular-nums">
                    {delta >= 0 ? "+" : "−"}
                    {formatGHS(Math.abs(delta))}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                {netPaid > chosen.price
                  ? `${formatGHS(netPaid - chosen.price)} will be refunded to the customer.`
                  : netPaid < chosen.price
                    ? `${formatGHS(chosen.price - netPaid)} will be left to pay.`
                    : "Nothing further to pay or refund."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                The appointment keeps its time. If the new service runs longer
                it has to still fit before closing and not overlap the next
                booking, or the change is refused.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !serviceId}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Change service"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
