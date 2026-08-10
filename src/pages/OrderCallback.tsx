import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2, Download, MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ordersApi, contactInfoApi } from "@/lib/api";
import { downloadOrderReceipt } from "@/lib/receipt";
import { whatsappLink } from "@/lib/whatsapp";
import { celebrate } from "@/lib/confetti";

const OrderCallback = () => {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const queryClient = useQueryClient();

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["verify-order", reference],
    queryFn: () => ordersApi.verify(reference),
    enabled: !!reference,
    retry: 1,
  });

  const { data: contactInfo } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });

  const paid = order?.status === "paid";

  // A paid order clears the server cart — refresh the badge + celebrate.
  useEffect(() => {
    if (paid) {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      celebrate();
    }
  }, [paid, queryClient]);

  const studioWhatsapp =
    contactInfo?.showWhatsapp && contactInfo.whatsapp ? contactInfo.whatsapp : null;
  const whatsappLinkUrl =
    studioWhatsapp && order && paid
      ? whatsappLink(
          studioWhatsapp,
          `Hi El's Beauty Studio, I've just placed order ${order.order_number} ` +
            `(GHS ${order.total}). Looking forward to it!`,
        )
      : null;

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center animate-fade-in">
            {!reference ? (
              <>
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
                <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
                  No order reference
                </h1>
                <Button asChild>
                  <Link to="/account">Go to my account</Link>
                </Button>
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-6" />
                <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                  Confirming your payment…
                </h1>
                <p className="text-muted-foreground">
                  Please wait while we verify your order.
                </p>
              </>
            ) : isError || !paid ? (
              <>
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
                <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
                  Payment not completed
                </h1>
                <p className="text-muted-foreground mb-6">
                  {isError
                    ? error instanceof Error
                      ? error.message
                      : "We couldn't verify your payment."
                    : "Your payment wasn't completed. You can try again from your cart."}
                </p>
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <Link to="/cart">Back to cart</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/account">Go to my account</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                  Order confirmed!
                </h1>
                <p className="text-muted-foreground mb-6">
                  Thank you! A receipt has been sent to your email. Order{" "}
                  <span className="font-medium text-foreground">
                    {order.order_number}
                  </span>
                  .
                </p>

                <div className="rounded-lg border border-border bg-secondary/40 p-5 text-left space-y-2 mb-6">
                  {order.items.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {it.name}{" "}
                        <span className="text-xs">x{it.quantity}</span>
                      </span>
                      <span className="text-foreground">
                        GHS {it.line_total}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">GHS {order.subtotal}</span>
                  </div>
                  {order.delivery_fee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="text-foreground">
                        GHS {order.delivery_fee}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">GHS {order.total}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    {order.fulfillment === "delivery"
                      ? "Delivery"
                      : "Pickup at studio"}{" "}
                    · Ref: {order.reference}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button onClick={() => downloadOrderReceipt(order)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download receipt
                  </Button>
                  {whatsappLinkUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-[#25D366] text-[#1da851] hover:bg-[#25D366]/10"
                    >
                      <a href={whatsappLinkUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message the studio
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link to="/account?tab=orders">View my orders</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderCallback;
