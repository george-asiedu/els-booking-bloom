import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { appointmentsApi, type AppointmentDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

/**
 * Moves a booking to a new slot.
 *
 * Slot rules (clash, terminal status, same slot) are enforced server-side and
 * surfaced here as the returned message — the client deliberately doesn't
 * duplicate them, so it can't disagree with the server about availability.
 */
export const RescheduleDialog = ({
  appointment,
  onOpenChange,
  // A studio move is final; a customer's is a request the studio must approve,
  // and the copy has to say so rather than implying it's done.
  audience = "admin",
  invalidateKeys = ["admin-appointments"],
}: {
  appointment: AppointmentDTO | null;
  onOpenChange: (open: boolean) => void;
  audience?: "admin" | "customer";
  invalidateKeys?: string[];
}) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isCustomer = audience === "customer";

  // Seed with the current slot so a small change is a small edit.
  useEffect(() => {
    if (appointment) {
      setDate(appointment.appointment_date ?? "");
      setTime(appointment.appointment_time ?? "");
      setReason("");
    }
  }, [appointment]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error("Nothing selected");
      return appointmentsApi.reschedule(appointment.id, {
        date,
        time,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
    },
    onSuccess: (_data) => {
      for (const k of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: [k] });
      }
      toast({
        title: isCustomer ? "Reschedule requested" : "Appointment moved",
        description: isCustomer
          ? "The studio will confirm your new time. Your payment stays with the booking."
          : "The customer has been emailed the new time.",
      });
      onOpenChange(false);
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Couldn't reschedule",
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  const unchanged =
    !!appointment &&
    date === appointment.appointment_date &&
    time === appointment.appointment_time;

  return (
    <Dialog open={!!appointment} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            {appointment
              ? `${appointment.full_name} — ${appointment.services?.name ?? "booking"}, currently ${appointment.appointment_date} at ${appointment.appointment_time}.`
              : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rs-date">New date</Label>
              <Input
                id="rs-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rs-time">New time</Label>
              <Input
                id="rs-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="rs-reason">Reason (optional)</Label>
            <Textarea
              id="rs-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Shown to the customer, e.g. “Stylist unavailable”."
              rows={2}
              maxLength={300}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {isCustomer
              ? "Your new time is held while the studio reviews it, and any deposit you've paid stays with the booking. The studio needs a couple of hours' notice, and the time has to fall inside its opening hours."
              : "The customer is emailed the old and new times straight away."}
          </p>
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
            disabled={mutation.isPending || !date || !time || unchanged}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isCustomer ? "Requesting…" : "Moving…"}
              </>
            ) : isCustomer ? (
              "Request new time"
            ) : (
              "Move appointment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
