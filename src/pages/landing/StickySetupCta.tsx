import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Set up your studio" is what we want visitors to do, so on phones and
 * tablets it is pinned to the bottom of the screen and never scrolls away.
 * Hidden on desktop, where the navigation bar already has it.
 */
export const StickySetupCta = () => (
  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur lg:hidden">
    <div className="mx-auto flex max-w-xl items-center gap-3">
      <p className="hidden min-w-0 flex-1 text-sm leading-tight sm:block">
        <span className="font-semibold">Ready to start?</span>
        <span className="block text-muted-foreground">Set up in about 5 minutes.</span>
      </p>
      <Button size="lg" className="h-12 flex-1 rounded-full text-base sm:flex-none sm:px-8" asChild>
        <Link to="/onboarding">
          Set up your studio <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  </div>
);
