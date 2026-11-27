// Low-level API client for the ELS-Server Express API.
// Handles base URL, cookie sessions, JSON (de)serialization and error shaping.

import { resetCaptcha, takeCaptchaToken } from "@/components/Captcha";
import { getDeviceId } from "./deviceIdentity";

const CONFIGURED_API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const TOKEN_KEY = "els_token"; // Old sessions: only ever removed now.
const USER_KEY = "els_user";
const STUDIO_SLUG_KEY = "els_studio_slug";

export interface AuthUser {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "STAFF";
}

// The session itself is an HttpOnly cookie that scripts can't read; this only
// remembers who's signed in, for the UI.
export const tokenStore = {
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  setUser(user: AuthUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// Root domain of the platform (e.g. "app.example.com"). When set, a request to
// "<slug>.app.example.com" resolves to that studio's slug. Left empty in local
// dev, where the slug comes from impersonation or the server default instead.
// A bare host, however it's written in the env ("http://localhost:8080" -> "localhost").
// The guest key (for booking, paying and buying without an account) is read
// from the API when first needed, so the platform can rotate it without a new
// release. A request refused because the key changed fetches the new one and
// tries once more.
let guestKey: string | null = null;
const loadGuestKey = async (force = false): Promise<string> => {
  if (guestKey && !force) return guestKey;
  const res = await fetch(`${API_URL}/platform/guest-key`, { headers: { "X-Zuri-Client": "web" }, cache: "no-store" });
  const json = (await res.json().catch(() => null)) as { data?: { key?: string } } | null;
  if (!res.ok || !json?.data?.key) throw new ApiError("Couldn't start this request. Please try again.", res.status);
  guestKey = json.data.key;
  return guestKey;
};
const ROOT_DOMAIN = (import.meta.env.VITE_ROOT_DOMAIN as string | undefined)
  ?.trim()
  .toLowerCase()
  .replace(/^https?:\/\//, "")
  .replace(/[/?#].*$/, "")
  .replace(/:\d+$/, "");

// Labels that are never a studio slug (platform surfaces / conventions).
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "platform",
  "dashboard",
]);

// Derive the studio slug from the current subdomain, if this host is a studio
// subdomain (e.g. "els" from "els.zuristudios.com"). Computed once at load — the
// host doesn't change without a full navigation.
const subdomainSlug = (() => {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  // Local dev / IPs never carry a studio subdomain (els.localhost does).
  if (
    host === "localhost" ||
    host.startsWith("127.") ||
    host.endsWith(".local") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  ) {
    return null;
  }

  // Primary: <slug>.<ROOT_DOMAIN> when the root domain is configured.
  if (ROOT_DOMAIN) {
    if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return null;
    if (host.endsWith(`.${ROOT_DOMAIN}`)) {
      const label = host.slice(0, -(ROOT_DOMAIN.length + 1)).split(".")[0];
      return label && !RESERVED_SUBDOMAINS.has(label) ? label : null;
    }
    // A different host (e.g. a studio's custom domain) — resolved separately.
    return null;
  }

  // Fallback when VITE_ROOT_DOMAIN isn't set: treat a 3+ label host as
  // <slug>.<apex> so studio subdomains still resolve (and the home tab returns
  // to the studio, not the platform landing) even if the env var is missing.
  const parts = host.split(".");
  if (parts.length >= 3 && !RESERVED_SUBDOMAINS.has(parts[0])) return parts[0];
  return null;
})();

// The studio (tenant) the app is acting within. The subdomain wins when present
// (production multi-studio hosting); otherwise it's whatever was stored — set
// when a super admin impersonates a studio. Empty means the server falls back to
// its default studio. When resolved it's sent as the X-Studio-Slug header.
export const studioStore = {
  getSlug(): string | null {
    return subdomainSlug ?? localStorage.getItem(STUDIO_SLUG_KEY);
  },
  setSlug(slug: string) {
    localStorage.setItem(STUDIO_SLUG_KEY, slug);
  },
  clear() {
    localStorage.removeItem(STUDIO_SLUG_KEY);
  },
  // True when the active studio is a local preview/impersonation (stored slug),
  // not a real subdomain. Used to offer an "exit to the platform" affordance.
  isLocalOverride(): boolean {
    return !subdomainSlug && Boolean(localStorage.getItem(STUDIO_SLUG_KEY));
  },
};

// Whether the current host is a potential custom domain (not localhost, not the
// platform apex/subdomain). For such hosts the SPA asks the API which studio the
// domain belongs to and scopes to it.
const isCustomHost = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.startsWith("127.") ||
    host === "0.0.0.0" ||
    host.endsWith(".local")
  )
    return false;
  if (subdomainSlug) return false; // a ROOT_DOMAIN subdomain
  if (
    ROOT_DOMAIN &&
    (host === ROOT_DOMAIN ||
      host === `www.${ROOT_DOMAIN}` ||
      host.endsWith(`.${ROOT_DOMAIN}`))
  )
    return false;
  return true;
};

// A studio's own domain forwards /api to the server, so the session cookie
// belongs to that domain (browsers block cookies from another site).
// Locally, els.localhost and localhost are different sites, so the API is
// called on the same name to keep the session cookie.
export const API_URL: string = window.location.hostname.endsWith(".localhost")
  ? CONFIGURED_API_URL.replace("//localhost", `//${window.location.hostname}`)
  : isCustomHost() && !window.location.hostname.endsWith(".vercel.app")
    ? `${window.location.origin}/api`
    : CONFIGURED_API_URL;

/**
 * When served from a studio's custom domain, resolve that host to a studio slug
 * and store it so every request is scoped correctly. No-op on localhost, the
 * platform apex, and ROOT_DOMAIN subdomains. Call once before the app renders.
 */
export const maybeResolveCustomDomain = async (): Promise<void> => {
  if (!isCustomHost() || localStorage.getItem(STUDIO_SLUG_KEY)) return;
  try {
    const res = await fetch(
      `${API_URL}/studio/resolve-domain?host=${encodeURIComponent(
        window.location.hostname,
      )}`,
    );
    if (!res.ok) return;
    const json = (await res.json()) as { data?: { slug?: string } };
    if (json?.data?.slug) localStorage.setItem(STUDIO_SLUG_KEY, json.data.slug);
  } catch {
    /* ignore — falls back to the platform landing */
  }
};

/**
 * Whether a studio with this address exists and is open, asked of the API
 * directly so it doesn't depend on (or change) the studio this browser has
 * stored. Used by the platform's "Sign in to your studio" page.
 */
export const checkStudio = async (
  slug: string,
): Promise<"ok" | "missing" | "suspended" | "error"> => {
  try {
    const res = await fetch(`${API_URL}/studio`, { headers: { "X-Studio-Slug": slug } });
    if (res.ok) return "ok";
    if (res.status === 404) return "missing";
    if (res.status === 403) return "suspended";
    return "error";
  } catch {
    return "error";
  }
};

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  // When true, `body` is sent as FormData (multipart) instead of JSON.
  formData?: FormData;
  auth?: boolean;
}

