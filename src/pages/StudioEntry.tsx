import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { studioStore } from "@/lib/apiClient";

/**
 * Enter a studio's storefront by slug: `/s/<slug>`. Sets the active studio and
 * reloads into the homepage so everything (data + branding) is scoped to it.
 * This is the path-based way to reach a studio without subdomain DNS; in
 * production, `<slug>.<root-domain>` resolves the same studio automatically.
 */
const StudioEntry = () => {
  const { slug } = useParams();

  useEffect(() => {
    if (slug) {
      studioStore.setSlug(slug.trim().toLowerCase());
    }
    // Full reload so all queries refetch under the new studio and the theme
    // re-applies cleanly.
    window.location.replace("/");
  }, [slug]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default StudioEntry;
