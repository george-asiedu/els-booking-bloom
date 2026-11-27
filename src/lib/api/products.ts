import { apiRequest } from "../apiClient";
import { CategoryDTO } from "./categories";
import { readVariants, readTiers, effectivePriceFor, basePriceFor, type Variant, type BulkTier } from "../variantPricing";
import { CursorPage, Envelope, cursorPage, cursorQuery, uploadStudioMedia } from "./core";

// ---------------- Commerce: products ----------------

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  cost_price: number;
  promo_price: number | null;
  on_promo: boolean;
  effective_price: number;
  image_url: string | null;
  // Every photo, main one first.
  images: string[];
  sizes: string[];
  /** What one item is sold as ("kg", "crate"...), shown after the price. */
  unit: string | null;
  /** A price for each option; empty when every option costs the same. */
  variants: Variant[];
  /** Pre-order: the day it is ready (YYYY-MM-DD), while that day is still ahead. */
  available_from: string | null;
  preorder: boolean;
  /** The least a customer can order, in units. */
  min_quantity: number;
  /** Cheaper per unit in bulk, smallest quantity first. */
  bulk_tiers: BulkTier[];
  colors: { name: string; hex: string }[];
  rating_average: number | null;
  rating_count: number;
  category: string;
  stock: number;
  track_stock: boolean;
  in_stock: boolean;
  active: boolean;
  popular: boolean;
  audience: ProductAudience;
  brand: string | null;
  /** Facts for the product page table, e.g. { label: "Fabric", value: "Cotton" }. */
  attributes: { label: string; value: string }[];
  created_at: string | null;
}

export type ProductAudience = "MEN" | "WOMEN" | "UNISEX";

interface RawProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  costPrice?: number;
  promoPrice: number | null;
  imageUrl: string | null;
  images?: string[];
  sizes?: string[];
  unit?: string | null;
  variants?: unknown;
  availableFrom?: string | null;
  minQuantity?: number;
  bulkTiers?: unknown;
  colors?: string[];
  ratingAverage?: number | null;
  ratingCount?: number;
  category: string;
  stock: number;
  trackStock: boolean;
  active: boolean;
  popular: boolean;
  audience?: string;
  brand?: string | null;
  attributes?: string[];
  createdAt?: string;
}

const normalizeProduct = (p: RawProduct): ProductDTO => {
  const onPromo = p.promoPrice != null && p.promoPrice < p.price;
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: p.price,
    cost_price: p.costPrice ?? 0,
    promo_price: p.promoPrice,
    on_promo: onPromo,
    effective_price: onPromo ? (p.promoPrice as number) : p.price,
    image_url: p.imageUrl,
    images: [...(p.imageUrl ? [p.imageUrl] : []), ...(p.images ?? [])],
    sizes: p.sizes ?? [],
    unit: p.unit ?? null,
    variants: readVariants(p.variants),
    available_from: p.availableFrom ? p.availableFrom.slice(0, 10) : null,
    preorder: Boolean(p.availableFrom) && new Date(p.availableFrom as string).getTime() > Date.now(),
    min_quantity: p.minQuantity && p.minQuantity > 1 ? p.minQuantity : 1,
    bulk_tiers: readTiers(p.bulkTiers),
    colors: (p.colors ?? []).map((c) => {
      const [name, hex] = c.split("|");
      return { name, hex };
    }),
    rating_average: p.ratingAverage ?? null,
    rating_count: p.ratingCount ?? 0,
    category: p.category,
    stock: p.stock,
    track_stock: p.trackStock,
    in_stock: !p.trackStock || p.stock > 0,
    active: p.active,
    popular: p.popular,
    audience: p.audience === "MEN" || p.audience === "WOMEN" ? p.audience : "UNISEX",
    brand: p.brand ?? null,
    attributes: (p.attributes ?? []).map((a) => {
      const [label, value] = a.split("|");
      return { label, value };
    }),
    created_at: p.createdAt ?? null,
  };
};

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  promoPrice?: number | null;
  category: string;
  stock?: number;
  trackStock?: boolean;
  active?: boolean;
  popular?: boolean;
  image?: File | null;
  imageUrl?: string | null;
  // Extra photos: already-uploaded ones to keep, and new files to add.
  images?: string[];
  newImages?: File[];
  sizes?: string[];
  /** What one item is sold as ("kg", "crate"...). Blank clears it. */
  unit?: string | null;
  /** A price for each option. An empty list goes back to one price. */
  variants?: Variant[];
  /** Pre-order: the day it is ready (YYYY-MM-DD). Null clears it. */
  availableFrom?: string | null;
  minQuantity?: number;
  /** Cheaper per unit in bulk. An empty list clears it. */
  bulkTiers?: BulkTier[];
  colors?: string[];
  audience?: ProductAudience;
  brand?: string | null;
  attributes?: string[];
}

