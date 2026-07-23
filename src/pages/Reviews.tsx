import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { servicesApi, reviewsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  serviceId: z.string().optional(),
  rating: z.number().min(1, "Please select a rating").max(5),
  content: z.string().min(10, "Review must be at least 10 characters").max(500),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const Reviews = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const serviceIdFromUrl = searchParams.get("service") || "";
  const appointmentIdFromUrl = searchParams.get("appointment") || "";

  const { data: services = [] } = useQuery({
    queryKey: ["services-for-review"],
    queryFn: () => servicesApi.listActive(),
  });

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      // "general" is a sentinel — Radix Select items can't have an empty value.
      serviceId: serviceIdFromUrl || "general",
      rating: 0,
      content: "",
    },
  });

  const rating = form.watch("rating");

  const submitMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      if (!user) throw new Error("Must be logged in");

      const serviceId =
        data.serviceId && data.serviceId !== "general" ? data.serviceId : undefined;
      await reviewsApi.create({
        rating: data.rating,
        content: data.content,
        ...(serviceId ? { serviceId } : {}),
        ...(appointmentIdFromUrl ? { appointmentId: appointmentIdFromUrl } : {}),
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit review",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ReviewFormValues) => {
    submitMutation.mutate(data);
  };

  // Redirect unauthenticated users after render (never call navigate mid-render).
  useEffect(() => {
    if (!user) navigate("/login?redirect=/review");
  }, [user, navigate]);

  if (!user) return null;

  if (isSubmitted) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
                Thank You!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your review has been submitted and will be visible once approved.
              </p>
              <Button onClick={() => navigate("/account")}>
                Back to Account
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
            Leave a Review
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Share your experience and help others discover our services
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-card border border-border rounded-lg p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service (optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="General review" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General Review</SelectItem>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating *</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => field.onChange(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="p-1 transition-transform hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    "h-8 w-8 transition-colors",
                                    star <= (hoveredRating || rating)
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Review *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your experience..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Review
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Reviews;
