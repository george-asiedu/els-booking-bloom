import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone, MessageCircle, Mail, Instagram, Music2, MapPin } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { contactInfoApi, ContactInfoDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type FieldKey = "phone" | "whatsapp" | "email" | "instagram" | "tiktok" | "address";
type ShowKey =
  | "showPhone"
  | "showWhatsapp"
  | "showEmail"
  | "showInstagram"
  | "showTiktok"
  | "showAddress";

const fields: {
  key: FieldKey;
  showKey: ShowKey;
  label: string;
  placeholder: string;
  icon: typeof Phone;
  hint?: string;
}[] = [
  { key: "phone", showKey: "showPhone", label: "Phone (Call)", placeholder: "+233 20 123 4567", icon: Phone },
  { key: "whatsapp", showKey: "showWhatsapp", label: "WhatsApp", placeholder: "+233 20 123 4567", icon: MessageCircle, hint: "Number customers will message on WhatsApp" },
  { key: "email", showKey: "showEmail", label: "Email", placeholder: "hello@elsbeauty.com", icon: Mail },
  { key: "instagram", showKey: "showInstagram", label: "Instagram", placeholder: "@elsbeautystudio or full URL", icon: Instagram },
  { key: "tiktok", showKey: "showTiktok", label: "TikTok", placeholder: "@elsbeautystudio or full URL", icon: Music2 },
  { key: "address", showKey: "showAddress", label: "Address / Location", placeholder: "123 Beauty Lane, Accra", icon: MapPin },
];

const AdminContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<ContactInfoDTO | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact-info"],
    queryFn: () => contactInfoApi.get(),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<ContactInfoDTO>) =>
      contactInfoApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-info"] });
      queryClient.invalidateQueries({ queryKey: ["contact-info"] });
      toast({
        title: "Contact info saved",
        description: "The public contact page has been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const setField = (key: keyof ContactInfoDTO, value: string | boolean) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form) mutation.mutate(form);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Information</h1>
          <p className="text-muted-foreground">
            Manage the details shown on your public contact page. Toggle each item
            to control whether it appears.
          </p>
        </div>

        {isLoading || !form ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, showKey, label, placeholder, icon: Icon, hint }) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`show-${key}`} className="text-xs text-muted-foreground">
                        Show
                      </Label>
                      <Switch
                        id={`show-${key}`}
                        checked={form[showKey]}
                        onCheckedChange={(checked) => setField(showKey, checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input
                    value={(form[key] as string) ?? ""}
                    onChange={(e) => setField(key, e.target.value)}
                    placeholder={placeholder}
                  />
                  {hint && (
                    <p className="text-xs text-muted-foreground mt-2">{hint}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContact;
