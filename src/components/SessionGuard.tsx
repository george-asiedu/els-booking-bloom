import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setUnauthorizedHandler } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/**
 * Bridges the API client's 401 signal to the router. When an authenticated
 * request fails because the access token expired (and couldn't be refreshed),
 * we sign the user out and send them to the login screen, remembering the page
 * they were on so they land right back there after re-authenticating and can
 * finish the action they were attempting.
 */
export const SessionGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();

  // Keep the latest location without re-registering the handler on every nav.
  const locationRef = useRef(location);
  locationRef.current = location;
  // Guard against a burst of parallel 401s all triggering a redirect.
  const redirectingRef = useRef(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      const { pathname, search } = locationRef.current;

      // Already on an auth screen (or mid-redirect): nothing to do.
      if (
        redirectingRef.current ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/admin/login")
      ) {
        return;
      }
      redirectingRef.current = true;

      signOut();
      toast({
        variant: "destructive",
        title: "Session expired",
        description: "Please sign in again to continue where you left off.",
      });

      const isAdmin = pathname.startsWith("/admin");
      const returnTo = `${pathname}${search}`;
      const loginPath = isAdmin ? "/admin/login" : "/login";
      navigate(
        `${loginPath}?redirect=${encodeURIComponent(returnTo)}&expired=1`,
      );

      // Allow future expiries to redirect again once this one has landed.
      window.setTimeout(() => {
        redirectingRef.current = false;
      }, 1000);
    });

    return () => setUnauthorizedHandler(null);
  }, [navigate, signOut, toast]);

  return null;
};
