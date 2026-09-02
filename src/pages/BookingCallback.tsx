import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, contactInfoApi } from "@/lib/api";
import {
  downloadReceipt,
  receiptFromVerify,
  downloadOrderReceipt,
} from "@/lib/receipt";
import { whatsappLink } from "@/lib/whatsapp";
import { useStudio } from "@/hooks/useStudio";
import {
  PaymentResultScreen,
  PaymentResultStatus,
  ResultRow,
} from "@/components/payment/PaymentResultScreen";

const BookingCallback = () => {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const queryClient = useQueryClient();
  const { name: studioName } = useStudio();

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
    if (paid) queryClient.invalidateQueries({ queryKey: ["cart"] });
  }, [paid, queryClient]);

  const studioWhatsapp =
    contactInfo?.showWhatsapp && contactInfo.whatsapp ? contactInfo.whatsapp : null;
  const whatsappUrl =
    studioWhatsapp && paid
      ? whatsappLink(
          studioWhatsapp,
          `Hi ${studioName}, I've just paid for my booking${
            order ? ` and products (order ${order.order_number})` : ""
          }. See you soon!`,
        )
      : null;

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
            value: `GHS ${payment.amount}`,
          },
        ]
      : []),
    ...(order?.items.map((it) => ({
      label: `${it.name} ×${it.quantity}`,
      value: `GHS ${it.line_total}`,
    })) ?? []),
    ...(payment && payment.balance > 0
      ? [{ label: "Balance due at studio", value: `GHS ${payment.balance}` }]
      : []),
  ];

  const receipts = [
    ...(payment
      ? [
          {
            label: "Service receipt",
            onDownload: () => downloadReceipt(receiptFromVerify(payment), studioName),
          },
        ]
      : []),
    ...(order
      ? [
          {
            label: "Products receipt",
            onDownload: () => downloadOrderReceipt(order, studioName),
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
      whatsappUrl={whatsappUrl}
      whatsappLabel="Message the studio"
      retryTo="/book"
      retryLabel="Back to booking"
      accountTo="/account?tab=appointments"
    />
  );
};

export default BookingCallback;
