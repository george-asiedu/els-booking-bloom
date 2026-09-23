import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Sticky bottom "Book appointment" CTA on mobile — booking is the primary
 * conversion, so it stays reachable while scrolling. Hidden on the booking page
 * itself, and it slides in only after the user scrolls past the hero so it never
 * covers the hero's own CTA. Respects the safe-area inset.
 */
export const MobileBookingBar = () => {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Don't show on the booking flow or the cart/checkout.
  if (["/book", "/cart"].some((p) => pathname.startsWith(p))) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md transition-transform duration-300 md:hidden",
        "px-4 pt-3 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <Button size="lg" className="group w-full" asChild>
        <Link to="/book">
          Book appointment
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
};
