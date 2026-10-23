import { useAuth } from "@/hooks/useAuth";
import { useStudioWhatsapp } from "@/hooks/useStudioWhatsapp";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { useMobileBookingBar } from "@/hooks/useMobileBookingBar";
import { cn } from "@/lib/utils";

/**
 * The customer's way to message the studio: a WhatsApp button in the corner of
 * every storefront page. Shown only when the studio has a working WhatsApp
 * number switched on, and not to the studio's own admins. On phones it rides
 * above the "Book an appointment" bar when that's up.
 */
export const WhatsappChatButton = () => {
  const whatsapp = useStudioWhatsapp();
  const { user } = useAuth();
  const { show: barUp } = useMobileBookingBar();

  if (!whatsapp || user?.role === "ADMIN") return null;

  return (
    <a
      href={whatsapp.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on WhatsApp"
      title="Message us on WhatsApp"
      className={cn(
        "fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white",
        "shadow-[0_2px_6px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.12)]",
        "transition-[transform,bottom] duration-300 hover:bg-[#1fbe5b] active:scale-[0.96]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2",
        "md:bottom-6 md:right-6",
        // Clear the booking bar (about 76px plus the phone's safe area).
        barUp
          ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
      )}
    >
      <WhatsappIcon className="h-7 w-7" />
    </a>
  );
};
