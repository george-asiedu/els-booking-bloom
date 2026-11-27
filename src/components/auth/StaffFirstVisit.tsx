import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PASSWORD_RULE_MESSAGE, isStrongPassword } from "@/lib/passwordPolicy";

/**
 * A team member's first visit. The owner already created their account, so
 * there is nothing to accept: they enter their email, we send a code to it, and
 * they choose their own password.
 */
export const StaffFirstVisit = ({ onBack, onSignedIn }: { onBack: () => void; onSignedIn: () => void }) => {
  const { startFirstVisit, finishFirstVisit } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setBusy(true);
    const res = await startFirstVisit(email.trim());
    setBusy(false);
    if (res.error) {
      toast({ variant: "destructive", title: "Couldn't send the code", description: res.error.message });
      return;
    }
    toast({ title: "Check your email", description: res.message });
    setStep("password");
  };

  const finish = async () => {
    if (!isStrongPassword(password)) {
      toast({ variant: "destructive", title: "Choose a stronger password", description: PASSWORD_RULE_MESSAGE });
      return;
    }
    if (password !== again) {
      toast({ variant: "destructive", title: "The two passwords don't match" });
      return;
    }
    setBusy(true);
    const res = await finishFirstVisit(email.trim(), code.trim(), password);
    setBusy(false);
    if (res.error) {
      toast({ variant: "destructive", title: "Couldn't set your password", description: res.error.message });
      return;
    }
    toast({ title: "You're in", description: "Your password is set." });
    onSignedIn();
  };

  return (
    <div className="space-y-4">
      {step === "email" ? (
        <>
          <p className="text-sm text-muted-foreground">
            Your studio has set up your account. Enter your email and we'll send you a code to confirm it's you, then you choose your password.
          </p>
          <div className="space-y-2">
            <Label htmlFor="fv-email">Your email</Label>
            <Input id="fv-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button className="w-full" disabled={busy || !email.includes("@")} onClick={sendCode}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send me a code
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It can take a minute.
          </p>
          <div className="space-y-2">
            <Label htmlFor="fv-code">Code</Label>
            <Input id="fv-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fv-pass">Choose your password</Label>
            <PasswordInput id="fv-pass" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fv-again">Type it again</Label>
            <PasswordInput id="fv-again" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
          </div>
          <Button className="w-full" disabled={busy || code.length !== 6 || !password} onClick={finish}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Set my password and sign in
          </Button>
          <button type="button" className="w-full text-center text-sm text-primary hover:underline" onClick={sendCode} disabled={busy}>
            Send a new code
          </button>
        </>
      )}
      <button type="button" className="w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
        Back to sign in
      </button>
    </div>
  );
};
