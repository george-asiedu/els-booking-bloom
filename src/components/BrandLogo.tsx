import { cn } from "@/lib/utils";

/**
 * Zuri brand marks, from the logo files in /public.
 * - Default: the mark (/zuri-mark.png, cut from the logo) with the name set
 *   beside it, for headers where the stacked logo would be too small to read.
 * - `stacked`: the full logo as designed (/zuri-lockup.png), for footers and
 *   other places with room for it.
 */
export const BrandLogo = ({
  full = false,
  stacked = false,
  className,
  iconClassName,
}: {
  full?: boolean;
  stacked?: boolean;
  className?: string;
  iconClassName?: string;
}) =>
  stacked ? (
    <img
      src="/zuri-lockup.png"
      alt="Zuri Studios"
      className={cn("h-20 w-auto", className)}
      width={85}
      height={80}
    />
  ) : (
    <span className={cn("flex items-center gap-2", className)}>
      <img
        src="/zuri-mark.png"
        alt=""
        className={cn("h-6 w-auto", iconClassName)}
        width={65}
        height={24}
      />
      <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
        Zuri
        {full && <span className="font-normal text-muted-foreground"> Studios</span>}
      </span>
    </span>
  );
