import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Globe, ShieldCheck, Smartphone, Store, Wallet } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { formatGHS } from "@/lib/currency";

interface PlatformStats {
  // Null until the figure is big enough to show (decided by the API).
  studiosLive: number | null;
  bookingsMade: number | null;
  customers: number | null;
  paymentsProcessed: number | null;
}

const REASONS = [
  { icon: Globe, title: "Your own website", text: "A site with your name, your colour and your own web address, ready the day you sign up." },
  { icon: Wallet, title: "Paid straight to you", text: "Customers pay by Mobile Money or card, and the money goes to your account. No middleman holding it." },
  { icon: CalendarCheck, title: "Bookings run themselves", text: "Clients see free times and book. Reminders go out on their own, so fewer people forget." },
  { icon: Store, title: "Sell online too", text: "Add a shop to your studio, or run Zuri Storefront on its own for anything you sell." },
  { icon: Smartphone, title: "Built for phones", text: "Your customers book and buy from their phones, and you manage everything from yours." },
  { icon: ShieldCheck, title: "Made in Ghana, for Ghana", text: "Cedis, Mobile Money and local support. Talk to a real person on WhatsApp." },
];

/** Why businesses choose Zuri. */
export const WhyZuriSection = () => (
  <section className="py-20 md:py-28">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-balance font-serif text-3xl font-semibold md:text-4xl">
          Why businesses choose Zuri
        </h2>
        <p className="mt-3 text-muted-foreground">
          Everything you need to take bookings, sell and get paid, without the tech headaches.
        </p>
      </div>
      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((r) => (
          <div key={r.title} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <r.icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/**
 * Real platform numbers, for transparency. Each appears only once it's big
 * enough to mean something; with fewer than two, the strip isn't shown.
 */
export const PlatformMetricsSection = () => {
  const { data } = useQuery({
    queryKey: ["platform-public-stats"],
    queryFn: async () =>
      (await apiRequest<{ data: PlatformStats }>("/platform/public-stats")).data,
    staleTime: 10 * 60 * 1000,
  });
  const items = [
    data?.studiosLive && { value: data.studiosLive.toLocaleString(), label: "Businesses on Zuri" },
    data?.bookingsMade && { value: data.bookingsMade.toLocaleString(), label: "Bookings made" },
    data?.customers && { value: data.customers.toLocaleString(), label: "Customers served" },
    data?.paymentsProcessed && { value: formatGHS(data.paymentsProcessed), label: "Paid to businesses" },
  ].filter(Boolean) as { value: string; label: string }[];
  if (items.length < 2) return null;
  return (
    <section className="border-y border-border bg-foreground py-14 text-background">
      <div className="container mx-auto grid grid-cols-2 gap-y-10 px-4 md:grid-cols-4">
        {items.map((m) => (
          <div key={m.label} className="text-center">
            <p className="font-serif text-3xl font-semibold tabular-nums text-primary md:text-4xl">{m.value}</p>
            <p className="mt-1 text-sm text-background/70">{m.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
