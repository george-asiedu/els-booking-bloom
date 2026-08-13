import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the window to the top on every route change. Without this, React
 * Router preserves the previous scroll position, so navigating (especially
 * from a footer link on mobile) can drop you into the middle or bottom of
 * the next page. Keyed on pathname + search so tab deep-links reset too.
 */
export const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, search]);

  return null;
};
