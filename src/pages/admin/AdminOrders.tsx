import { ExportButton } from "@/components/admin/ExportButton";
import { useState } from "react";
import { CancellationActions } from "@/components/admin/CancellationActions";
import { OrderDetails } from "@/components/admin/RowDetails";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package, Loader2, Truck, Store } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
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
import { FilterBar } from "@/components/admin/FilterBar";
import { useToast } from "@/hooks/use-toast";
import { formatGHS } from "@/lib/currency";
import { DateRangeField } from "@/components/admin/DateRangeFilter";
import { StatusTabs, TabEmpty } from "@/components/dashboard/StatusTabs";

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

const ORDER_TABS = [
  { key: "paid", label: "Paid", empty: "No paid orders waiting to be fulfilled" },
  { key: "cancel_requested", label: "Cancel requests", empty: "No cancellation requests" },
  { key: "fulfilled", label: "Fulfilled", empty: "No fulfilled orders yet" },
  { key: "pending_payment", label: "Awaiting payment", empty: "No orders awaiting payment" },
  { key: "cancelled", label: "Cancelled", empty: "No cancelled orders" },
  { key: "all", label: "All", empty: "No orders yet" },
];

const AdminOrders = () => {
  // The row whose details drawer is open.
  const [details, setDetails] = useState<OrderDTO | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("paid");
  const [oSearch, setOSearch] = useState("");
  const [oFulfil, setOFulfil] = useState("all");
  const [oFrom, setOFrom] = useState("");
  const [oTo, setOTo] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const ordersQuery = useInfiniteQuery({
    queryKey: ["admin-orders", "cursor-pages"],
    queryFn: ({ pageParam }) => ordersApi.listAllPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
  const orders = ordersQuery.data?.pages.flatMap((page) => page.items);
  const isLoading = ordersQuery.isLoading;

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

  const oq = oSearch.trim().toLowerCase();
  const filtered = (orders ?? []).filter((o) => {
    if (statusFilter === "cancel_requested") {
      if (!o.cancel_requested_at || o.status === "cancelled") return false;
    } else if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (oFulfil !== "all" && o.fulfillment !== oFulfil) return false;
    if (oq) {
      const hay = `${o.order_number} ${o.customer_name ?? ""} ${o.customer_email ?? ""} ${o.customer_phone ?? ""}`.toLowerCase();
      if (!hay.includes(oq)) return false;
    }
    const d = o.created_at.slice(0, 10);
    if (oFrom && d < oFrom) return false;
    if (oTo && d > oTo) return false;
    return true;
  });
  const oFiltersActive =
    oFulfil !== "all" || oq !== "" || oFrom !== "" || oTo !== "";
  const clearO = () => {
    setOFulfil("all");
    setOSearch("");
    setOFrom("");
    setOTo("");
  };

  const stats = {
    total: orders?.length ?? 0,
    paid: orders?.filter((o) => o.status === "paid").length ?? 0,
    fulfilled: orders?.filter((o) => o.status === "fulfilled").length ?? 0,
    // Commerce revenue = profit (selling − cost), delivery excluded.
    profit:
      Math.round(
        (orders
          ?.filter((o) => o.status === "paid" || o.status === "fulfilled")
          .reduce((s, o) => s + o.profit, 0) ?? 0) * 100,
      ) / 100,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">Manage product orders</p>
          </div>
          <ExportButton kind="orders" />
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
            label="Profit (revenue)"
            value={formatGHS(stats.profit)}
          />
        </div>

        <FilterBar
          search={oSearch}
          onSearch={setOSearch}
          searchPlaceholder="Search order #, customer…"
          onClear={clearO}
          active={oFiltersActive}
          count={filtered.length}
        >
          <Select value={oFulfil} onValueChange={setOFulfil}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Fulfilment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any fulfilment</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
          <DateRangeField
            from={oFrom}
            to={oTo}
            onChange={(f, t) => {
              setOFrom(f);
              setOTo(t);
            }}
          />
        </FilterBar>

        <StatusTabs
          value={statusFilter}
          onChange={setStatusFilter}
          tabs={ORDER_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count:
              t.key === "all"
                ? orders?.length ?? 0
                : t.key === "cancel_requested"
                  ? orders?.filter((o) => o.cancel_requested_at && o.status !== "cancelled").length ?? 0
                  : orders?.filter((o) => o.status === t.key).length ?? 0,
          }))}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered?.length === 0 ? (
          <TabEmpty
            icon={<Package />}
            title={oFiltersActive ? "No orders match these filters" : ORDER_TABS.find((t) => t.key === statusFilter)?.empty ?? "No orders yet"}
            hint={oFiltersActive ? "Try clearing the search or date range." : undefined}
          />
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
                  <TableRow key={order.id} onOpen={() => setDetails(order)}>
                    <TableCell>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{order.customer_name || "—"}</p>
                        {order.is_guest && (
                          <Badge variant="outline" className="text-xs">
                            Guest
                          </Badge>
                        )}
                        {order.appointment_id && (
                          <Badge variant="secondary" className="text-xs">
                            Booking
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_email}
                      </p>
                      {order.customer_phone && (
                        <p className="text-xs text-muted-foreground">
                          {order.customer_phone}
                        </p>
                      )}
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
                      {formatGHS(order.total)}
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
        {ordersQuery.hasNextPage && (
          <div className="text-center">
            <Button variant="outline" onClick={() => ordersQuery.fetchNextPage()} disabled={ordersQuery.isFetchingNextPage}>
              {ordersQuery.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load more orders
            </Button>
          </div>
        )}
      </div>

      <OrderDetails
        item={details}
        onClose={() => setDetails(null)}
        footer={details && <CancellationActions kind="orders" item={details} onChanged={() => setDetails(null)} />}
      />
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
