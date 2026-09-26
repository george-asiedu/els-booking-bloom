import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Loader2, Receipt, ExternalLink } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilterBar } from "@/components/admin/FilterBar";
import {
  transactionsApi,
  type LedgerEntryType,
  type LedgerStatus,
} from "@/lib/api";
import {
  StatusBadge,
  AmountCell,
  SummaryCards,
} from "@/components/ledger/LedgerShared";
import {
  TYPE_LABEL,
  STATUS_LABEL,
  channelLabel,
  entryDate,
} from "@/lib/ledgerFormat";
import { formatGHS } from "@/lib/currency";

const PAGE_SIZE = 25;

const AdminTransactions = () => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // "all" is the UI's idle value; the API expects the parameter to be absent.
  const filters = {
    ...(type !== "all" ? { type: type as LedgerEntryType } : {}),
    ...(status !== "all" ? { status: status as LedgerStatus } : {}),
    ...(source !== "all" ? { source: source as "customer" | "studio" } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
  const filterKey = JSON.stringify(filters);

  const summaryQuery = useQuery({
    queryKey: ["admin-ledger-summary", from, to],
    queryFn: () =>
      transactionsApi.summary({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });

  const listQuery = useInfiniteQuery({
    queryKey: ["admin-ledger", filterKey],
    queryFn: ({ pageParam }) =>
      transactionsApi.list({
        ...filters,
        limit: PAGE_SIZE,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  // Refunds live alongside the ledger rather than on their own page: a studio
  // admin looking for "did that refund go through" is already looking at money.
  const refundsQuery = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: () => refundsApi.list({ limit: 25 }),
  });

  const detailQuery = useQuery({
    queryKey: ["admin-ledger-detail", openId],
    queryFn: () => transactionsApi.detail(openId!),
    enabled: !!openId,
  });

  const entries = listQuery.data?.pages.flatMap((p) => p.entries) ?? [];
  const anyFilter =
    !!search.trim() ||
    type !== "all" ||
    status !== "all" ||
    source !== "all" ||
    !!from ||
    !!to;

  const clear = () => {
    setSearch("");
    setType("all");
    setStatus("all");
    setSource("all");
    setFrom("");
    setTo("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Receipt className="h-6 w-6" aria-hidden />
            Transactions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every payment on your studio — bookings, shop orders, and your own
            subscription renewals.
          </p>
        </div>

        <SummaryCards
          summary={summaryQuery.data}
          loading={summaryQuery.isLoading}
        />

        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search reference, customer, description…"
          onClear={clear}
          active={anyFilter}
          count={entries.length}
        >
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Everyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="customer">From customers</SelectItem>
              <SelectItem value="studio">Your own spend</SelectItem>
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-[150px]"
          />
          <Input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-[150px]"
          />
        </FilterBar>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : listQuery.isError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        We couldn't load your transactions. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        {anyFilter
                          ? "No transactions match these filters."
                          : "No transactions yet. They'll appear here as soon as a customer pays."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {entryDate(e.occurredAt)}
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <span className="block truncate">{e.description}</span>
                          {e.reference ? (
                            <span className="block truncate font-mono text-[11px] text-muted-foreground">
                              {e.reference}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">
                          {TYPE_LABEL[e.type]}
                        </TableCell>
                        <TableCell className="max-w-[170px] text-sm">
                          <span className="block truncate">
                            {e.customerName ?? e.customerEmail ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {channelLabel(e.channel)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={e.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <AmountCell entry={e} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpenId(e.id)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {(refundsQuery.data?.length ?? 0) > 0 ? (
          <Card>
            <CardContent className="py-4">
              <p className="mb-1 text-sm font-medium">Recent refunds</p>
              <p className="mb-3 text-xs text-muted-foreground">
                A refund stays pending until the provider confirms it. The
                customer is emailed a receipt once it completes.
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundsQuery.data!.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {entryDate(r.processedAt ?? r.createdAt)}
                        </TableCell>
                        <TableCell className="max-w-[180px] text-sm">
                          <span className="block truncate">
                            {r.customerName ?? r.customerEmail ?? "—"}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-muted-foreground">
                            {r.reference}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] text-sm">
                          <span className="block truncate">
                            {r.reason ?? "—"}
                          </span>
                          {r.failureReason ? (
                            <span className="block truncate text-[11px] text-destructive">
                              {r.failureReason}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.status === "PROCESSED"
                                ? "default"
                                : r.status === "FAILED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {r.status === "PROCESSED"
                              ? "Refunded"
                              : r.status === "FAILED"
                                ? "Failed"
                                : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          −{formatGHS(r.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {listQuery.hasNextPage ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => listQuery.fetchNextPage()}
              disabled={listQuery.isFetchingNextPage}
            >
              {listQuery.isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction details</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin" />
          ) : detailQuery.data ? (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-[130px_1fr] gap-y-2">
                <dt className="text-muted-foreground">Description</dt>
                <dd>{detailQuery.data.entry.description}</dd>
                <dt className="text-muted-foreground">Amount</dt>
                <dd>
                  <AmountCell entry={detailQuery.data.entry} />
                </dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={detailQuery.data.entry.status} />
                </dd>
                <dt className="text-muted-foreground">Type</dt>
                <dd>{TYPE_LABEL[detailQuery.data.entry.type]}</dd>
                <dt className="text-muted-foreground">Method</dt>
                <dd>{channelLabel(detailQuery.data.entry.channel)}</dd>
                <dt className="text-muted-foreground">When</dt>
                <dd>{entryDate(detailQuery.data.entry.occurredAt)}</dd>
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="break-all font-mono text-xs">
                  {detailQuery.data.entry.reference ?? "—"}
                </dd>
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="break-all font-mono text-xs">
                  {detailQuery.data.entry.transactionId ?? "—"}
                </dd>
                <dt className="text-muted-foreground">Customer</dt>
                <dd>
                  {detailQuery.data.entry.customerName ??
                    detailQuery.data.entry.customerEmail ??
                    "—"}
                </dd>
              </dl>

              {detailQuery.data.attempts.length > 0 ? (
                <div>
                  <p className="mb-2 font-medium">
                    Payment attempts ({detailQuery.data.attempts.length})
                  </p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Each time the customer started this payment. More than one is
                    normal — an abandoned checkout followed by a successful retry.
                  </p>
                  <div className="space-y-2">
                    {detailQuery.data.attempts.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-md border px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="break-all font-mono">
                            {a.reference}
                          </span>
                          <StatusBadge status={a.status} />
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          Expected {formatGHS(a.expectedAmount)}
                          {a.paidAmount !== null
                            ? ` · paid ${formatGHS(a.paidAmount)}`
                            : ""}
                          {a.failureReason ? ` · ${a.failureReason}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {detailQuery.data.entry.appointmentId ? (
                <a
                  href="/admin"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View bookings <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : detailQuery.data.entry.orderId ? (
                <a
                  href="/admin/orders"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View orders <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : null}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              We couldn't load this transaction.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTransactions;
