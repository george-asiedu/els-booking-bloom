import { useState } from "react";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generatePassword } from "@/lib/passwordGen";

/**
 * A standalone password generator for settings: make a strong password,
 * copy it, and use it wherever it is needed (a new account, a password
 * manager). Nothing is stored or sent anywhere.
 */
export const PasswordGeneratorCard = () => {
  const [length, setLength] = useState(16);
  const [password, setPassword] = useState(() => generatePassword(16));
  const [copied, setCopied] = useState(false);

  const make = (len = length) => {
    setPassword(generatePassword(len));
    setCopied(false);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: select and copy by hand */
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden /> Password generator
        </CardTitle>
        <CardDescription>
          Make a strong, random password. It is created on this device and is never saved or sent
          anywhere. To use it, copy it and set it as your password from My profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
          <code className="min-w-0 flex-1 break-all font-mono text-sm" aria-live="polite">{password}</code>
          <Button type="button" variant="outline" size="icon" onClick={() => make()} aria-label="Make another">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy password">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <label className="block text-sm">
          <span className="flex justify-between text-muted-foreground">
            <span>Length</span>
            <span className="tabular-nums">{length} characters</span>
          </span>
          <input
            type="range"
            min={10}
            max={32}
            value={length}
            onChange={(e) => {
              const n = Number(e.target.value);
              setLength(n);
              make(n);
            }}
            className="mt-2 w-full accent-primary"
          />
        </label>
      </CardContent>
    </Card>
  );
};
