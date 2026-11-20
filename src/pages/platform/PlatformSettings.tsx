import { useEffect, useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Settings } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { apiRequest } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { platformApi, type PlatformSiteSettings } from "@/lib/platformApi";
import { PlatformLayout } from "./PlatformLayout";
import { NotificationsCard } from "@/components/security/NotificationsCard";
import { TwoFactorCard } from "@/components/security/TwoFactorCard";
import { SITE_DEFAULTS } from "@/config/platform";

// Shown as placeholders: what a blank field means.
const DEFAULTS: Record<keyof PlatformSiteSettings, string> = {
  siteName: SITE_DEFAULTS.name,
  siteHeroBadge: SITE_DEFAULTS.heroBadge,
  supportEmail: SITE_DEFAULTS.email,
  supportWhatsapp: SITE_DEFAULTS.whatsapp,
  demoStudioSlug: SITE_DEFAULTS.demoSlug,
};

const FIELDS: {
  key: keyof PlatformSiteSettings;
  label: string;
  hint: string;
  type?: string;
  inputMode?: "numeric" | "email";
}[] = [
  { key: "siteName", label: "Platform name", hint: "Shown in the browser tab, footers and legal pages." },
  {
    key: "siteHeroBadge",
    label: "Line above the main headline",
    hint: "Who the platform is for, in a few words.",
  },
  {
    key: "supportEmail",
    label: "Support email",
    hint: "Shown on the platform page and in the terms and privacy pages.",
    type: "email",
    inputMode: "email",
  },
  {
    key: "supportWhatsapp",
    label: "Support WhatsApp number",
    hint: "With the country code and no leading 0, e.g. 233201234567. Leave empty to use email instead.",
    inputMode: "numeric",
  },
  {
    key: "demoStudioSlug",
    label: "Demo studio",
    hint: "The studio address opened by \"See a real studio's page\", e.g. els for els.zuristudios.com.",
  },
];

interface GuestKeyStatus {
  endsWith: string;
  rotatedAt: string | null;
  previousValidUntil: string | null;
}

/** The key the web app sends for guest bookings, payments and orders. */
const GuestKeyCard = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["platform-guest-key"],
    queryFn: async () => (await apiRequest<{ data: GuestKeyStatus }>("/platform/guest-key/status", { auth: true })).data,
  });
  const rotate = useMutation({
    mutationFn: () => apiRequest<{ message: string }>("/platform/guest-key/rotate", { method: "POST", auth: true }),
    onSuccess: (r) => {
      toast({ title: "Guest key rotated", description: r.message });
      qc.invalidateQueries({ queryKey: ["platform-guest-key"] });
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't rotate the key" }),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" /> Guest access key
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Customers without an account need this key to book, pay or buy. The app picks up the new one by itself when you rotate it, and the old key keeps working for 24 hours so pages that are already open don't break. Rotate it if you think it has leaked or is being misused.
        </p>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : data ? (
          <dl className="grid gap-1">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Current key</dt><dd className="font-mono">gk_••••{data.endsWith}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Last changed</dt><dd>{data.rotatedAt ? format(new Date(data.rotatedAt), "d MMM yyyy, h:mm a") : "Never"}</dd></div>
            {data.previousValidUntil && (
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Previous key stops working</dt><dd>{format(new Date(data.previousValidUntil), "d MMM, h:mm a")}</dd></div>
            )}
          </dl>
        ) : null}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={rotate.isPending}>
              {rotate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rotate key
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rotate the guest key?</AlertDialogTitle>
              <AlertDialogDescription>
                A new key is made now. The app uses it automatically. The current key stops working after 24 hours.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => rotate.mutate()}>Rotate key</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

const PlatformSettings = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const baseId = useId();

  const { data, isLoading } = useQuery({
    queryKey: ["platform-site-settings"],
    queryFn: () => platformApi.getSiteSettings(),
  });
  const [form, setForm] = useState<PlatformSiteSettings | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => platformApi.updateSiteSettings(form!),
    onSuccess: (saved) => {
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["platform-site-settings"] });
      toast({
        title: "Settings saved",
        description: "Visitors see the new details on their next page load.",
      });
    },
    onError: (e) =>
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: e instanceof Error ? e.message : "Please try again.",
      }),
  });

  return (
    <PlatformLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Settings className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Details shown on the platform's own pages. Leave a box empty to use the value shown
            in grey. Plan prices and fees are under Billing.
          </p>
        </div>

        {isLoading || !form ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {FIELDS.map((f) => {
                const id = `${baseId}-${f.key}`;
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={id}>{f.label}</Label>
                    <Input
                      id={id}
                      type={f.type ?? "text"}
                      inputMode={f.inputMode}
                      value={form[f.key] ?? ""}
                      placeholder={DEFAULTS[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">{f.hint}</p>
                  </div>
                );
              })}
              <div className="flex justify-end pt-2">
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <GuestKeyCard />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your sign-in and alerts</h2>
          <TwoFactorCard client="platform" />
          <NotificationsCard
            client="platform"
            description="New feature requests from studios, on this device."
          />
        </div>
      </div>
    </PlatformLayout>
  );
};

export default PlatformSettings;
