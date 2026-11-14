import { toast } from "sonner";

// Installable app + push, after the Westend City Church app: the service
// worker (public/sw.js), the browser's install prompt, and what the device can do.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const INSTALLABLE_EVENT = "zuri:installable";
export const OPEN_INSTALL_EVENT = "zuri:install";

// Captured at load: Chrome fires it once, possibly before any banner mounts.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  window.dispatchEvent(new Event(INSTALLABLE_EVENT));
});
window.addEventListener("appinstalled", () => (deferredPrompt = null));

export const canPromptInstall = () => Boolean(deferredPrompt);

/** The browser's own install prompt when it offers one; otherwise the guide. */
export const installApp = async (appName: string): Promise<void> => {
  if (!deferredPrompt) {
    window.dispatchEvent(new Event(OPEN_INSTALL_EVENT));
    return;
  }
  const e = deferredPrompt;
  await e.prompt();
  const { outcome } = await e.userChoice;
  deferredPrompt = null;
  if (outcome === "accepted") toast.success(`${appName} is installing`);
};

export interface Platform {
  ios: boolean;
  android: boolean;
  /** Already running as the installed app. */
  standalone: boolean;
  /** iOS browsers other than Safari can't add to the Home Screen (except Chrome). */
  iosBrowser: "safari" | "chrome" | "other";
  inApp: boolean;
}

export const platform = (): Platform => {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const inApp = /FBAN|FBAV|Instagram|Line\/|TikTok|Snapchat/i.test(ua);
  const iosBrowser = /CriOS/.test(ua) ? "chrome" : /FxiOS|EdgiOS|OPiOS/.test(ua) ? "other" : "safari";
  return { ios, android: /Android/.test(ua), standalone, iosBrowser, inApp };
};

/** Registers /sw.js in production and offers a reload when a new version waits. */
export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((reg) => {
      const offer = (worker: ServiceWorker) =>
        toast("A new version is ready", {
          duration: Infinity,
          action: { label: "Update", onClick: () => worker.postMessage("SKIP_WAITING") },
        });
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        w?.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) offer(w);
        });
      });
      // Look for a new version whenever the app comes back to the foreground.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => undefined);
      });
    })
    .catch(() => undefined);
};

/** The service worker, or null when none is running (local development). */
export const swRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) return null;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), 3000)),
  ]);
};

/** A VAPID key (base64url) as the bytes PushManager.subscribe wants. */
export const keyBytes = (base64url: string): Uint8Array<ArrayBuffer> => {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

/**
 * Point the page at its install manifest. The platform uses the static
 * /manifest.webmanifest; a studio's site gets one with its own name and colour,
 * so its customers install "El's Beauty Studio", not "Zuri Studios".
 */
export const applyStudioManifest = (studio: { name: string; themeColor?: string | null }) => {
  const origin = window.location.origin;
  const manifest = {
    id: `${origin}/`,
    name: studio.name,
    short_name: studio.name.length > 12 ? studio.name.split(" ")[0] : studio.name,
    start_url: `${origin}/`,
    scope: `${origin}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: studio.themeColor || "#fab700",
    icons: [
      { src: `${origin}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${origin}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${origin}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  const href = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }));
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  const old = link.href;
  link.href = href;
  if (old.startsWith("blob:")) URL.revokeObjectURL(old);
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute("content", studio.name);
};
