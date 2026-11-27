import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { CalendarDays, Clock, Loader2, LogOut, MessageCircle, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/KpiTile";
import { StudioMark } from "@/components/StudioMark";
import { NotificationsCard } from "@/components/security/NotificationsCard";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { apiRequest } from "@/lib/apiClient";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  fullName: string;
  phone: string;
  notes: string | null;
  status: "PENDING" | "CONFIRMED" | "COMPLETED";
  appointmentDate: string;
  appointmentTime: string;
  service: { name: string; duration: string | null } | null;
}
interface Me {
  id: string;
  name: string;
  role: string | null;
  photoUrl: string | null;
}

const dayLabel = (iso: string) => {
  const d = parseISO(iso);
  return isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEEE d MMMM");
};

/**
 * A team member's own page: their bookings for the next two weeks and the
 * switch for notifications on this device. It shows nothing else of the
 * studio, and the server only returns what belongs to them.
 */
const StaffPortal = () => {
  const { user, signOut } = useAuth();
  const { name: studioName, config } = useStudio();

  const me = useQuery({
    queryKey: ["staff-me"],
    queryFn: async () => (await apiRequest<{ data: Me }>("/staff/me", { auth: true })).data,
  });
  const bookings = useQuery({
    queryKey: ["staff-bookings"],
    queryFn: async () => (await apiRequest<{ data: Booking[] }>("/staff/me/bookings", { auth: true })).data,
    refetchInterval: 60_000,
  });

  const groups = useMemo(() => {
    const out = new Map<string, Booking[]>();
    for (const b of bookings.data ?? []) {
      const key = b.appointmentDate.slice(0, 10);
      out.set(key, [...(out.get(key) ?? []), b]);
    }
    return [...out.entries()];
  }, [bookings.data]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <StudioMark name={studioName} logoUrl={config?.branding.logoUrl} className="h-9 w-9 text-base" />
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-semibold">{studioName}</p>
              <p className="truncate text-xs text-muted-foreground">{me.data?.name ?? user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
            <CalendarDays className="h-6 w-6 text-primary" /> My bookings
          </h1>
          <p className="text-sm text-muted-foreground">The next two weeks. You'll be alerted about 15 minutes before each one, and when it's time.</p>
        </div>

        {bookings.isLoading || me.isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : me.isError ? (
          <Panel>
            <p className="text-sm text-muted-foreground">
              {me.error instanceof Error ? me.error.message : "We couldn't open your page."} Ask {studioName} to check your account.
            </p>
          </Panel>
        ) : groups.length === 0 ? (
          <Panel>
            <p className="text-sm text-muted-foreground">No bookings with you in the next two weeks.</p>
          </Panel>
        ) : (
          groups.map(([day, rows]) => (
            <section key={day} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">{dayLabel(day)}</h2>
              {rows.map((b) => (
                <Panel key={b.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold">
                        <Clock className="h-4 w-4 text-primary" aria-hidden /> {b.appointmentTime}
                        <span className="font-normal text-muted-foreground">·</span> {b.service?.name ?? "Appointment"}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm"><User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> {b.fullName}</p>
                      {b.notes && <p className="mt-1 text-sm text-muted-foreground">{b.notes}</p>}
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        b.status === "CONFIRMED" && "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
                        b.status === "PENDING" && "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
                        b.status === "COMPLETED" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {b.status === "PENDING" ? "Waiting for approval" : b.status === "CONFIRMED" ? "Confirmed" : "Done"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${b.phone.replace(/\s+/g, "")}`}><Phone className="mr-1.5 h-4 w-4" /> Call</a>
                    </Button>
                    {whatsappLink(b.phone) && (
                      <Button asChild size="sm" variant="outline">
                        <a href={whatsappLink(b.phone, `Hello ${b.fullName.split(" ")[0]}, this is ${me.data?.name ?? "your stylist"} from ${studioName} about your ${b.service?.name ?? "appointment"} at ${b.appointmentTime}.`) ?? undefined} target="_blank" rel="noreferrer">
                          <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </Panel>
              ))}
            </section>
          ))
        )}

        <NotificationsCard client="studio" description="Get a notification on this device when a booking is about to start." />
      </main>
    </div>
  );
};

export default StaffPortal;
