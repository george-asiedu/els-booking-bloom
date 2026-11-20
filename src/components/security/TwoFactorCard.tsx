import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel } from "@/components/dashboard/KpiTile";
import { useToast } from "@/hooks/use-toast";
import { securityRequest, type SecurityClient, type TwoFactorSetup, type TwoFactorStatus } from "./securityApi";

const sixDigits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

/** Shows the recovery codes once, with copy and download. */
const RecoveryCodes = ({ codes, label }: { codes: string[]; label: string }) => {
  const { toast } = useToast();
  const text = codes.join("\n");
  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/50 p-4 font-mono text-sm tabular-nums">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            navigator.clipboard.writeText(text).then(
              () => toast({ title: "Recovery codes copied" }),
              () => toast({ variant: "destructive", title: "Couldn't copy. Write them down instead." }),
            )
          }
        >
          <Copy className="mr-2 h-4 w-4" /> Copy
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([`${label} recovery codes\nEach code works once.\n\n${text}\n`], { type: "text/plain" }));
            a.download = "recovery-codes.txt";
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>
    </div>
  );
};

/**
 * Two-step sign-in with an authenticator app (Google Authenticator, Microsoft
 * Authenticator, 1Password…): set up by scanning a QR code, recovery codes
 * shown once, and turning it off needs the password and a code.
 */
export const TwoFactorCard = ({ client, label = "Zuri" }: { client: SecurityClient; label?: string }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const key = ["two-factor", client];
  const status = useQuery({ queryKey: key, queryFn: () => securityRequest<TwoFactorStatus>(client, "/auth/2fa") });

  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [dialog, setDialog] = useState<null | "setup" | "disable" | "regenerate">(null);

  const close = () => {
    // Refreshed only now, so a dashboard gate doesn't swap this card out
    // while the recovery codes are still on screen.
    if (codes) void qc.invalidateQueries({ queryKey: key });
    setDialog(null);
    setSetup(null);
    setCodes(null);
    setCode("");
    setPassword("");
  };
  const fail = (e: unknown) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Something went wrong" });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const start = useMutation({
    mutationFn: () => securityRequest<TwoFactorSetup>(client, "/auth/2fa/setup", "POST"),
    onSuccess: (s) => {
      setSetup(s);
      setDialog("setup");
    },
    onError: fail,
  });
  const enable = useMutation({
    mutationFn: () => securityRequest<{ recoveryCodes: string[] }>(client, "/auth/2fa/enable", "POST", { code }),
    onSuccess: (r) => {
      setCodes(r.recoveryCodes);
      setCode("");
      toast({ title: "Two-step sign-in is on" });
    },
    onError: fail,
  });
  const regenerate = useMutation({
    mutationFn: () => securityRequest<{ recoveryCodes: string[] }>(client, "/auth/2fa/recovery-codes", "POST", { code }),
    onSuccess: (r) => {
      setCodes(r.recoveryCodes);
      setCode("");
      refresh();
    },
    onError: fail,
  });
  const disable = useMutation({
    mutationFn: () => securityRequest(client, "/auth/2fa/disable", "POST", { password, code }),
    onSuccess: () => {
      close();
      refresh();
      toast({ title: "Two-step sign-in is off" });
    },
    onError: fail,
  });

  const s = status.data;
  return (
    <Panel>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-foreground">Two-step sign-in</h2>
            {s?.enabled && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">On</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            After your password, sign-in asks for a code from an authenticator app on your phone, so a stolen password isn't enough.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {status.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : s?.enabled ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {s.recoveryCodesLeft} of 10 recovery codes left.
              {s.recoveryCodesLeft <= 3 && " Make new ones soon."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setDialog("regenerate")}>
                <KeyRound className="mr-2 h-4 w-4" /> New recovery codes
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDialog("disable")}>
                <ShieldOff className="mr-2 h-4 w-4" /> Turn off
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set up two-step sign-in
          </Button>
        )}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md">
          {codes ? (
            <>
              <DialogHeader>
                <DialogTitle>Save your recovery codes</DialogTitle>
                <DialogDescription>
                  If you lose your phone, each code signs you in once. Keep them somewhere safe; they won't be shown again.
                </DialogDescription>
              </DialogHeader>
              <RecoveryCodes codes={codes} label={label} />
              <DialogFooter>
                <Button onClick={close}>I've saved them</Button>
              </DialogFooter>
            </>
          ) : dialog === "setup" && setup ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enable.mutate();
              }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Set up two-step sign-in</DialogTitle>
                <DialogDescription>
                  Scan this with an authenticator app such as Google Authenticator, Microsoft Authenticator or 1Password, then enter the code it shows.
                </DialogDescription>
              </DialogHeader>
              <img src={setup.qrDataUrl} alt="QR code for your authenticator app" className="mx-auto h-48 w-48 rounded-lg bg-white p-2" />
              <div className="text-center text-xs text-muted-foreground">
                Can't scan? Enter this key in the app:
                <p className="mt-1 break-all font-mono text-sm text-foreground">{setup.secret.match(/.{1,4}/g)?.join(" ")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-code">Code from the app</Label>
                <Input
                  id="setup-code"
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(sixDigits(e.target.value))}
                  className="text-center text-lg tracking-[0.3em] tabular-nums"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={code.length !== 6 || enable.isPending}>
                  {enable.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Turn on
                </Button>
              </DialogFooter>
            </form>
          ) : dialog === "regenerate" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                regenerate.mutate();
              }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>New recovery codes</DialogTitle>
                <DialogDescription>Your old codes stop working. Enter a code from your authenticator app to continue.</DialogDescription>
              </DialogHeader>
              <Input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(sixDigits(e.target.value))}
                className="text-center text-lg tracking-[0.3em] tabular-nums"
              />
              <DialogFooter>
                <Button type="submit" disabled={code.length !== 6 || regenerate.isPending}>
                  {regenerate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Make new codes
                </Button>
              </DialogFooter>
            </form>
          ) : dialog === "disable" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                disable.mutate();
              }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Turn off two-step sign-in</DialogTitle>
                <DialogDescription>Sign-in will only ask for your password. Confirm with your password and a code from the app (or a recovery code).</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="disable-password">Password</Label>
                <PasswordInput id="disable-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disable-code">Code</Label>
                <Input id="disable-code" value={code} onChange={(e) => setCode(e.target.value.slice(0, 11))} autoComplete="one-time-code" placeholder="123456" />
              </div>
              <DialogFooter>
                <Button type="submit" variant="destructive" disabled={!password || code.length < 6 || disable.isPending}>
                  {disable.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Turn off
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </Panel>
  );
};
