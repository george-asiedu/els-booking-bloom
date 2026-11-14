import { useState } from "react";
import { Link } from "react-router-dom";
import { DetailsSheet } from "@/components/ui/details-sheet";
import { format } from "date-fns";
import { Download, Package, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGHS } from "@/lib/currency";
import { downloadOrderReceipt, type DocumentBrand } from "@/lib/receipt";
import type { CartDTO, OrderDTO } from "@/lib/api";
import { orderStatusColors, orderStatusLabel } from "./accountFormat";
import { LoadMore } from "./AccountParts";
import { StatusTabs, TabEmpty } from "@/components/dashboard/StatusTabs";

const ORDER_TABS = [
  { key: "paid", label: "Paid", empty: "No paid orders being prepared" },
  { key: "fulfilled", label: "Fulfilled", empty: "No fulfilled orders yet" },
  { key: "pending_payment", label: "Awaiting payment", empty: "Nothing waiting for payment" },
  { key: "cancelled", label: "Cancelled", empty: "No cancelled orders" },
];

interface OrdersTabProps {
  cart: CartDTO | undefined;
  orders: OrderDTO[];
  pager: React.ComponentProps<typeof LoadMore>["query"];
  shopEnabled: boolean;
  brand: DocumentBrand;
}

export const OrdersTab = ({ cart, orders, pager, shopEnabled, brand }: OrdersTabProps) => {
  // The order whose details drawer is open.
  const [open, setOpen] = useState<OrderDTO | null>(null);
  const [tab, setTab] = useState("paid");
  const shown = orders.filter((o) => o.status === tab);
  return (
  <>
    {/* Current cart */}
    {cart && cart.items.length > 0 && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            In your cart ({cart.count})
          </CardTitle>
          <Button size="sm" asChild>
            <Link to="/cart">Checkout</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 tabular-nums">
          {cart.items.map((it) => (
            <div key={it.product_id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {it.name} <span className="text-xs">x{it.quantity}</span>
              </span>
              <span className="text-foreground">{formatGHS(it.line_total)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-border font-semibold">
            <span>Subtotal</span>
            <span className="text-primary">{formatGHS(cart.subtotal)}</span>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Order history */}
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">My orders</h2>
      <StatusTabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={ORDER_TABS.map((t) => ({ key: t.key, label: t.label, count: orders.filter((o) => o.status === t.key).length }))}
      />
      {shown.length === 0 ? (
        <TabEmpty
          icon={<Package />}
          title={orders.length === 0 ? "You haven't placed any orders yet" : ORDER_TABS.find((t) => t.key === tab)!.empty}
          action={
            orders.length === 0 && shopEnabled ? (
              <Button asChild>
                <Link to="/shop">Start shopping</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Fulfilment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((order) => (
                <TableRow key={order.id} onOpen={() => setOpen(order)}>
                  <TableCell className="whitespace-nowrap font-medium">{order.order_number}</TableCell>
                  <TableCell className="min-w-[12rem] text-sm text-muted-foreground">
                    {order.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ""} x${i.quantity}`).join(", ")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{format(new Date(order.created_at), "d MMM yyyy")}</TableCell>
                  <TableCell>{order.fulfillment === "delivery" ? "Delivery" : "Pickup"}</TableCell>
                  <TableCell>
                    <Badge className={cn("whitespace-nowrap", orderStatusColors[order.status])}>
                      {orderStatusLabel[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">{formatGHS(order.total)}</TableCell>
                  <TableCell className="text-right">
                    {order.status === "pending_payment" ? (
                      <Button size="sm" asChild>
                        <Link to="/cart">Pay</Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => downloadOrderReceipt(order, brand)}>
                        <Download className="mr-1 h-4 w-4" />
                        Receipt
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <LoadMore query={pager} label="Load more orders" />
    </div>
    {open && (
      <DetailsSheet
        open
        onClose={() => setOpen(null)}
        title={`Order ${open.order_number}`}
        subtitle={format(new Date(open.created_at), "d MMMM yyyy, HH:mm")}
        badges={
          <Badge className={cn("whitespace-nowrap", orderStatusColors[open.status])}>
            {orderStatusLabel[open.status]}
          </Badge>
        }
        sections={[
          {
            title: "Items",
            items: open.items.map((i) => ({
              label: `${i.name}${[i.color, i.size && `Size ${i.size}`].filter(Boolean).length ? ` (${[i.color, i.size && `Size ${i.size}`].filter(Boolean).join(", ")})` : ""} × ${i.quantity}`,
              value: formatGHS(i.line_total),
            })),
          },
          {
            title: "Payment",
            items: [
              { label: "Subtotal", value: formatGHS(open.subtotal) },
              ...(open.discount_amount > 0 ? [{ label: "Discount", value: `-${formatGHS(open.discount_amount)}` }] : []),
              ...(open.delivery_fee > 0 ? [{ label: "Delivery", value: formatGHS(open.delivery_fee) }] : []),
              { label: "Total", value: <span className="font-semibold">{formatGHS(open.total)}</span> },
              { label: "Paid on", value: open.paid_at ? format(new Date(open.paid_at), "d MMM yyyy, HH:mm") : "Not paid yet" },
              { label: "Reference", value: open.reference, mono: true },
            ],
          },
          {
            title: open.fulfillment === "delivery" ? "Delivery" : "Pickup",
            items:
              open.fulfillment === "delivery"
                ? [
                    { label: "Address", value: open.delivery_address },
                    { label: "Phone", value: open.delivery_phone },
                  ]
                : [{ label: "Collect from", value: "The studio, once it's ready" }],
          },
        ]}
        footer={
          open.status === "pending_payment" ? (
            <Button className="w-full" asChild>
              <Link to="/cart">Pay for this order</Link>
            </Button>
          ) : (
            <Button className="w-full" variant="outline" onClick={() => downloadOrderReceipt(open, brand)}>
              <Download className="mr-2 h-4 w-4" />
              Download receipt
            </Button>
          )
        }
      />
    )}
  </>
  );
};
