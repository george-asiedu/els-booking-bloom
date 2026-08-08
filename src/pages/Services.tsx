import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { services as staticServices } from "@/data/services";
import { servicesApi, categoriesApi } from "@/lib/api";

const titleize = (slug: string) =>
  slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

interface DisplayService {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  promo_price?: number | null;
  on_promo?: boolean;
  popular?: boolean;
  category: string;
}

const Services = () => {
  // Prefer live services from the API; fall back to the static menu so the page
  // is never empty (e.g. before any services are added, or if the API is down).
  const { data: apiServices, isLoading } = useQuery({
    queryKey: ["public-services-catalog"],
    queryFn: () => servicesApi.listActive(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => categoriesApi.listActive(),
  });

  const source: DisplayService[] =
    apiServices && apiServices.length > 0 ? apiServices : staticServices;

  const nameBySlug = new Map((categoriesData ?? []).map((c) => [c.slug, c.name]));
  const catName = (slug: string) => nameBySlug.get(slug) ?? titleize(slug);

  // Category tabs, ordered by the admin's category order, limited to those
  // that actually have services.
  const present = Array.from(new Set(source.map((s) => s.category)));
  const orderedSlugs = (categoriesData ?? []).map((c) => c.slug);
  const tabSlugs = [
    ...orderedSlugs.filter((s) => present.includes(s)),
    ...present.filter((s) => !orderedSlugs.includes(s)),
  ];

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Our Services
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From classic manicures to dramatic volume lashes and statement hairstyling, explore our full menu of beauty services
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 mb-12 h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {tabSlugs.map((slug) => (
                <TabsTrigger key={slug} value={slug}>
                  {catName(slug)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-12">
                {tabSlugs.map((slug) => (
                  <ServiceCategory
                    key={slug}
                    title={`${catName(slug)} Services`}
                    services={source.filter((s) => s.category === slug)}
                  />
                ))}
              </div>
            </TabsContent>

            {tabSlugs.map((slug) => (
              <TabsContent key={slug} value={slug}>
                <ServiceCategory
                  title={`${catName(slug)} Services`}
                  services={source.filter((s) => s.category === slug)}
                />
              </TabsContent>
            ))}
          </Tabs>
          )}

          {/* Book CTA */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">Ready to book your appointment?</p>
            <Button size="lg" asChild>
              <Link to="/book">
                Book Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-8 text-center">
            Good to Know
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Cancellation Policy",
                description: "Please provide at least 24 hours notice for cancellations to avoid a fee.",
              },
              {
                title: "Lash Refills",
                description: "Refills are recommended every 2-3 weeks for best results.",
              },
              {
                title: "Aftercare",
                description: "Detailed aftercare instructions provided with every service.",
              },
            ].map((policy) => (
              <div key={policy.title} className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">{policy.title}</h3>
                <p className="text-sm text-muted-foreground">{policy.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

interface ServiceCategoryProps {
  title: string;
  services: DisplayService[];
}

const ServiceCategory = ({ title, services }: ServiceCategoryProps) => (
  <div>
    <h2 className="text-2xl font-serif font-bold text-foreground mb-6">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service, index) => (
        <div
          key={service.id}
          className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex gap-2 mb-3">
            {service.popular && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                Popular
              </span>
            )}
            {service.on_promo && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-full">
                Promo
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{service.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {service.on_promo && service.promo_price != null ? (
              <span className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  GHS {service.price}
                </span>
                <span className="text-xl font-bold text-primary">
                  GHS {service.promo_price}
                </span>
              </span>
            ) : (
              <span className="text-xl font-bold text-primary">GHS {service.price}</span>
            )}
            <span className="text-sm text-muted-foreground">{service.duration}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Services;
