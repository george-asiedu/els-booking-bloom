import { useEffect, useRef } from "react";

// Cloudflare Turnstile, the check on anything a visitor does without an
// account (booking, buying, paying a bill). Most people never see a puzzle.
// It only shows when VITE_TURNSTILE_SITE_KEY is set; without a key nothing is
// shown and nothing is sent (the API accepts that only outside production).

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? "";

type Turnstile = {
  render: (el: HTMLElement, o: { sitekey: string; callback: (t: string) => void; "expired-callback": () => void; "error-callback": () => void; theme?: string }) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let token = "";
let widgetId: string | undefined;

/** The token for the next guest request. Each one works once. */
export const takeCaptchaToken = (): string => {
  const t = token;
  token = "";
  return t;
};
/** Ask for a fresh check after a token was used. */
export const resetCaptcha = () => {
  token = "";
  if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
};
export const captchaEnabled = Boolean(SITE_KEY);
/** Whether a token is ready to send (true when no CAPTCHA is set up). */
export const captchaReady = () => !SITE_KEY || Boolean(token);

let loading: Promise<void> | null = null;
const loadScript = () =>
  (loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("The security check couldn't load"));
    document.head.appendChild(s);
  }));

/** The check itself. Put it above the button that sends the guest request. */
export const Captcha = ({ onChange }: { onChange?: (ready: boolean) => void }) => {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widgetId = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          callback: (t) => {
            token = t;
            onChange?.(true);
          },
          "expired-callback": () => {
            token = "";
            onChange?.(false);
          },
          "error-callback": () => {
            token = "";
            onChange?.(false);
          },
        });
      })
      .catch(() => onChange?.(false));
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      widgetId = undefined;
      token = "";
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!SITE_KEY) return null;
  return <div ref={box} className="min-h-[65px]" aria-label="Security check" />;
};
