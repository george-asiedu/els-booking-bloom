import { useQuery } from "@tanstack/react-query";
import { Copy, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";
import { PLATFORM } from "@/config/platform";

/** Invite another business: both get their next month free when it joins. */
export const InviteBusinessCard = () => {
  const { toast } = useToast();
  const { data } = useQuery({
    queryKey: ["business-referrals"],
    queryFn: async () => (await apiRequest<{ data: { slug: string; joined: number } }>("/studio/referrals", { auth: true })).data,
  });
  if (!data?.slug) return null;
  const base = PLATFORM.rootDomain ? `https://${PLATFORM.rootDomain}` : window.location.origin;
  const link = `${base}/onboarding?ref=${data.slug}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Handshake className="h-5 w-5 text-primary" />
          Invite another business
        </CardTitle>
        <CardDescription>
          Know a salon, barber or shop that would like Zuri? When they sign up with your link, you both get your next month free.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm">{link}</code>
          <Button
            variant="outline"
            onClick={() =>
              navigator.clipboard.writeText(link).then(
                () => toast({ title: "Invite link copied" }),
                () => toast({ variant: "destructive", title: "Couldn't copy. Select the link and copy it instead." }),
              )
            }
          >
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.joined === 0 ? "No businesses have joined with your link yet." : `${data.joined} ${data.joined === 1 ? "business has" : "businesses have"} joined with your link.`}
        </p>
      </CardContent>
    </Card>
  );
};
