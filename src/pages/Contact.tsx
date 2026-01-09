import { Phone, Mail, Instagram, MapPin, Clock, MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const contactInfo = [
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (555) 123-4567",
    href: "tel:+15551234567",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Chat with me",
    href: "https://wa.me/15551234567",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@elsbeauty.com",
    href: "mailto:hello@elsbeauty.com",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@elsbeautystudio",
    href: "https://instagram.com/elsbeautystudio",
  },
];

const businessHours = [
  { day: "Monday", hours: "9:00 AM - 6:00 PM" },
  { day: "Tuesday", hours: "9:00 AM - 6:00 PM" },
  { day: "Wednesday", hours: "9:00 AM - 6:00 PM" },
  { day: "Thursday", hours: "9:00 AM - 7:00 PM" },
  { day: "Friday", hours: "9:00 AM - 7:00 PM" },
  { day: "Saturday", hours: "10:00 AM - 5:00 PM" },
  { day: "Sunday", hours: "Closed" },
];

const Contact = () => {
  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions or want to book an appointment? Reach out through any of these channels!
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Cards */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactInfo.map((item, index) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="group bg-card border border-border rounded-lg p-6 hover:shadow-md hover:border-primary/50 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Location */}
              <div className="mt-8 bg-card border border-border rounded-lg p-6 animate-fade-in [animation-delay:400ms]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium text-foreground">123 Beauty Lane, Suite 101</p>
                    <p className="text-muted-foreground">Downtown Beauty District</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                Business Hours
              </h2>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">Weekly Schedule</span>
                </div>
                <div className="space-y-3">
                  {businessHours.map((item, index) => (
                    <div
                      key={item.day}
                      className="flex justify-between py-2 border-b border-border last:border-0 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="text-foreground font-medium">{item.day}</span>
                      <span
                        className={
                          item.hours === "Closed"
                            ? "text-muted-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <a href="https://wa.me/15551234567" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp Me
                  </a>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a href="tel:+15551234567">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: "How do I book an appointment?",
                a: "You can book through our website's booking page, or reach out via WhatsApp or phone for immediate assistance.",
              },
              {
                q: "What's your cancellation policy?",
                a: "Please provide at least 24 hours notice for cancellations to avoid a cancellation fee.",
              },
              {
                q: "How often should I get lash refills?",
                a: "For best results, lash refills are recommended every 2-3 weeks depending on your lash growth cycle.",
              },
              {
                q: "Do you accept walk-ins?",
                a: "Walk-ins are welcome based on availability, but appointments are recommended to guarantee your preferred time.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
