import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Loader2, Receipt } from "lucide-react";
import { PlatformLayout } from "./PlatformLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { platformApi } from "@/lib/platformApi";
import type { LedgerEntryType, LedgerStatus } from "@/lib/api";
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

const PAGE_SIZE = 50;

const PlatformTransactions = () => {
  const [params, setParams] = useSearchParams();
  // The studio filter lives in the URL so a link from a studio's detail page
  // lands here already scoped, and the view is shareable.
  const studioId = params.get("studio") ?? "";

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const studiosQuery = useQuery({
    queryKey: ["platform-studios-forledger"],
    queryFn: () => platformApi.listStudios(),
  });

  const filters = {
    ...(studioId ? { studioId } : {}),
    ...(type !== "all" ? { type: type as LedgerEntryType } : {}),
    ...(status !== "all" ? { status: status as LedgerStatus } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
  const filterKey = JSON.stringify(filters);

  const summaryQuery = useQuery({
    queryKey: ["platform-ledger-summary", studioId, from, to],
    queryFn: () =>
      platformApi.transactionSummary({
        ...(studioId ? { studioId } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });

  const listQuery = useInfiniteQuery({
    queryKey: ["platform-ledger", filterKey],
    queryFn: ({ pageParam }) =>
      platformApi.listTransactions({
        ...filters,
        limit: PAGE_SIZE,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const queuesQuery = useQuery({
    queryKey: ["platform-queues"],
    queryFn: () => platformApi.queues(),
    refetchInterval: 30_000,
  });

  const entries = listQuery.data?.pages.flatMap((p) => p.entries) ?? [];
  const studios = studiosQuery.data ?? [];
  const studioName = studioId
    ? (studios.find((st) => st.id === studioId)?.name ?? "this studio")
    : null;

  const setStudio = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "all") next.delete("studio");
    else next.set("studio", v);
    setParams(next, { replace: true });
  };

  const q = queuesQuery.data?.data;

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
            <Receipt className="h-6 w-6" aria-hidden />
            Transactions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {studioName
              ? `Every payment on ${studioName}.`
              : "Every payment across all studios. Filter to one studio to see its books."}
          </p>
        </div>

        <SummaryCards
          summary={summaryQuery.data}
          loading={summaryQuery.isLoading}
        />

        <Card>
          <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:flex-wrap lg:items-center">
            <Select value={studioId || "all"} onValueChange={setStudio}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All studios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All studios</SelectItem>
                {studios.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, customer…"
              className="w-[220px]"
            />

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[160px]">
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
              <SelectTrigger className="w-[160px]">
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

            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setType("all");
                setStatus("all");
                setFrom("");
                setTo("");
                setStudio("all");
              }}
            >
              Clear
            </Button>
          </CardContent>
        </Card>

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : listQuery.isError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        Couldn't load transactions. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        No transactions match these filters.
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
                        <TableCell className="text-sm">{TYPE_LABEL[e.type]}</TableCell>
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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

        {/* Queue health sits here because a stalled reconcile queue is the most
            likely reason a payment looks stuck in this very table. */}
        <Card>
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium">Background jobs</p>
            {queuesQuery.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !q?.enabled ? (
              <p className="text-sm text-muted-foreground">
                Queues are disabled (no REDIS_URL configured). Emails send
                inline and payment reconciliation doesn't run on a schedule.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["Email", q.email],
                    ["Payment reconciliation", q.reconcilePayments],
                  ] as const
                ).map(([label, queue]) => (
                  <div key={label} className="rounded-md border p-3">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {queue
                        ? Object.entries(queue.counts)
                            .filter(([, v]) => typeof v === "number")
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")
                        : "No data"}
                    </p>
                    {queue && queue.recentFailures.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {queue.recentFailures.slice(0, 3).map((f, i) => (
                          <li
                            key={f.id ?? i}
                            className="truncate text-xs text-destructive"
                            title={f.failedReason}
                          >
                            {f.failedReason ?? "Unknown failure"}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
};

export default PlatformTransactions;
