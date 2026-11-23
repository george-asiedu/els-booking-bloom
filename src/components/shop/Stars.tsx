import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Five stars filled to a rating, with the count beside them. */
export const Stars = ({ value, count, className }: { value: number; count?: number; className?: string }) => (
  <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
    <span className="flex" role="img" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("h-3.5 w-3.5 text-foreground/70", n <= Math.round(value) ? "fill-current" : "opacity-25")} aria-hidden />
      ))}
    </span>
    <span className="tabular-nums">
      {value.toFixed(1)}
      {count !== undefined && ` (${count})`}
    </span>
  </span>
);
