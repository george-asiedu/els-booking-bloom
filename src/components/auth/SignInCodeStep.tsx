import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The second step of signing in when the account has two-step sign-in on:
 * the 6-digit code from the authenticator app, or one of the recovery codes.
 */
export const SignInCodeStep = ({
  loading,
  onSubmit,
  onBack,
}: {
  loading: boolean;
  onSubmit: (code: string) => void;
  onBack: () => void;
}) => {
  const [recovery, setRecovery] = useState(false);
  const [code, setCode] = useState("");
  const ready = recovery ? code.replace(/[^a-z0-9]/gi, "").length === 10 : /^\d{6}$/.test(code);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit(code.trim());
      }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium text-foreground">Two-step sign-in</p>
          <p className="text-sm text-muted-foreground">
            {recovery
              ? "Enter one of the recovery codes you saved. Each one works once."
              : "Open your authenticator app and enter the 6-digit code for this account."}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-code">{recovery ? "Recovery code" : "Code"}</Label>
        <Input
          id="signin-code"
          autoFocus
          autoComplete="one-time-code"
          inputMode={recovery ? "text" : "numeric"}
          placeholder={recovery ? "abcde-12345" : "123456"}
          maxLength={recovery ? 11 : 6}
          value={code}
          onChange={(e) => setCode(recovery ? e.target.value : e.target.value.replace(/\D/g, ""))}
          className="text-center text-lg tracking-[0.3em] tabular-nums"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading || !ready}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify and sign in
      </Button>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            setRecovery(!recovery);
            setCode("");
          }}
          className="text-primary hover:underline"
        >
          {recovery ? "Use the app code" : "Use a recovery code"}
        </button>
      </div>
    </form>
  );
};
