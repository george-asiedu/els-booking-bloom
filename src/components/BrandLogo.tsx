import { cn } from "@/lib/utils";

/**
 * Zuri brand lockup: the transparent app icon + a typeset serif wordmark.
 * We typeset the wordmark (rather than using the full raster logos, which have
 * baked-in ivory/navy backgrounds) so it stays crisp and correct in both
 * themes and on any surface.
 */
export const BrandLogo = ({
  full = false,
  className,
  iconClassName,
}: {
  full?: boolean;
  className?: string;
  iconClassName?: string;
}) => (
  <span className={cn("flex items-center gap-2", className)}>
    <img
      src="/zuri-icon.png"
      alt="Zuri Studios"
      className={cn("h-8 w-8 rounded-lg object-contain", iconClassName)}
      width={32}
      height={32}
    />
    <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
      Zuri
      {full && <span className="font-normal text-muted-foreground"> Studios</span>}
    </span>
  </span>
);
