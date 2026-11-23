import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const INTERVAL = 6000;

/**
 * Hero photos that crossfade on a timer. Only the images change; whatever is
 * laid over them stays put. Dash pills at the bottom jump to a photo; there
 * are no arrows. One image renders as a plain photo.
 */
export const HeroSlides = ({
  images,
  className,
  imgClassName,
  onFirstLoad,
}: {
  images: string[];
  /** Positions the stack, e.g. "absolute inset-0 -z-20". */
  className?: string;
  imgClassName?: string;
  /** Fires once the first photo has loaded (or failed). */
  onFirstLoad?: () => void;
}) => {
  const slides = Array.from(new Set(images.filter(Boolean))).slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      INTERVAL,
    );
    return () => window.clearInterval(id);
  }, [slides.length]);

  const current = index % Math.max(slides.length, 1);

  return (
    <>
      <div className={cn("overflow-hidden", className)}>
        {slides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            onLoad={i === 0 ? onFirstLoad : undefined}
            onError={i === 0 ? onFirstLoad : undefined}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out",
              i === 0 && "hero-zoom",
              i === current ? "opacity-100" : "opacity-0",
              imgClassName,
            )}
          />
        ))}
      </div>
      {/* Dash pills: the current photo's is long. Sibling of the stack so they sit above any overlay. */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-1">
          {slides.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === current}
              onClick={() => setIndex(i)}
              className="grid h-6 place-items-center px-0.5"
            >
              <span
                className={cn(
                  "block h-1 rounded-full bg-white transition-[width,opacity] duration-500",
                  i === current
                    ? "w-8 opacity-100"
                    : "w-4 opacity-50 hover:opacity-80",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
};
