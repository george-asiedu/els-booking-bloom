// A product's price when its options cost different amounts (1 kg, 5 kg, a 20 kg
// crate...). The same rule as the server's (ELS-Server src/product/pricing.ts):
// a sale or promo price is a fraction of the lowest price, and that fraction
// comes off every option.

export interface Variant {
  label: string;
  price: number;
  /** How many of this option are in stock. Set on every option, or on none. */
  stock?: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const readVariants = (raw: unknown): Variant[] => {
  if (!Array.isArray(raw)) return [];
  const out: Variant[] = [];
  for (const v of raw) {
    const { label, price, stock } = (v ?? {}) as { label?: unknown; price?: unknown; stock?: unknown };
    if (typeof label === "string" && label.trim() && Number(price) > 0)
      out.push({ label: label.trim(), price: round2(Number(price)), ...(stock !== undefined && stock !== null && Number(stock) >= 0 ? { stock: Math.floor(Number(stock)) } : {}) });
  }
  return out;
};

/** The option's own price before any sale, or the product's price. */
export const basePriceFor = (p: { price: number; variants?: unknown }, size?: string | null): number => {
  const variant = size ? readVariants(p.variants).find((v) => v.label === size) : undefined;
  return variant?.price ?? p.price;
};

export interface BulkTier {
  minQty: number;
  percentOff: number;
}

/** Bulk prices as a clean list, smallest quantity first. */
export const readTiers = (raw: unknown): BulkTier[] => {
  if (!Array.isArray(raw)) return [];
  const out: BulkTier[] = [];
  for (const t of raw) {
    const { minQty, percentOff } = (t ?? {}) as { minQty?: unknown; percentOff?: unknown };
    if (Number(minQty) >= 2 && Number(percentOff) > 0 && Number(percentOff) < 100) out.push({ minQty: Math.floor(Number(minQty)), percentOff: Number(percentOff) });
  }
  return out.sort((a, b) => a.minQty - b.minQty);
};

/** The percentage off for buying `qty` of it (0 when no tier fits). */
export const tierPercent = (raw: unknown, qty: number): number => [...readTiers(raw)].reverse().find((t) => qty >= t.minQty)?.percentOff ?? 0;

/** What one unit costs for the chosen option and quantity: after any sale, or the bulk price if that is lower. */
export const effectivePriceFor = (
  p: { price: number; promoPrice: number | null; variants?: unknown; bulkTiers?: unknown },
  size?: string | null,
  qty?: number,
): number => {
  const base = basePriceFor(p, size);
  let price = base;
  if (p.promoPrice != null && p.promoPrice < p.price && p.price > 0) price = round2((base * p.promoPrice) / p.price);
  const off = qty ? tierPercent(p.bulkTiers, qty) : 0;
  if (off > 0) price = Math.min(price, round2(base * (1 - off / 100)));
  return price;
};

/** True when each option of the product counts its own stock. */
export const usesOptionStock = (p: { trackStock: boolean; variants?: unknown }): boolean => {
  const v = readVariants(p.variants);
  return p.trackStock && v.length > 0 && v.every((x) => x.stock !== undefined);
};

/** How many can be bought: the chosen option's own stock, or the product's. */
export const stockForOption = (p: { trackStock: boolean; stock: number; variants?: unknown }, size?: string | null): number => {
  if (!usesOptionStock(p)) return p.stock;
  return readVariants(p.variants).find((v) => v.label === size)?.stock ?? 0;
};
