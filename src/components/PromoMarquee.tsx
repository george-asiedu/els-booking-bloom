import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { promoApi, PromoBannerDTO } from "@/lib/api";

// One repeated run of the banners — rendered twice in the track for a seamless
// loop. Each banner links out if it has a URL.
const Run = ({ banners }: { banners: PromoBannerDTO[] }) => (
  <div className="flex items-center" aria-hidden={false}>
    {banners.map((b, i) => {
      const content = (
        <span className="mx-8 inline-flex items-center gap-2 text-sm font-medium">
          <Megaphone className="h-4 w-4 shrink-0 opacity-80" />
          {b.message}
        </span>
      );
      return b.linkUrl ? (
        <a
          key={`${b.id}-${i}`}
          href={b.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          {content}
        </a>
      ) : (
        <span key={`${b.id}-${i}`}>{content}</span>
      );
    })}
  </div>
);

/**
 * A studio's scrolling promo banner for a placement ("shop" | "booking").
 * Renders nothing when the studio has no active banners.
 */
export const PromoMarquee = ({
  placement,
}: {
  placement: "shop" | "booking";
}) => {
  const { data: banners = [] } = useQuery({
    queryKey: ["promo-banners", placement],
    queryFn: () => promoApi.listActive(placement),
    staleTime: 5 * 60 * 1000,
  });

  if (banners.length === 0) return null;

  // Use the first banner's colours for the strip, falling back to the brand.
  const first = banners[0];
  const bg = first.bgColor || "hsl(var(--primary))";
  const fg = first.textColor || "hsl(var(--primary-foreground))";

  return (
    <div
      className="marquee-viewport w-full overflow-hidden py-2"
      style={{ backgroundColor: bg, color: fg }}
      role="region"
      aria-label="Promotions"
    >
      <div className="marquee-track">
        <Run banners={banners} />
        <Run banners={banners} />
      </div>
    </div>
  );
};
