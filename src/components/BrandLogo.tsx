import { cn } from "@/lib/utils";
import { ZuriMark } from "@/components/ZuriMark";

/**
 * Zuri brand lockups, built from the vector mark so they stay sharp.
 * - Default: mark with "Zuri" beside it, for headers.
 * - `stacked`: the mark with a larger "Zuri", for footers and splash.
 */
export const BrandLogo = ({
  stacked = false,
  className,
  iconClassName,
}: {
  stacked?: boolean;
  className?: string;
  iconClassName?: string;
}) =>
  stacked ? (
    <span className={cn("flex items-center gap-3", className)} aria-label="Zuri" role="img">
      <ZuriMark className={cn("h-14 w-14", iconClassName)} />
      <span className="text-[2.2rem] font-extrabold leading-none tracking-[-0.03em] text-foreground" aria-hidden>Zuri</span>
    </span>
  ) : (
    <span className={cn("flex items-center gap-2", className)}>
      <ZuriMark className={cn("h-7 w-7", iconClassName)} />
      <span className="text-lg font-bold tracking-[-0.02em] text-foreground">Zuri</span>
    </span>
  );
