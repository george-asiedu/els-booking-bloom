import { useEffect, useRef, useState } from "react";
import { WebsiteDesignPicker } from "@/components/admin/WebsiteDesignPicker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Eye, Loader2, Upload, Trash2, Palette } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studioAdminApi, StudioBrandingDTO, StudioContentDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useStudio } from "@/hooks/useStudio";
import { LandingContentEditor } from "./appearance/LandingContentEditor";
import { LivePreview } from "./appearance/LivePreview";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const FONT_OPTIONS = [
  { label: "Default", value: "__default__" },
  { label: "Inter", value: "Inter" },
  { label: "Lora (serif)", value: "Lora" },
  { label: "Space Mono", value: "Space Mono" },
];


// A color field: native swatch + hex text kept in sync.
const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) => {
  const hex = value && /^#([0-9a-fA-F]{6})$/.test(value) ? value : "#000000";
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-input bg-background p-1"
          aria-label={`${label} swatch`}
        />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="#4F46E5"
          className="max-w-[160px] font-mono"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

const AdminAppearance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { name: studioName, features } = useStudio();
  // ?tab=content opens straight onto the landing-page editor.
  const [searchParams] = useSearchParams();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ---- Branding ----
  const { data: branding, isLoading: brandingLoading } = useQuery({
    queryKey: ["admin-branding"],
    queryFn: () => studioAdminApi.getBranding(),
  });
  const [brandForm, setBrandForm] = useState<StudioBrandingDTO | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  useEffect(() => {
    if (branding) setBrandForm(branding);
  }, [branding]);

  const refreshTheme = () => {
    // The storefront theme is driven by this query — refetch so changes apply
    // live everywhere (including this admin shell's own colors).
    queryClient.invalidateQueries({ queryKey: ["studio-config"] });
  };

  const brandingMutation = useMutation({
    mutationFn: () =>
      studioAdminApi.updateBranding({
        primaryColor: brandForm?.primaryColor ?? null,
        // Only one brand colour now; clear any old accent.
        accentColor: null,
        fontFamily: brandForm?.fontFamily ?? null,
        logo: logoFile,
        removeLogo: !logoFile && brandForm?.logoUrl === null,
      }),
    onSuccess: (data) => {
      setBrandForm(data);
      setLogoFile(null);
      setLogoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["admin-branding"] });
      refreshTheme();
      toast({ title: "Branding saved", description: "Your storefront was updated." });
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  const onLogoPicked = (file: File | null) => {
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  // ---- Content ----
  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: () => studioAdminApi.getContent(),
  });
  const [contentForm, setContentForm] = useState<StudioContentDTO | null>(null);
  useEffect(() => {
    if (content) setContentForm(content);
  }, [content]);

  const contentMutation = useMutation({
    mutationFn: () =>
      studioAdminApi.updateContent({
        ...contentForm!,
        // Untitled highlight rows are ones the owner started and abandoned.
        featureCards: (contentForm?.featureCards ?? []).filter((c) => c.title.trim()),
      }),
    onSuccess: (data) => {
      setContentForm(data);
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      refreshTheme();
      toast({ title: "Content saved", description: "Your landing page was updated." });
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  const currentLogo = logoPreview ?? brandForm?.logoUrl ?? null;

  return (
    <AdminLayout>
      {/* Branding is a narrow form; the landing page tab has the form and the live preview side by side. */}
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Palette className="h-6 w-6 text-primary" />
            Appearance
          </h1>
          <p className="text-muted-foreground">
            Brand your studio and customise your landing page. Changes go live on
            your public site as soon as you save.
          </p>
        </div>

        <Tabs defaultValue={searchParams.get("tab") === "content" ? "content" : "branding"}>
          <TabsList>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="content">Landing page</TabsTrigger>
          </TabsList>

          {/* ---- Branding ---- */}
          <TabsContent value="branding" className="mt-4 max-w-3xl">
            {brandingLoading || !brandForm ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Brand</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo */}
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded border bg-muted">
                        {currentLogo ? (
                          <img
                            src={currentLogo}
                            alt="Logo preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            onLogoPicked(e.target.files?.[0] ?? null)
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                        {currentLogo && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onLogoPicked(null);
                              setBrandForm((p) =>
                                p ? { ...p, logoUrl: null } : p,
                              );
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Square image works best. Max 4 MB.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <ColorField
                      label="Brand colour"
                      value={brandForm.primaryColor}
                      onChange={(v) =>
                        setBrandForm((p) => (p ? { ...p, primaryColor: v } : p))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      One colour for your buttons, links and highlights, on light and dark
                      backgrounds. Leave it empty to use Zuri yellow.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Font</Label>
                    <Select
                      value={brandForm.fontFamily || "__default__"}
                      onValueChange={(v) =>
                        setBrandForm((p) =>
                          p
                            ? {
                                ...p,
                                fontFamily: v === "__default__" ? null : v,
                              }
                            : p,
                        )
                      }
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => brandingMutation.mutate()}
                      disabled={brandingMutation.isPending}
                    >
                      {brandingMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save branding
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---- Content ---- */}
          <TabsContent value="content" className="mt-4">
            {contentLoading || !contentForm ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
                <div className="min-w-0 space-y-6">
                  {/* On smaller screens the preview opens in a window; on wide ones it sits beside the form. */}
                  <div className="xl:hidden">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full">
                          <Eye className="mr-2 h-4 w-4" /> Preview your site
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Preview</DialogTitle>
                          <DialogDescription>How your site looks with what you have typed so far.</DialogDescription>
                        </DialogHeader>
                        <LivePreview value={contentForm} />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <WebsiteDesignPicker value={contentForm} onChange={setContentForm} shop={features.booking === false} />
                  <LandingContentEditor
                    value={contentForm}
                    onChange={setContentForm}
                    studioName={studioName}
                    onSave={() => contentMutation.mutate()}
                    saving={contentMutation.isPending}
                  />
                </div>
                <div className="hidden xl:sticky xl:top-2 xl:block">
                  <Card>
                    <CardContent className="pt-6">
                      <LivePreview value={contentForm} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAppearance;
