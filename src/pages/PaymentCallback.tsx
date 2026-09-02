import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PaystackPop from "@paystack/inline-js";
import { paymentsApi, contactInfoApi } from "@/lib/api";
import { whatsappLink } from "@/lib/whatsapp";
import { downloadReceipt, receiptFromVerify } from "@/lib/receipt";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import {
  PaymentResultScreen,
  PaymentResultStatus,
  ResultRow,
} from "@/components/payment/PaymentResultScreen";

const PaymentCallback = () => {
  const [params] = useSearchParams();
  // Paystack appends ?reference= (and ?trxref=) to the callback URL.
  const reference = params.get("reference") || params.get("trxref") || "";
  const { name: studioName } = useStudio();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: receipt, isLoading, isError, error } = useQuery({
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
    contactInfo?.showWhatsapp && contactInfo.whatsapp ? contactInfo.whatsapp : null;
  const paid = receipt?.status === "paid";

  const status: PaymentResultStatus = !reference
    ? "no-reference"
    : isLoading
      ? "verifying"
      : isError || !paid
        ? "failed"
        : "success";

  const rows: ResultRow[] = receipt
    ? [
        { label: "Service", value: receipt.service_name },
        { label: "Date", value: `${receipt.appointment_date} · ${receipt.appointment_time}` },
        {
          label: receipt.type === "partial" ? "Deposit paid" : "Amount paid",
          value: `GHS ${receipt.amount}`,
          highlight: true,
        },
        ...(receipt.balance > 0
          ? [{ label: "Balance due at studio", value: `GHS ${receipt.balance}` }]
          : []),
        { label: "Reference", value: receipt.reference ?? "—" },
      ]
    : [];

  const whatsappUrl =
    studioWhatsapp && receipt && paid
      ? whatsappLink(
          studioWhatsapp,
          `Hi ${studioName}, I've just paid for my appointment:\n\n` +
            `Service: ${receipt.service_name}\n` +
            `Date: ${receipt.appointment_date}\n` +
            `Time: ${receipt.appointment_time}\n` +
            `${receipt.type === "partial" ? "Deposit paid" : "Amount paid"}: GHS ${receipt.amount}\n` +
            (receipt.balance > 0 ? `Balance due at studio: GHS ${receipt.balance}\n` : "") +
            `Reference: ${receipt.reference}\n`,
        )
      : null;

  // Retry the same appointment payment in place: re-initialize the charge and
  // reopen Paystack. On success we refetch the verification so the screen flips
  // to the success state.
  const appointmentId = receipt?.appointment_id ?? null;
  const canRetry = status === "failed" && !!appointmentId;
  const retryPayment = async () => {
    if (!appointmentId) return;
    try {
      const init = await paymentsApi.initialize(
        appointmentId,
        receipt?.type === "partial" ? "PARTIAL" : "FULL",
      );
      const popup = new PaystackPop();
      popup.resumeTransaction(init.access_code, {
        onSuccess: () => {
          // The new charge uses a fresh reference; point the screen at it so it
          // re-verifies and flips to success.
          navigate(`?reference=${encodeURIComponent(init.reference)}`, {
            replace: true,
          });
        },
        onError: (e: { message?: string }) =>
          toast({ variant: "destructive", title: "Payment failed", description: e?.message }),
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't reopen payment",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <PaymentResultScreen
      status={status}
      firstName={receipt?.full_name?.split(" ")[0]}
      rows={rows}
      errorMessage={
        isError ? (error instanceof Error ? error.message : undefined) : undefined
      }
      onDownloadReceipt={
        receipt ? () => downloadReceipt(receiptFromVerify(receipt), studioName) : undefined
      }
      whatsappUrl={whatsappUrl}
      onRetry={canRetry ? retryPayment : undefined}
      retryTo="/book"
      retryLabel="Back to booking"
    />
  );
};

export default PaymentCallback;
