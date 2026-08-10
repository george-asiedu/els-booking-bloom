// Remembers a product a guest tried to add to their cart, so the action can be
// resumed after they log in.
const KEY = "pendingCartAdd";

export const setPendingCartAdd = (productId: string) => {
  localStorage.setItem(KEY, productId);
};

export const takePendingCartAdd = (): string | null => {
  const v = localStorage.getItem(KEY);
  if (v) localStorage.removeItem(KEY);
  return v;
};
