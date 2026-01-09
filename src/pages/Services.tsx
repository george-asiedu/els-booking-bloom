import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { services, getServicesByCategory } from "@/data/services";

const Services = () => {
  const nailServices = getServicesByCategory("nails");
  const lashServices = getServicesByCategory("lashes");

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Our Services
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From classic manicures to dramatic volume lashes, explore our full menu of beauty services
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-12">
              <TabsTrigger value="all">All Services</TabsTrigger>
              <TabsTrigger value="nails">Nails</TabsTrigger>
              <TabsTrigger value="lashes">Lashes</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-12">
                <ServiceCategory title="Nail Services" services={nailServices} />
                <ServiceCategory title="Lash Services" services={lashServices} />
              </div>
            </TabsContent>

            <TabsContent value="nails">
              <ServiceCategory title="Nail Services" services={nailServices} />
            </TabsContent>

            <TabsContent value="lashes">
              <ServiceCategory title="Lash Services" services={lashServices} />
            </TabsContent>
          </Tabs>

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
  services: typeof services;
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
          {service.popular && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full mb-3">
              Popular
            </span>
          )}
          <h3 className="text-lg font-semibold text-foreground mb-2">{service.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-xl font-bold text-primary">${service.price}</span>
            <span className="text-sm text-muted-foreground">{service.duration}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Services;
