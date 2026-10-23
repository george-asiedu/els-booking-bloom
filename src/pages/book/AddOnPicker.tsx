import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { formatGHS } from "@/lib/currency";
import type { ProductDTO } from "@/lib/api";

// 28px buttons with a 40px tap target: the pseudo-element extends the hit
// area 6px each side without moving anything.
const HIT_AREA = "relative h-7 w-7 after:absolute after:-inset-1.5 after:content-['']";

export const AddOnPicker = ({
  products,
  quantities,
  onChange,
}: {
  products: ProductDTO[];
  quantities: Record<string, number>;
  onChange: (productId: string, qty: number) => void;
}) => (
  <div className="space-y-2">
    <FormLabel className="flex items-center gap-2">
      <ShoppingBag className="h-4 w-4" />
      Add products (optional)
    </FormLabel>
    <p className="text-sm text-muted-foreground">
      Grab products to go with your appointment — paid together and collected
      at the studio.
    </p>
    <div className="space-y-2">
      {products.map((p) => {
        const qty = quantities[p.id] ?? 0;
        return (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-md border border-border p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatGHS(p.effective_price)}
                {p.on_promo ? " (Promo)" : ""}
              </p>
            </div>
            {qty > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={HIT_AREA}
                  aria-label={`Remove one ${p.name}`}
                  onClick={() => onChange(p.id, qty - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={HIT_AREA}
                  aria-label={`Add one more ${p.name}`}
                  disabled={p.track_stock && qty >= p.stock}
                  onClick={() => onChange(p.id, qty + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!p.in_stock}
                onClick={() => onChange(p.id, 1)}
              >
                {p.in_stock ? "Add" : "Out of stock"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
