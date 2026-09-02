import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  Download,
  RefreshCw,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { celebrate } from "@/lib/confetti";

export type PaymentResultStatus =
  | "verifying"
  | "success"
  | "failed"
  | "no-reference";

export interface ResultRow {
  label: string;
  value: string;
  highlight?: boolean;
}

/**
 * One shared screen for the outcome of any Paystack payment (appointment
 * booking, product order, or a combined booking+products charge). Renders a
 * consistent verifying / success / failed experience, fires confetti on
 * success, and always offers a retry path on failure — payments are the most
 * business-critical flow, so failed transactions must never be a dead end.
 */
export const PaymentResultScreen = ({
  status,
  firstName,
  successMessage,
  rows,
  errorMessage,
  onDownloadReceipt,
  receipts,
  whatsappUrl,
  whatsappLabel = "Send receipt on WhatsApp",
  onRetry,
  retryTo,
  retryLabel = "Try payment again",
  accountTo = "/account",
}: {
  status: PaymentResultStatus;
  firstName?: string;
  successMessage?: string;
  rows?: ResultRow[];
  errorMessage?: string;
  onDownloadReceipt?: () => void;
  // For charges that produce more than one receipt (e.g. a combined booking +
  // products payment). Takes precedence over onDownloadReceipt when set.
  receipts?: { label: string; onDownload: () => void }[];
  whatsappUrl?: string | null;
  whatsappLabel?: string;
  // In-place retry: re-charge the same transaction and reopen Paystack. When
  // set, it's the primary action on failure (takes precedence over retryTo).
  onRetry?: () => Promise<void> | void;
  retryTo?: string;
  retryLabel?: string;
  accountTo?: string;
}) => {
  const [retrying, setRetrying] = useState(false);

  // Celebrate exactly once when we land on success.
  useEffect(() => {
    if (status === "success") celebrate();
  }, [status]);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md animate-fade-in text-center">
            {status === "verifying" ? (
              <>
                <Loader2 className="mx-auto mb-6 h-10 w-10 animate-spin text-primary" />
                <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
                  Confirming your payment…
                </h1>
                <p className="text-muted-foreground">
                  Please wait while we verify your transaction.
                </p>
              </>
            ) : status === "success" ? (
              <>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
                  Payment successful!
                </h1>
                <p className="mb-6 text-muted-foreground">
                  {successMessage ??
                    `Thank you${firstName ? `, ${firstName}` : ""}. A receipt has been sent to your email.`}
                </p>

                {rows && rows.length > 0 && (
                  <div className="mb-6 space-y-2 rounded-lg border border-border bg-secondary/40 p-5 text-left">
                    {rows.map((r) => (
                      <Row key={r.label} {...r} />
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {receipts && receipts.length > 0
                    ? receipts.map((r, i) => (
                        <Button
                          key={r.label}
                          variant={i === 0 ? "default" : "outline"}
                          onClick={r.onDownload}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {r.label}
                        </Button>
                      ))
                    : onDownloadReceipt && (
                        <Button onClick={onDownloadReceipt}>
                          <Download className="mr-2 h-4 w-4" />
                          Download receipt
                        </Button>
                      )}
                  {whatsappUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-[#25D366] text-[#1da851] hover:bg-[#25D366]/10"
                    >
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {whatsappLabel}
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link to={accountTo}>Go to my account</Link>
                  </Button>
                </div>
              </>
            ) : (
              // failed | no-reference
              <>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
                  {status === "no-reference"
                    ? "No payment reference"
                    : "Payment not completed"}
                </h1>
                <p className="mb-6 text-muted-foreground">
                  {errorMessage ??
                    (status === "no-reference"
                      ? "We couldn't find a payment to confirm."
                      : "Your payment wasn't completed. No money has left your account — you can try again.")}
                </p>
                <div className="flex flex-col gap-3">
                  {onRetry ? (
                    <Button onClick={handleRetry} disabled={retrying}>
                      {retrying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      {retrying ? "Reopening payment…" : "Retry payment"}
                    </Button>
                  ) : (
                    retryTo && (
                      <Button asChild>
                        <Link to={retryTo}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {retryLabel}
                        </Link>
                      </Button>
                    )
                  )}
                  {onRetry && retryTo && (
                    <Button variant="outline" asChild>
                      <Link to={retryTo}>{retryLabel}</Link>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link to={accountTo}>Go to my account</Link>
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

const Row = ({ label, value, highlight }: ResultRow) => (
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
