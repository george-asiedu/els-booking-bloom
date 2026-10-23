import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Download, Package, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGHS } from "@/lib/currency";
import { downloadOrderReceipt, type DocumentBrand } from "@/lib/receipt";
import type { CartDTO, OrderDTO } from "@/lib/api";
import { orderStatusColors, orderStatusLabel } from "./accountFormat";
import { LoadMore } from "./AccountParts";

interface OrdersTabProps {
  cart: CartDTO | undefined;
  orders: OrderDTO[];
  pager: React.ComponentProps<typeof LoadMore>["query"];
  shopEnabled: boolean;
  brand: DocumentBrand;
}

export const OrdersTab = ({ cart, orders, pager, shopEnabled, brand }: OrdersTabProps) => (
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
      <h2 className="text-xl font-semibold text-foreground mb-4">My Orders</h2>
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
            {shopEnabled && (
              <Button asChild>
                <Link to="/shop">Start shopping</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{order.order_number}</p>
                      <Badge className={orderStatusColors[order.status]}>
                        {orderStatusLabel[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(order.created_at), "MMM d, yyyy")} ·{" "}
                      {order.fulfillment === "delivery" ? "Delivery" : "Pickup"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-foreground tabular-nums">
                      {formatGHS(order.total)}
                    </span>
                    {order.status === "pending_payment" ? (
                      <Button size="sm" asChild>
                        <Link to="/cart">Pay</Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => downloadOrderReceipt(order, brand)}>
                        <Download className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <LoadMore query={pager} label="Load more orders" />
    </div>
  </>
);
