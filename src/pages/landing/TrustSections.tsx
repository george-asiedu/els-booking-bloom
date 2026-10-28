import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";
import { formatGHS } from "@/lib/currency";

interface PlatformStats {
  // Null until the figure is big enough to show (decided by the API).
  studiosLive: number | null;
  bookingsMade: number | null;
  customers: number | null;
  paymentsProcessed: number | null;
}


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
