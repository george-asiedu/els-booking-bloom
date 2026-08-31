import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Globe, CheckCircle2, Copy } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { studioAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CopyField = ({ label, value }: { label: string; value: string }) => {
  const { toast } = useToast();
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded border border-border bg-muted px-2 py-1.5 text-xs">
          {value}
        </code>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast({ title: "Copied" });
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const AdminDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [domain, setDomain] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["studio-domain"],
    queryFn: () => studioAdminApi.getDomain(),
  });
  useEffect(() => {
    if (data?.domain) setDomain(data.domain);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => studioAdminApi.setDomain(domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-domain"] });
      toast({ title: "Domain saved", description: "Now add the DNS record and verify." });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Couldn't save", description: e.message }),
  });

  const verifyMutation = useMutation({
    mutationFn: () => studioAdminApi.verifyDomain(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["studio-domain"] });
      if (res.verified) toast({ title: "Domain verified 🎉" });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Not verified yet", description: e.message }),
  });

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Globe className="h-6 w-6 text-primary" />
            Custom domain
          </h1>
          <p className="text-muted-foreground">
            Use your own web address (e.g. book.mystudio.com) for your studio.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your domain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="book.mystudio.com"
                      className="font-mono"
                    />
                    {data?.verified && data.domain === domain && (
                      <Badge className="shrink-0" variant="default">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !domain.trim()}
                >
                  {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save domain
                </Button>
              </CardContent>
            </Card>

            {data?.txt && !data.verified && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Verify ownership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add this <span className="font-medium">TXT</span> record at your
                    DNS provider, then click Verify. DNS can take a few minutes.
                  </p>
                  <CopyField label="Type" value="TXT" />
                  <CopyField label="Name / Host" value={data.txt.name} />
                  <CopyField label="Value" value={data.txt.value} />
                  <p className="text-sm text-muted-foreground">
                    Then point your domain to us with a CNAME to your Cloudflare
                    Pages URL (your host will guide you).
                  </p>
                  <Button
                    onClick={() => verifyMutation.mutate()}
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify domain
                  </Button>
                </CardContent>
              </Card>
            )}

            {data?.verified && (
              <Card className="border-green-500/40 bg-green-500/5">
                <CardContent className="flex items-center gap-3 py-5">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold">Your domain is live</p>
                    <p className="text-sm text-muted-foreground">
                      Visitors to {data.domain} now see your studio.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDomain;
