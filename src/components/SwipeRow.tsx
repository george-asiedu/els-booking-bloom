import { useRef, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cards in a swipeable row on phones and a grid from the md breakpoint up.
 * Saves a lot of vertical space on a phone. A small "Swipe" hint with moving
 * arrows sits on top until the first swipe, so people know there is more.
 */
export const SwipeRow = ({
  children,
  gridClass,
  cardWidth = "w-[82%] sm:w-[55%]",
  className,
}: {
  children: ReactNode[];
  // Classes for the md+ grid, e.g. "md:grid-cols-3 lg:grid-cols-4".
  gridClass: string;
  cardWidth?: string;
  className?: string;
}) => {
  const row = useRef<HTMLDivElement>(null);
  const [moved, setMoved] = useState(false);
  return (
    <div className={className}>
      {!moved && (
        <p className="mb-3 flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground md:hidden" aria-hidden>
          Swipe
          <ChevronRight className="h-4 w-4 animate-nudge" />
          <ChevronRight className="-ml-3 h-4 w-4 animate-nudge [animation-delay:150ms]" />
          <ChevronRight className="-ml-3 h-4 w-4 animate-nudge [animation-delay:300ms]" />
        </p>
      )}
      <div
        ref={row}
        onScroll={() => !moved && (row.current?.scrollLeft ?? 0) > 24 && setMoved(true)}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:gap-5 md:overflow-visible md:px-0 md:pb-0",
          gridClass,
        )}
      >
        {children.map((child, i) => (
          <div key={i} className={cn("shrink-0 snap-start md:w-auto", cardWidth)}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};
