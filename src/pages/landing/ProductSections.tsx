import { useQuery } from "@tanstack/react-query";
import { platformReviewsApi } from "@/lib/api";
import { Gift, Star, Check, Upload, MessageSquareQuote, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { cn } from "@/lib/utils";
import { GHS } from "./content";
import { Bar } from "./Visuals";

export const BookingSection = () => {
  return (
    <>
      {/* ------------------------------------------------ Booking experience */}
      <section className="bg-secondary py-20 md:py-28">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold md:text-5xl">
              Clients can book without messaging you.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              They pick a service, see the times you're actually free, and can
              attach a photo of the look they want, so you're ready when they arrive.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Pick a service, date and time in seconds",
                "Upload a design or reference photo",
                "Pay a deposit or in full at booking",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
              <p className="font-serif text-lg font-semibold">
                Book your appointment
              </p>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Choose a service
              </p>
              <div className="mt-2 space-y-2">
                {[
                  { n: "Gel Extensions", p: 180, d: "60 min", on: true },
                  { n: "Classic Lashes", p: 150, d: "75 min", on: false },
                ].map((s) => (
                  <div
                    key={s.n}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 text-sm",
                      s.on
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border",
                    )}
                  >
                    <span className="font-medium">{s.n}</span>
                    <span className="text-muted-foreground">
                      {GHS(s.p)} · {s.d}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Date
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {["11", "12", "13", "14"].map((d, i) => (
                      <span
                        key={d}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg text-sm",
                          i === 1
                            ? "bg-primary text-primary-foreground"
                            : "border border-border",
                        )}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Time
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["9:30", "11:00", "1:30"].map((t, i) => (
                      <span
                        key={t}
                        className={cn(
                          "rounded-lg px-2.5 py-1.5 text-xs",
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "border border-border",
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
                <Upload className="h-4 w-4 text-primary" />
                Upload design reference (optional)
              </div>

              <button className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-transform">
                Confirm booking
              </button>
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

export const BusinessSection = () => {
  return (
    <>
      {/* ---------------------------------------------------- Business side */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
          <div className="order-2 mx-auto w-full max-w-lg lg:order-1">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg font-semibold">Today</p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Live
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Today's bookings", value: 18 },
                  { label: "New clients", value: 7 },
                  { label: "Returning clients", value: 11 },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-border p-4">
                    <p className="font-serif text-2xl font-semibold text-primary">
                      <CountUp value={m.value} />
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
                  </div>
                ))}
                <div className="rounded-xl border border-border bg-primary/5 p-4">
                  <p className="font-serif text-2xl font-semibold text-primary">
                    <CountUp value={2480} prefix="GHS " />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Popular services
              </p>
              <div className="mt-3 space-y-2.5">
                {[
                  { n: "Gel Extensions", w: 90 },
                  { n: "Classic Lashes", w: 68 },
                  { n: "Box Braids", w: 44 },
                ].map((b) => (
                  <div key={b.n}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{b.n}</span>
                    </div>
                    <Bar pct={b.w} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="font-serif text-3xl font-semibold md:text-5xl">
              See how your week is going at a glance.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Today's appointments, what you've taken this month, your most booked
              services and who keeps coming back, all on one screen.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {["Appointments", "Revenue", "Reviews", "Loyalty", "Analytics"].map(
                (t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> {t}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

export const LoyaltyReviewsSection = () => {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["platform-testimonials"],
    queryFn: () => platformReviewsApi.listApproved(),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <>
      {/* ------------------------------------------------- Loyalty + reviews */}
      <section className="bg-secondary py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div>
              <h2 className="font-serif text-3xl font-semibold md:text-5xl">
                Give your regulars a reason to come back.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Points for every visit, a bonus when they bring a friend, and
                their reviews on your page for new clients to read.
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquareQuote className="h-4 w-4" aria-hidden />
                Example of a review on a studio's page
              </p>
              <div className="mt-4 flex" style={{ color: "hsl(var(--gold))" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="mt-4 font-serif text-xl leading-snug">
                “Booked on my lunch break, paid the deposit with MoMo, and earned
                points towards my next visit.”
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Ama, a regular
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <Gift className="h-5 w-5 text-primary" /> Zuri Rewards
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Gold
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current points
                  </p>
                  <p className="font-serif text-4xl font-semibold text-primary">
                    <CountUp value={350} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Next reward
                  </p>
                  <p className="font-serif text-2xl font-semibold">500</p>
                </div>
              </div>
              <Bar pct={70} className="mt-4 h-2.5" />
              <p className="mt-2 text-sm text-muted-foreground">150 points to go</p>
            </div>
          </div>

          {/* Real studio testimonials, if any */}
          {testimonials.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t, i) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="mb-3 flex gap-1" style={{ color: "hsl(var(--gold))" }}>
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className={cn(
                          "h-4 w-4",
                          j < t.rating ? "fill-current" : "text-muted-foreground/30",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm">“{t.content}”</p>
                  <p className="mt-4 text-sm font-medium">
                    {t.authorName}
                    {t.authorRole ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}· {t.authorRole}
                      </span>
                    ) : null}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </>
  );
};

export const HowSection = () => {
  return (
    <>
      {/* ------------------------------------------------------- How it works */}
      <section id="how" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div>
              <h2 className="font-serif text-3xl font-semibold md:text-5xl">
                Set up in about 10 minutes.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Three simple steps from sign-up to your first paid booking.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { n: "1", t: "Pick your plan", d: "Choose Standard or Premium, monthly or yearly, and set up in minutes." },
              { n: "2", t: "Make it yours", d: "Add your logo and colours, list your services and products, set your hours." },
              { n: "3", t: "Share your link", d: "Send clients your booking link and start taking bookings the same day." },
            ].map((s, i) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary font-serif text-xl font-semibold text-primary-foreground shadow-lg shadow-primary/25">
                  {s.n}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{s.t}</h3>
                <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};
