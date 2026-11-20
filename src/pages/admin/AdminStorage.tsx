import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format } from "date-fns";
import { HardDrive, Loader2, Plus, RotateCcw, Trash2, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading, Panel } from "@/components/dashboard/KpiTile";
import { TabEmpty } from "@/components/dashboard/StatusTabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Summary {
  applies: boolean;
  plan: string;
  usedBytes: number;
  trashBytes: number;
  limitBytes: number;
  includedMb: number;
  extraBlocks: number;
  blockMb: number;
  blockPrice: number;
  extraPerMonth: number;
  byCategory: { category: string; bytes: number }[];
  trashDays: number;
}
interface TrashItem {
  id: string;
  title: string | null;
  imageUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  deletedAt: string;
  purgeAfter: string | null;
}

const bytes = (n: number) => {
  if (n < 1024 * 1024) return `${Math.max(0, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(n < 100 * 1024 ** 2 ? 1 : 0)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
};
const LABELS: Record<string, string> = {
  gallery: "Gallery",
  services: "Services",
  products: "Products",
  studio: "Branding and website",
  appointments: "Booking photos",
  profiles: "Profile photos",
};

/** What's stored, against the plan's limit, with the trash and extra blocks. */
const AdminStorage = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const summary = useQuery({
    queryKey: ["storage"],
    queryFn: async () => (await apiRequest<{ data: Summary }>("/storage", { auth: true })).data,
  });
  const trash = useQuery({
    queryKey: ["gallery-trash"],
    queryFn: async () => (await apiRequest<{ data: TrashItem[] }>("/gallery/trash", { auth: true })).data,
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["storage"] });
    qc.invalidateQueries({ queryKey: ["gallery-trash"] });
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    qc.invalidateQueries({ queryKey: ["studio-billing"] });
  };
  const fail = (e: unknown) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Something went wrong" });
  const addBlock = useMutation({
    mutationFn: () => apiRequest("/storage/blocks", { method: "POST", auth: true }),
    onSuccess: () => { toast({ title: "Extra storage added", description: "It's added to your next renewal." }); refresh(); },
    onError: fail,
  });
  const removeBlock = useMutation({
    mutationFn: () => apiRequest("/storage/blocks", { method: "DELETE", auth: true }),
    onSuccess: () => { toast({ title: "Extra storage removed", description: "You won't be charged for it from next month." }); refresh(); },
    onError: fail,
  });
  const restore = useMutation({
    mutationFn: (id: string) => apiRequest<{ message: string }>(`/gallery/${id}/restore`, { method: "POST", auth: true }),
    onSuccess: (r) => { toast({ title: r.message }); refresh(); },
    onError: fail,
  });
  const purge = useMutation({
    mutationFn: (id: string) => apiRequest<{ message: string }>(`/gallery/${id}/purge`, { method: "DELETE", auth: true }),
    onSuccess: () => { toast({ title: "Deleted for good" }); refresh(); },
    onError: fail,
  });

  const s = summary.data;
  const pct = s ? Math.min(100, (s.usedBytes / s.limitBytes) * 100) : 0;
  const full = s ? s.usedBytes >= s.limitBytes : false;
  const nearly = pct >= 80;
  const max = Math.max(1, ...(s?.byCategory.map((c) => c.bytes) ?? [1]));

  return (
    <AdminLayout>
      <DashboardHeading title="Storage" subtitle="Photos and videos on your website count towards your plan's storage." />
      {summary.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : !s?.applies ? (
        <TabEmpty icon={<HardDrive />} title="No storage limit on your plan" hint="Storage limits only apply to Zuri Studios plans." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <Panel>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-2xl font-semibold tabular-nums">{bytes(s.usedBytes)}</p>
                <p className="text-sm text-muted-foreground">of {bytes(s.limitBytes)}</p>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
                <div className={cn("h-full rounded-full", full ? "bg-destructive" : nearly ? "bg-amber-500" : "bg-primary")} style={{ width: `${pct}%` }} />
              </div>
              <p className={cn("mt-3 text-sm", full ? "font-medium text-destructive" : nearly ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
                {full
                  ? "Your storage is full, so new uploads are paused. Delete files below or add more storage."
                  : nearly
                    ? "You're running low. Delete files you don't need, or add more storage."
                    : `${bytes(s.limitBytes - s.usedBytes)} free.`}
              </p>
            </Panel>

            <Panel>
              <h2 className="font-semibold">What's using it</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {s.byCategory.length === 0 && <li className="text-muted-foreground">Nothing uploaded yet.</li>}
                {s.byCategory.map((c) => (
                  <li key={c.category}>
                    <span className="flex justify-between">
                      <span>{LABELS[c.category] ?? c.category}</span>
                      <span className="tabular-nums text-muted-foreground">{bytes(c.bytes)}</span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${(c.bytes / max) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Manage photos and videos in <Link to="/admin/gallery" className="underline underline-offset-2">your gallery</Link>.
              </p>
            </Panel>

            <Panel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Trash</h2>
                {s.trashBytes > 0 && <span className="text-xs text-muted-foreground">{bytes(s.trashBytes)} still counted</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Deleted gallery items wait here for {s.trashDays} days and can be restored. They still use storage until they're deleted for good.
              </p>
              {trash.isLoading ? (
                <Loader2 className="mt-4 h-5 w-5 animate-spin text-muted-foreground" />
              ) : !trash.data?.length ? (
                <p className="mt-4 text-sm text-muted-foreground">The trash is empty.</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {trash.data.map((t) => {
                    const left = t.purgeAfter ? Math.max(0, differenceInCalendarDays(new Date(t.purgeAfter), new Date())) : s.trashDays;
                    return (
                      <li key={t.id} className="flex items-center gap-3 py-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                          {t.mediaType === "VIDEO" ? <Video className="h-5 w-5 text-muted-foreground" /> : <img src={t.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.title || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground">
                            Deleted {format(new Date(t.deletedAt), "d MMM")} · gone for good in {left} {left === 1 ? "day" : "days"}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" disabled={restore.isPending} onClick={() => restore.mutate(t.id)}>
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Delete for good" disabled={purge.isPending} onClick={() => confirm("Delete this for good? This can't be undone.") && purge.mutate(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <Panel className="h-fit">
            <h2 className="font-semibold">Your plan's storage</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Included</dt><dd className="tabular-nums">{s.includedMb >= 1024 ? `${s.includedMb / 1024} GB` : `${s.includedMb} MB`}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Extra added</dt><dd className="tabular-nums">{s.extraBlocks * s.blockMb} MB</dd></div>
              <div className="flex justify-between gap-3 border-t border-border pt-2 font-medium"><dt>Extra cost</dt><dd className="tabular-nums">{formatGHS(s.extraPerMonth)} / month</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Each extra {s.blockMb} MB is {formatGHS(s.blockPrice)} a month, added to your next renewal.
            </p>
            <Button className="mt-4 w-full" disabled={addBlock.isPending} onClick={() => addBlock.mutate()}>
              {addBlock.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add {s.blockMb} MB for {formatGHS(s.blockPrice)} a month
            </Button>
            {s.extraBlocks > 0 && (
              <Button variant="ghost" className="mt-2 w-full" disabled={removeBlock.isPending} onClick={() => removeBlock.mutate()}>
                Remove {s.blockMb} MB from next month
              </Button>
            )}
          </Panel>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStorage;
