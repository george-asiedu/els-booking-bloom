import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  Download,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { paymentsApi, contactInfoApi } from "@/lib/api";
import { whatsappLink } from "@/lib/whatsapp";
import { downloadReceipt, receiptFromVerify } from "@/lib/receipt";

const PaymentCallback = () => {
  const [params] = useSearchParams();
  // Paystack appends ?reference= (and ?trxref=) to the callback URL.
  const reference = params.get("reference") || params.get("trxref") || "";

  const {
    data: receipt,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["verify-payment", reference],
    queryFn: () => paymentsApi.verify(reference),
    enabled: !!reference,
    retry: 1,
  });

  const { data: contactInfo } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });

  const studioWhatsapp =
    contactInfo?.showWhatsapp && contactInfo.whatsapp
      ? contactInfo.whatsapp
      : null;

  const paid = receipt?.status === "paid";

  const whatsappReceiptLink =
    studioWhatsapp && receipt && paid
      ? whatsappLink(
          studioWhatsapp,
          `Hi El's Beauty Studio, I've just paid for my appointment:\n\n` +
            `Service: ${receipt.service_name}\n` +
            `Date: ${receipt.appointment_date}\n` +
            `Time: ${receipt.appointment_time}\n` +
            `${receipt.type === "partial" ? "Deposit paid" : "Amount paid"}: GHS ${receipt.amount}\n` +
            (receipt.balance > 0
              ? `Balance due at studio: GHS ${receipt.balance}\n`
              : "") +
            `Reference: ${receipt.reference}\n`,
        )
      : null;

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center animate-fade-in">
            {!reference ? (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
                  No payment reference
                </h1>
                <p className="text-muted-foreground mb-6">
                  We couldn't find a payment to confirm.
                </p>
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
                  Please wait while we verify your transaction.
                </p>
              </>
            ) : isError || !paid ? (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
                  Payment not completed
                </h1>
                <p className="text-muted-foreground mb-6">
                  {isError
                    ? error instanceof Error
                      ? error.message
                      : "We couldn't verify your payment."
                    : "Your payment wasn't completed. You can try again from your account."}
                </p>
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <Link to="/account">Go to my account</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/book">Back to booking</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                  Payment successful!
                </h1>
                <p className="text-muted-foreground mb-6">
                  Thank you, {receipt.full_name.split(" ")[0] || "there"}. A
                  receipt has been sent to your email.
                </p>

                {/* Receipt */}
                <div className="rounded-lg border border-border bg-secondary/40 p-5 text-left space-y-2 mb-6">
                  <Row label="Service" value={receipt.service_name} />
                  <Row
                    label="Date"
                    value={`${receipt.appointment_date} · ${receipt.appointment_time}`}
                  />
                  <Row
                    label={
                      receipt.type === "partial" ? "Deposit paid" : "Amount paid"
                    }
                    value={`GHS ${receipt.amount}`}
                    highlight
                  />
                  {receipt.balance > 0 && (
                    <Row
                      label="Balance due at studio"
                      value={`GHS ${receipt.balance}`}
                    />
                  )}
                  <Row label="Reference" value={receipt.reference ?? "—"} />
                </div>

                <div className="flex flex-col gap-3">
                  <Button onClick={() => downloadReceipt(receiptFromVerify(receipt))}>
                    <Download className="mr-2 h-4 w-4" />
                    Download receipt
                  </Button>
                  {whatsappReceiptLink && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-[#25D366] text-[#1da851] hover:bg-[#25D366]/10"
                    >
                      <a
                        href={whatsappReceiptLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Send receipt on WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link to="/account">Go to my account</Link>
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

const Row = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={
        highlight ? "font-semibold text-primary" : "font-medium text-foreground"
      }
    >
      {value}
    </span>
  </div>
);

export default PaymentCallback;