export class ApiError extends Error {
  status: number;
  /** A machine-readable reason from the API, e.g. "TOTP_REQUIRED". */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** The first `errors[].code` in an API error body, if any. */
export const errorCode = (json: unknown): string | undefined => {
  const first = (json as { errors?: { code?: unknown }[] } | null)?.errors?.[0];
  return typeof first?.code === "string" ? first.code : undefined;
};

// Global handler invoked once when an authenticated request comes back 401 —
// i.e. the access token has expired or been invalidated. The app registers a
// handler (see SessionGuard) that signs the user out and sends them to the
// login screen so they can re-authenticate and resume what they were doing.
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
export const setUnauthorizedHandler = (fn: UnauthorizedHandler | null) => {
  unauthorizedHandler = fn;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  // The security check's token works once, so take it here and use the same
  // one if the request has to be tried again.
  const captcha = takeCaptchaToken();
  try {
    return await send<T>(path, options, false, captcha);
  } catch (e) {
    // The guest key was rotated since this page loaded: get the new one, retry once.
    if (path.includes("guest") && e instanceof ApiError && e.status === 401) return send<T>(path, options, true, captcha);
    throw e;
  } finally {
    // A used token is spent: ask for a fresh check for the next try.
    if (captcha) resetCaptcha();
  }
}

async function send<T>(path: string, options: RequestOptions, refreshGuestKey: boolean, captcha: string): Promise<T> {
  const { method = "GET", body, formData, auth = false } = options;

  const headers: Record<string, string> = {};
  if (path === "/auth/login" || path === "/auth/signup") {
    headers["X-Device-Id"] = getDeviceId();
  }
  // Proves the request came from this app (see the CSRF check in the API).
  headers["X-Zuri-Client"] = "web";
  // Guest endpoints (no account) need the app's guest key.
  if (path.includes("guest")) headers["X-Guest-Key"] = await loadGuestKey(refreshGuestKey);
  // The security check, for the requests that start something as a guest.
  if (captcha && (path === "/appointments/guest" || path === "/orders/guest-checkout" || path === "/payments/charge/momo" || path === "/orders/charge/momo" || /^\/bills\/pay\/[^/]+\/momo$/.test(path) || path === "/payments/guest/charge/momo" || /^\/bills\/pay\/[^/]+\/start$/.test(path)))
    headers["X-Captcha-Token"] = captcha;
  const signedIn = Boolean(tokenStore.getUser());

  // Scope the request to a specific studio when one is active (e.g. during
  // super-admin impersonation). Absent, the server uses its default studio.
  const studioSlug = studioStore.getSlug();
  if (studioSlug) {
    headers["X-Studio-Slug"] = studioSlug;
  }

  let payload: BodyInit | undefined;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: payload,
    credentials: "include",
  });

  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    // An expired/invalid session on an authenticated request. There is no
    // silent refresh, so clear the dead session and let the app redirect to
    // login. Guarded on `signedIn` so failed logins don't trigger it.
    if (res.status === 401 && auth && signedIn) {
      tokenStore.clear();
      unauthorizedHandler?.();
    }
    const message =
      (json as { message?: string } | null)?.message ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, errorCode(json));
  }

  return json as T;
}
