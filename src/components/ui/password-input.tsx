import * as React from "react";
import { Check, Copy, Eye, EyeOff, Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { generatePassword } from "@/lib/passwordGen";

type Props = Omit<React.ComponentProps<"input">, "type"> & {
  // Show a "generate a strong password" button. onGenerate receives the new
  // password so the form can store it (and, e.g., fill a confirm field too).
  generate?: boolean;
  onGenerate?: (password: string) => void;
};

// A password field with a show/hide eye toggle, and optionally a generator.
// Forwards ref + all input props so it drops into react-hook-form via
// {...field} exactly like <Input>.
const PasswordInput = React.forwardRef<HTMLInputElement, Props>(
  ({ className, generate, onGenerate, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const [made, setMade] = React.useState("");

    const make = () => {
      const pw = generatePassword(16);
      setMade(pw);
      setShow(true); // so the person can see (and save) what was made
      setCopied(false);
      onGenerate?.(pw);
    };
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(made);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {
        /* clipboard unavailable: the password is visible to copy by hand */
      }
    };

    return (
      <div>
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            className={cn(generate ? "pr-24" : "pr-10", className)}
            ref={ref}
            {...props}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            {generate && (
              <button
                type="button"
                onClick={make}
                aria-label="Generate a strong password"
                title="Generate a strong password"
                className="flex h-full items-center px-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <Wand2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              tabIndex={-1}
              aria-label={show ? "Hide password" : "Show password"}
              className="flex h-full items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {generate && made && (
          <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Strong password made. Save it somewhere safe.</span>
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
