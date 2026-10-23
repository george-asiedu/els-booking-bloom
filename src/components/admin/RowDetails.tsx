import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DetailsSheet, type DetailItem } from "@/components/ui/details-sheet";
import type {
  AppointmentDTO,
  CategoryDTO,
  LedgerEntryDTO,
  OrderDTO,
  ProductDTO,
  RefundDTO,
  ReviewDTO,
  ServiceDTO,
} from "@/lib/api";
import { formatGHS } from "@/lib/currency";

// The details drawers the studio admin's tables open when a row is clicked.
// Each shows everything we hold about the row, payment details first-class.

const when = (iso: string | null | undefined, withTime = true) =>
  iso ? format(parseISO(iso), withTime ? "d MMM yyyy, h:mm a" : "d MMM yyyy") : null;
const yesNo = (v: boolean) => (v ? "Yes" : "No");
// "PARTIALLY_REFUNDED" / "pending_reschedule" → "Partially Refunded".
const words = (s: string) =>
  s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const channel = (c: string | null | undefined) =>
  c ? (c === "mobile_money" ? "Mobile Money" : c === "card" ? "Card" : words(c)) : null;

type Close = { onClose: () => void };

export const AppointmentDetails = ({ item, onClose }: { item: AppointmentDTO | null } & Close) => {
  const p = item?.payment;
  const refunded = p?.refunded_amount ?? 0;
  return (
    <DetailsSheet
      open={Boolean(item)}
      onClose={onClose}
      title={item?.full_name ?? ""}
      subtitle={item ? `${item.services?.name ?? "Appointment"} · ${format(parseISO(item.appointment_date), "EEEE d MMMM yyyy")} at ${item.appointment_time}` : undefined}
      badges={item && (
        <>
          <Badge variant="secondary">{words(item.status)}</Badge>
          {p && <Badge variant="outline">{words(p.status)}</Badge>}
        </>
      )}
      media={item?.design_image_url ? <img src={item.design_image_url} alt="Inspiration the customer shared" className="max-h-64 w-full object-contain" /> : undefined}
      sections={
        item
          ? [
              {
                title: "Customer",
                items: [
                  { label: "Name", value: item.full_name },
                  { label: "Phone", value: item.phone },
                  { label: "Email", value: item.email },
                  { label: "Has an account", value: yesNo(Boolean(item.user_id)) },
                ],
              },
              {
                title: "Appointment",
                items: [
                  { label: "Service", value: item.services?.name },
                  { label: "Category", value: item.services?.category },
                  { label: "Duration", value: item.services?.duration },
                  { label: "Date", value: format(parseISO(item.appointment_date), "EEE d MMM yyyy") },
                  { label: "Time", value: item.appointment_time },
                  { label: "Notes", value: item.notes },
                  { label: "Booked on", value: when(item.created_at) },
                ],
              },
              {
                title: "Price",
                items: [
                  { label: "Service price", value: formatGHS(item.total_price) },
                  ...(item.discount_amount
                    ? [{ label: `Loyalty discount${item.points_redeemed ? ` (${item.points_redeemed} pts)` : ""}`, value: `−${formatGHS(item.discount_amount)}` }]
                    : []),
                  { label: "To pay", value: formatGHS(item.amount_due) },
                ],
              },
              {
                title: "Payment",
                items: p
                  ? ([
                      { label: "Status", value: words(p.status) },
                      { label: "Type", value: p.type === "partial" ? "Deposit" : "Full payment" },
                      { label: "Paid", value: formatGHS(p.amount) },
                      { label: "Total due", value: formatGHS(p.total_amount) },
                      { label: "Balance at the studio", value: formatGHS(p.balance) },
                      ...(refunded ? [{ label: "Refunded", value: formatGHS(refunded) }] : []),
                      { label: "Method", value: channel(p.channel) },
                      { label: "Paid on", value: when(p.paid_at) },
                      { label: "Reference", value: p.reference, mono: true },
                    ] as DetailItem[])
                  : [{ label: "Payment", value: "Pay at the studio" }],
              },
            ]
          : []
      }
    />
  );
};

