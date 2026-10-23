import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface DetailItem {
  label: string;
  value: ReactNode;
  /** Monospace, for references and IDs. */
  mono?: boolean;
}

export interface DetailSection {
  title?: string;
  items?: DetailItem[];
  /** Free content instead of (or after) label/value rows. */
  content?: ReactNode;
}

/**
 * The details drawer every table row opens: a title, a few badges, an optional
 * picture, then labelled sections of facts. Empty values show as "—".
 */
export const DetailsSheet = ({
  open,
  onClose,
  title,
  subtitle,
  badges,
  media,
  sections,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  media?: ReactNode;
  sections: DetailSection[];
  footer?: ReactNode;
}) => (
  <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
    <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
      <SheetHeader className="border-b px-6 py-5 text-left">
        <SheetTitle className="pr-6">{title}</SheetTitle>
        {subtitle ? <SheetDescription>{subtitle}</SheetDescription> : <SheetDescription className="sr-only">Details</SheetDescription>}
        {badges && <div className="flex flex-wrap gap-2 pt-1">{badges}</div>}
      </SheetHeader>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {media && <div className="overflow-hidden rounded-lg border bg-muted">{media}</div>}
        {sections.map((section, i) => (
          <section key={section.title ?? i}>
            {section.title && <h3 className="mb-1 text-sm font-semibold">{section.title}</h3>}
            {section.items && section.items.length > 0 && (
              <dl className="divide-y">
                {section.items.map((item) => (
                  <div key={item.label} className="flex justify-between gap-4 py-2 text-sm">
                    <dt className="shrink-0 text-muted-foreground">{item.label}</dt>
                    <dd className={cn("min-w-0 break-words text-right", item.mono && "font-mono text-xs")}>
                      {item.value === null || item.value === undefined || item.value === "" ? "—" : item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {section.content}
          </section>
        ))}
      </div>
      {footer && <SheetFooter className="border-t px-6 py-4">{footer}</SheetFooter>}
    </SheetContent>
  </Sheet>
);
