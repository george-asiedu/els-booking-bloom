import { cn } from "@/lib/utils";

/**
 * A studio's mark: its uploaded logo, or else the first letter of its name in
 * the studio's colour. Used wherever the studio identifies itself (nav,
 * footer, loading screen).
 */
export const StudioMark = ({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null | undefined;
  className?: string;
}) =>
  logoUrl ? (
    <img src={logoUrl} alt="" className={cn("h-8 w-8 shrink-0 rounded object-cover", className)} />
  ) : (
    <span
      aria-hidden
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-base font-semibold text-primary-foreground",
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "·"}
    </span>
  );
