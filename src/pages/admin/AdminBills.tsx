import { useEffect, useState } from "react";
import { useCursorPages } from "@/hooks/useCursorPages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadMore } from "@/components/LoadMore";
import { format } from "date-fns";
import QRCode from "qrcode";
import { Copy, Loader2, MessageCircle, Plus, Receipt, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading, KpiTile } from "@/components/dashboard/KpiTile";
import { StatusTabs, TabEmpty } from "@/components/dashboard/StatusTabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useStudio } from "@/hooks/useStudio";
import { apiRequest } from "@/lib/apiClient";
import { productsApi, servicesApi } from "@/lib/api";
import { formatGHS } from "@/lib/currency";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface Line { name: string; quantity: number; unitPrice: number; kind: "service" | "product" | "custom" }
interface Bill {
  id: string;
  number: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  items: Line[];
  total: number;
  note: string | null;
  status: "UNPAID" | "PAID" | "VOID";
  paidAt: string | null;
  paidVia: string | null;
  paidNote?: string | null;
  createdAt: string;
  payUrl: string | null;
}

const STATUS = {
  UNPAID: { label: "Unpaid", className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300" },
  PAID: { label: "Paid", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300" },
  VOID: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
} as const;
const VIA: Record<string, string> = { paystack: "online", cash: "cash", momo: "Mobile Money", card: "card machine" };

/** The pay link as a QR code, a copy button and a WhatsApp message. */
const ShareDialog = ({ bill, onClose }: { bill: Bill | null; onClose: () => void }) => {
  const { toast } = useToast();
  const { name: business } = useStudio();
  const [qr, setQr] = useState("");
  useEffect(() => {
    setQr("");
    if (bill?.payUrl) QRCode.toDataURL(bill.payUrl, { margin: 1, width: 240 }).then(setQr).catch(() => setQr(""));
  }, [bill?.payUrl]);
  if (!bill) return null;
  const text = `Hello ${bill.customerName.split(" ")[0]}, here is your bill from ${business} for ${formatGHS(bill.total)}. You can pay by Mobile Money or card here: ${bill.payUrl}`;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bill {bill.number}</DialogTitle>
          <DialogDescription>
            {formatGHS(bill.total)} for {bill.customerName}. Let them scan the code, or send the link.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          {qr ? <img src={qr} alt={`QR code to pay bill ${bill.number}`} className="h-48 w-48 rounded-lg border border-border" /> : <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
        <code className="block break-all rounded-lg bg-muted px-3 py-2 text-xs">{bill.payUrl}</code>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigator.clipboard.writeText(bill.payUrl ?? "").then(
                () => toast({ title: "Link copied" }),
                () => toast({ variant: "destructive", title: "Couldn't copy. Select the link instead." }),
              )
            }
          >
            <Copy className="mr-2 h-4 w-4" /> Copy link
          </Button>
          <Button asChild>
            <a href={whatsappLink(bill.customerPhone, text) ?? `https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Send on WhatsApp
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type BillTab = "UNPAID" | "PAID" | "VOID" | "ALL";
const emptyLine = (): Line => ({ name: "", quantity: 1, unitPrice: 0, kind: "custom" });

const NewBillDialog = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (b: Bill) => void }) => {
  const { toast } = useToast();
  const { features } = useStudio();
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", note: "" });
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const services = useQuery({ queryKey: ["bill-services"], queryFn: () => servicesApi.listActive(), enabled: open });
  const products = useQuery({ queryKey: ["bill-products"], queryFn: () => productsApi.listActive(), enabled: open && Boolean(features?.commerce) });

  const total = lines.reduce((s, l) => s + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0), 0);
  const setLine = (i: number, patch: Partial<Line>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const valid = form.customerName.trim() && total > 0 && lines.every((l) => l.name.trim());

  const create = useMutation({
    mutationFn: async () =>
      (await apiRequest<{ data: Bill }>("/bills", { method: "POST", auth: true, body: { ...form, items: lines.filter((l) => l.name.trim()) } })).data,
    onSuccess: (bill) => {
      setForm({ customerName: "", customerPhone: "", customerEmail: "", note: "" });
      setLines([emptyLine()]);
      onCreated(bill);
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't create the bill" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>New bill</DialogTitle>
            <DialogDescription>For a walk-in. You'll get a link and QR code they pay through on their phone.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bill-name">Customer name</Label>
              <Input id="bill-name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill-phone">Phone (optional)</Label>
              <Input id="bill-phone" type="tel" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill-email">Email (optional)</Label>
              <Input id="bill-email" type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>What they had</Label>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_4rem_6rem_2rem] items-center gap-2">
                <Input aria-label="Item" placeholder="Item" value={l.name} maxLength={80} onChange={(e) => setLine(i, { name: e.target.value, kind: "custom" })} />
                <Input aria-label="Quantity" type="number" min={1} max={99} value={l.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} />
                <Input aria-label="Price" type="number" min={0} step="0.01" value={l.unitPrice || ""} placeholder="Price" onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) })} />
                <Button type="button" variant="ghost" size="icon" aria-label="Remove line" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Select
                value=""
                onValueChange={(id) => {
                  const s = services.data?.find((x) => x.id === id);
                  if (s) setLines([...lines.filter((l) => l.name.trim()), { name: s.name, quantity: 1, unitPrice: s.effective_price, kind: "service" }]);
                }}
              >
                <SelectTrigger className="h-9 w-44" aria-label="Add a service"><SelectValue placeholder="Add a service" /></SelectTrigger>
                <SelectContent>{services.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {formatGHS(s.effective_price)}</SelectItem>)}</SelectContent>
              </Select>
              {!!features?.commerce && (
                <Select
                  value=""
                  onValueChange={(id) => {
                    const p = products.data?.find((x) => x.id === id);
                    if (p) setLines([...lines.filter((l) => l.name.trim()), { name: p.name, quantity: 1, unitPrice: p.effective_price, kind: "product" }]);
                  }}
                >
                  <SelectTrigger className="h-9 w-44" aria-label="Add a product"><SelectValue placeholder="Add a product" /></SelectTrigger>
                  <SelectContent>{products.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {formatGHS(p.effective_price)}</SelectItem>)}</SelectContent>
                </Select>
              )}
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setLines([...lines, emptyLine()])}>
                <Plus className="mr-1.5 h-4 w-4" /> Other item
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill-note">Note (optional)</Label>
            <Input id="bill-note" value={form.note} maxLength={300} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold tabular-nums">{formatGHS(total)}</span>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!valid || create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create bill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/** Bills for walk-ins: a payment link and QR code, and a record of what's paid. */
const AdminBills = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<BillTab>("UNPAID");
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState<Bill | null>(null);
  const [paying, setPaying] = useState<Bill | null>(null);
  const [method, setMethod] = useState("cash");
  const [received, setReceived] = useState("");
  const [payNote, setPayNote] = useState("");

  // One page at a time, per tab. Totals and counts come from the server over
  // every bill, so they are right however many pages are loaded.
  type BillsPage = {
    data: Bill[];
    totals: { unpaid: number; paid: number };
    today?: { cash: number; counter: number; online: number; count: number };
    counts: Record<BillTab, number>;
    pagination?: { nextCursor: string | null; hasMore: boolean };
  };
  const billsQuery = useCursorPages({
    queryKey: ["bills", tab],
    queryFn: ({ pageParam }) =>
      apiRequest<BillsPage>(
        `/bills?${new URLSearchParams({ limit: "25", ...(tab !== "ALL" ? { status: tab } : {}), ...(pageParam ? { cursor: pageParam } : {}) })}`,
        { auth: true },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.pagination?.hasMore ? last.pagination.nextCursor ?? undefined : undefined),
  });
  const isLoading = billsQuery.isLoading;
  const data = billsQuery.data?.pages[0];
  const refresh = () => qc.invalidateQueries({ queryKey: ["bills"] });
  const fail = (e: unknown) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Something went wrong" });
  const markPaid = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ message: string }>(`/bills/${id}/paid`, {
        method: "POST",
        auth: true,
        body: { method, ...(method === "cash" && received.trim() ? { received: Number(received) } : {}), ...(payNote.trim() ? { note: payNote.trim() } : {}) },
      }),
    onSuccess: (res) => { setPaying(null); refresh(); toast({ title: res.message }); },
    onError: fail,
  });
  const remind = useMutation({
    mutationFn: (id: string) => apiRequest<{ message: string }>(`/bills/${id}/remind`, { method: "POST", auth: true }),
    onSuccess: (res) => toast({ title: res.message }),
    onError: fail,
  });
  const openPaying = (b: Bill) => { setMethod("cash"); setReceived(""); setPayNote(""); setPaying(b); };
  const receivedNum = Number(received);
  const change = paying && method === "cash" && received.trim() && Number.isFinite(receivedNum) ? receivedNum - paying.total : null;
  const cancel = useMutation({
    mutationFn: (id: string) => apiRequest(`/bills/${id}/void`, { method: "POST", auth: true }),
    onSuccess: refresh,
    onError: fail,
  });

  const shown = billsQuery.data?.pages.flatMap((pg) => pg.data) ?? [];
  const count = (s: BillTab) => data?.counts?.[s] ?? 0;

  return (
    <AdminLayout>
      <DashboardHeading
        title="Bills"
        subtitle="Bill a walk-in and send a payment link. Every bill stays on record: paid online, paid at the counter, or cancelled."
        actions={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New bill</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiTile tone="amber" label="Waiting to be paid" value={formatGHS(data?.totals.unpaid ?? 0)} hint={`${count("UNPAID")} unpaid`} />
        <KpiTile tone="green" label="Paid" value={formatGHS(data?.totals.paid ?? 0)} hint={`${count("PAID")} paid`} />
        <KpiTile
          tone="green"
          label="Taken today"
          value={formatGHS((data?.today?.cash ?? 0) + (data?.today?.counter ?? 0) + (data?.today?.online ?? 0))}
          hint={`Cash ${formatGHS(data?.today?.cash ?? 0)} · Counter ${formatGHS(data?.today?.counter ?? 0)} · Online ${formatGHS(data?.today?.online ?? 0)}`}
        />
      </div>
      <StatusTabs<BillTab>
        tabs={[
          { key: "UNPAID", label: "Unpaid", count: count("UNPAID") },
          { key: "PAID", label: "Paid", count: count("PAID") },
          { key: "VOID", label: "Cancelled", count: count("VOID") },
          { key: "ALL", label: "All", count: count("ALL") },
        ]}
        value={tab}
        onChange={setTab}
      />
      {isLoading ? (
        <Loader2 className="mt-6 h-6 w-6 animate-spin text-muted-foreground" />
      ) : shown.length === 0 ? (
        <TabEmpty icon={<Receipt />} title="No bills here" hint="Create a bill for a walk-in to get a payment link and QR code." />
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-64" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <p className="font-medium">{b.number}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(b.createdAt), "d MMM, h:mm a")}</p>
                  </TableCell>
                  <TableCell>
                    <p>{b.customerName}</p>
                    <p className="text-xs text-muted-foreground">{b.items.map((i) => `${i.quantity > 1 ? `${i.quantity} × ` : ""}${i.name}`).join(", ")}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatGHS(b.total)}</TableCell>
                  <TableCell>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS[b.status].className)}>{STATUS[b.status].label}</span>
                    {b.status === "PAID" && b.paidVia && <p className="mt-1 text-xs text-muted-foreground">{VIA[b.paidVia] ?? b.paidVia}</p>}
                    {b.status === "PAID" && b.paidNote && <p className="text-xs text-muted-foreground">{b.paidNote}</p>}
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === "UNPAID" && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setSharing(b)}>Link and QR</Button>
                        <Button size="sm" variant="outline" onClick={() => openPaying(b)}>Paid at counter</Button>
                        {b.customerEmail && (
                          <Button size="sm" variant="ghost" disabled={remind.isPending} onClick={() => remind.mutate(b.id)}>Send reminder</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => confirm(`Cancel bill ${b.number}?`) && cancel.mutate(b.id)}>Cancel</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <LoadMore query={billsQuery} label="Load more bills" />

      <NewBillDialog open={creating} onClose={() => setCreating(false)} onCreated={(b) => { setCreating(false); refresh(); setSharing(b); }} />
      <ShareDialog bill={sharing} onClose={() => setSharing(null)} />
      <Dialog open={Boolean(paying)} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Paid at the counter</DialogTitle>
            <DialogDescription>{paying ? `${paying.number}: ${formatGHS(paying.total)} from ${paying.customerName}.` : ""} How did they pay?</DialogDescription>
          </DialogHeader>
          <Select value={method} onValueChange={(v) => { setMethod(v); setReceived(""); }}>
            <SelectTrigger aria-label="How they paid"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="momo">Mobile Money to our own number</SelectItem>
              <SelectItem value="card">Card machine</SelectItem>
            </SelectContent>
          </Select>
          {method === "cash" && paying && (
            <div className="space-y-1.5">
              <Label htmlFor="bill-received">Cash received (optional)</Label>
              <Input id="bill-received" type="number" inputMode="decimal" min={paying.total} step="0.01" value={received} onChange={(e) => setReceived(e.target.value)} placeholder={String(paying.total)} />
              {change != null && (
                <p className={cn("text-sm", change < 0 ? "text-destructive" : "text-muted-foreground")}>
                  {change < 0 ? `${formatGHS(-change)} short` : change === 0 ? "No change to give" : `Give back ${formatGHS(change)} in change`}
                </p>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="bill-paynote">Note (optional)</Label>
            <Input id="bill-paynote" maxLength={120} value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="For example: received by Ama" />
          </div>
          {paying?.customerEmail && <p className="text-xs text-muted-foreground">A receipt will be emailed to {paying.customerEmail}.</p>}
          <DialogFooter>
            <Button disabled={markPaid.isPending || (change != null && change < 0)} onClick={() => paying && markPaid.mutate(paying.id)}>
              {markPaid.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Mark as paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBills;
