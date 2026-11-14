import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2, Wallet } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading, KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { TabEmpty } from "@/components/dashboard/StatusTabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";
import { formatGHS } from "@/lib/currency";

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string | null;
  amount: number;
}
interface MonthData {
  month: string;
  items: Expense[];
  categories: string[];
  summary: { earned: number; spent: number; profit: number; byCategory: { category: string; amount: number }[] };
}

/** What the business spent this month, against what it took in. */
const AdminExpenses = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const { data, isLoading } = useQuery({
    queryKey: ["expenses", month],
    queryFn: async () => (await apiRequest<{ data: MonthData }>(`/expenses?month=${month}`, { auth: true })).data,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: format(new Date(), "yyyy-MM-dd"), category: "Products and supplies", amount: "", description: "" });

  const add = useMutation({
    mutationFn: () => apiRequest("/expenses", { method: "POST", auth: true, body: { ...form, amount: Number(form.amount) } }),
    onSuccess: () => {
      toast({ title: "Expense added" });
      setOpen(false);
      setForm({ ...form, amount: "", description: "" });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't add it" }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiRequest(`/expenses/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const label = format(parseISO(`${month}-01`), "MMMM yyyy");
  const step = (n: number) => setMonth(format(addMonths(parseISO(`${month}-01`), n), "yyyy-MM"));
  const s = data?.summary;

  return (
    <AdminLayout>
      <DashboardHeading
        title="Expenses"
        subtitle="Record what you spend to see your real profit. Income is what customers paid you in the app."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add expense
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => step(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="min-w-36 text-center font-medium">{label}</p>
        <Button variant="outline" size="icon" aria-label="Next month" onClick={() => step(1)} disabled={month >= format(new Date(), "yyyy-MM")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiTile tone="green" label="Income" value={formatGHS(s?.earned ?? 0)} hint="Booking payments and shop sales" />
        <KpiTile tone="rose" label="Expenses" value={formatGHS(s?.spent ?? 0)} hint={`${data?.items.length ?? 0} recorded`} />
        <KpiTile tone={(s?.profit ?? 0) >= 0 ? "blue" : "amber"} label="Profit" value={formatGHS(s?.profit ?? 0)} hint="Income minus expenses" />
      </div>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : !data?.items.length ? (
        <TabEmpty icon={<Wallet />} title={`No expenses for ${label}`} hint="Add rent, products you bought, salaries and other costs to see your profit." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="overflow-hidden rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{format(parseISO(e.date), "d MMM")}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatGHS(e.amount)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="Remove expense" onClick={() => remove.mutate(e.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Panel>
            <h2 className="font-semibold">By category</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {s?.byCategory.map((c) => (
                <li key={c.category}>
                  <span className="flex justify-between">
                    <span>{c.category}</span>
                    <span className="tabular-nums">{formatGHS(c.amount)}</span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${s.spent ? (c.amount / s.spent) * 100 : 0}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              add.mutate();
            }}
          >
            <DialogHeader>
              <DialogTitle>Add an expense</DialogTitle>
              <DialogDescription>Only you and your team see this.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-date">Date</Label>
                <Input id="exp-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount (GHS)</Label>
                <Input id="exp-amount" type="number" min={0.01} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(data?.categories ?? []).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-note">Note (optional)</Label>
              <Input id="exp-note" maxLength={200} placeholder="e.g. November rent" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={add.isPending || !(Number(form.amount) > 0)}>
                {add.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminExpenses;
