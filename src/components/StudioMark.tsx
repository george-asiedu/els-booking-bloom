import { cn } from "@/lib/utils";

/**
 * A studio's logo, where the studio identifies itself (nav, footer, admin
 * header, sign-in). Nothing at all when the studio hasn't uploaded one: a
 * made-up mark would look like a logo the studio never chose.
 */
export const StudioMark = ({
  logoUrl,
  className,
}: {
  name?: string;
  logoUrl: string | null | undefined;
  className?: string;
}) =>
  logoUrl ? (
    <img src={logoUrl} alt="" className={cn("h-8 w-8 shrink-0 rounded object-cover", className)} />
  ) : null;
