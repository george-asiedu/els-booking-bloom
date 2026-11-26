import { useState } from "react";
import { keepPreviousData, useQuery, type QueryKey } from "@tanstack/react-query";

/**
 * Previous / Next paging over a cursor-paginated API list.
 *
 * Takes the same options as react-query's useInfiniteQuery (queryKey,
 * queryFn({ pageParam }), getNextPageParam) but shows ONE page at a time: Next
 * fetches the following page in place of this one, Previous goes back. So a
 * long list never makes the page longer. Cursors already visited are kept,
 * which is what lets Previous work with a forward-only cursor API.
 *
 * `data.pages` holds just the current page, so code written for an infinite
 * query (`data?.pages.flatMap(...)`) keeps working. Changing the queryKey
 * (a filter or tab) starts again at page 1.
 *
 * Each page is cached under [...queryKey, "page", cursor], so invalidating
 * queryKey refreshes every page.
 */
export function useCursorPages<TPage>(opts: {
  queryKey: QueryKey;
  queryFn: (ctx: { pageParam: string | undefined }) => Promise<TPage>;
  getNextPageParam: (lastPage: TPage) => string | null | undefined;
  /** Accepted for drop-in compatibility with useInfiniteQuery; unused. */
  initialPageParam?: string | undefined;
  /** Accepted for compatibility; the previous page always stays on screen while the next loads. */
  placeholderData?: unknown;
  enabled?: boolean;
}) {
  const keyId = JSON.stringify(opts.queryKey);
  const [state, setState] = useState<{ keyId: string; cursors: (string | undefined)[] }>({
    keyId,
    cursors: [undefined],
  });
  // A new filter or tab: back to the first page.
  const cursors = state.keyId === keyId ? state.cursors : [undefined];
  const index = cursors.length - 1;
  const cursor = cursors[index];

  const query = useQuery({
    queryKey: [...opts.queryKey, "page", cursor ?? null],
    queryFn: () => opts.queryFn({ pageParam: cursor }),
    // Keep showing the current page while the next one loads.
    placeholderData: keepPreviousData,
    ...(opts.enabled !== undefined ? { enabled: opts.enabled } : {}),
  });

  const next = query.data && !query.isPlaceholderData ? opts.getNextPageParam(query.data) ?? undefined : undefined;
  const changing = query.isFetching && query.isPlaceholderData;

  return {
    data: query.data ? { pages: [query.data] } : undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    /** 1-based number of the page on screen. */
    page: index + 1,
    hasNextPage: Boolean(next),
    hasPreviousPage: index > 0,
    /** True while Next or Previous is loading the other page. */
    isChangingPage: changing,
    // Names kept from useInfiniteQuery so existing "load more" code still reads.
    isFetchingNextPage: changing,
    fetchNextPage: () => {
      if (next) setState({ keyId, cursors: [...cursors, next] });
    },
    fetchPreviousPage: () => {
      if (index > 0) setState({ keyId, cursors: cursors.slice(0, -1) });
    },
    /** Back to page 1 (e.g. after creating an item). */
    resetPages: () => setState({ keyId, cursors: [undefined] }),
  };
}

export type CursorPagesQuery = ReturnType<typeof useCursorPages<unknown>>;
