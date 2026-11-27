// A product's price when its options cost different amounts (1 kg, 5 kg, a 20 kg
// crate...). The same rule as the server's (ELS-Server src/product/pricing.ts):
// a sale or promo price is a fraction of the lowest price, and that fraction
// comes off every option.

export interface Variant {
  label: string;
  price: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const readVariants = (raw: unknown): Variant[] => {
  if (!Array.isArray(raw)) return [];
  const out: Variant[] = [];
  for (const v of raw) {
    const { label, price } = (v ?? {}) as { label?: unknown; price?: unknown };
    if (typeof label === "string" && label.trim() && Number(price) > 0) out.push({ label: label.trim(), price: round2(Number(price)) });
  }
  return out;
};

/** The option's own price before any sale, or the product's price. */
export const basePriceFor = (p: { price: number; variants?: unknown }, size?: string | null): number => {
  const variant = size ? readVariants(p.variants).find((v) => v.label === size) : undefined;
  return variant?.price ?? p.price;
};

/** What one unit costs for the chosen option, after any sale. */
export const effectivePriceFor = (
  p: { price: number; promoPrice: number | null; variants?: unknown },
  size?: string | null,
): number => {
  const base = basePriceFor(p, size);
  if (p.promoPrice != null && p.promoPrice < p.price && p.price > 0) return round2((base * p.promoPrice) / p.price);
  return base;
};
