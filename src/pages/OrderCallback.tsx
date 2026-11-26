import { useEffect } from "react";
import { useNoIndex } from "@/lib/seo";
import { PROCESSING, useProcessing } from "@/components/ProcessingOverlay";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { SHOP_CTA } from "@/components/shop/ProductCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { openPaystackCheckout } from "@/lib/paystackCheckout";
import { ordersApi } from "@/lib/api";
import { downloadOrderReceipt } from "@/lib/receipt";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import {
  PaymentResultScreen,
  PaymentResultStatus,
  ResultRow,
} from "@/components/payment/PaymentResultScreen";
import { clearGuestCart, isGuestShopper } from "@/lib/api/cart";
import { formatGHS } from "@/lib/currency";

const OrderCallback = () => {
  // Private page: keep it out of search results.
  useNoIndex();
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const processing = useProcessing();
  const { name: studioName, config } = useStudio();

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ["verify-order", reference],
    queryFn: () => ordersApi.verify(reference),
    enabled: !!reference,
    retry: 1,
  });

  const paid = order?.status === "paid";

  // A paid order clears the server cart — refresh the badge.
  useEffect(() => {
    if (paid) {
      // A guest's basket lives on their device: empty it once the order is paid.
      if (isGuestShopper()) clearGuestCart();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  }, [paid, queryClient]);

  const status: PaymentResultStatus = !reference
    ? "no-reference"
    : isLoading
      ? "verifying"
      : isError || !paid
        ? "failed"
        : "success";

  const rows: ResultRow[] = order
    ? [
        ...order.items.map((it) => ({
          label: `${it.name} ×${it.quantity}`,
          value: formatGHS(it.line_total),
        })),
        { label: "Subtotal", value: formatGHS(order.subtotal) },
        ...(order.delivery_fee > 0
          ? [{ label: "Delivery", value: formatGHS(order.delivery_fee) }]
          : []),
        { label: "Total", value: formatGHS(order.total), highlight: true },
        {
          label: "Fulfilment",
          value: order.fulfillment === "delivery" ? "Delivery" : "Pickup at studio",
        },
        { label: "Reference", value: order.reference ?? "—" },
      ]
    : [];

  // Retry an unpaid order in place: fetch a fresh access code and reopen Paystack.
  const orderId = order?.id ?? null;
  const canRetry = status === "failed" && !!orderId;
  const retryPayment = async () => {
    if (!orderId) return;
    try {
      processing.show(PROCESSING.preparing);
      const init = await ordersApi.repay(orderId);
      processing.hide();
      // A popup error is a failed payment, not a failure to reopen it.
      const result = await openPaystackCheckout(init.accessCode).catch((e: unknown) => {
        toast({ variant: "destructive", title: "Payment failed", description: e instanceof Error ? e.message : undefined });
        return null;
      });
      if (result === "paid") {
        navigate(`?reference=${encodeURIComponent(init.reference)}`, { replace: true });
      }
    } catch (err) {
      processing.hide();
      toast({
        variant: "destructive",
        title: "Couldn't reopen payment",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  if (status === "success" && order) {
    const firstName = order.customer_name?.split(" ")[0];
    const pickup = order.fulfillment !== "delivery";
    return (
      <ShopLayout>
        <section className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold">Thank you{firstName ? `, ${firstName}` : ""}!</h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Your order <span className="font-semibold text-foreground">#{order.order_number}</span> is placed.
              We've received your payment and sent a receipt to your email.
            </p>
          </div>
          <h2 className="mt-10 font-medium">Your order details</h2>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {order.items.map((it) => (
              <li key={`${it.name}:${it.size}:${it.color}`} className="flex justify-between gap-4 py-4 text-sm">
                <span>{it.name} <span className="text-muted-foreground">× {it.quantity}{it.size && ` · Size ${it.size}`}{it.color && ` · ${it.color}`}</span></span>
                <span className="tabular-nums">{formatGHS(it.line_total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-8 border border-border bg-secondary/40 p-6 text-sm md:grid-cols-3 md:p-8">
            <div>
              <p className="uppercase tracking-wider">{pickup ? "Pickup" : "Delivery"}</p>
              <p className="mt-2 text-muted-foreground">{pickup ? `Collect your order from ${studioName}.` : order.delivery_address ?? "To your address."}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider">Reference</p>
              <p className="mt-2 break-all text-muted-foreground">{order.reference ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <p className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatGHS(order.subtotal)}</span></p>
              {order.discount_amount > 0 && <p className="flex justify-between"><span>Discount</span><span className="tabular-nums">-{formatGHS(order.discount_amount)}</span></p>}
              {order.delivery_fee > 0 && <p className="flex justify-between"><span>Delivery</span><span className="tabular-nums">{formatGHS(order.delivery_fee)}</span></p>}
              <p className="flex justify-between text-xl font-semibold"><span>Total</span><span className="tabular-nums">{formatGHS(order.total)}</span></p>
            </div>
          </div>
          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3">
            <Link to="/shop/products" className={SHOP_CTA}>Continue shopping</Link>
            <div className="flex justify-center gap-6 text-sm">
              <button type="button" className="underline underline-offset-2" onClick={() => downloadOrderReceipt(order, { name: studioName, primaryColor: config?.branding.primaryColor, accentColor: config?.branding.accentColor })}>Download receipt</button>
              <Link to="/account?tab=orders" className="underline underline-offset-2">View your orders</Link>
            </div>
          </div>
        </section>
      </ShopLayout>
    );
  }

  return (
    <PaymentResultScreen
      status={status}
      successMessage={
        order
          ? `Thank you. A receipt has been sent to your email. Order ${order.order_number}.`
          : undefined
      }
      onRetry={canRetry ? retryPayment : undefined}
      rows={rows}
      errorMessage={
        isError ? (error instanceof Error ? error.message : undefined) : undefined
      }
      onDownloadReceipt={
        order ? () => downloadOrderReceipt(order, { name: studioName, primaryColor: config?.branding.primaryColor, accentColor: config?.branding.accentColor }) : undefined
      }
      retryTo="/cart"
      retryLabel="Back to cart"
      accountTo="/account?tab=orders"
    />
  );
};

export default OrderCallback;
