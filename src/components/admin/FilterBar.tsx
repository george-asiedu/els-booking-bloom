import { ReactNode } from "react";
import { X } from "lucide-react";
import { SearchBox } from "@/components/ui/search-box";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * A compact filter row for admin list pages: a search box plus any number of
 * filter controls (selects, date inputs), with a "Clear" action and a result
 * count.
 */
export const FilterBar = ({
  search,
  onSearch,
  searchPlaceholder = "Search…",
  children,
  onClear,
  active,
  count,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  onClear: () => void;
  active: boolean; // whether any filter (incl. search) is set
  count?: number;
}) => (
  <Card>
    <CardContent className="flex flex-col gap-3 pb-6 pt-4 lg:flex-row lg:items-center">
      <SearchBox value={search} onSearch={onSearch} placeholder={searchPlaceholder} className="flex-1 min-w-[180px] lg:mb-0" />
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {active && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
        {count !== undefined && (
          <span className="ml-auto text-sm text-muted-foreground lg:ml-2">
            {count} result{count === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);
