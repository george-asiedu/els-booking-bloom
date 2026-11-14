import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { API_URL, studioStore } from "@/lib/apiClient";

/** Downloads a CSV of this business's records (for an accountant or a spreadsheet). */
export const ExportButton = ({ kind, label = "Export CSV" }: { kind: "bookings" | "orders" | "transactions" | "expenses"; label?: string }) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const slug = studioStore.getSlug();
      const res = await fetch(`${API_URL}/exports/${kind}`, {
        credentials: "include",
        headers: { "X-Zuri-Client": "web", ...(slug ? { "X-Studio-Slug": slug } : {}) },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Couldn't export");
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? `${kind}.csv`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't export" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="outline" onClick={download} disabled={busy}>
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
};
