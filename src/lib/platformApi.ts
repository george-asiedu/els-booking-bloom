// API layer for the super-admin platform surface (/api/platform/*).
//
// The platform session is kept separate from the storefront/admin session
// (its own token + user keys) so that impersonating a studio — which writes the
// normal els_token/els_user — doesn't sign the super admin out of /platform.

import { ApiError } from "./apiClient";
import { FeatureRequestDTO, FeatureRequestStatus } from "./api";

const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const PLATFORM_TOKEN_KEY = "els_platform_token";
const PLATFORM_USER_KEY = "els_platform_user";

export interface PlatformUser {
  id: string;
  email: string;
  role: "SUPER_ADMIN";
}

export const platformStore = {
  getToken(): string | null {
    return localStorage.getItem(PLATFORM_TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(PLATFORM_TOKEN_KEY, token);
  },
  getUser(): PlatformUser | null {
    const raw = localStorage.getItem(PLATFORM_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PlatformUser;
    } catch {
      return null;
    }
  },
  setUser(user: PlatformUser) {
    localStorage.setItem(PLATFORM_USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(PLATFORM_TOKEN_KEY);
    localStorage.removeItem(PLATFORM_USER_KEY);
  },
};

interface PlatformRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

async function platformRequest<T>(
  path: string,
  options: PlatformRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  const token = platformStore.getToken();
  if (auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}/platform${path}`, {
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
    // Dead platform session — clear it so the guard bounces to /platform/login.
    if (res.status === 401 && auth && token) {
      platformStore.clear();
    }
    const message =
      (json as { message?: string } | null)?.message ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return json as T;
}

// ---------------- Types ----------------

export type StudioStatus = "ACTIVE" | "SUSPENDED" | "TRIAL";

export interface StudioFeatureSettings {
  commerce: boolean;
  loyalty: boolean;
  referrals: boolean;
  reviews: boolean;
  gallery: boolean;
  onlinePayments: boolean;
  productsInBooking: boolean;
}

export interface StudioSummary {
  id: string;
  name: string;
  slug: string;
  status: StudioStatus;
  plan: "STANDARD" | "PREMIUM";
  billingCadence: "MONTHLY" | "YEARLY";
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  customDomain: string | null;
  ownerEmail: string | null;
  userCount: number;
  appointmentCount: number;
  revenue: number;
  settings: StudioFeatureSettings | null;
  createdAt: string;
}

export interface PlatformAnalytics {
  totalStudios: number;
  activeStudios: number;
  suspendedStudios: number;
  trialStudios: number;
  totalUsers: number;
  totalRevenue: number;
}

export interface StudioDetail {
  id: string;
  name: string;
  slug: string;
  status: StudioStatus;
  customDomain: string | null;
  ownerUserId: string | null;
  paystackSubaccountCode: string | null;
  platformFeePercent: number;
  payoutProvider: string | null;
  payoutAccountNumber: string | null;
  plan: "STANDARD" | "PREMIUM";
  billingCadence: "MONTHLY" | "YEARLY";
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  owner: { id: string; email: string; role: string } | null;
  settings: StudioFeatureSettings | null;
  branding: Record<string, unknown> | null;
  content: Record<string, unknown> | null;
  counts: {
    userCount: number;
    appointmentCount: number;
    serviceCount: number;
    orderCount: number;
  };
}

export interface ProvisionStudioInput {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerFullName?: string;
  customDomain?: string;
  settings?: Partial<StudioFeatureSettings>;
}

export interface PlatformFeatureRequest extends FeatureRequestDTO {
  studio: { id: string; name: string; slug: string } | null;
}

export interface PlatformReviewRow {
  id: string;
  studioId: string | null;
  studioName: string | null;
  authorName: string;
  authorRole: string | null;
  content: string;
  rating: number;
  approved: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  studioId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ImpersonateResult {
  token: { accessToken: string; refreshToken: string };
  studio: { id: string; slug: string; name: string };
  user: { id: string; email: string; role: string };
}

interface Envelope<T> {
  message: string;
  data: T;
}

// ---------------- API ----------------

export const platformApi = {
  async login(email: string, password: string): Promise<PlatformUser> {
    const res = await platformRequest<
      Envelope<{ user: PlatformUser; token: { accessToken: string } }>
    >("/auth/login", { method: "POST", auth: false, body: { email, password } });
    platformStore.setToken(res.data.token.accessToken);
    platformStore.setUser(res.data.user);
    return res.data.user;
  },

  logout() {
    platformStore.clear();
  },

  async me(): Promise<PlatformUser> {
    return platformRequest<PlatformUser>("/me");
  },

  async listStudios(): Promise<StudioSummary[]> {
    return platformRequest<StudioSummary[]>("/studios");
  },

  async getAnalytics(): Promise<PlatformAnalytics> {
    const res = await platformRequest<Envelope<PlatformAnalytics>>("/analytics");
    return res.data;
  },

  async getStudio(id: string): Promise<StudioDetail> {
    return platformRequest<StudioDetail>(`/studios/${id}`);
  },

  async createStudio(input: ProvisionStudioInput): Promise<StudioDetail> {
    return platformRequest<StudioDetail>("/studios", {
      method: "POST",
      body: input,
    });
  },

  async updateStudio(
    id: string,
    input: {
      name?: string;
      customDomain?: string | null;
      platformFeePercent?: number;
    },
  ): Promise<StudioDetail> {
    return platformRequest<StudioDetail>(`/studios/${id}`, {
      method: "PATCH",
      body: input,
    });
  },

  async setStatus(id: string, status: StudioStatus): Promise<StudioDetail> {
    return platformRequest<StudioDetail>(`/studios/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  async updateSettings(
    id: string,
    settings: Partial<StudioFeatureSettings>,
  ): Promise<StudioDetail> {
    return platformRequest<StudioDetail>(`/studios/${id}/settings`, {
      method: "PATCH",
      body: settings,
    });
  },

  async impersonate(id: string): Promise<ImpersonateResult> {
    return platformRequest<ImpersonateResult>(`/studios/${id}/impersonate`, {
      method: "POST",
    });
  },

  async listFeatureRequests(
    status?: FeatureRequestStatus,
  ): Promise<PlatformFeatureRequest[]> {
    const qs = status ? `?status=${status}` : "";
    const res = await platformRequest<Envelope<PlatformFeatureRequest[]>>(
      `/feature-requests${qs}`,
    );
    return res.data;
  },

  async updateFeatureRequestStatus(
    id: string,
    status: FeatureRequestStatus,
  ): Promise<PlatformFeatureRequest> {
    const res = await platformRequest<Envelope<PlatformFeatureRequest>>(
      `/feature-requests/${id}`,
      { method: "PATCH", body: { status } },
    );
    return res.data;
  },

  async listReviews(): Promise<PlatformReviewRow[]> {
    const res = await platformRequest<Envelope<PlatformReviewRow[]>>("/reviews");
    return res.data;
  },
  async setReviewApproved(
    id: string,
    approved: boolean,
  ): Promise<PlatformReviewRow> {
    const res = await platformRequest<Envelope<PlatformReviewRow>>(
      `/reviews/${id}`,
      { method: "PATCH", body: { approved } },
    );
    return res.data;
  },
  async removeReview(id: string): Promise<void> {
    await platformRequest(`/reviews/${id}`, { method: "DELETE" });
  },

  async listAuditLogs(params?: {
    studioId?: string;
    action?: string;
  }): Promise<AuditLogEntry[]> {
    const qs = new URLSearchParams();
    if (params?.studioId) qs.set("studioId", params.studioId);
    if (params?.action) qs.set("action", params.action);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await platformRequest<Envelope<AuditLogEntry[]>>(
      `/audit-logs${suffix}`,
    );
    return res.data;
  },
};
