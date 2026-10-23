import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  // The one table look across the app: a soft tint of the brand colour in
  // the header, alternating row shades in the body (see TableBody).
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("bg-primary/10 dark:bg-primary/15 [&_tr]:border-b [&_tr]:border-primary/15 [&_tr:hover]:bg-transparent", className)}
      {...props}
    />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0 [&>tr:nth-child(even)]:bg-muted/40", className)}
      {...props}
    />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

// Clicks on the row's own controls (buttons, menus, switches, links, fields)
// do their own thing and don't open the row.
const INTERACTIVE =
  "button, a, input, select, textarea, label, [role=switch], [role=combobox], [role=menuitem], [role=checkbox], [data-row-ignore]";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    /** Makes the row open its details: click, or Enter/Space when focused. */
    onOpen?: () => void;
  }
>(({ className, onOpen, onClick, onKeyDown, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors data-[state=selected]:bg-muted hover:!bg-accent/50",
      onOpen && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
      className,
    )}
    {...(onOpen ? { tabIndex: 0 } : {})}
    onClick={(e) => {
      onClick?.(e);
      if (onOpen && !(e.target as HTMLElement).closest(INTERACTIVE)) onOpen();
    }}
    onKeyDown={(e) => {
      onKeyDown?.(e);
      if (onOpen && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onOpen();
      }
    }}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-11 px-4 text-left align-middle text-sm font-semibold text-foreground/80 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
