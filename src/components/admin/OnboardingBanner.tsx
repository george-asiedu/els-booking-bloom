import { useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

const KEY = "els_onboarding_dismissed";

// A gentle nudge on the admin dashboard while setup is incomplete. Dismissible
// per browser; hidden once every step is done.
export const OnboardingBanner = () => {
  const { allDone, ready, doneCount, total } = useOnboardingStatus();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!ready || allDone || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-foreground">
            Finish setting up your studio
          </p>
          <p className="text-sm text-muted-foreground">
            {doneCount} of {total} steps done — complete setup to start taking
            bookings.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button asChild size="sm">
          <Link to="/admin/onboarding">Continue setup</Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
