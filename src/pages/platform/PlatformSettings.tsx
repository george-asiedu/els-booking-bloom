import { useEffect, useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { platformApi, type PlatformSiteSettings } from "@/lib/platformApi";
import { PlatformLayout } from "./PlatformLayout";
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
      </div>
    </PlatformLayout>
  );
};

export default PlatformSettings;
