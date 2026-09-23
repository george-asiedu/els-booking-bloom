import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { promoApi, PromoBannerDTO } from "@/lib/api";

// One run of the banners. When scrolling, two runs are rendered in the track for
// a seamless -50% loop; when static, a single run is centered to fill the strip.
const Run = ({ banners }: { banners: PromoBannerDTO[] }) => (
  <div className="flex items-center">
    {banners.map((b, i) => {
      const content = (
        <span className="mx-6 inline-flex items-center gap-2 text-sm font-medium">
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
 * A studio's promo strip. Shown site-wide (below the navbar). If the banner text
 * is short it fills the strip centered and static; if it overflows the width it
 * scrolls as a marquee. Renders nothing when there are no active banners.
 */
export const PromoMarquee = ({
  placement,
}: {
  // Optional: limit to "shop" | "booking". Omit to show all active banners.
  placement?: "shop" | "booking";
}) => {
  const { data: banners = [] } = useQuery({
    queryKey: ["promo-banners", placement ?? "all"],
    queryFn: () => promoApi.listActive(placement),
    staleTime: 5 * 60 * 1000,
  });

  const viewportRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const measure = () => {
      const vp = viewportRef.current;
      const run = runRef.current;
      if (!vp || !run) return;
      // Scroll only when a single run is wider than the strip.
      setScroll(run.scrollWidth > vp.clientWidth + 4);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [banners]);

  if (banners.length === 0) return null;

  const first = banners[0];
  const bg = first.bgColor || "hsl(var(--primary))";
  const fg = first.textColor || "hsl(var(--primary-foreground))";

  return (
    <div
      ref={viewportRef}
      className="marquee-viewport w-full overflow-hidden py-2"
      style={{ backgroundColor: bg, color: fg }}
      role="region"
      aria-label="Promotions"
    >
      <div className={scroll ? "marquee-track" : "flex justify-center"}>
        {/* runRef is always the first run, so it stays measurable in both modes */}
        <div ref={runRef} className="flex items-center">
          <Run banners={banners} />
        </div>
        {scroll && (
          <div className="flex items-center" aria-hidden>
            <Run banners={banners} />
          </div>
        )}
      </div>
    </div>
  );
};
