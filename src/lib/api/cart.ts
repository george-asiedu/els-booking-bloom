import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Commerce: cart ----------------

export interface CartItemDTO {
  product_id: string;
  name: string;
  unit_price: number;
  image_url: string | null;
  quantity: number;
  line_total: number;
  in_stock: boolean;
  max_qty: number | null; // null when stock isn't tracked
}

export interface CartDTO {
  items: CartItemDTO[];
  subtotal: number;
  count: number;
}

interface RawCart {
  items: {
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: number;
      promoPrice: number | null;
      imageUrl: string | null;
      stock: number;
      trackStock: boolean;
      active: boolean;
    };
  }[];
}

const normalizeCart = (c: RawCart | null): CartDTO => {
  const items = (c?.items ?? []).map((it) => {
    const p = it.product;
    const onPromo = p.promoPrice != null && p.promoPrice < p.price;
    const unit = onPromo ? (p.promoPrice as number) : p.price;
    return {
      product_id: it.productId,
      name: p.name,
      unit_price: unit,
      image_url: p.imageUrl,
      quantity: it.quantity,
      line_total: Math.round(unit * it.quantity * 100) / 100,
      in_stock: p.active && (!p.trackStock || p.stock > 0),
      max_qty: p.trackStock ? p.stock : null,
    };
  });
  const subtotal =
    Math.round(items.reduce((s, i) => s + i.line_total, 0) * 100) / 100;
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return { items, subtotal, count };
};

export const cartApi = {
  async getMine(): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart | null>>("/cart", {
      auth: true,
    });
    return normalizeCart(res.data);
  },
  async addItem(productId: string, quantity = 1): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart>>("/cart/items", {
      method: "POST",
      auth: true,
      body: { productId, quantity },
    });
    return normalizeCart(res.data);
  },
  async updateItem(productId: string, quantity: number): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart>>("/cart/items", {
      method: "PUT",
      auth: true,
      body: { productId, quantity },
    });
    return normalizeCart(res.data);
  },
  async removeItem(productId: string): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart>>(
      `/cart/items/${productId}`,
      { method: "DELETE", auth: true },
    );
    return normalizeCart(res.data);
  },
  async clear(): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart>>("/cart", {
      method: "DELETE",
      auth: true,
    });
    return normalizeCart(res.data);
  },
};
