import { apiRequest } from "../apiClient";
import { CategoryDTO } from "./categories";
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
  category: string;
  stock: number;
  track_stock: boolean;
  in_stock: boolean;
  active: boolean;
  popular: boolean;
}

interface RawProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  costPrice?: number;
  promoPrice: number | null;
  imageUrl: string | null;
  category: string;
  stock: number;
  trackStock: boolean;
  active: boolean;
  popular: boolean;
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
    category: p.category,
    stock: p.stock,
    track_stock: p.trackStock,
    in_stock: !p.trackStock || p.stock > 0,
    active: p.active,
    popular: p.popular,
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

export const productsApi = {
  async listActive(): Promise<ProductDTO[]> {
    const res = await apiRequest<Envelope<RawProduct[]>>(`/products?${cursorQuery(undefined, 100)}`);
    return res.data.map(normalizeProduct);
  },
  async listActivePage(cursor?: string | null, limit = 24): Promise<CursorPage<ProductDTO>> {
    const res = await apiRequest<Envelope<RawProduct[]>>(`/products?${cursorQuery(cursor, limit)}`);
    return { ...cursorPage(res), items: res.data.map(normalizeProduct) };
  },
  async listAll(): Promise<ProductDTO[]> {
    const res = await apiRequest<Envelope<RawProduct[]>>(`/products/all?${cursorQuery(undefined, 100)}`, {
      auth: true,
    });
    return res.data.map(normalizeProduct);
  },
  async listAllPage(cursor?: string | null, limit = 25): Promise<CursorPage<ProductDTO>> {
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
      body: { ...input, image: undefined, imageUrl },
    });
    return normalizeProduct(res.data);
  },
  async update(id: string, input: Partial<ProductInput>): Promise<ProductDTO> {
    const imageUrl = input.image ? await uploadStudioMedia(input.image, "products") : input.imageUrl;
    const res = await apiRequest<Envelope<RawProduct>>(`/products/${id}`, {
      method: "PUT",
      auth: true,
      body: { ...input, image: undefined, imageUrl },
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
