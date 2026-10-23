import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { PlatformLayout } from "./PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { EarningDetails, PurposeBadge } from "@/components/platform/EarningDetails";
import { PURPOSE_LABEL } from "@/lib/earnings";
import { DateRangeField } from "@/components/admin/DateRangeFilter";
import { platformApi, type EarningEntry, type EarningPurpose } from "@/lib/platformApi";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

/** Every payment the platform has earned, by studio and purpose. */
const PlatformEarnings = () => {
  const [studioId, setStudioId] = useState("");
  const [purpose, setPurpose] = useState<EarningPurpose | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<EarningEntry | null>(null);

  useEffect(() => setPage(1), [studioId, purpose, from, to]);

  const { data: studios = [] } = useQuery({
    queryKey: ["platform", "studios"],
    queryFn: () => platformApi.listStudios(),
  });
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["platform", "earnings", studioId, purpose, from, to, page],
    queryFn: () =>
      platformApi.listEarnings({
        studioId,
        purpose,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Earnings</h1>
          <p className="text-muted-foreground">
            Every payment studios have made to you: which studio, what it was for, and when.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={studioId || "all"} onValueChange={(v) => setStudioId(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[220px]" aria-label="Studio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All studios</SelectItem>
              {studios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={purpose || "all"} onValueChange={(v) => setPurpose(v === "all" ? "" : (v as EarningPurpose))}>
            <SelectTrigger className="h-9 w-[180px]" aria-label="What for">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Every purpose</SelectItem>
              {(Object.keys(PURPOSE_LABEL) as EarningPurpose[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PURPOSE_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangeField from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        </div>

        {/* Totals for the current filters */}
        {data && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="space-y-3 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Total for this view</p>
                  <p className="text-3xl font-semibold tabular-nums">{formatGHS(data.summary.total)}</p>
                  <p className="text-xs text-muted-foreground">{data.total} {data.total === 1 ? "payment" : "payments"}</p>
                </div>
                <dl className="space-y-1 border-t pt-3 text-sm">
                  {(Object.keys(PURPOSE_LABEL) as EarningPurpose[])
                    .filter((p) => data.summary.byPurpose[p])
                    .map((p) => (
                      <div key={p} className="flex justify-between">
                        <dt className="text-muted-foreground">{PURPOSE_LABEL[p]}</dt>
                        <dd className="font-medium tabular-nums">{formatGHS(data.summary.byPurpose[p] ?? 0)}</dd>
                      </div>
                    ))}
                </dl>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">By studio</CardTitle>
              </CardHeader>
              <CardContent>
                {data.summary.byStudio.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No payments for this view.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.summary.byStudio.slice(0, 6).map((row) => {
                      const share = data.summary.total ? (row.amount / data.summary.total) * 100 : 0;
                      return (
                        <li key={row.studio?.id ?? "unknown"}>
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <button
                              type="button"
                              className="truncate font-medium hover:underline"
                              onClick={() => row.studio && setStudioId(row.studio.id)}
                            >
                              {row.studio?.name ?? "Unknown studio"}
                            </button>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {row.payments} · <span className="font-medium text-foreground">{formatGHS(row.amount)}</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, share)}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Studio</TableHead>
                <TableHead>What for</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn(isFetching && !isLoading && "opacity-60")}>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : !data?.items.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No payments match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((e) => (
                  <TableRow key={e.id} onOpen={() => setOpen(e)}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {e.purpose === "COMMISSION" ? e.detail.month : format(parseISO(e.date), "d MMM yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{e.studio?.name ?? "—"}</TableCell>
                    <TableCell>
                      <PurposeBadge purpose={e.purpose} />
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-muted-foreground">{e.description}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatGHS(e.amount)}
                      {e.estimated && <span className="ml-1 text-xs font-normal text-muted-foreground">est.</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {data && (
            <TablePagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} noun="payments" />
          )}
        </Card>
      </div>
      <EarningDetails entry={open} onClose={() => setOpen(null)} />
    </PlatformLayout>
  );
};

export default PlatformEarnings;
