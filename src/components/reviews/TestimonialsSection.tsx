import { useQuery } from "@tanstack/react-query";
import { Star, Quote } from "lucide-react";
import { reviewsApi, ReviewDTO } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// Shown when there are no approved reviews yet, so the landing page always has
// social proof. Replaced by real reviews as soon as any are approved.
const fallbackTestimonials: ReviewDTO[] = [
  {
    id: "fallback-1",
    rating: 5,
    content:
      "Absolutely love my nails! El is so talented and always makes sure I leave feeling beautiful. The attention to detail is incredible.",
    approved: true,
    created_at: "",
    profiles: { full_name: "Amara O.", email: "" },
    services: { name: "Full Set Acrylics" },
  },
  {
    id: "fallback-2",
    rating: 5,
    content:
      "Best lash extensions I've ever had! They look so natural and last for weeks. Highly recommend El's Beauty Studio!",
    approved: true,
    created_at: "",
    profiles: { full_name: "Jade M.", email: "" },
    services: { name: "Volume Lash Set" },
  },
  {
    id: "fallback-3",
    rating: 5,
    content:
      "My hair has never looked better. El really listens to what you want and delivers beyond expectations. Will definitely be back!",
    approved: true,
    created_at: "",
    profiles: { full_name: "Tasha B.", email: "" },
    services: { name: "Hairstyling" },
  },
];

export const TestimonialsSection = () => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: () => reviewsApi.listApproved(),
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Always render something: fall back to curated testimonials when there are
  // no approved reviews yet.
  const testimonials = reviews.length > 0 ? reviews : fallbackTestimonials;

  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real experiences from our valued customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((review, index) => (
            <div
              key={review.id}
              className="bg-card border border-border rounded-lg p-6 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Quote className="h-8 w-8 text-primary/20 mb-4" />

              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>

              <p className="text-foreground mb-4 line-clamp-4">
                "{review.content}"
              </p>

              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {review.profiles?.full_name || "Anonymous"}
                </span>
                {review.services?.name && (
                  <span className="text-muted-foreground">
                    {review.services.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
