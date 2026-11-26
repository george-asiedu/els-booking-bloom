import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Load more" under a paginated list (a react-query infinite query). Renders
 * nothing once there are no more pages.
 */
export const LoadMore = ({
  query,
  label = "Load more",
}: {
  query: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown };
  label?: string;
}) =>
  query.hasNextPage ? (
    <div className="mt-4 text-center">
      <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
        {query.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {label}
      </Button>
    </div>
  ) : null;
