// Low-level API client for the ELS-Server Express API.
// Handles base URL, bearer-token auth, JSON (de)serialization and error shaping.

const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const TOKEN_KEY = "els_token";
const USER_KEY = "els_user";
const STUDIO_SLUG_KEY = "els_studio_slug";

export interface AuthUser {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
}

export const tokenStore = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
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

// The studio (tenant) the app is currently acting within. Normally empty — the
// server falls back to its default studio slug — but it's set when a super admin
// impersonates a studio, and (later) will be derived from the subdomain. When
// present it's sent as the X-Studio-Slug header so the API scopes to it.
export const studioStore = {
  getSlug(): string | null {
    return localStorage.getItem(STUDIO_SLUG_KEY);
  },
  setSlug(slug: string) {
    localStorage.setItem(STUDIO_SLUG_KEY, slug);
  },
  clear() {
    localStorage.removeItem(STUDIO_SLUG_KEY);
  },
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
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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
  const { method = "GET", body, formData, auth = false } = options;

  const headers: Record<string, string> = {};
  const token = tokenStore.getToken();
  if (auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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
    // An expired/invalid token on an authenticated request: the refresh flow
    // couldn't renew it, so clear the dead session and let the app redirect to
    // login. Guarded on `token` so failed logins (no token) don't trigger it.
    if (res.status === 401 && auth && token) {
      tokenStore.clear();
      unauthorizedHandler?.();
    }
    const message =
      (json as { message?: string } | null)?.message ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return json as T;
}
