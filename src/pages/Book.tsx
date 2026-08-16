import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, CheckCircle, Loader2, Upload, X, MessageCircle, Plus, Minus, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
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
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";

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

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
}

// Loyalty: 10 points = GHS 1 off, capped at 30% of the service price.
const POINTS_PER_GHS = 10;
const MAX_DISCOUNT_RATIO = 0.3;

const Book = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<AppointmentDTO | null>(null);
  const [designImage, setDesignImage] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [applyPoints, setApplyPoints] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"full" | "partial">("full");
  const [redirecting, setRedirecting] = useState(false);
  // Products added to the booking: productId -> quantity.
  const [addOns, setAddOns] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { features } = useStudio();
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

  const addOnItems = Object.entries(addOns)
    .map(([id, qty]) => {
      const p = products.find((pr) => pr.id === id);
      return p ? { product: p, qty } : null;
    })
    .filter((x): x is { product: (typeof products)[number]; qty: number } => !!x);
  const productSubtotal = addOnItems.reduce(
    (s, i) => s + i.product.effective_price * i.qty,
    0,
  );
  const hasAddOns = addOnItems.length > 0;

  const setAddOnQty = (id: string, qty: number) =>
    setAddOns((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

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

  // Pre-fill from the account: profile first, then fall back to the login email.
  useEffect(() => {
    if (profile) {
      form.setValue("fullName", profile.full_name || "");
      form.setValue("phone", profile.phone || "");
    }
    if (profile?.email || user?.email) {
      form.setValue("email", profile?.email || user?.email || "");
    }
  }, [profile, user, form]);

  // Times already booked for the chosen date are removed from the picker.
  const selectedDate = form.watch("date");
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const { data: takenSlots = [] } = useQuery({
    queryKey: ["taken-slots", selectedDateStr],
    queryFn: () => appointmentsApi.takenSlots(selectedDateStr),
    enabled: !!selectedDateStr,
  });
  const availableTimeSlots = timeSlots.filter((t) => !takenSlots.includes(t));

  // If the picked time becomes unavailable after choosing a date, clear it.
  const selectedTime = form.watch("time");
  useEffect(() => {
    if (selectedTime && takenSlots.includes(selectedTime)) {
      form.setValue("time", "");
    }
  }, [takenSlots, selectedTime, form]);

  const handleDesignImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesignImage(file);
      setDesignPreview(URL.createObjectURL(file));
    }
  };

  const clearDesignImage = () => {
    setDesignImage(null);
    setDesignPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Loyalty discount preview for the selected service.
  const selectedService = services.find((s) => s.id === form.watch("service"));
  const onPromo = selectedService?.on_promo ?? false;
  const servicePrice = selectedService?.effective_price ?? 0;
  const maxPointsByCap = Math.floor(
    servicePrice * MAX_DISCOUNT_RATIO * POINTS_PER_GHS,
  );
  const pointsToUse = Math.min(availablePoints, maxPointsByCap);
  const discount = pointsToUse / POINTS_PER_GHS;
  // Points can't be combined with a promo price.
  const canUsePoints = !!user && availablePoints > 0 && discount > 0 && !onPromo;
  const effectiveApplyPoints = applyPoints && canUsePoints;
  const amountDue = servicePrice - (effectiveApplyPoints ? discount : 0);

  // Payment split preview.
  const depositPercent = paymentSettings?.deposit_percent ?? 50;
  const depositAmount = Math.round(amountDue * (depositPercent / 100) * 100) / 100;
  const payNowAmount = paymentMethod === "partial" ? depositAmount : amountDue;
  const balanceAfterDeposit = Math.max(0, amountDue - depositAmount);
  // Combined amount charged now when products are added (service due + products).
  const bookingPayNow =
    Math.round(
      ((paymentEnabled ? payNowAmount : 0) + productSubtotal) * 100,
    ) / 100;

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
        design_image: designImage,
        apply_points: effectiveApplyPoints,
      }),
    onSuccess: async (appointment) => {
      // Points were spent and this slot is now taken — refresh both.
      queryClient.invalidateQueries({ queryKey: ["loyalty-points", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["taken-slots"] });

      // Products added → one combined charge (service + products) via Paystack.
      if (hasAddOns) {
        try {
          setRedirecting(true);
          const res = await ordersApi.bookingCheckout({
            appointmentId: appointment.id,
            items: addOnItems.map((i) => ({
              productId: i.product.id,
              quantity: i.qty,
            })),
            serviceType: paymentMethod === "partial" ? "PARTIAL" : "FULL",
          });
          window.location.href = res.authorization_url;
          return;
        } catch (error) {
          setRedirecting(false);
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
          setRedirecting(true);
          const init = await paymentsApi.initialize(
            appointment.id,
            paymentMethod === "partial" ? "PARTIAL" : "FULL",
          );
          window.location.href = init.authorization_url;
          return;
        } catch (error) {
          setRedirecting(false);
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
    bookingMutation.mutate(data);
  };

  const resetBooking = () => {
    setIsSubmitted(false);
    setBookedAppointment(null);
    setApplyPoints(false);
    clearDesignImage();
    form.reset();
  };

  // Pre-filled WhatsApp message to the studio confirming the request.
  const studioWhatsapp =
    contactInfo?.showWhatsapp && contactInfo.whatsapp ? contactInfo.whatsapp : null;
  const whatsappConfirmLink =
    studioWhatsapp && bookedAppointment
      ? whatsappLink(
          studioWhatsapp,
          `Hi El's Beauty Studio, I've just requested an appointment:\n\n` +
            `Service: ${bookedAppointment.services?.name ?? "Service"}\n` +
            `Name: ${bookedAppointment.full_name}\n` +
            `Date: ${bookedAppointment.appointment_date}\n` +
            `Time: ${bookedAppointment.appointment_time}\n` +
            `Status: Pending confirmation\n\n` ,
        )
      : null;

  if (isSubmitted) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
                Booking Request Received!
              </h1>
              <p className="text-muted-foreground mb-6">
                Thank you for booking with El's Beauty Studio. Your request is
                <span className="font-medium text-foreground"> pending confirmation</span> —
                we'll confirm shortly. Send us a quick WhatsApp so we can keep you updated.
              </p>
              <div className="flex flex-col gap-3">
                {whatsappConfirmLink && (
                  <Button asChild className="bg-[#25D366] hover:bg-[#1da851] text-white">
                    <a href={whatsappConfirmLink} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Confirm on WhatsApp
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={resetBooking}>
                  Book Another Appointment
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Booking is customer-only — guests must log in, admins can't book.
  if (!user) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-3">
                Log in to book
              </h1>
              <p className="text-muted-foreground mb-6">
                Appointments are for registered customers. Log in or create an
                account to book, earn loyalty points and track your visits.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link to="/login?redirect=/book">Log in</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/signup">Create an account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <h1 className="text-3xl font-serif font-bold text-foreground mb-3">
                Admins can't book appointments
              </h1>
              <p className="text-muted-foreground mb-6">
                Appointment booking is for customer accounts only. Log in with a
                customer account to make a booking.
              </p>
              <Button asChild>
                <Link to="/admin">Back to dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Book an Appointment
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fill out the form below to request your appointment. I'll get back to you to confirm!
          </p>
        </div>
      </section>

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
                              {service.name} - GHS {service.effective_price}
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
                      {selectedDateStr && takenSlots.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Some times are already booked and hidden.
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
                  {designPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={designPreview}
                        alt="Design reference preview"
                        className="max-h-48 rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                        onClick={clearDesignImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Upload className="h-8 w-8 mb-2" />
                        <p>Click to upload an image</p>
                        <p className="text-xs">JPG, PNG, or WebP</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleDesignImageChange}
                    className="hidden"
                  />
                </div>

                {/* Product add-ons */}
                {shopEnabled && products.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Add products (optional)
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Grab products to go with your appointment — paid together
                      and collected at the studio.
                    </p>
                    <div className="space-y-2">
                      {products.map((p) => {
                        const qty = addOns[p.id] ?? 0;
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-md border border-border p-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {p.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                GHS {p.effective_price}
                                {p.on_promo ? " (Promo)" : ""}
                              </p>
                            </div>
                            {qty > 0 ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setAddOnQty(p.id, qty - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm">
                                  {qty}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={p.track_stock && qty >= p.stock}
                                  onClick={() => setAddOnQty(p.id, qty + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!p.in_stock}
                                onClick={() => setAddOnQty(p.id, 1)}
                              >
                                {p.in_stock ? "Add" : "Out of stock"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Loyalty points discount + order summary */}
                {selectedService && (
                  <div className="rounded-lg border border-border p-4 space-y-3 bg-secondary/40">
                    {canUsePoints && (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-foreground">
                            Use my loyalty points
                          </p>
                          <p className="text-sm text-muted-foreground">
                            You have {availablePoints.toLocaleString()} points. Save{" "}
                            <span className="font-medium text-foreground">
                              GHS {discount}
                            </span>{" "}
                            ({pointsToUse.toLocaleString()} pts) on this booking —
                            up to 30% off.
                          </p>
                        </div>
                        <Switch
                          checked={applyPoints}
                          onCheckedChange={setApplyPoints}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Service price</span>
                      {onPromo && selectedService ? (
                        <span className="flex items-baseline gap-2">
                          <span className="text-muted-foreground line-through">
                            GHS {selectedService.price}
                          </span>
                          <span className="text-foreground">
                            GHS {servicePrice}
                          </span>
                          <span className="text-xs font-medium text-green-600">
                            Promo
                          </span>
                        </span>
                      ) : (
                        <span className="text-foreground">GHS {servicePrice}</span>
                      )}
                    </div>
                    {effectiveApplyPoints && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Points discount
                        </span>
                        <span className="text-green-600">− GHS {discount}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="font-semibold text-foreground">
                        {hasAddOns ? "Service" : "Amount due"}
                      </span>
                      <span
                        className={
                          hasAddOns
                            ? "font-semibold text-foreground"
                            : "text-xl font-bold text-primary"
                        }
                      >
                        GHS {amountDue}
                      </span>
                    </div>

                    {/* Product add-ons */}
                    {hasAddOns && (
                      <>
                        {addOnItems.map((i) => (
                          <div
                            key={i.product.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {i.product.name}{" "}
                              <span className="text-xs">x{i.qty}</span>
                            </span>
                            <span className="text-foreground">
                              GHS{" "}
                              {Math.round(
                                i.product.effective_price * i.qty * 100,
                              ) / 100}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="font-semibold text-foreground">
                            Products
                          </span>
                          <span className="font-semibold text-foreground">
                            GHS {productSubtotal}
                          </span>
                        </div>
                        {!paymentEnabled && (
                          <p className="text-xs text-muted-foreground">
                            The service is settled at the studio; products are
                            paid now.
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="font-semibold text-foreground">
                            You'll pay now
                          </span>
                          <span className="text-xl font-bold text-primary">
                            GHS {bookingPayNow}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Payment method — only when the admin requires payment. */}
                    {paymentEnabled && (
                      <div className="pt-3 border-t border-border space-y-3">
                        <p className="text-sm font-medium text-foreground">
                          Pay to confirm your booking
                        </p>
                        <div className="grid gap-2">
                          {paymentSettings?.allow_full && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("full")}
                              className={cn(
                                "flex items-center justify-between rounded-md border p-3 text-left transition-colors",
                                paymentMethod === "full"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50",
                              )}
                            >
                              <span className="text-sm font-medium text-foreground">
                                Pay in full
                              </span>
                              <span className="text-sm font-semibold text-primary">
                                GHS {amountDue}
                              </span>
                            </button>
                          )}
                          {paymentSettings?.allow_partial && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("partial")}
                              className={cn(
                                "flex items-center justify-between rounded-md border p-3 text-left transition-colors",
                                paymentMethod === "partial"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50",
                              )}
                            >
                              <span className="text-sm font-medium text-foreground">
                                Pay {depositPercent}% deposit
                                <span className="block text-xs text-muted-foreground">
                                  GHS {balanceAfterDeposit} due at the studio
                                </span>
                              </span>
                              <span className="text-sm font-semibold text-primary">
                                GHS {depositAmount}
                              </span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            You'll pay now
                          </span>
                          <span className="font-semibold text-foreground">
                            GHS {payNowAmount}
                          </span>
                        </div>
                      </div>
                    )}
                    {!paymentEnabled && (
                      <p className="text-xs text-muted-foreground">
                        No payment needed to book — you'll settle at the studio.
                      </p>
                    )}
                    {onPromo && (
                      <p className="text-xs text-muted-foreground">
                        This service is on promo — loyalty points can't be applied.
                      </p>
                    )}
                    {!user && (
                      <p className="text-xs text-muted-foreground">
                        Log in to earn and redeem loyalty points on your bookings.
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={
                    bookingMutation.isPending || servicesLoading || redirecting
                  }
                >
                  {(bookingMutation.isPending || redirecting) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {redirecting
                    ? "Redirecting to payment…"
                    : hasAddOns
                      ? `Pay GHS ${bookingPayNow} & Book`
                      : paymentEnabled
                        ? `Pay GHS ${payNowAmount} & Book`
                        : "Request Appointment"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Book;
