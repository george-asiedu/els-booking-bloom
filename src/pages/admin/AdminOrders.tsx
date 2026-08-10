import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package, Loader2, Truck, Store } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ordersApi, OrderDTO, OrderStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending_payment: "secondary",
  paid: "default",
  fulfilled: "outline",
  cancelled: "destructive",
};
const statusLabel: Record<string, string> = {
  pending_payment: "Payment pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => ordersApi.listAll(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Order updated" });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const filtered = orders?.filter((o) =>
    statusFilter === "all" ? true : o.status === statusFilter,
  );

  const stats = {
    total: orders?.length ?? 0,
    paid: orders?.filter((o) => o.status === "paid").length ?? 0,
    fulfilled: orders?.filter((o) => o.status === "fulfilled").length ?? 0,
    revenue:
      orders
        ?.filter((o) => o.status === "paid" || o.status === "fulfilled")
        .reduce((s, o) => s + o.total, 0) ?? 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage product orders</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total orders" value={stats.total} />
          <StatCard label="Paid" value={stats.paid} className="text-green-600" />
          <StatCard
            label="Fulfilled"
            value={stats.fulfilled}
            className="text-blue-600"
          />
          <StatCard
            label="Revenue"
            value={`GHS ${stats.revenue.toLocaleString()}`}
          />
        </div>

        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending_payment">Payment pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((order: OrderDTO) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{order.customer_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_email}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-0.5 max-w-[220px]">
                        {order.items.map((it, i) => (
                          <p key={i} className="text-muted-foreground">
                            {it.name}{" "}
                            <span className="text-xs">x{it.quantity}</span>
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {order.fulfillment === "delivery" ? (
                          <Truck className="h-4 w-4 text-primary" />
                        ) : (
                          <Store className="h-4 w-4 text-primary" />
                        )}
                        {order.fulfillment === "delivery" ? "Delivery" : "Pickup"}
                      </div>
                      {order.fulfillment === "delivery" &&
                        order.delivery_address && (
                          <p className="text-xs text-muted-foreground max-w-[180px] mt-1">
                            {order.delivery_address}
                            {order.delivery_phone
                              ? ` · ${order.delivery_phone}`
                              : ""}
                          </p>
                        )}
                    </TableCell>
                    <TableCell className="font-medium">
                      GHS {order.total}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Badge
                          variant={
                            statusColors[order.status] as
                              | "secondary"
                              | "default"
                              | "outline"
                              | "destructive"
                          }
                        >
                          {statusLabel[order.status]}
                        </Badge>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateStatus.mutate({
                              id: order.id,
                              status: value as OrderStatus,
                            })
                          }
                        >
                          <SelectTrigger className="w-40 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending_payment">
                              Payment pending
                            </SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="fulfilled">Fulfilled</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

const StatCard = ({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${className ?? ""}`}>{value}</div>
    </CardContent>
  </Card>
);

export default AdminOrders;
