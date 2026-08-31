import { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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
    <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>
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
