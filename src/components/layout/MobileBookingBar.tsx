import { Link } from "react-router-dom";
import { useMobileBookingBar } from "@/hooks/useMobileBookingBar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Sticky bottom "Book appointment" CTA on mobile — booking is the primary
 * conversion, so it stays reachable while scrolling. Hidden on the booking page
 * itself, and it slides in only after the user scrolls past the hero so it never
 * covers the hero's own CTA. Respects the safe-area inset.
 */
export const MobileBookingBar = () => {
  const { allowed, show } = useMobileBookingBar();
  if (!allowed) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md transition-transform duration-300 md:hidden",
        "px-4 pt-3 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <Button size="lg" className="w-full" asChild>
        <Link to="/book">Book an appointment</Link>
      </Button>
    </div>
  );
};
