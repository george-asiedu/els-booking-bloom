import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Clock, Star, Heart, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { TestimonialsSection } from "@/components/reviews/TestimonialsSection";
import { services as staticServices } from "@/data/services";
import { servicesApi, commerceApi, productsApi } from "@/lib/api";
import heroImage from "@/assets/hero-beauty.jpg";
import nails1 from "@/assets/gallery/nails-1.jpg";
import lashes1 from "@/assets/gallery/lashes-1.jpg";

const titleize = (slug: string) =>
  slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const Index = () => {
  // Featured services come from the live catalog; fall back to the static menu.
  const { data: apiServices } = useQuery({
    queryKey: ["public-services-catalog"],
    queryFn: () => servicesApi.listActive(),
  });

  const source =
    apiServices && apiServices.length > 0 ? apiServices : staticServices;
  const popularServices = source.filter((s) => s.popular).slice(0, 4);

  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });
  const shopEnabled = commerce?.enabled ?? false;

  const { data: products = [] } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => productsApi.listActive(),
    enabled: shopEnabled,
  });
  const featuredProducts = [
    ...products.filter((p) => p.popular),
    ...products.filter((p) => !p.popular),
  ].slice(0, 4);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6 animate-fade-in">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Welcome to El's Beauty Studio
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6 animate-fade-in [animation-delay:100ms]">
              Where Beauty
              <br />
              <span className="text-primary">Meets Artistry</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 animate-fade-in [animation-delay:200ms]">
              Specializing in stunning nail art, luxurious lash extensions and
              statement hairstyling. Let me help you feel confident and beautiful,
              one appointment at a time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in [animation-delay:300ms]">
              <Button size="lg" asChild>
                <Link to="/book">
                  Book an Appointment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/gallery">View My Work</Link>
              </Button>
              {shopEnabled && (
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/shop">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Shop Products
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Star,
                title: "Quality First",
                description: "Using only premium products for results that last",
              },
              {
                icon: Clock,
                title: "Flexible Booking",
                description: "Easy online scheduling that fits your busy life",
              },
              {
                icon: Heart,
                title: "Personal Touch",
                description: "Customized designs tailored to your style",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center p-6 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Popular Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From elegant nail designs and flawless lash extensions to fresh
              hairstyling, discover our most loved treatments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularServices.map((service, index) => (
              <div
                key={service.id}
                className="group bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      service.category === "nails"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {titleize(service.category)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  {service.on_promo && service.promo_price != null ? (
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground line-through">
                        GHS {service.price}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        GHS {service.promo_price}
                      </span>
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-primary">GHS {service.price}</span>
                  )}
                  <span className="text-sm text-muted-foreground">{service.duration}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" asChild>
              <Link to="/services">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Products Preview */}
      {shopEnabled && featuredProducts.length > 0 && (
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                Shop Our Products
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Take the salon home — curated products to prep, style and
                maintain your look between appointments.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/shop/${product.id}`}
                  className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in flex flex-col"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="aspect-square bg-muted overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Sparkles className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="mt-1">
                      {product.on_promo ? (
                        <span className="flex items-baseline gap-2">
                          <span className="text-xs text-muted-foreground line-through">
                            GHS {product.price}
                          </span>
                          <span className="font-bold text-primary">
                            GHS {product.effective_price}
                          </span>
                        </span>
                      ) : (
                        <span className="font-bold text-primary">
                          GHS {product.price}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button variant="outline" asChild>
                <Link to="/shop">
                  Visit the Shop
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Preview */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                See My Work
              </h2>
              <p className="text-muted-foreground mb-6">
                Every set of nails, lashes and hairstyle is a work of art. Browse my portfolio to see the
                transformations and find inspiration for your next appointment.
              </p>
              <Button asChild>
                <Link to="/gallery">
                  View Full Gallery
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src={nails1}
                  alt="Nail art showcase"
                  className="rounded-lg w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="space-y-4 pt-8">
                <img
                  src={lashes1}
                  alt="Lash extensions showcase"
                  className="rounded-lg w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-4">
              Ready to Look Your Best?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Book your appointment today and let's create something beautiful together.
            </p>
            <Button
              size="lg"
              variant="secondary"
              asChild
            >
              <Link to="/book">
                Book Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