const productForm = (input: Partial<ProductInput>): FormData => {
  const form = new FormData();
  if (input.name !== undefined) form.append("name", input.name);
  if (input.description !== undefined) form.append("description", input.description);
  if (input.price !== undefined) form.append("price", String(input.price));
  if (input.costPrice !== undefined) form.append("costPrice", String(input.costPrice));
  if (input.promoPrice !== undefined && input.promoPrice !== null)
    form.append("promoPrice", String(input.promoPrice));
  if (input.promoPrice === null) form.append("promoPrice", "");
  if (input.category !== undefined) form.append("category", input.category);
  if (input.stock !== undefined) form.append("stock", String(input.stock));
  if (input.trackStock !== undefined)
    form.append("trackStock", String(input.trackStock));
  if (input.active !== undefined) form.append("active", String(input.active));
  if (input.popular !== undefined) form.append("popular", String(input.popular));
  if (input.image) form.append("image", input.image);
  return form;
};

const withExtraPhotos = async (input: Partial<ProductInput>) => {
  if (input.images === undefined && !input.newImages?.length) return {};
  const added = await Promise.all((input.newImages ?? []).map((f) => uploadStudioMedia(f, "products")));
  return { images: [...(input.images ?? []), ...added] };
};

/** What one unit costs for the chosen option (the lowest price when none is chosen), after any sale. */
export const optionPrice = (p: ProductDTO, size?: string | null, qty?: number): number =>
  effectivePriceFor({ price: p.price, promoPrice: p.promo_price, variants: p.variants, bulkTiers: p.bulk_tiers }, size, qty);
/** The same before any sale. */
export const optionBase = (p: ProductDTO, size?: string | null): number => basePriceFor({ price: p.price, variants: p.variants }, size);
/** "per kg" for a product sold by the kg, else an empty string. */
export const perUnit = (p: { unit: string | null }): string => (p.unit ? `per ${p.unit}` : "");
/** True when options cost different amounts. */
export const hasOptionPrices = (p: ProductDTO): boolean => new Set(p.variants.map((v) => v.price)).size > 1;

export const productsApi = {
  async listActive(): Promise<ProductDTO[]> {
    const res = await apiRequest<Envelope<RawProduct[]>>(`/products?${cursorQuery(undefined, 100)}`);
    return res.data.map(normalizeProduct);
  },
  async listActivePage(cursor?: string | null, limit = 15): Promise<CursorPage<ProductDTO>> {
    const res = await apiRequest<Envelope<RawProduct[]>>(`/products?${cursorQuery(cursor, limit)}`);
    return { ...cursorPage(res), items: res.data.map(normalizeProduct) };
  },
  async listAll(): Promise<ProductDTO[]> {
    const res = await apiRequest<Envelope<RawProduct[]>>(`/products/all?${cursorQuery(undefined, 100)}`, {
      auth: true,
    });
    return res.data.map(normalizeProduct);
  },
  async listAllPage(cursor?: string | null, limit = 15): Promise<CursorPage<ProductDTO>> {
    const res = await apiRequest<Envelope<RawProduct[]>>(`/products/all?${cursorQuery(cursor, limit)}`, { auth: true });
    return { ...cursorPage(res), items: res.data.map(normalizeProduct) };
  },
  async getOne(id: string): Promise<ProductDTO> {
    const res = await apiRequest<Envelope<RawProduct>>(`/products/${id}`);
    return normalizeProduct(res.data);
  },
  async create(input: ProductInput): Promise<ProductDTO> {
    const imageUrl = input.image ? await uploadStudioMedia(input.image, "products") : input.imageUrl;
    const res = await apiRequest<Envelope<RawProduct>>("/products", {
      method: "POST",
      auth: true,
      body: { ...input, image: undefined, newImages: undefined, imageUrl, ...(await withExtraPhotos(input)) },
    });
    return normalizeProduct(res.data);
  },
  async update(id: string, input: Partial<ProductInput>): Promise<ProductDTO> {
    const imageUrl = input.image ? await uploadStudioMedia(input.image, "products") : input.imageUrl;
    const res = await apiRequest<Envelope<RawProduct>>(`/products/${id}`, {
      method: "PUT",
      auth: true,
      body: { ...input, image: undefined, newImages: undefined, imageUrl, ...(await withExtraPhotos(input)) },
    });
    return normalizeProduct(res.data);
  },
  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/products/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

export const productCategoriesApi = {
  async listActive(): Promise<CategoryDTO[]> {
    const res = await apiRequest<Envelope<CategoryDTO[]>>("/product-categories");
    return res.data;
  },
  async listAll(): Promise<CategoryDTO[]> {
    const res = await apiRequest<Envelope<CategoryDTO[]>>(
      "/product-categories/all",
      { auth: true },
    );
    return res.data;
  },
  async create(name: string): Promise<CategoryDTO> {
    const res = await apiRequest<Envelope<CategoryDTO>>("/product-categories", {
      method: "POST",
      auth: true,
      body: { name },
    });
    return res.data;
  },
  async update(
    id: string,
    input: { name?: string; active?: boolean; order?: number },
  ): Promise<CategoryDTO> {
    const res = await apiRequest<Envelope<CategoryDTO>>(
      `/product-categories/${id}`,
      { method: "PUT", auth: true, body: input },
    );
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/product-categories/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};
