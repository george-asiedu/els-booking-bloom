import { useQuery } from "@tanstack/react-query";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  services?: {
    name: string;
  };
}

export const TestimonialsSection = () => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          content,
          created_at,
          profiles(full_name),
          services(name)
        `)
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as unknown as Review[];
    },
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

  if (reviews.length === 0) {
    return null;
  }

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
          {reviews.map((review, index) => (
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
