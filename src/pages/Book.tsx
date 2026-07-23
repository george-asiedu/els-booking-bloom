import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CalendarIcon, CheckCircle, Loader2, Upload, X, MessageCircle } from "lucide-react";
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
import {
  servicesApi,
  profileApi,
  appointmentsApi,
  contactInfoApi,
  AppointmentDTO,
} from "@/lib/api";
import { whatsappLink } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

const Book = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<AppointmentDTO | null>(null);
  const [designImage, setDesignImage] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
      }),
    onSuccess: (appointment) => {
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
          `Hi El's Beauty Studio 👋, I've just requested an appointment:\n\n` +
            `Service: ${bookedAppointment.services?.name ?? "Service"}\n` +
            `Date: ${bookedAppointment.appointment_date}\n` +
            `Time: ${bookedAppointment.appointment_time}\n` +
            `Status: Pending confirmation\n\n` +
            `Name: ${bookedAppointment.full_name}`,
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
                              {service.name} - GHS {service.price} ({service.duration})
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

                <Button type="submit" size="lg" className="w-full" disabled={bookingMutation.isPending || servicesLoading}>
                  {bookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Request Appointment
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
