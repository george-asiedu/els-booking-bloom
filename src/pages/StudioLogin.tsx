import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLATFORM } from "@/config/platform";
import { checkStudio, studioStore } from "@/lib/apiClient";

// Studios live at <slug>.<rootDomain> in production. Locally there are no
// subdomains (and "localhost" may be the configured root), so the studio is
// picked in this browser instead.
const LOCAL_HOST = /^(localhost|127\.|\d{1,3}(\.\d{1,3}){3}$)|\.local$/;
const usesSubdomains = () =>
  Boolean(PLATFORM.rootDomain) && !LOCAL_HOST.test(window.location.hostname);

// Remembered per browser so a returning admin only has to press Continue.
const LAST_STUDIO_KEY = "zuri_last_studio";

const readLast = () => {
  try {
    return localStorage.getItem(LAST_STUDIO_KEY) ?? "";
  } catch {
    return "";
  }
};

/**
 * "elsbeauty", "elsbeauty.zuristudios.com" or a pasted link all give
 * "elsbeauty": what the admin knows is their web address, not a slug.
 */
const toSlug = (raw: string) => {
  let v = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (usesSubdomains() && v.endsWith(`.${PLATFORM.rootDomain}`)) {
    v = v.slice(0, -(PLATFORM.rootDomain.length + 1));
  }
  return v.split(".")[0];
};
const VALID_SLUG = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * The platform's "Studio login". Admin accounts belong to one studio (the same
 * email can exist in two), so we ask which studio first, then hand over to
 * that studio's own sign-in page.
 */
const StudioLogin = () => {
  const [address, setAddress] = useState(readLast);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = toSlug(address);
    if (!slug || !VALID_SLUG.test(slug)) {
      setError("Enter your studio's web address, like yourstudio.");
      return;
    }
    setChecking(true);
    setError(null);
    const result = await checkStudio(slug);
    if (result !== "ok") {
      setChecking(false);
      setError(
        result === "missing"
          ? `There's no studio at ${slug}${usesSubdomains() ? `.${PLATFORM.rootDomain}` : ""}. Check the address in your welcome email.`
          : result === "suspended"
            ? "This studio is currently suspended. Contact us to restore it."
            : "We couldn't reach the server. Check your connection and try again.",
      );
      return;
    }
    try {
      localStorage.setItem(LAST_STUDIO_KEY, slug);
    } catch {
      /* remembering is optional */
    }
    if (usesSubdomains()) {
      const port = window.location.port ? `:${window.location.port}` : "";
      window.location.href = `${window.location.protocol}//${slug}.${PLATFORM.rootDomain}${port}/admin/login`;
    } else {
      // Local dev has no subdomains: pick the studio here instead. A full
      // load so every query and the theme start fresh for that studio.
      studioStore.setSlug(slug);
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4">
            <BrandLogo />
          </Link>
          <CardTitle>Sign in to your studio</CardTitle>
          <CardDescription>Enter your studio's web address to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="studio-address">Studio web address</Label>
              <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <Input
                  id="studio-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setError(null);
                  }}
                  placeholder="yourstudio"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  aria-invalid={Boolean(error)}
                  aria-describedby="studio-address-help"
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {usesSubdomains() && (
                  <span className="shrink-0 pr-3 text-sm text-muted-foreground">
                    .{PLATFORM.rootDomain}
                  </span>
                )}
              </div>
              <p
                id="studio-address-help"
                role={error ? "alert" : undefined}
                className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
              >
                {error ?? "It's in the welcome email you got when you set up your studio."}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={checking}>
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </form>
          <div className="mt-6 space-y-1 border-t pt-4 text-center text-sm text-muted-foreground">
            <p>
              Can't find your address?{" "}
              <a href={`mailto:${PLATFORM.email}`} className="text-primary hover:underline">
                Email us
              </a>
            </p>
            <p>
              No studio yet?{" "}
              <Link to="/onboarding" className="text-primary hover:underline">
                Set one up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudioLogin;
