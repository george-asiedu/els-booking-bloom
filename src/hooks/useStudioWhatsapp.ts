import { useQuery } from "@tanstack/react-query";
import { contactInfoApi } from "@/lib/api";
import { formatWhatsappNumber, whatsappLink } from "@/lib/whatsapp";
import { useStudio } from "@/hooks/useStudio";

/**
 * How customers reach the studio on WhatsApp: the studio's own number, if it
 * has one, chose to show it, and it's a number WhatsApp can open. Otherwise
 * null, and every WhatsApp button on the storefront stays hidden.
 */
export const useStudioWhatsapp = () => {
  const { name: studioName } = useStudio();
  // Same query (and cache) as the footer and contact page.
  const { data: contact } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });
  const raw = contact?.showWhatsapp ? contact.whatsapp : null;
  // Opening line so the studio knows where the chat came from.
  const href = whatsappLink(raw, `Hi ${studioName}, I have a question.`);
  if (!href) return null;
  return { href, display: formatWhatsappNumber(raw) };
};
