import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Previous / Next under a paged list (see hooks/useCursorPages). One page is
 * shown at a time, so asking for more never makes the page longer. Hidden
 * when everything fits on one page.
 *
 * Named LoadMore for history: it replaced a "Load more" button.
 */
export const LoadMore = ({
  query,
  className,
}: {
  query: {
    page: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    isChangingPage: boolean;
    fetchNextPage: () => void;
    fetchPreviousPage: () => void;
  };
  /** Kept for older call sites; the buttons always say Previous / Next. */
  label?: string;
  className?: string;
}) => {
  if (!query.hasNextPage && !query.hasPreviousPage) return null;
  // Show the start of the new page rather than leaving the reader at the bottom.
  const go = (fn: () => void) => {
    fn();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <nav aria-label="Pagination" className={cn("mt-4 flex items-center justify-between gap-3", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={!query.hasPreviousPage || query.isChangingPage}
        onClick={() => go(query.fetchPreviousPage)}
      >
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden /> Previous
      </Button>
      <span className="flex items-center gap-2 text-sm tabular-nums text-muted-foreground" aria-live="polite">
        {query.isChangingPage && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Page {query.page}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={!query.hasNextPage || query.isChangingPage}
        onClick={() => go(query.fetchNextPage)}
      >
        Next <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
      </Button>
    </nav>
  );
};
