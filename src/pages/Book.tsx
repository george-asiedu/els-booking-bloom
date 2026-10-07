import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Loader2, Upload, X } from "lucide-react";
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
  contactInfoApi,
  accountApi,
  paymentsApi,
  productsApi,
  commerceApi,
  ordersApi,
  AppointmentDTO,
} from "@/lib/api";
import { whatsappLink } from "@/lib/whatsapp";
import { setPendingBooking, takePendingBooking } from "@/lib/pendingBooking";
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
  phone: z.string().min(10, "Please enter a valid phone number"),
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

  // Studio contact info — used for the WhatsApp confirmation button.
  const { data: contactInfo } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
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
  const availableTimeSlots = timeSlots.filter(
    (t) => !slotIsBusy(t, serviceMinutes, busy),
  );

  // If the picked time becomes unavailable after choosing a date or a longer
  // service, clear it rather than letting the form carry a slot that will fail.
  const selectedTime = form.watch("time");
  useEffect(() => {
    if (selectedTime && slotIsBusy(selectedTime, serviceMinutes, busy)) {
      form.setValue("time", "");
    }
  }, [busy, selectedTime, serviceMinutes, form]);

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

  const bookingMutation = useMutation({
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
        apply_points: effectiveApplyPoints,
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
      } else if (paymentEnabled) {
        // Service-only online payment.
        try {
          const init = await paymentsApi.initialize(appointment.id, type);
          setBookedAppointment(appointment);
          setPaymentKind("service");
          setPayAppointment({ id: appointment.id, type });
          setPaymentTarget({
            reference: init.reference,
            amount: init.amount,
            email: init.email,
            access_code: init.access_code,
            subaccount: init.subaccount,
            public_key: init.public_key,
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
    // Anyone can fill the form, but booking/paying requires an account. Save the
    // filled-in details and send guests to log in / sign up — they come back to
    // /book with everything restored (the design image can't be saved).
    if (!user) {
      setPendingBooking({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        service: data.service,
        date: data.date ? data.date.toISOString() : undefined,
        time: data.time,
        notes: data.notes,
        addOns,
        applyPoints,
        paymentMethod,
        referral,
      });
      toast({
        title: "Almost there",
        description: "Log in or sign up to confirm your appointment.",
      });
      navigate("/login?redirect=/book");
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

  // Pre-filled WhatsApp message to the studio confirming the request.
  const studioWhatsapp =
    contactInfo?.showWhatsapp && contactInfo.whatsapp ? contactInfo.whatsapp : null;
  const whatsappConfirmLink =
    studioWhatsapp && bookedAppointment
      ? whatsappLink(
          studioWhatsapp,
          `Hi ${studioName}, I've just requested an appointment:\n\n` +
            `Service: ${bookedAppointment.services?.name ?? "Service"}\n` +
            `Name: ${bookedAppointment.full_name}\n` +
            `Date: ${bookedAppointment.appointment_date}\n` +
            `Time: ${bookedAppointment.appointment_time}\n` +
            `Status: Pending confirmation\n\n` ,
        )
      : null;

  if (isSubmitted) {
    return (
      <BookingSuccess
        studioName={studioName}
        whatsappConfirmLink={whatsappConfirmLink}
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
                      <FormLabel>Email (optional)</FormLabel>
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
                            disabled={(date) =>
                              date < new Date() || date.getDay() === 0
                            }
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
                            ? "Every time that day is taken. Please try another date."
                            : serviceMinutes && serviceMinutes > 60
                              ? "Times that don't leave room for this service are hidden."
                              : "Times already booked are hidden."}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
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
                {shopEnabled && products.length > 0 && (
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
                    paymentSettings={paymentSettings}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                  />
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
                  {!user
                    ? "Log in to book"
                    : hasAddOns
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
