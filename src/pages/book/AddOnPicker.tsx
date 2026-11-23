import { SearchBox } from "@/components/ui/search-box";
import { useState } from "react";
import { ImageOff, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatGHS } from "@/lib/currency";
import type { ProductDTO } from "@/lib/api";

// 28px buttons with a 40px tap target: the pseudo-element extends the hit
// area 6px each side without moving anything.
const HIT_AREA = "relative h-7 w-7 after:absolute after:-inset-1.5 after:content-['']";

const Stepper = ({ p, qty, onChange }: { p: ProductDTO; qty: number; onChange: (id: string, q: number) => void }) =>
  qty > 0 ? (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" className={HIT_AREA} aria-label={`Remove one ${p.name}`} onClick={() => onChange(p.id, qty - 1)}>
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
      <Button type="button" variant="outline" size="icon" className={HIT_AREA} aria-label={`Add one more ${p.name}`} disabled={p.track_stock && qty >= p.stock} onClick={() => onChange(p.id, qty + 1)}>
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  ) : (
    <Button type="button" variant="outline" size="sm" disabled={!p.in_stock} onClick={() => onChange(p.id, 1)}>
      {p.in_stock ? "Add" : "Sold out"}
    </Button>
  );

/**
 * Optional products for a booking. Kept to one line in the form: products are
 * chosen in a side panel, and only what's been picked is shown here.
 */
export const AddOnPicker = ({
  products,
  quantities,
  onChange,
}: {
  products: ProductDTO[];
  quantities: Record<string, number>;
  onChange: (productId: string, qty: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const chosen = products.filter((p) => (quantities[p.id] ?? 0) > 0);
  const query = q.trim().toLowerCase();
  const shown = products.filter((p) => !query || p.name.toLowerCase().includes(query) || p.category.includes(query));

  return (
    <div className="space-y-2">
      <FormLabel className="flex items-center gap-2">
        <ShoppingBag className="h-4 w-4" />
        Add products (optional)
      </FormLabel>
      {chosen.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {chosen.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{formatGHS(p.effective_price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Stepper p={p} qty={quantities[p.id] ?? 0} onChange={onChange} />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remove ${p.name}`} onClick={() => onChange(p.id, 0)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setOpen(true)}>
        <span>{chosen.length ? "Add more products" : "Browse products to add"}</span>
        <span className="text-xs text-muted-foreground">{products.length} available</span>
      </Button>
      <p className="text-xs text-muted-foreground">Paid together with your booking and collected at the studio.</p>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border p-5 text-left">
            <SheetTitle>Add products</SheetTitle>
            <SheetDescription>Pick anything you'd like with your appointment.</SheetDescription>
            <div className="pb-4 pt-2">
              <SearchBox value={q} onSearch={setQ} placeholder="Search products" />
            </div>
          </SheetHeader>
          <ul className="flex-1 divide-y divide-border overflow-y-auto">
            {shown.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.image_url ? <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ImageOff className="m-auto mt-4 h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{formatGHS(p.effective_price)}{p.on_promo ? " · On offer" : ""}</p>
                </div>
                <Stepper p={p} qty={quantities[p.id] ?? 0} onChange={onChange} />
              </li>
            ))}
            {shown.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No products match that search.</li>}
          </ul>
          <div className="border-t border-border p-4">
            <Button type="button" className="w-full" onClick={() => setOpen(false)}>
              Done{chosen.length ? ` (${chosen.reduce((n, p) => n + (quantities[p.id] ?? 0), 0)} added)` : ""}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
