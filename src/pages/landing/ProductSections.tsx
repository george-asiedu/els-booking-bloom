import { Gift, Star, MessageSquareQuote } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { Bar } from "./Visuals";

export const LoyaltyReviewsSection = () => {
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
                their reviews on your page for new customers to read.
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

        </div>
      </section>

    </>
  );
};

