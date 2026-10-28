import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";
import { CountUp } from "@/components/CountUp";

interface PlatformStats {
  studiosLive: number;
  bookingsMade: number;
  customers: number;
  paymentsProcessed: number;
}

/** Real platform numbers, counting up as they scroll into view. */
export const PlatformMetricsSection = () => {
  const { data } = useQuery({
    queryKey: ["platform-public-stats"],
    queryFn: async () =>
      (await apiRequest<{ data: PlatformStats }>("/platform/public-stats")).data,
    staleTime: 10 * 60 * 1000,
  });
  if (!data) return null;
  const items = [
    { value: data.studiosLive, label: "Businesses on Zuri" },
    { value: data.bookingsMade, label: "Bookings made" },
    { value: data.customers, label: "Customers served" },
    { value: data.paymentsProcessed, label: "Paid to businesses", prefix: "GH₵ " },
  ];
  return (
    <section className="border-y border-border bg-foreground py-14 text-background">
      <div className="container mx-auto grid grid-cols-2 gap-y-10 px-4 md:grid-cols-4">
        {items.map((m) => (
          <div key={m.label} className="text-center">
            <p className="font-serif text-3xl font-semibold tabular-nums text-primary md:text-4xl">
              <CountUp value={m.value ?? 0} prefix={m.prefix} />
            </p>
            <p className="mt-1 text-sm text-background/70">{m.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
