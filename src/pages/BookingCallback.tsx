import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api";
import {
  downloadReceipt,
  receiptFromVerify,
  downloadOrderReceipt,
} from "@/lib/receipt";
import { useStudio } from "@/hooks/useStudio";
import {
  PaymentResultScreen,
  PaymentResultStatus,
  ResultRow,
} from "@/components/payment/PaymentResultScreen";
import { formatGHS } from "@/lib/currency";

const BookingCallback = () => {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const queryClient = useQueryClient();
  const { name: studioName, config } = useStudio();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verify-combined", reference],
    queryFn: () => paymentsApi.verifyCombined(reference),
    enabled: !!reference,
    retry: 1,
  });

  const payment = data?.payment ?? null;
  const order = data?.order ?? null;
  const paid = payment?.status === "paid" || order?.status === "paid";

  useEffect(() => {
    if (paid) queryClient.invalidateQueries({ queryKey: ["cart"] });
  }, [paid, queryClient]);

  const status: PaymentResultStatus = !reference
    ? "no-reference"
    : isLoading
      ? "verifying"
      : isError || !paid
        ? "failed"
        : "success";

  const rows: ResultRow[] = [
    ...(payment
      ? [
          {
            label: `${payment.service_name}${payment.type === "partial" ? " (deposit)" : ""}`,
            value: formatGHS(payment.amount),
          },
        ]
      : []),
    ...(order?.items.map((it) => ({
      label: `${it.name} ×${it.quantity}`,
      value: formatGHS(it.line_total),
    })) ?? []),
    ...(payment && payment.balance > 0
      ? [{ label: "Balance due at studio", value: formatGHS(payment.balance) }]
      : []),
  ];

  const receipts = [
    ...(payment
      ? [
          {
            label: "Service receipt",
            onDownload: () => downloadReceipt(receiptFromVerify(payment), { name: studioName, primaryColor: config?.branding.primaryColor, accentColor: config?.branding.accentColor }),
          },
        ]
      : []),
    ...(order
      ? [
          {
            label: "Products receipt",
            onDownload: () => downloadOrderReceipt(order, { name: studioName, primaryColor: config?.branding.primaryColor, accentColor: config?.branding.accentColor }),
          },
        ]
      : []),
  ];

  return (
    <PaymentResultScreen
      status={status}
      successMessage="Your booking and products are confirmed. A receipt has been sent to your email."
      rows={rows}
      errorMessage={
        isError ? (error instanceof Error ? error.message : undefined) : undefined
      }
      receipts={receipts}
      retryTo="/book"
      retryLabel="Back to booking"
      accountTo="/account?tab=appointments"
    />
  );
};

export default BookingCallback;
