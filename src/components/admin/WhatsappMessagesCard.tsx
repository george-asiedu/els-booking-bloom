import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";

interface Messaging {
  whatsappAvailable: boolean;
  whatsappMessages: boolean;
}

/** Booking confirmations and reminders on WhatsApp, on top of email and push. */
export const WhatsappMessagesCard = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery({
    queryKey: ["studio-messaging"],
    queryFn: async () => (await apiRequest<{ data: Messaging }>("/studio/messaging", { auth: true })).data,
  });
  const save = useMutation({
    mutationFn: async (on: boolean) =>
      (await apiRequest<{ data: Messaging }>("/studio/messaging", { method: "PUT", auth: true, body: { whatsappMessages: on } })).data,
    onSuccess: (d) => {
      qc.setQueryData(["studio-messaging"], d);
      toast({ title: d.whatsappMessages ? "WhatsApp messages are on" : "WhatsApp messages are off" });
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't save" }),
  });
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-primary" />
          WhatsApp messages to customers
        </CardTitle>
        <CardDescription>
          Send booking confirmations, and reminders a day and an hour before, to customers on WhatsApp as well as by email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.whatsappAvailable ? (
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={data.whatsappMessages} disabled={save.isPending} onCheckedChange={(v) => save.mutate(v)} />
            {data.whatsappMessages ? "On: customers get WhatsApp messages" : "Off"}
          </label>
        ) : (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">WhatsApp messages aren't available yet. They'll appear here once they are.</p>
        )}
      </CardContent>
    </Card>
  );
};
