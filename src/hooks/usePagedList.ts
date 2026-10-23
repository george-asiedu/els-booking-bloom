import { useEffect, useState } from "react";

/**
 * Client-side paging for a list that's already loaded in full (categories,
 * the studios list). Goes back to page 1 when the list's length changes,
 * e.g. after filtering.
 */
export const usePagedList = <T,>(items: T[], pageSize = 20) => {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => setPage(1), [items.length]);
  const current = Math.min(page, pages);
  return {
    page: current,
    setPage,
    pageSize,
    total: items.length,
    rows: items.slice((current - 1) * pageSize, current * pageSize),
  };
};
