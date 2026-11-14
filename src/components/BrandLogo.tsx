import { cn } from "@/lib/utils";
import { ZuriMark } from "@/components/ZuriMark";

/**
 * Zuri brand lockups, built from the vector mark so they stay sharp.
 * - Default: mark with "Zuri Studios" beside it, for headers.
 * - `stacked`: "Zuri" large over spaced-out "Studios", for footers and splash.
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
    <span className={cn("flex items-center gap-3", className)} aria-label="Zuri Studios" role="img">
      <ZuriMark className={cn("h-14 w-14", iconClassName)} />
      <span className="flex flex-col leading-none text-foreground" aria-hidden>
        <span className="text-[2rem] font-extrabold tracking-[-0.03em]">Zuri</span>
        <span className="mt-1 pl-0.5 text-[0.7rem] font-medium uppercase tracking-[0.42em] text-muted-foreground">Studios</span>
      </span>
    </span>
  ) : (
    <span className={cn("flex items-center gap-2", className)}>
      <ZuriMark className={cn("h-7 w-7", iconClassName)} />
      <span className="text-lg font-bold tracking-[-0.02em] text-foreground">
        Zuri <span className="font-medium text-muted-foreground">Studios</span>
      </span>
    </span>
  );
