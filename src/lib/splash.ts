import { useEffect } from "react";

// Pairs with public/splash.js and the #splash markup in index.html.

declare global {
  interface Window {
    __hideSplash?: () => void;
  }
}

/** Fade the loading screen out. Safe to call more than once. */
export const hideSplash = () => window.__hideSplash?.();

/** Hide the loading screen as soon as `ready` turns true. */
export const useHideSplashWhen = (ready: boolean) => {
  useEffect(() => {
    if (ready) hideSplash();
  }, [ready]);
};

/**
 * Remember how this studio looks, so the next visit's loading screen shows its
 * name, logo and colour before any JavaScript has run. Keyed by host: one
 * browser can visit several studios.
 */
export const rememberStudioSplash = (studio: {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}) => {
  try {
    localStorage.setItem(`zuri_splash:${window.location.host}`, JSON.stringify(studio));
  } catch {
    // Storage full or blocked: the loading screen just stays unbranded.
  }
};
