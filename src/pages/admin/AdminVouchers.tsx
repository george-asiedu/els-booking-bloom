import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadMore } from "@/components/LoadMore";
import { format } from "date-fns";
import { ExternalLink, Gift, Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading, Panel } from "@/components/dashboard/KpiTile";
import { TabEmpty } from "@/components/dashboard/StatusTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import { servicesApi, vouchersApi, type PackageOfferDTO, type VoucherDTO } from "@/lib/api";
import { formatGHS } from "@/lib/currency";

/** Gift cards and packages: what's on sale, what's been sold, and in-person use. */
const AdminVouchers = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { features } = useStudio();
  const booking = features.booking !== false;
  const soldQuery = useInfiniteQuery({
    queryKey: ["admin-vouchers"],
    queryFn: ({ pageParam }) => vouchersApi.listPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  });
  const sold = soldQuery.data?.pages.flatMap((pg) => pg.items) ?? [];
  const isLoading = soldQuery.isLoading;
  const { data: offers = [] } = useQuery({ queryKey: ["admin-packages"], queryFn: () => vouchersApi.allPackages(), enabled: booking });
  const { data: services = [] } = useQuery({ queryKey: ["admin-services"], queryFn: () => servicesApi.listAll(), enabled: booking });
  const serviceName = (id: string | null) => services.find((s) => s.id === id)?.name ?? "";
  const fail = (e: unknown) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Something went wrong" });

  // Package editor
  const [editing, setEditing] = useState<PackageOfferDTO | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offer, setOffer] = useState({ serviceId: "", sessions: "5", price: "", name: "", active: true });
  const saveOffer = useMutation({
    mutationFn: () =>
      vouchersApi.savePackage(editing?.id ?? null, {
        serviceId: offer.serviceId,
        sessions: Number(offer.sessions),
        price: Number(offer.price),
        name: offer.name,
        active: offer.active,
      }),
    onSuccess: () => {
      toast({ title: "Package saved" });
      setOfferOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
    },
    onError: fail,
  });
  const removeOffer = useMutation({
    mutationFn: (id: string) => vouchersApi.removePackage(id),
    onSuccess: (r) => {
      toast({ title: r.message });
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
    },
    onError: fail,
  });
  const openOffer = (o: PackageOfferDTO | null) => {
    setEditing(o);
    setOffer(
      o
        ? { serviceId: o.serviceId, sessions: String(o.sessions), price: String(o.price), name: o.name, active: o.active }
        : { serviceId: "", sessions: "5", price: "", name: "", active: true },
    );
    setOfferOpen(true);
  };

  // In-person use
  const [using, setUsing] = useState<VoucherDTO | null>(null);
  const [amount, setAmount] = useState("");
  const redeem = useMutation({
    mutationFn: () => vouchersApi.redeem(using!.id, using!.kind === "GIFT_CARD" ? Number(amount) : undefined),
    onSuccess: (r) => {
      toast({ title: r.message });
      setUsing(null);
      qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
    onError: fail,
  });

  return (
    <AdminLayout>
      <DashboardHeading
        title={booking ? "Gift cards & packages" : "Gift cards"}
        subtitle="Customers buy them on your site and get a code by email. They use the code when booking or checking out, or show it to you in person."
        actions={
          <Button variant="outline" asChild>
            <a href="/gift-cards" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> View the gift card page
            </a>
          </Button>
        }
      />

      {booking && (
        <Panel className="mb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Packages on sale</h2>
              <p className="text-sm text-muted-foreground">Several sessions of one service, paid upfront, usually at a saving.</p>
            </div>
            <Button size="sm" onClick={() => openOffer(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add package
            </Button>
          </div>
          {offers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages yet. Gift cards are always on sale.</p>
          ) : (
            <ul className="divide-y divide-border">
              {offers.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {o.sessions} × {serviceName(o.serviceId)} · {formatGHS(o.price)}
                      {!o.active && " · Not on sale"}
                    </span>
                  </span>
                  <span className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${o.name}`} onClick={() => openOffer(o)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${o.name}`} onClick={() => removeOffer.mutate(o.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <h2 className="mb-3 font-semibold">Sold</h2>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : sold.length === 0 ? (
        <TabEmpty icon={<Gift />} title="Nothing sold yet" hint="Share your gift card page with customers, for example before holidays." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Bought by</TableHead>
                <TableHead>For</TableHead>
                <TableHead>Left</TableHead>
                <TableHead>Bought</TableHead>
                <TableHead className="text-right">In person</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sold.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-mono text-sm">
                      {v.kind === "PACKAGE" ? <Package className="h-4 w-4 text-muted-foreground" /> : <Gift className="h-4 w-4 text-muted-foreground" />}
                      {v.code}
                    </span>
                  </TableCell>
                  <TableCell>{v.buyerName}</TableCell>
                  <TableCell>{v.kind === "PACKAGE" ? serviceName(v.serviceId) : (v.recipientName ?? "Themselves")}</TableCell>
                  <TableCell className="tabular-nums">
                    {v.status === "USED" ? (
                      <Badge variant="secondary">Used up</Badge>
                    ) : v.kind === "PACKAGE" ? (
                      `${v.sessionsLeft} of ${v.sessionsTotal} sessions`
                    ) : (
                      `${formatGHS(v.balance)} of ${formatGHS(v.price)}`
                    )}
                  </TableCell>
                  <TableCell>{v.paidAt ? format(new Date(v.paidAt), "d MMM yyyy") : ""}</TableCell>
                  <TableCell className="text-right">
                    {v.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUsing(v);
                          setAmount("");
                        }}
                      >
                        {v.kind === "PACKAGE" ? "Use a session" : "Take off an amount"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <LoadMore query={soldQuery} label="Load more" />

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="max-w-md">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveOffer.mutate();
            }}
          >
            <DialogHeader>
              <DialogTitle>{editing ? "Edit package" : "Add package"}</DialogTitle>
              <DialogDescription>Customers pay once and use a session each time they book this service.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={offer.serviceId} onValueChange={(v) => setOffer({ ...offer, serviceId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a service" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({formatGHS(s.effective_price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pk-sessions">Sessions</Label>
                <Input id="pk-sessions" type="number" min={2} max={50} value={offer.sessions} onChange={(e) => setOffer({ ...offer, sessions: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pk-price">Package price (GHS)</Label>
                <Input id="pk-price" type="number" min={1} step="0.01" value={offer.price} onChange={(e) => setOffer({ ...offer, price: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pk-name">Name (optional)</Label>
              <Input id="pk-name" maxLength={80} placeholder="e.g. Braids five-pack" value={offer.name} onChange={(e) => setOffer({ ...offer, name: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={offer.active} onCheckedChange={(v) => setOffer({ ...offer, active: v })} /> On sale
            </label>
            <DialogFooter>
              <Button type="submit" disabled={saveOffer.isPending || !offer.serviceId || !offer.price}>
                {saveOffer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save package
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(using)} onOpenChange={(o) => !o && setUsing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{using?.kind === "PACKAGE" ? "Use a session" : "Take off an amount"}</DialogTitle>
            <DialogDescription>
              {using?.kind === "PACKAGE"
                ? `${using?.code} has ${using?.sessionsLeft} sessions left. This uses one.`
                : `${using?.code} has ${formatGHS(using?.balance ?? 0)} left.`}
            </DialogDescription>
          </DialogHeader>
          {using?.kind === "GIFT_CARD" && (
            <div className="space-y-2">
              <Label htmlFor="use-amount">Amount (GHS)</Label>
              <Input id="use-amount" type="number" min={0.01} step="0.01" max={using.balance} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button disabled={redeem.isPending || (using?.kind === "GIFT_CARD" && !(Number(amount) > 0))} onClick={() => redeem.mutate()}>
              {redeem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVouchers;
