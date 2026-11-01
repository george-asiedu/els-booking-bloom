import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

/** Optional: customers can confirm their email whenever they like. */
export const VerifyEmailCard = ({ email }: { email: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: verified = true } = useQuery({
    queryKey: ["email-status"],
    queryFn: () => authApi.emailStatus(),
  });
  if (verified) return null;

  const attempt = async (fn: () => Promise<void>, title: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast({
        variant: "destructive",
        title,
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };
  const send = () =>
    attempt(async () => {
      await authApi.sendEmailCode();
      setSent(true);
      setCode("");
    }, "We couldn't send the code");
  const confirm = () =>
    attempt(async () => {
      await authApi.confirmEmailCode(code);
      queryClient.setQueryData(["email-status"], true);
      toast({ title: "Email confirmed" });
    }, "Code not accepted");

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium">Confirm your email</p>
            <p className="break-words text-sm text-muted-foreground">
              {sent ? `Enter the 6-digit code we sent to ${email}.` : `Help keep your account safe by confirming ${email}.`}
            </p>
          </div>
        </div>
        {sent ? (
          <div className="flex shrink-0 gap-2">
            <Input
              aria-label="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-28 font-mono"
            />
            <Button disabled={busy || code.length !== 6} onClick={confirm}>
              Confirm
            </Button>
            <Button variant="ghost" disabled={busy} onClick={send}>
              Resend
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="shrink-0" disabled={busy} onClick={send}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send code
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
