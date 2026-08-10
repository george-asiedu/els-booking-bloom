import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2, Download, MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { paymentsApi, contactInfoApi } from "@/lib/api";
import {
  downloadReceipt,
  receiptFromVerify,
  downloadOrderReceipt,
} from "@/lib/receipt";
import { whatsappLink } from "@/lib/whatsapp";
import { celebrate } from "@/lib/confetti";

const BookingCallback = () => {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verify-combined", reference],
    queryFn: () => paymentsApi.verifyCombined(reference),
    enabled: !!reference,
    retry: 1,
  });

  const { data: contactInfo } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });

  const payment = data?.payment ?? null;
  const order = data?.order ?? null;
  const paid = payment?.status === "paid" || order?.status === "paid";

  useEffect(() => {
    if (paid) {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      celebrate();
    }
  }, [paid, queryClient]);

  const studioWhatsapp =
    contactInfo?.showWhatsapp && contactInfo.whatsapp ? contactInfo.whatsapp : null;
  const whatsappLinkUrl =
    studioWhatsapp && paid
      ? whatsappLink(
          studioWhatsapp,
          `Hi El's Beauty Studio, I've just paid for my booking${
            order ? ` and products (order ${order.order_number})` : ""
          }. See you soon!`,
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
                  No payment reference
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
                    : "Your payment wasn't completed."}
                </p>
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <Link to="/account?tab=appointments">Go to my account</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/book">Back to booking</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                  Payment successful!
                </h1>
                <p className="text-muted-foreground mb-6">
                  Your booking and products are confirmed. A receipt has been
                  sent to your email.
                </p>

                <div className="rounded-lg border border-border bg-secondary/40 p-5 text-left space-y-2 mb-6">
                  {payment && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {payment.service_name}
                        {payment.type === "partial" ? " (deposit)" : ""}
                      </span>
                      <span className="text-foreground">GHS {payment.amount}</span>
                    </div>
                  )}
                  {order?.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {it.name} <span className="text-xs">x{it.quantity}</span>
                      </span>
                      <span className="text-foreground">GHS {it.line_total}</span>
                    </div>
                  ))}
                  {payment && payment.balance > 0 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Balance due at studio: GHS {payment.balance}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {payment && (
                    <Button onClick={() => downloadReceipt(receiptFromVerify(payment))}>
                      <Download className="mr-2 h-4 w-4" />
                      Service receipt
                    </Button>
                  )}
                  {order && (
                    <Button
                      variant={payment ? "outline" : "default"}
                      onClick={() => downloadOrderReceipt(order)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Products receipt
                    </Button>
                  )}
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
                  <Button variant="ghost" asChild>
                    <Link to="/account?tab=appointments">Go to my account</Link>
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

export default BookingCallback;
