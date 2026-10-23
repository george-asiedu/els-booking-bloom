import { useState } from "react";
import type { ProductDTO } from "@/lib/api";

export interface AddOnItem {
  product: ProductDTO;
  qty: number;
}

/** Products added to a booking (productId → quantity) and what they cost. */
export const useAddOns = (products: ProductDTO[]) => {
  const [addOns, setAddOns] = useState<Record<string, number>>({});

  const items = Object.entries(addOns)
    .map(([id, qty]) => {
      const product = products.find((p) => p.id === id);
      return product ? { product, qty } : null;
    })
    .filter((x): x is AddOnItem => !!x);
  const subtotal =
    Math.round(
      items.reduce((s, i) => s + i.product.effective_price * i.qty, 0) * 100,
    ) / 100;

  const setQty = (id: string, qty: number) =>
    setAddOns((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  return { addOns, setAddOns, items, subtotal, hasAddOns: items.length > 0, setQty };
};
