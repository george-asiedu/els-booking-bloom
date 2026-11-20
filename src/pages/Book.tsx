import { businessHoursApi } from "@/lib/api";
import { apiRequest } from "@/lib/apiClient";
import { doesService, staffApi } from "@/lib/api/staff";
import { vouchersApi, type VoucherCheck } from "@/lib/api/vouchers";
import { slotIsBusyForStaff } from "@/lib/slots";
import { useState, useEffect } from "react";
import { PROCESSING, useProcessing } from "@/components/ProcessingOverlay";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toWhatsappNumber } from "@/lib/whatsapp";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Loader2, Upload, UserRound, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { StudioPageHero } from "@/components/storefront/StudioPageHero";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  servicesApi,
  profileApi,
  appointmentsApi,
  accountApi,
  paymentsApi,
  productsApi,
  commerceApi,
  ordersApi,
  AppointmentDTO,
} from "@/lib/api";
import { takePendingBooking } from "@/lib/pendingBooking";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { PaymentDialog } from "@/components/payment/PaymentDialog";
import { PaymentTarget } from "@/lib/api";
import { slotIsBusy, parseDurationMinutes } from "@/lib/slots";
import { formatGHS } from "@/lib/currency";
import { computeBookingPricing } from "./book/pricing";
import { useDesignImage } from "./book/useDesignImage";
import { useAddOns } from "./book/useAddOns";
import { AdminCannotBook, BookingSuccess } from "./book/BookingStates";
import { AddOnPicker } from "./book/AddOnPicker";
import { BookingSummary } from "./book/BookingSummary";

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

const bookingSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  // The studio confirms on WhatsApp, so it must be a number WhatsApp can open.
  phone: z
    .string()
    .refine((v) => toWhatsappNumber(v) !== null, "Enter a phone number like 024 555 0142"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  service: z.string().min(1, "Please select a service"),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string().min(1, "Please select a time"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const Book = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<AppointmentDTO | null>(null);
  const [applyPoints, setApplyPoints] = useState(false);
  const [referral, setReferral] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"full" | "partial">("full");
  // In-app payment dialog state.
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentKind, setPaymentKind] = useState<"service" | "combined">("service");
  const [payAppointment, setPayAppointment] = useState<{
    id: string;
    type: "FULL" | "PARTIAL";
    guestToken?: string;
  } | null>(null);
  const designImage = useDesignImage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { features, config, name: studioName } = useStudio();
  const loyaltyCap = config?.settings.loyaltyCapPercent ?? 30;
  const queryClient = useQueryClient();

  // Fetch services from the API
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["public-services"],
    queryFn: () => servicesApi.listActive(),
  });

  // Fetch user profile if logged in
  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => profileApi.getMine(),
    enabled: !!user,
  });

  // Loyalty balance — lets logged-in customers apply points as a discount.
  const { data: loyalty } = useQuery({
    queryKey: ["loyalty-points", user?.id],
    queryFn: () => accountApi.getLoyalty(),
    enabled: !!user,
  });
  const availablePoints = loyalty?.points ?? 0;

  // Payment policy — controls whether the customer pays at booking.
  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => paymentsApi.getSettings(),
  });
  const paymentEnabled =
    features.onlinePayments &&
    !!paymentSettings?.enabled &&
    (paymentSettings.allow_full || paymentSettings.allow_partial);

  // Default the method to whatever the admin allows (full preferred).
  useEffect(() => {
    if (paymentSettings) {
      setPaymentMethod(paymentSettings.allow_full ? "full" : "partial");
    }
  }, [paymentSettings]);

  // Product add-ons for the booking (only when the shop is enabled).
  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });
  const shopEnabled =
    features.productsInBooking &&
    features.commerce &&
    (commerce?.enabled ?? false);
  const { data: products = [] } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => productsApi.listActive(),
    enabled: shopEnabled,
  });

  // Products added to the booking.
  const {
    addOns,
    setAddOns,
    items: addOnItems,
    subtotal: productSubtotal,
    hasAddOns,
    setQty: setAddOnQty,
  } = useAddOns(products);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      service: "",
      notes: "",
    },
  });

  // Links like /book?service=…&date=… (a waitlist "slot opened" email) pick
  // the service and day.
  const [linkParams] = useSearchParams();
  useEffect(() => {
    const service = linkParams.get("service");
    const date = linkParams.get("date");
    if (service) form.setValue("service", service);
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const d = new Date(`${date}T12:00:00`);
      if (!Number.isNaN(d.getTime())) form.setValue("date", d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A booking a guest started before logging in — restored once on mount.
  const [restored] = useState(() => takePendingBooking());
  useEffect(() => {
    if (!restored) return;
    const r = restored;
    if (r.fullName) form.setValue("fullName", r.fullName);
    if (r.phone) form.setValue("phone", r.phone);
    if (r.email) form.setValue("email", r.email);
    if (r.service) form.setValue("service", r.service);
    if (r.time) form.setValue("time", r.time);
    if (r.notes) form.setValue("notes", r.notes);
    if (r.date) {
      const d = new Date(r.date);
      if (!Number.isNaN(d.getTime())) form.setValue("date", d);
    }
    if (r.addOns) setAddOns(r.addOns);
    if (typeof r.applyPoints === "boolean") setApplyPoints(r.applyPoints);
    if (r.paymentMethod) setPaymentMethod(r.paymentMethod);
    if (r.referral) setReferral(r.referral);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill from the account: profile first, then fall back to the login email.
  // Skipped when we've just restored a guest's own typed details (those win).
  useEffect(() => {
    if (restored) return;
    if (profile) {
      form.setValue("fullName", profile.full_name || "");
      form.setValue("phone", profile.phone || "");
    }
    if (profile?.email || user?.email) {
      form.setValue("email", profile?.email || user?.email || "");
    }
  }, [profile, user, form, restored]);

  // Slots unavailable for the chosen date are removed from the picker.
  //
  // This has to account for how long each booking RUNS, not just when it
  // starts: a 4-hour service booked at 10:00 also occupies 11:00, 12:00 and
  // 13:00, and the server refuses those. Offering them would only produce a
  // rejection after the customer had filled the form in.
  const selectedDate = form.watch("date");
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const { data: busy = [] } = useQuery({
    queryKey: ["busy-slots", selectedDateStr],
    queryFn: () => appointmentsApi.busySlots(selectedDateStr),
    enabled: !!selectedDateStr,
  });

  // The chosen service's length decides which slots it can still fit into, so
  // changing the service re-filters the times.
  const selectedService = services.find((s) => s.id === form.watch("service"));
  const serviceMinutes = parseDurationMinutes(selectedService?.duration);

  // Staff: customers can pick a person or "anyone". With no staff set up, the
  // studio takes one booking at a time, as before.
  const { data: allStaff = [] } = useQuery({
    queryKey: ["public-staff"],
    queryFn: () => staffApi.listActive(),
    staleTime: 5 * 60 * 1000,
  });
  const [staffChoice, setStaffChoice] = useState<string>("any");
  const qualifiedStaff = allStaff.filter((s) => doesService(s, selectedService?.id));
  const staffMode = allStaff.length > 0 && qualifiedStaff.length > 0;
  useEffect(() => {
    // A person who doesn't do the newly chosen service falls back to "anyone".
    if (staffChoice !== "any" && !qualifiedStaff.some((s) => s.id === staffChoice)) setStaffChoice("any");
  }, [qualifiedStaff, staffChoice]);
  const slotBusy = (t: string) =>
    staffMode
      ? slotIsBusyForStaff(t, serviceMinutes, busy, staffChoice === "any" ? qualifiedStaff.map((s) => s.id) : [staffChoice])
      : slotIsBusy(t, serviceMinutes, busy);
  const availableTimeSlots = timeSlots.filter((t) => !slotBusy(t));

  // If the picked time becomes unavailable after choosing a date or a longer
  // service, clear it rather than letting the form carry a slot that will fail.
  const selectedTime = form.watch("time");
  useEffect(() => {
    if (selectedTime && slotBusy(selectedTime)) {
      form.setValue("time", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, selectedTime, serviceMinutes, form, staffChoice]);

  const pricing = computeBookingPricing({
    service: selectedService,
    signedIn: !!user,
    availablePoints,
    loyaltyCapPercent: loyaltyCap,
    applyPoints,
    paymentEnabled,
    paymentMethod,
    depositPercent: paymentSettings?.deposit_percent ?? 50,
    productSubtotal,
  });
  const { effectiveApplyPoints, payNowAmount, bookingPayNow } = pricing;

  // A gift card or package code: checked here, taken when the booking is made.
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherCheck | null>(null);
  const checkVoucher = useMutation({
    mutationFn: () => vouchersApi.check(voucherInput, selectedService?.id),
    onSuccess: (v) => setVoucher(v),
    onError: (e) => {
      setVoucher(null);
      toast({ variant: "destructive", title: e instanceof Error ? e.message : "That code isn't valid" });
    },
  });
  // A package only covers its own service.
  useEffect(() => {
    if (voucher?.kind === "PACKAGE" && selectedService && voucher.serviceId !== selectedService.id) setVoucher(null);
  }, [voucher, selectedService]);
  const voucherCovers =
    voucher && selectedService
      ? voucher.kind === "PACKAGE"
        ? selectedService.effective_price
        : Math.min(voucher.balance, selectedService.effective_price)
      : 0;

  // Customers who've missed bookings pay in full rather than a deposit.
  const { data: standing } = useQuery({
    queryKey: ["booking-standing", user?.id],
    queryFn: async () =>
      (await apiRequest<{ data: { noShows: number; mustPayInFull: boolean } }>("/appointments/me/standing", { auth: true })).data,
    enabled: !!user,
  });
  const mustPayInFull = Boolean(standing?.mustPayInFull);
  const offeredPaymentSettings =
    mustPayInFull && paymentSettings ? { ...paymentSettings, allow_partial: false, allow_full: true } : paymentSettings;
  useEffect(() => {
    if (mustPayInFull && paymentMethod === "partial") setPaymentMethod("full");
  }, [mustPayInFull, paymentMethod]);

  // Days the studio is closed: its weekly closed days and one-off closures.
  const { data: weekHours = [] } = useQuery({ queryKey: ["business-hours"], queryFn: () => businessHoursApi.list() });
  const { data: closures = [] } = useQuery({
    queryKey: ["closures"],
    queryFn: async () => (await apiRequest<{ data: { date: string }[] }>("/business-hours/closures")).data,
  });
  const closedWeekdays = new Set(weekHours.filter((h) => h.is_closed).map((h) => h.day_of_week));
  const closedDates = new Set(closures.map((c) => c.date));

  // Waitlist for a full day: uses the name and contact details already typed.
  const joinWaitlist = useMutation({
    mutationFn: () =>
      apiRequest<{ message: string }>("/waitlist", {
        method: "POST",
        auth: true,
        body: {
          serviceId: selectedService?.id,
          date: selectedDateStr,
          name: form.getValues("fullName") || profile?.full_name || "",
          email: form.getValues("email") || user?.email || "",
          phone: form.getValues("phone") || "",
        },
      }),
    onSuccess: (r) => toast({ title: "You're on the waitlist", description: r.message }),
    onError: (e) =>
      toast({
        variant: "destructive",
        title: "Couldn't join the waitlist",
        description: e instanceof Error ? `${e.message}. Fill in your name and email above first.` : undefined,
      }),
  });

  const processing = useProcessing();
  const bookingMutation = useMutation({
    // Saving the booking and setting up its payment: cover the screen so the
    // customer doesn't tap twice or leave mid-way.
    onMutate: () => {
      if (hasAddOns || paymentEnabled) processing.show(PROCESSING.booking);
    },
    onSettled: () => processing.hide(),
    mutationFn: (data: BookingFormValues) =>
      appointmentsApi.create({
        full_name: data.fullName,
        phone: data.phone,
        email: data.email || null,
        service_id: data.service,
        appointment_date: format(data.date, "yyyy-MM-dd"),
        appointment_time: data.time,
        notes: data.notes || null,
        design_image: designImage.file,
        apply_points: voucher ? false : effectiveApplyPoints,
        staff_id: staffMode ? staffChoice : undefined,
        voucher_code: voucher?.code,
        guest: !user,
      }),
    onSuccess: async (appointment) => {
      // Points were spent and this slot is now taken — refresh both.
      queryClient.invalidateQueries({ queryKey: ["loyalty-points", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["busy-slots"] });

      const type = paymentMethod === "partial" ? "PARTIAL" : "FULL";

      // Products added → one combined charge (service + products) via Paystack.
      if (hasAddOns) {
        try {
          const res = await ordersApi.bookingCheckout({
            appointmentId: appointment.id,
            items: addOnItems.map((i) => ({
              productId: i.product.id,
              quantity: i.qty,
            })),
            serviceType: type,
            referralCode: referral.trim() || undefined,
          });
          setBookedAppointment(appointment);
          setPaymentKind("combined");
          setPayAppointment({ id: appointment.id, type });
          setPaymentTarget({
            reference: res.reference,
            amount: res.total,
            email: res.email,
            access_code: res.access_code,
            subaccount: res.subaccount,
            public_key: res.public_key,
            processing_fee: res.processing_fee,
          });
          setPaymentOpen(true);
          return;
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Couldn't start payment",
            description:
              error instanceof Error ? error.message : "Please try again.",
          });
        }
      } else if (paymentEnabled && appointment.amount_due > 0) {
        // Service-only online payment (nothing to pay when a gift card or
        // package covered it).
        try {
          const init = await paymentsApi.initialize(appointment.id, type, appointment.guest_token);
          setBookedAppointment(appointment);
          setPaymentKind("service");
          setPayAppointment({ id: appointment.id, type, ...(appointment.guest_token ? { guestToken: appointment.guest_token } : {}) });
          setPaymentTarget({
            reference: init.reference,
            amount: init.amount,
            email: init.email,
            access_code: init.access_code,
            subaccount: init.subaccount,
            public_key: init.public_key,
            processing_fee: init.processing_fee,
          });
          setPaymentOpen(true);
          return;
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Couldn't start payment",
            description:
              (error instanceof Error ? error.message : "Please try again.") +
              " Your booking is saved as payment pending.",
          });
        }
      }

      setBookedAppointment(appointment);
      setIsSubmitted(true);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    // Guests can book and pay without an account; their email is how the
    // studio confirms and sends the receipt.
    if (!user && !data.email?.trim()) {
      form.setError("email", { message: "Enter your email so we can confirm your booking" });
      return;
    }
    bookingMutation.mutate(data);
  };

  const resetBooking = () => {
    setIsSubmitted(false);
    setBookedAppointment(null);
    setApplyPoints(false);
    designImage.clear();
    form.reset();
  };

  if (isSubmitted) {
    return (
      <BookingSuccess
        studioName={studioName}
        onBookAnother={resetBooking}
      />
    );
  }

  if (user?.role === "ADMIN") return <AdminCannotBook />;

  return (
    <Layout>
      <StudioPageHero
        eyebrow="Book an appointment"
        title="Let's get you booked in."
        description="Choose your service, pick a time that works, and we'll confirm your appointment."
        variant="compact"
      />

      {/* Booking Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{user ? "Email (optional)" : "Email *"}</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Service */}
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - {formatGHS(service.effective_price)}
                              {service.on_promo ? " (Promo)" : ""} ({service.duration})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Who: only when the studio has staff who do this service. */}
                {staffMode && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Who would you like?</p>
                    <div role="radiogroup" aria-label="Who would you like?" className="flex flex-wrap gap-2">
                      {[{ id: "any", name: "Anyone available", photoUrl: null as string | null }, ...qualifiedStaff].map((s) => {
                        const on = staffChoice === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setStaffChoice(s.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition-colors",
                              on ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/50",
                            )}
                          >
                            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted">
                              {s.photoUrl ? <img src={s.photoUrl} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4 text-muted-foreground" />}
                            </span>
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Preferred Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today || closedWeekdays.has(date.getDay()) || closedDates.has(format(date, "yyyy-MM-dd"));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Time */}
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Time *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedDateStr}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                selectedDateStr
                                  ? "Select a time"
                                  : "Pick a date first"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTimeSlots.length === 0 ? (
                            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                              {selectedDateStr
                                ? "No times left for this date"
                                : "Pick a date first"}
                            </div>
                          ) : (
                            availableTimeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedDateStr && busy.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {availableTimeSlots.length === 0
                            ? "Every time that day is taken. Try another date, or join the waitlist below."
                            : serviceMinutes && serviceMinutes > 60
                              ? "Times that don't leave room for this service are hidden."
                              : "Times already booked are hidden."}
                        </p>
                      )}
                      {selectedDateStr && selectedService && availableTimeSlots.length === 0 && busy.length > 0 && (
                        <div className="rounded-lg border border-border p-3 text-sm">
                          <p className="font-medium">This day is full</p>
                          <p className="mt-0.5 text-muted-foreground">
                            Join the waitlist and we'll tell you if a slot opens up on this day.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            disabled={joinWaitlist.isPending || joinWaitlist.isSuccess}
                            onClick={() => joinWaitlist.mutate()}
                          >
                            {joinWaitlist.isSuccess ? "You're on the waitlist" : "Join the waitlist"}
                          </Button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gift card or package */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Gift card or package code</p>
                  {voucher ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
                      <span>
                        <span className="font-medium">{voucher.code}</span>
                        {" · "}
                        {voucher.kind === "PACKAGE"
                          ? `Uses 1 of ${voucher.sessionsLeft} sessions left`
                          : `Covers ${formatGHS(voucherCovers)} of this booking`}
                      </span>
                      <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setVoucher(null)}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                        placeholder="GIFT-XXXX-XXXX"
                        aria-label="Gift card or package code"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!voucherInput.trim() || !selectedService || checkVoucher.isPending}
                        onClick={() => checkVoucher.mutate()}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any design ideas, references, or special requests..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Design reference image */}
                <div className="space-y-2">
                  <FormLabel>Design Inspiration (optional)</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Have a style in mind? Upload a photo of the look you want.
                  </p>
                  {designImage.preview ? (
                    <div className="relative inline-block">
                      <img
                        src={designImage.preview}
                        alt="Design reference preview"
                        className="max-h-48 rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                        aria-label="Remove design image"
                        onClick={designImage.clear}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => designImage.inputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Upload className="h-8 w-8 mb-2" />
                        <p>Click to upload an image</p>
                        <p className="text-xs">JPG, PNG, or WebP</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={designImage.inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={designImage.onChange}
                    className="hidden"
                  />
                </div>

                {/* Product add-ons */}
                {user && shopEnabled && products.length > 0 && (
                  <AddOnPicker
                    products={products}
                    quantities={addOns}
                    onChange={setAddOnQty}
                  />
                )}

                {/* Loyalty points discount + order summary */}
                {selectedService && (
                  <BookingSummary
                    service={selectedService}
                    pricing={pricing}
                    signedIn={!!user}
                    availablePoints={availablePoints}
                    loyaltyCapPercent={loyaltyCap}
                    applyPoints={applyPoints}
                    onApplyPointsChange={setApplyPoints}
                    addOnItems={addOnItems}
                    productSubtotal={productSubtotal}
                    referral={referral}
                    onReferralChange={setReferral}
                    paymentEnabled={paymentEnabled}
                    paymentSettings={offeredPaymentSettings}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                  />
                )}

                {mustPayInFull && paymentEnabled && (
                  <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    Because of missed appointments, this booking needs to be paid in full.
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={bookingMutation.isPending || servicesLoading}
                >
                  {bookingMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {hasAddOns
                      ? `Pay ${formatGHS(bookingPayNow)} & Book`
                      : paymentEnabled
                        ? `Pay ${formatGHS(payNowAmount)} & Book`
                        : "Request Appointment"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </section>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        target={paymentTarget}
        title="Pay to confirm your booking"
        momoCharge={
          paymentKind === "service" && payAppointment
            ? (phone, provider) =>
                paymentsApi.chargeMomo({
                  appointmentId: payAppointment.id,
                  type: payAppointment.type,
                  phone,
                  provider,
                  ...(payAppointment.guestToken ? { guestToken: payAppointment.guestToken } : {}),
                })
            : undefined
        }
        onSuccess={(reference) => {
          const path =
            paymentKind === "combined"
              ? "/booking/callback"
              : "/payment/callback";
          navigate(`${path}?reference=${encodeURIComponent(reference)}`);
        }}
      />
    </Layout>
  );
};

export default Book;
