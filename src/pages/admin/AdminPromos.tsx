import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Megaphone, Trash2, Plus } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { promoApi, PromoBannerInput, PromoPlacement } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PLACEMENTS: { value: PromoPlacement; label: string }[] = [
  { value: "BOTH", label: "Shop & Booking" },
  { value: "SHOP", label: "Shop only" },
  { value: "BOOKING", label: "Booking only" },
];

const empty: PromoBannerInput = {
  message: "",
  linkUrl: "",
  bgColor: "",
  textColor: "",
  placement: "BOTH",
  active: true,
};

const AdminPromos = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<PromoBannerInput>(empty);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: () => promoApi.listAll(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
    queryClient.invalidateQueries({ queryKey: ["promo-banners"] });
  };
  const onError = (error: unknown) =>
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: error instanceof Error ? error.message : "Please try again.",
    });

  const createMutation = useMutation({
    mutationFn: () =>
      promoApi.create({
        ...form,
        linkUrl: form.linkUrl?.trim() || null,
        bgColor: form.bgColor?.trim() || null,
        textColor: form.textColor?.trim() || null,
      }),
    onSuccess: () => {
      setForm(empty);
      invalidate();
      toast({ title: "Promo added" });
    },
    onError,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      promoApi.update(id, { active }),
    onSuccess: invalidate,
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promoApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Promo removed" });
    },
    onError,
  });

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Megaphone className="h-6 w-6 text-primary" />
            Promotions
          </h1>
          <p className="text-muted-foreground">
            Scrolling banners to advertise offers on your shop and booking pages.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">New promotion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promo-message">Message</Label>
              <Input
                id="promo-message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                maxLength={140}
                placeholder="🎉 20% off all gel manicures this week!"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Show on</Label>
                <Select
                  value={form.placement}
                  onValueChange={(v) =>
                    setForm({ ...form, placement: v as PromoPlacement })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-link">Link (optional)</Label>
                <Input
                  id="promo-link"
                  value={form.linkUrl ?? ""}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="promo-bg">Background colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.bgColor || "#4F46E5"}
                    onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded border border-input bg-background p-1"
                    aria-label="Background colour"
                  />
                  <Input
                    id="promo-bg"
                    value={form.bgColor ?? ""}
                    onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                    placeholder="Brand colour"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-fg">Text colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.textColor || "#FFFFFF"}
                    onChange={(e) =>
                      setForm({ ...form, textColor: e.target.value })
                    }
                    className="h-10 w-12 cursor-pointer rounded border border-input bg-background p-1"
                    aria-label="Text colour"
                  />
                  <Input
                    id="promo-fg"
                    value={form.textColor ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, textColor: e.target.value })
                    }
                    placeholder="White"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || form.message.trim().length < 1}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add promotion
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Your promotions</h2>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : banners.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No promotions yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {banners.map((b) => (
                <Card key={b.id}>
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {b.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary">
                          {PLACEMENTS.find((p) => p.value === b.placement)?.label ??
                            b.placement}
                        </Badge>
                        {b.bgColor && (
                          <span
                            className="inline-block h-4 w-4 rounded-full border"
                            style={{ backgroundColor: b.bgColor }}
                            title={b.bgColor}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Switch
                        checked={b.active}
                        onCheckedChange={(active) =>
                          toggleMutation.mutate({ id: b.id, active })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(b.id)}
                        aria-label="Delete promo"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPromos;
