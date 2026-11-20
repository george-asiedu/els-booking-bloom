import { apiRequest, tokenStore } from "../apiClient";
import { productsApi } from "./products";
import { Envelope } from "./core";

// ---------------- Commerce: cart ----------------

export interface CartItemDTO {
  product_id: string;
  size: string;
  color: string;
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
    size?: string;
    color?: string;
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
      size: it.size ?? "",
      color: it.color ?? "",
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

// ---- A visitor without an account keeps a basket on their own device. It has
// the same shape as the signed-in one, so the basket pages don't care which it
// is. Signing in adds it to their account's basket (mergeGuestCart).

interface GuestLine { productId: string; quantity: number; size: string; color: string }
const GUEST_KEY = "zuri-guest-cart";
const readGuest = (): GuestLine[] => {
  try {
    const v = JSON.parse(localStorage.getItem(GUEST_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((l) => l && typeof l.productId === "string" && l.quantity > 0) : [];
  } catch {
    return [];
  }
};
const writeGuest = (lines: GuestLine[]) => {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
  } catch {
    /* storage blocked: the basket just won't be remembered */
  }
};
const sameLine = (l: GuestLine, id: string, size: string, color: string) => l.productId === id && l.size === size && l.color === color;
export const isGuestShopper = () => !tokenStore.getUser();

/** The guest basket with current names, prices and stock. */
const guestCart = async (): Promise<CartDTO> => {
  const lines = readGuest();
  if (!lines.length) return { items: [], subtotal: 0, count: 0 };
  const products = await productsApi.listActive();
  const items: CartItemDTO[] = lines.map((l) => {
    const p = products.find((x) => x.id === l.productId);
    const unit = p?.effective_price ?? 0;
    const room = p?.track_stock ? p.stock : null;
    const quantity = room !== null ? Math.min(l.quantity, Math.max(room, 1)) : l.quantity;
    return {
      product_id: l.productId,
      size: l.size,
      color: l.color,
      name: p?.name ?? "This item is no longer available",
      unit_price: unit,
      image_url: p?.image_url ?? null,
      quantity,
      line_total: Math.round(unit * quantity * 100) / 100,
      in_stock: Boolean(p?.in_stock),
      max_qty: room,
    };
  });
  return {
    items,
    subtotal: Math.round(items.reduce((s, i) => s + i.line_total, 0) * 100) / 100,
    count: items.reduce((n, i) => n + i.quantity, 0),
  };
};

/** Move the guest basket into the signed-in account's basket. */
export const mergeGuestCart = async () => {
  const lines = readGuest();
  if (!lines.length) return;
  for (const l of lines) {
    await apiRequest("/cart/items", { method: "POST", auth: true, body: { productId: l.productId, quantity: l.quantity, size: l.size, color: l.color } }).catch(() => undefined);
  }
  writeGuest([]);
};
export const clearGuestCart = () => writeGuest([]);
/** What a guest checkout sends. */
export const guestCartLines = () => readGuest().map((l) => ({ productId: l.productId, quantity: l.quantity, size: l.size || undefined, color: l.color || undefined }));

export const cartApi = {
  async getMine(): Promise<CartDTO> {
    if (isGuestShopper()) return guestCart();
    const res = await apiRequest<Envelope<RawCart | null>>("/cart", {
      auth: true,
    });
    return normalizeCart(res.data);
  },
  async addItem(productId: string, quantity = 1, size = "", color = ""): Promise<CartDTO> {
    if (isGuestShopper()) {
      const lines = readGuest();
      const have = lines.find((l) => sameLine(l, productId, size, color));
      if (have) have.quantity += quantity;
      else lines.push({ productId, quantity, size, color });
      writeGuest(lines);
      return guestCart();
    }
    const res = await apiRequest<Envelope<RawCart>>("/cart/items", {
      method: "POST",
      auth: true,
      body: { productId, quantity, size, color },
    });
    return normalizeCart(res.data);
  },
  async updateItem(productId: string, quantity: number, size = "", color = ""): Promise<CartDTO> {
    if (isGuestShopper()) {
      writeGuest(readGuest().map((l) => (sameLine(l, productId, size, color) ? { ...l, quantity: Math.max(1, quantity) } : l)));
      return guestCart();
    }
    const res = await apiRequest<Envelope<RawCart>>("/cart/items", {
      method: "PUT",
      auth: true,
      body: { productId, quantity, size, color },
    });
    return normalizeCart(res.data);
  },
  async removeItem(productId: string, size = "", color = ""): Promise<CartDTO> {
    if (isGuestShopper()) {
      writeGuest(readGuest().filter((l) => !sameLine(l, productId, size, color)));
      return guestCart();
    }
    const query = new URLSearchParams({ size, color }).toString();
    const res = await apiRequest<Envelope<RawCart>>(
      `/cart/items/${productId}?${query}`,
      { method: "DELETE", auth: true },
    );
    return normalizeCart(res.data);
  },
  async clear(): Promise<CartDTO> {
    if (isGuestShopper()) {
      writeGuest([]);
      return guestCart();
    }
    const res = await apiRequest<Envelope<RawCart>>("/cart", {
      method: "DELETE",
      auth: true,
    });
    return normalizeCart(res.data);
  },
};
