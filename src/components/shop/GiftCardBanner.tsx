import { Link } from "react-router-dom";
import { Gift } from "lucide-react";

/** A band on the home page so customers find gift cards (and packages). */
export const GiftCardBanner = ({ name, packages }: { name: string; packages?: boolean }) => (
  <section className="container mx-auto px-4 py-10 md:py-14">
    <div className="flex flex-col items-start gap-5 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Gift className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Give the gift of {name}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground md:text-base">
            Gift cards from GHS 20, sent by email the moment you pay.
            {packages ? " Or buy a package of sessions and save on your regular visits." : ""}
          </p>
        </div>
      </div>
      <Link
        to="/gift-cards"
        className="inline-flex h-11 shrink-0 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        {packages ? "Gift cards and packages" : "Buy a gift card"}
      </Link>
    </div>
  </section>
);
