import { useState } from "react";
import { Link } from "react-router-dom";
import { CouponBox } from "@/components/shop/CouponBox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Minus, Plus, Loader2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopLayout as Layout } from "@/components/shop/ShopLayout";
import { ProductRow, SHOP_CTA } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import { cartApi, contactInfoApi, productsApi, type CartItemDTO } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatGHS as GHS } from "@/lib/currency";

/** Your basket (cart_bag): a table of items, totals, and "you may also like". */
const Cart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isCustomer = !!user && user.role !== "ADMIN";
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getMine(),
    enabled: isCustomer,
  });
  const { data: allProducts = [] } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => productsApi.listActive(),
  });
  const { data: contact } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: ["cart"] });
  const onError = (error: unknown) =>
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: error instanceof Error ? error.message : "Please try again.",
    });
  const updateMutation = useMutation({
    mutationFn: ({ item, quantity }: { item: CartItemDTO; quantity: number }) =>
      cartApi.updateItem(item.product_id, quantity, item.size, item.color),
    onSuccess: invalidateCart,
    onError,
  });
  const removeMutation = useMutation({
    mutationFn: (item: CartItemDTO) => cartApi.removeItem(item.product_id, item.size, item.color),
    onSuccess: invalidateCart,
    onError,
  });

  // Gates.
  if (!user) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto max-w-md px-4 text-center">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
              Log in to view your bag
            </h1>
            <p className="mb-6 text-muted-foreground">
              Sign in to add products and check out.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/login?redirect=/cart">Log in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <Layout>
        <section className="py-20 text-center">
          <div className="container mx-auto max-w-md px-4">
            <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
              Admins can't shop
            </h1>
            <p className="mb-6 text-muted-foreground">
              Use a customer account to make purchases.
            </p>
            <Button asChild>
              <Link to="/admin">Back to dashboard</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const blocked = items.some((i) => !i.in_stock);
  const inBag = new Set(items.map((i) => i.product_id));
  const suggestions = allProducts.filter((p) => !inBag.has(p.id) && p.in_stock);
  const checkout = blocked ? (
    <span className={cn(SHOP_CTA, "w-full cursor-not-allowed opacity-40")}>Secure checkout</span>
  ) : (
    <Link to="/checkout" className={cn(SHOP_CTA, "w-full")}>Secure checkout</Link>
  );

  return (
    <Layout>
      <section className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md py-12 text-center">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Your basket is empty</h1>
            <p className="mt-2 text-muted-foreground">Add something you love and it will wait for you here.</p>
            <Link to="/shop/products" className={cn(SHOP_CTA, "mt-6")}>Browse products</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Your basket</h1>
                <p className="mt-1 text-sm">{count} {count === 1 ? "item" : "items"}</p>
              </div>
              <div className="hidden w-72 sm:block">{checkout}</div>
            </div>

            <div className="mt-6 hidden grid-cols-[1fr_7rem_8rem_7rem] border-y border-border py-3 text-xs uppercase tracking-wider md:grid">
              <span>Item</span><span>Price</span><span>Qty</span><span className="text-right">Total</span>
            </div>
            <ul className="divide-y divide-border border-b border-border md:border-t-0 mt-6 md:mt-0">
              {items.map((item) => (
                <li key={`${item.product_id}:${item.size}:${item.color}`} className="grid grid-cols-[5rem_1fr] gap-4 py-5 md:grid-cols-[1fr_7rem_8rem_7rem] md:items-start md:gap-0">
                  <div className="contents md:flex md:gap-4">
                    <Link to={`/shop/${item.product_id}`} className="h-24 w-20 shrink-0 overflow-hidden bg-muted">
                      {item.image_url && <img src={item.image_url} alt="" className="h-full w-full object-cover" />}
                    </Link>
                    <div className="min-w-0">
                      <Link to={`/shop/${item.product_id}`} className="font-medium hover:underline">{item.name}</Link>
                      {(item.size || item.color) && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}</p>
                      )}
                      {!item.in_stock && <p className="mt-1 text-sm text-destructive">No longer in stock. Remove it to continue.</p>}
                      <p className="mt-1 text-sm tabular-nums text-muted-foreground md:hidden">{GHS(item.unit_price)}</p>
                      <button type="button" onClick={() => removeMutation.mutate(item)} className="mt-3 text-xs underline underline-offset-2 hover:text-destructive">
                        Remove from basket
                      </button>
                    </div>
                  </div>
                  <p className="hidden text-sm tabular-nums md:block">{GHS(item.unit_price)}</p>
                  <div className="col-start-2 flex h-9 w-fit items-center border border-input md:col-start-auto">
                    <button type="button" aria-label="Less" className="h-full px-2.5 disabled:opacity-40" disabled={item.quantity <= 1 || updateMutation.isPending} onClick={() => updateMutation.mutate({ item, quantity: item.quantity - 1 })}><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                    <button type="button" aria-label="More" className="h-full px-2.5 disabled:opacity-40" disabled={(item.max_qty !== null && item.quantity >= item.max_qty) || updateMutation.isPending} onClick={() => updateMutation.mutate({ item, quantity: item.quantity + 1 })}><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <p className="col-start-2 text-sm font-medium tabular-nums md:col-start-auto md:text-right">{GHS(item.line_total)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8 grid gap-8 border border-border bg-secondary/40 p-6 md:grid-cols-2 md:p-8">
              <div className="text-sm">
                <p className="uppercase tracking-wider">Delivery</p>
                <p className="mt-2 text-muted-foreground">You'll choose pickup or delivery at checkout, and see any delivery fee before you pay.</p>
                <p className="mt-6 uppercase tracking-wider">Need help?</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
                  {contact?.showPhone && contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-foreground"><Phone className="h-4 w-4" aria-hidden /> {contact.phone}</a>}
                  {contact?.showEmail && contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-foreground"><Mail className="h-4 w-4" aria-hidden /> {contact.email}</a>}
                </div>
              </div>
              <div>
                <div className="mb-5"><CouponBox subtotal={subtotal} onChange={setCoupon} /></div>
                <div className="flex items-baseline justify-between text-sm"><span>Subtotal</span><span className="tabular-nums">{GHS(subtotal)}</span></div>
                {coupon && <div className="mt-1 flex items-baseline justify-between text-sm"><span>Discount</span><span className="tabular-nums">-{GHS(coupon.discount)}</span></div>}
                <div className="mt-3 flex items-baseline justify-between text-2xl font-semibold"><span>Total</span><span className="tabular-nums">{GHS(subtotal - (coupon?.discount ?? 0))}</span></div>
                <div className="mt-5">{checkout}</div>
              </div>
            </div>
          </>
        )}
      </section>
      <ProductRow title="You may also like" products={suggestions} />
    </Layout>
  );
};

export default Cart;
