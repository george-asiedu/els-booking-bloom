import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Music2 } from "lucide-react";
import { BackToTop } from "@/components/BackToTop";
import { useMobileBookingBar } from "@/hooks/useMobileBookingBar";
import { contactInfoApi } from "@/lib/api";
import { socialHref } from "@/lib/social";
import { cn } from "@/lib/utils";
import { WhatsappChatButton } from "./WhatsappChatButton";

/**
 * The corner stack on studio and shop pages: back to top, the studio's social
 * profiles (only those it has switched on), then WhatsApp. On phones it rides
 * above the "Book an appointment" bar when that's up.
 */
export const FloatingActions = () => {
  const { show: barUp } = useMobileBookingBar();
  const { data: contact } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });
  const socials = [
    contact?.showInstagram && contact.instagram && { label: "Instagram", icon: Instagram, href: socialHref("instagram", contact.instagram), bg: "bg-[radial-gradient(circle_at_30%_110%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]" },
    contact?.showTiktok && contact.tiktok && { label: "TikTok", icon: Music2, href: socialHref("tiktok", contact.tiktok), bg: "bg-black" },
    contact?.showFacebook && contact.facebook && { label: "Facebook", icon: Facebook, href: socialHref("facebook", contact.facebook), bg: "bg-[#1877F2]" },
  ].filter(Boolean) as { label: string; icon: typeof Instagram; href: string; bg: string }[];

  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex flex-col items-center gap-2.5 transition-[bottom] duration-300 md:bottom-6 md:right-6",
        barUp ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
      )}
    >
      <BackToTop inline />
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Follow us on ${s.label}`}
          title={s.label}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.96]",
            s.bg,
          )}
        >
          <s.icon className="h-5 w-5" aria-hidden />
        </a>
      ))}
      <WhatsappChatButton inline />
    </div>
  );
};