export const OrderDetails = ({ item, onClose }: { item: OrderDTO | null } & Close) => (
  <DetailsSheet
    open={Boolean(item)}
    onClose={onClose}
    title={item ? `Order ${item.order_number}` : ""}
    subtitle={item ? `${formatGHS(item.total)} · ${when(item.created_at)}` : undefined}
    badges={item && (
      <>
        <Badge variant="secondary">{words(item.status)}</Badge>
        <Badge variant="outline">{item.fulfillment === "delivery" ? "Delivery" : "Pickup"}</Badge>
        {item.is_guest && <Badge variant="outline">Guest</Badge>}
      </>
    )}
    sections={
      item
        ? [
            {
              title: "Customer",
              items: [
                { label: "Name", value: item.customer_name },
                { label: "Email", value: item.customer_email },
                { label: "Phone", value: item.customer_phone ?? item.delivery_phone },
                ...(item.fulfillment === "delivery" ? [{ label: "Deliver to", value: item.delivery_address }] : []),
              ],
            },
            {
              title: "Items",
              content: (
                <ul className="divide-y rounded-md border text-sm">
                  {item.items.map((it, i) => (
                    <li key={`${it.name}-${i}`} className="flex justify-between gap-3 px-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{it.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {it.quantity} × {formatGHS(it.unit_price)}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">{formatGHS(it.line_total)}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              title: "Money",
              items: [
                { label: "Subtotal", value: formatGHS(item.subtotal) },
                ...(item.discount_amount ? [{ label: "Loyalty discount", value: `−${formatGHS(item.discount_amount)}` }] : []),
                ...(item.delivery_fee ? [{ label: "Delivery", value: formatGHS(item.delivery_fee) }] : []),
                { label: "Total", value: <span className="font-semibold">{formatGHS(item.total)}</span> },
                ...(item.refunded_amount ? [{ label: "Refunded", value: formatGHS(item.refunded_amount) }] : []),
                { label: "Profit (before delivery)", value: formatGHS(item.profit) },
              ],
            },
            {
              title: "Payment",
              items: [
                { label: "Paid on", value: when(item.paid_at) },
                { label: "Reference", value: item.reference, mono: true },
                ...(item.appointment_id ? [{ label: "Paid with a booking", value: "Yes" }] : []),
              ],
            },
          ]
        : []
    }
  />
);

export const ServiceDetails = ({ item, onClose }: { item: ServiceDTO | null } & Close) => (
  <DetailsSheet
    open={Boolean(item)}
    onClose={onClose}
    title={item?.name ?? ""}
    subtitle={item ? `${formatGHS(item.effective_price)} · ${item.duration}` : undefined}
    badges={item && (
      <>
        <Badge variant={item.active ? "secondary" : "outline"}>{item.active ? "Bookable" : "Hidden"}</Badge>
        {item.popular && <Badge variant="outline">Popular</Badge>}
        {item.on_promo && <Badge variant="outline">On promo</Badge>}
      </>
    )}
    media={item?.image_url ? <img src={item.image_url} alt="" className="max-h-64 w-full object-cover" /> : undefined}
    sections={
      item
        ? [
            { items: [
              { label: "Category", value: item.category },
              { label: "Duration", value: item.duration },
              { label: "Price", value: formatGHS(item.price) },
              ...(item.on_promo && item.promo_price != null ? [{ label: "Promo price", value: formatGHS(item.promo_price) }] : []),
              { label: "Shown on your site", value: yesNo(item.active) },
              { label: "Marked popular", value: yesNo(item.popular) },
            ] },
            ...(item.description ? [{ title: "Description", content: <p className="whitespace-pre-line text-sm text-muted-foreground">{item.description}</p> }] : []),
          ]
        : []
    }
  />
);

export const ProductDetails = ({ item, onClose }: { item: ProductDTO | null } & Close) => {
  const margin = item ? item.effective_price - item.cost_price : 0;
  return (
    <DetailsSheet
      open={Boolean(item)}
      onClose={onClose}
      title={item?.name ?? ""}
      subtitle={item ? formatGHS(item.effective_price) : undefined}
      badges={item && (
        <>
          <Badge variant={item.active ? "secondary" : "outline"}>{item.active ? "For sale" : "Hidden"}</Badge>
          {!item.in_stock && <Badge variant="destructive">Out of stock</Badge>}
          {item.on_promo && <Badge variant="outline">On promo</Badge>}
        </>
      )}
      media={item?.image_url ? <img src={item.image_url} alt="" className="max-h-64 w-full object-cover" /> : undefined}
      sections={
        item
          ? [
              { title: "Pricing", items: [
                { label: "Price", value: formatGHS(item.price) },
                ...(item.on_promo && item.promo_price != null ? [{ label: "Promo price", value: formatGHS(item.promo_price) }] : []),
                { label: "Cost", value: formatGHS(item.cost_price) },
                { label: "Profit per sale", value: `${formatGHS(margin)}${item.effective_price ? ` (${Math.round((margin / item.effective_price) * 100)}%)` : ""}` },
              ] },
              { title: "Stock", items: [
                { label: "Tracked", value: yesNo(item.track_stock) },
                { label: "In stock", value: item.track_stock ? item.stock : "Always available" },
              ] },
              { items: [
                { label: "Category", value: item.category },
                { label: "Marked popular", value: yesNo(item.popular) },
              ] },
              ...(item.description ? [{ title: "Description", content: <p className="whitespace-pre-line text-sm text-muted-foreground">{item.description}</p> }] : []),
            ]
          : []
      }
    />
  );
};

export const ReviewDetails = ({ item, onClose }: { item: ReviewDTO | null } & Close) => (
  <DetailsSheet
    open={Boolean(item)}
    onClose={onClose}
    title={item ? `${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}` : ""}
    subtitle={item ? `${item.profiles?.full_name ?? "Anonymous"} · ${when(item.created_at, false)}` : undefined}
    badges={item && <Badge variant={item.approved ? "secondary" : "outline"}>{item.approved ? "Shown on your site" : "Waiting for approval"}</Badge>}
    sections={
      item
        ? [
            { title: "Review", content: <p className="whitespace-pre-line text-sm">{item.content || "No written review."}</p> },
            { items: [
              { label: "Rating", value: `${item.rating} out of 5` },
              { label: "Service", value: item.services?.name },
              { label: "Customer", value: item.profiles?.full_name },
              { label: "Email", value: item.profiles?.email },
              { label: "Written on", value: when(item.created_at) },
            ] },
          ]
        : []
    }
  />
);

export const CategoryDetails = ({
  item,
  onClose,
  usedBy,
}: { item: CategoryDTO | null; usedBy?: { label: string; count: number }[] } & Close) => (
  <DetailsSheet
    open={Boolean(item)}
    onClose={onClose}
    title={item?.name ?? ""}
    subtitle={item ? `/${item.slug}` : undefined}
    badges={item && <Badge variant={item.active ? "secondary" : "outline"}>{item.active ? "Visible" : "Hidden"}</Badge>}
    sections={
      item
        ? [
            { items: [
              { label: "Name", value: item.name },
              { label: "Slug", value: item.slug, mono: true },
              { label: "Shown on your site", value: yesNo(item.active) },
              { label: "Position", value: item.order + 1 },
              ...(usedBy ?? []).map((u) => ({ label: u.label, value: u.count })),
            ] },
            ...(!item.active
              ? [{ content: <p className="rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">Hidden categories, and everything in them, don't show on your site.</p> }]
              : []),
          ]
        : []
    }
  />
);

const LEDGER_TYPE: Record<LedgerEntryDTO["type"], string> = {
  BOOKING_PAYMENT: "Booking payment",
  ORDER_PAYMENT: "Shop order payment",
  SUBSCRIPTION_PAYMENT: "Subscription payment",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

/** One transaction from the money ledger (customer payments, refunds, fees). */
export const LedgerEntryDetails = ({
  item,
  onClose,
  studioName,
}: { item: LedgerEntryDTO | null; studioName?: string | null } & Close) => {
  const out = item ? item.direction === "DEBIT" || item.type === "REFUND" : false;
  return (
    <DetailsSheet
      open={Boolean(item)}
      onClose={onClose}
      title={item ? `${out ? "−" : "+"}${formatGHS(item.amount)}` : ""}
      subtitle={item?.description}
      badges={item && (
        <>
          <Badge variant="secondary">{LEDGER_TYPE[item.type]}</Badge>
          <Badge variant={item.status === "SUCCESS" ? "outline" : "destructive"}>{words(item.status.toLowerCase())}</Badge>
        </>
      )}
      sections={
        item
          ? [
              { title: "Payment", items: [
                { label: "Amount", value: `${formatGHS(item.amount)} ${item.currency !== "GHS" ? item.currency : ""}` },
                { label: "Direction", value: out ? "Money out" : "Money in" },
                { label: "Status", value: words(item.status.toLowerCase()) },
                { label: "Method", value: channel(item.channel) },
                { label: "When", value: when(item.occurredAt) },
                { label: "Recorded", value: when(item.createdAt) },
              ] },
              { title: "Who", items: [
                ...(studioName !== undefined ? [{ label: "Studio", value: studioName }] : []),
                { label: "Customer", value: item.customerName },
                { label: "Customer email", value: item.customerEmail },
                { label: "Done by", value: item.actorEmail ? `${item.actorEmail}${item.actorRole ? ` (${item.actorRole})` : ""}` : null },
              ] },
              { title: "References", items: [
                { label: "Paystack reference", value: item.reference, mono: true },
                { label: "Transaction ID", value: item.transactionId, mono: true },
                { label: "Booking", value: item.appointmentId, mono: true },
                { label: "Order", value: item.orderId, mono: true },
                { label: "Entry ID", value: item.id, mono: true },
              ] },
            ]
          : []
      }
    />
  );
};

/** One refund: who, why, how much, and where it stands. */
export const RefundDetails = ({ item, onClose }: { item: RefundDTO | null } & Close) => (
  <DetailsSheet
    open={Boolean(item)}
    onClose={onClose}
    title={item ? `Refund of ${formatGHS(item.amount)}` : ""}
    subtitle={item ? (item.customerName ?? item.customerEmail ?? undefined) : undefined}
    badges={item && (
      <Badge variant={item.status === "PROCESSED" ? "secondary" : item.status === "FAILED" ? "destructive" : "outline"}>
        {item.status === "PROCESSED" ? "Refunded" : item.status === "FAILED" ? "Failed" : "Pending"}
      </Badge>
    )}
    sections={
      item
        ? [
            { items: [
              { label: "Amount", value: formatGHS(item.amount) },
              { label: "Reason", value: item.reason },
              ...(item.failureReason ? [{ label: "Why it failed", value: <span className="text-destructive">{item.failureReason}</span> }] : []),
              { label: "Customer", value: item.customerName },
              { label: "Customer email", value: item.customerEmail },
              { label: "Requested", value: when(item.createdAt) },
              { label: "Completed", value: when(item.processedAt) },
              { label: "Started by", value: item.initiatedByEmail },
            ] },
            { title: "References", items: [
              { label: "Paystack reference", value: item.reference, mono: true },
              { label: "For booking", value: item.appointmentId, mono: true },
              { label: "For order", value: item.orderId, mono: true },
            ] },
            ...(item.status === "PENDING"
              ? [{ content: <p className="rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">Paystack is processing this refund. Mobile Money refunds can take a few days to reach the customer.</p> }]
              : []),
          ]
        : []
    }
  />
);
