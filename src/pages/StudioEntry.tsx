import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { studioStore } from "@/lib/apiClient";

/**
 * Enter a studio's storefront by slug: `/s/<slug>`. Sets the active studio and
 * reloads into the homepage, or into `?next=<path>` (how emails link to, say,
 * a password reset when there are no subdomains), so everything (data +
 * branding) is scoped to it.
 * This is the path-based way to reach a studio without subdomain DNS; in
 * production, `<slug>.<root-domain>` resolves the same studio automatically.
 */
const StudioEntry = () => {
  const { slug } = useParams();
  const [params] = useSearchParams();
  // Only a path on this site: "/reset-password/…", never "//evil.com" (or
  // "/\evil.com", which browsers read the same way).
  const next = params.get("next");
  const target = next && /^\/(?![/\\])/.test(next) ? next : "/";

  useEffect(() => {
    if (slug) {
      studioStore.setSlug(slug.trim().toLowerCase());
    }
    // Full reload so all queries refetch under the new studio and the theme
    // re-applies cleanly.
    window.location.replace(target);
  }, [slug, target]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default StudioEntry;
