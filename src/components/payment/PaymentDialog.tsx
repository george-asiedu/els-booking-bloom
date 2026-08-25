import { useEffect, useRef, useState } from "react";
import PaystackPop from "@paystack/inline-js";
import { Loader2, Smartphone, CreditCard, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentsApi, PaymentTarget } from "@/lib/api";

// Paystack Ghana mobile-money provider codes.
const MOMO_PROVIDERS = [
  { code: "mtn", label: "MTN Mobile Money" },
  { code: "vod", label: "Telecel Cash (Vodafone)" },
  { code: "atl", label: "AirtelTigo Money" },
];

type Step = "choose" | "prompt" | "otp" | "awaiting" | "success" | "failed";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: PaymentTarget | null;
  onSuccess: (reference: string) => void;
  // Booking gets the pure mobile-money phone prompt; when omitted (orders) the
  // dialog offers only the inline popup (which still includes MoMo as a channel).
  momoCharge?: (
    phone: string,
    provider: string,
  ) => Promise<{ reference: string; status: string; displayText: string | null }>;
  title?: string;
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  target,
  onSuccess,
  momoCharge,
  title = "Complete payment",
}: PaymentDialogProps) => {
  const [step, setStep] = useState<Step>("choose");
  const [provider, setProvider] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Reset when opened/closed.
  useEffect(() => {
    if (open) {
      setStep("choose");
      setPhone("");
      setOtp("");
      setNote(null);
      setError(null);
      setBusy(false);
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [open]);

  const succeed = (reference: string) => {
    stopPolling();
    setStep("success");
    // Brief success state, then hand back to the caller.
    setTimeout(() => {
      onOpenChange(false);
      onSuccess(reference);
    }, 900);
  };

  const startPolling = (reference: string) => {
    stopPolling();
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 4;
      try {
        const status = await paymentsApi.status(reference);
        if (status === "success") return succeed(reference);
        if (status === "failed") {
          stopPolling();
          setStep("failed");
          setError("The payment was not completed.");
        }
      } catch {
        /* keep polling */
      }
      if (elapsed >= 120) {
        stopPolling();
        setNote(
          "Still waiting for confirmation. If you approved the prompt, it may take a moment — you can close this and check your bookings shortly.",
        );
      }
    }, 4000);
  };

  // ---- Inline popup (card + all channels, stays in-app) ----
  const payWithPopup = () => {
    if (!target) return;
    setError(null);
    try {
      const popup = new PaystackPop();
      const handlers = {
        onSuccess: (tx: { reference?: string }) =>
          succeed(tx?.reference || target.reference),
        onCancel: () => setError("Payment window closed before completing."),
        onError: (err: { message?: string }) =>
          setError(err?.message || "Payment failed. Please try again."),
      };
      if (target.access_code) {
        popup.resumeTransaction(target.access_code, handlers);
      } else {
        popup.newTransaction({
          key: target.public_key,
          email: target.email,
          amount: Math.round(target.amount * 100),
          currency: "GHS",
          reference: target.reference,
          ...(target.subaccount ? { subaccount: target.subaccount } : {}),
          ...handlers,
        });
      }
    } catch {
      setError("Could not open the payment window.");
    }
  };

  // ---- Mobile-money phone prompt ----
  const startMomo = async () => {
    if (!momoCharge) return;
    if (!/^\d{9,15}$/.test(phone.trim())) {
      setError("Enter a valid mobile-money number.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await momoCharge(phone.trim(), provider);
      setNote(res.displayText);
      const s = res.status;
      if (s === "success") return succeed(res.reference);
      if (s === "failed") {
        setStep("failed");
        setError("The charge could not be started.");
      } else if (s === "send_otp") {
        setStep("otp");
      } else {
        // pay_offline | pending | ongoing → user approves on their phone
        setStep("awaiting");
        startPolling(res.reference);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the charge.");
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const res = await paymentsApi.submitOtp(target.reference, otp.trim());
      setNote(res.displayText);
      setStep("awaiting");
      startPolling(res.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP.");
    } finally {
      setBusy(false);
    }
  };

  const amountLabel = target ? `GHS ${target.amount}` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {step === "success"
              ? "Payment received."
              : `Amount due: ${amountLabel}`}
          </DialogDescription>
        </DialogHeader>

        {step === "success" ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <p className="font-medium">Payment successful</p>
          </div>
        ) : step === "awaiting" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium">Approve the prompt on your phone</p>
            <p className="text-sm text-muted-foreground">
              {note ||
                "We sent a payment request to your phone. Enter your Mobile Money PIN to approve it."}
            </p>
          </div>
        ) : step === "otp" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {note || "Enter the OTP sent to your phone to authorise the payment."}
            </p>
            <div className="space-y-2">
              <Label htmlFor="momo-otp">OTP</Label>
              <Input
                id="momo-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                placeholder="123456"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={submitOtp} disabled={busy || !otp}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit OTP
            </Button>
          </div>
        ) : momoCharge ? (
          <Tabs defaultValue="momo">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="momo">
                <Smartphone className="mr-2 h-4 w-4" />
                Mobile money
              </TabsTrigger>
              <TabsTrigger value="card">
                <CreditCard className="mr-2 h-4 w-4" />
                Card / other
              </TabsTrigger>
            </TabsList>

            <TabsContent value="momo" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOMO_PROVIDERS.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="momo-phone">Mobile money number</Label>
                <Input
                  id="momo-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="numeric"
                  placeholder="0244123456"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={startMomo} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send prompt to my phone
              </Button>
              <p className="text-xs text-muted-foreground">
                You'll get a prompt on your phone to approve {amountLabel}. Keep
                this window open.
              </p>
            </TabsContent>

            <TabsContent value="card" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Pay securely with a card or any supported method in a popup —
                without leaving this page.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={payWithPopup}>
                Pay {amountLabel}
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Pay securely in a popup — card, mobile money and more — without
              leaving this page.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={payWithPopup}>
              Pay {amountLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
