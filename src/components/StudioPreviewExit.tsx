import { ArrowLeft } from "lucide-react";
import { studioStore } from "@/lib/apiClient";
import { PLATFORM } from "@/config/platform";

/**
 * A floating "exit" control shown only when a studio is being previewed locally
 * (a stored slug, not a real subdomain) — e.g. after "See a live studio" or a
 * super-admin impersonation. Clears the studio and returns to the Zuri landing.
 * On a real studio subdomain this never renders.
 */
export const StudioPreviewExit = () => {
  if (!studioStore.isLocalOverride()) return null;

  const exit = () => {
    studioStore.clear();
    // Full navigation so the app re-evaluates the root route and refetches
    // config in the neutral (platform) state.
    window.location.href = "/welcome";
  };

  return (
    <button
      onClick={exit}
      className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur transition-colors hover:bg-accent"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to {PLATFORM.name}
    </button>
  );
};
