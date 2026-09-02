import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PaystackPop from "@paystack/inline-js";
import { ordersApi, contactInfoApi } from "@/lib/api";
import { downloadOrderReceipt } from "@/lib/receipt";
import { whatsappLink } from "@/lib/whatsapp";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import {
  PaymentResultScreen,
  PaymentResultStatus,
  ResultRow,
} from "@/components/payment/PaymentResultScreen";

const OrderCallback = () => {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { name: studioName } = useStudio();

  const { data: order, isLoading, isError, error } = useQuery({
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

  // A paid order clears the server cart — refresh the badge.
  useEffect(() => {
    if (paid) queryClient.invalidateQueries({ queryKey: ["cart"] });
  }, [paid, queryClient]);

  const studioWhatsapp =
    contactInfo?.showWhatsapp && contactInfo.whatsapp ? contactInfo.whatsapp : null;
  const whatsappUrl =
    studioWhatsapp && order && paid
      ? whatsappLink(
          studioWhatsapp,
          `Hi ${studioName}, I've just placed order ${order.order_number} ` +
            `(GHS ${order.total}). Looking forward to it!`,
        )
      : null;

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
          value: `GHS ${it.line_total}`,
        })),
        { label: "Subtotal", value: `GHS ${order.subtotal}` },
        ...(order.delivery_fee > 0
          ? [{ label: "Delivery", value: `GHS ${order.delivery_fee}` }]
          : []),
        { label: "Total", value: `GHS ${order.total}`, highlight: true },
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
      const init = await ordersApi.repay(orderId);
      const popup = new PaystackPop();
      popup.resumeTransaction(init.accessCode, {
        onSuccess: () => {
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
      successMessage={
        order
          ? `Thank you! A receipt has been sent to your email. Order ${order.order_number}.`
          : undefined
      }
      onRetry={canRetry ? retryPayment : undefined}
      rows={rows}
      errorMessage={
        isError ? (error instanceof Error ? error.message : undefined) : undefined
      }
      onDownloadReceipt={
        order ? () => downloadOrderReceipt(order, studioName) : undefined
      }
      whatsappUrl={whatsappUrl}
      whatsappLabel="Message the studio"
      retryTo="/cart"
      retryLabel="Back to cart"
      accountTo="/account?tab=orders"
    />
  );
};

export default OrderCallback;
