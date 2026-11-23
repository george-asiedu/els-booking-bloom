import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const SEARCH_MIN = 3;
const DELAY = 350;

/**
 * The one search box used across the app, so every search behaves the same:
 * it searches once typing pauses, from 3 characters (shorter shows everything,
 * with a hint saying why), shows when it's working, and has a clear button.
 *
 * `onSearch` receives the term to apply: trimmed, or "" when it's too short.
 * `value` is that applied term, so the parent can clear the box by setting "".
 */
export const SearchBox = ({
  value,
  onSearch,
  placeholder = "Search",
  label,
  busy,
  className,
  inputClassName,
}: {
  value: string;
  onSearch: (term: string) => void;
  placeholder?: string;
  label?: string;
  /** The parent is fetching results for the current term. */
  busy?: boolean;
  className?: string;
  inputClassName?: string;
}) => {
  const [text, setText] = useState(value);
  const applied = useRef(value);

  // Cleared from outside (a "Clear filters" button).
  useEffect(() => {
    if (value === "" && applied.current !== "") setText("");
    applied.current = value;
  }, [value]);

  const term = text.trim().length >= SEARCH_MIN ? text.trim() : "";
  useEffect(() => {
    if (term === applied.current) return;
    const t = setTimeout(() => {
      applied.current = term;
      onSearch(term);
    }, DELAY);
    return () => clearTimeout(t);
  }, [term, onSearch]);

  const typing = term !== value;
  const tooShort = text.trim().length > 0 && text.trim().length < SEARCH_MIN;

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={cn("pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden", inputClassName)}
      />
      <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
        {(typing && term) || busy ? (
          <Loader2 className="mx-1 h-4 w-4 animate-spin text-muted-foreground" aria-label="Searching" />
        ) : text ? (
          <button
            type="button"
            onClick={() => {
              setText("");
              applied.current = "";
              onSearch("");
            }}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </span>
      {tooShort && (
        <p className="absolute left-0 top-full z-10 mt-1 text-xs text-muted-foreground" role="status">
          Type at least {SEARCH_MIN} letters to search.
        </p>
      )}
    </div>
  );
};
