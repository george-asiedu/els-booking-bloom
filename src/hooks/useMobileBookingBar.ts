import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Whether the phone-only "Book an appointment" bar is up on this page, so other
 * floating controls can sit above it.
 */
export const useMobileBookingBar = () => {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Not on the booking flow or the cart/checkout.
  const allowed = !["/book", "/cart"].some((p) => pathname.startsWith(p));
  return { allowed, show: allowed && scrolled };
};
