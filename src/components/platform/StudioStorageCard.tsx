import { useQuery } from "@tanstack/react-query";
import { HardDrive, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGHS } from "@/lib/currency";
import { platformRequest } from "@/lib/platformApi";

interface Summary {
  applies: boolean;
  usedBytes: number;
  trashBytes: number;
  limitBytes: number;
  includedMb: number;
  extraBlocks: number;
  blockMb: number;
  blockPrice: number;
  extraPerMonth: number;
}

const bytes = (n: number) => (n < 1024 ** 2 ? `${Math.round(n / 1024)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`);

/** What one studio has stored against its plan, for the super admin. */
export const StudioStorageCard = ({ studioId }: { studioId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["platform", "studio", studioId, "storage"],
    queryFn: async () => (await platformRequest<{ data: Summary }>(`/studios/${studioId}/storage`)).data,
  });
  if (isLoading)
    return <div className="mb-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!data?.applies) return null;
  const pct = Math.min(100, (data.usedBytes / data.limitBytes) * 100);
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><HardDrive className="h-4 w-4" /> Storage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="font-medium tabular-nums">{bytes(data.usedBytes)} of {bytes(data.limitBytes)}</span>
          <span className="text-muted-foreground">{pct.toFixed(0)}% used</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
          <div className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-muted-foreground">
          Plan includes {data.includedMb >= 1024 ? `${data.includedMb / 1024} GB` : `${data.includedMb} MB`}
          {data.extraBlocks > 0 && `, plus ${data.extraBlocks} × ${data.blockMb} MB extra (${formatGHS(data.extraPerMonth)} a month)`}
          {data.trashBytes > 0 && `. ${bytes(data.trashBytes)} of it is in the trash.`}
        </p>
      </CardContent>
    </Card>
  );
};
