import { Phone, Mail, Instagram, MapPin, Clock, MessageCircle, Music2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { contactInfoApi, businessHoursApi, ContactInfoDTO } from "@/lib/api";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// --- Link builders: turn stored values into working hrefs ---
const digitsOnly = (v: string) => v.replace(/[^\d]/g, "");
const stripAt = (v: string) => v.replace(/^@/, "").trim();

const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;
const whatsappHref = (phone: string) => `https://wa.me/${digitsOnly(phone)}`;
const emailHref = (email: string) => `mailto:${email}`;
const instagramHref = (v: string) =>
  v.startsWith("http") ? v : `https://instagram.com/${stripAt(v)}`;
const tiktokHref = (v: string) =>
  v.startsWith("http") ? v : `https://www.tiktok.com/@${stripAt(v)}`;

interface ContactCard {
  icon: typeof Phone;
  label: string;
  value: string;
  href: string;
}

const buildCards = (info: ContactInfoDTO): ContactCard[] => {
  const cards: ContactCard[] = [];
  if (info.showPhone && info.phone)
    cards.push({ icon: Phone, label: "Phone", value: info.phone, href: telHref(info.phone) });
  if (info.showWhatsapp && info.whatsapp)
    cards.push({ icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: whatsappHref(info.whatsapp) });
  if (info.showEmail && info.email)
    cards.push({ icon: Mail, label: "Email", value: info.email, href: emailHref(info.email) });
  if (info.showInstagram && info.instagram)
    cards.push({ icon: Instagram, label: "Instagram", value: `@${stripAt(info.instagram)}`, href: instagramHref(info.instagram) });
  if (info.showTiktok && info.tiktok)
    cards.push({ icon: Music2, label: "TikTok", value: `@${stripAt(info.tiktok)}`, href: tiktokHref(info.tiktok) });
  return cards;
};

const formatTime = (t: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

const Contact = () => {
  const { data: info, isLoading } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });

  const { data: hours = [] } = useQuery({
    queryKey: ["public-business-hours"],
    queryFn: () => businessHoursApi.list(),
  });

  const cards = info ? buildCards(info) : [];

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

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : cards.length === 0 ? (
                <p className="text-muted-foreground">
                  Contact details are being updated. Please check back soon.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cards.map((item, index) => (
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
              )}

              {/* Location */}
              {info?.showAddress && info.address && (
                <div className="mt-8 bg-card border border-border rounded-lg p-6 animate-fade-in [animation-delay:400ms]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium text-foreground whitespace-pre-line">
                        {info.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                  {hours.map((item) => (
                    <div
                      key={item.day_of_week}
                      className="flex justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-foreground font-medium">
                        {dayNames[item.day_of_week]}
                      </span>
                      <span className="text-muted-foreground">
                        {item.is_closed
                          ? "Closed"
                          : `${formatTime(item.open_time)} - ${formatTime(item.close_time)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              {info && ((info.showWhatsapp && info.whatsapp) || (info.showPhone && info.phone)) && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  {info.showWhatsapp && info.whatsapp && (
                    <Button asChild className="flex-1">
                      <a href={whatsappHref(info.whatsapp)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp Us
                      </a>
                    </Button>
                  )}
                  {info.showPhone && info.phone && (
                    <Button variant="outline" asChild className="flex-1">
                      <a href={telHref(info.phone)}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Now
                      </a>
                    </Button>
                  )}
                </div>
              )}
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
