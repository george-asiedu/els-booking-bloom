// API layer for the super-admin platform surface (/api/platform/*).
//
// The platform session is kept separate from the storefront/admin session
// (its own cookie + user key) so that impersonating a studio — which writes the
// normal session and els_user — doesn't sign the super admin out of /platform.

import { ApiError, errorCode } from "./apiClient";
import {
  directoryQuery,
  toDirectoryPage,
  type DirectoryPage,
  type DirectoryQuery,
  type DirectoryUserDetail,
  type RawDirectoryPage,
} from "./api/users";
import {
  ledgerQuery,
  type LedgerFilters,
  type LedgerEntryDTO,
  type LedgerSummaryDTO,
} from "./api";
import { FeatureRequestDTO, FeatureRequestStatus } from "./api";
import { getDeviceId } from "./deviceIdentity";

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

export async function platformRequest<T>(
  path: string,
  options: PlatformRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (path === "/auth/login") {
    headers["X-Device-Id"] = getDeviceId();
  }
  headers["X-Zuri-Client"] = "web";
  const signedIn = Boolean(platformStore.getUser());

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}/platform${path}`, {
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
    // Dead platform session — clear it so the guard bounces to /platform/login.
    if (res.status === 401 && auth && signedIn) {
      platformStore.clear();
    }
    const message =
      (json as { message?: string } | null)?.message ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, errorCode(json));
  }

  return json as T;
}

// ---------------- Types ----------------

export type StudioStatus = "ACTIVE" | "SUSPENDED" | "TRIAL";

export interface StudioFeatureSettings {
  booking?: boolean;
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
  // What customers paid this studio, after refunds: all time and this month.
  revenue: number;
  revenueThisMonth: number;
  // What this studio has paid the platform (setup fee, renewals, commission).
  paidToPlatform: number;
  billingMode: "SUBSCRIPTION" | "REVENUE_SHARE";
  platformFeePercent: number;
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
  studios: {
    total: number;
    active: number;
    suspended: number;
    trial: number;
    subscription: number;
    revenueShare: number;
    newThisMonth: number;
  };
  users: { customers: number; studioAdmins: number; newThisMonth: number };
  // Money customers paid studios (after refunds).
  customerPayments: {
    allTime: number;
    thisMonth: number;
    lastMonth: number;
    bookingsAllTime: number;
    ordersAllTime: number;
  };
  // Money studios paid the platform.
  platformEarnings: {
    allTime: number;
    thisMonth: number;
    lastMonth: number;
    setupFeesAllTime: number;
    renewalsAllTime: number;
    commissionsAllTime: number;
  };
}

export interface PlatformBillingConfig {
  priceStorefrontMonthly: number;
  priceStorefrontYearly: number;
  subscriptionSetupFeeStorefront: number;
  commissionStorefrontPercent: number;
  setupFeeStorefront: number;
  revenueShareEnabled: boolean;
  commissionStandardPercent: number;
  commissionPremiumPercent: number;
  setupFeeStandard: number;
  setupFeePremium: number;
  // Subscription setup fee per plan (0 = none), paid at signup instead of the
  // first period and covering the first setupFeeMonths* months.
  subscriptionSetupFeeStandard: number;
  subscriptionSetupFeePremium: number;
  setupFeeMonthsMonthly: number;
  setupFeeMonthsYearly: number;
  // Welcome discount for new subscription signups (0% = off).
  newStudioDiscountPercent: number;
  newStudioDiscountMonths: number;
  // Extra on top of the plan to bring a suspended account back (GHS, 0 = none).
  reactivationFee: number;
  // Plan prices (GHS) charged at signup and renewal.
  priceStandardMonthly: number;
  priceStandardYearly: number;
  pricePremiumMonthly: number;
  pricePremiumYearly: number;
}

// Public details on the platform pages. Null = the built-in default.
export interface PlatformSiteSettings {
  siteName: string | null;
  siteHeroBadge: string | null;
  supportEmail: string | null;
  supportWhatsapp: string | null;
  demoStudioSlug: string | null;
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
  billingMode: "SUBSCRIPTION" | "REVENUE_SHARE";
  billing: StudioBillingSummary;
}

export type EarningPurpose = "SETUP_FEE" | "ACTIVATION_FEE" | "RENEWAL" | "PLAN_CHANGE" | "COMMISSION";

/** One payment the platform earned (or, for commission, an estimate). */
export interface EarningEntry {
  id: string;
  date: string;
  studio: { id: string; name: string; slug: string } | null;
  purpose: EarningPurpose;
  description: string;
  amount: number;
  reference: string | null;
  plan: "STANDARD" | "PREMIUM" | null;
  cadence: "MONTHLY" | "YEARLY" | null;
  estimated: boolean;
  detail: { coverageMonths?: number | null; month?: string; customerPayments?: number; ratePercent?: number };
}

export interface EarningsPage {
  items: EarningEntry[];
  summary: {
    total: number;
    byPurpose: Partial<Record<EarningPurpose, number>>;
    byStudio: { studio: EarningEntry["studio"]; amount: number; payments: number }[];
  };
  page: number;
  pageSize: number;
  total: number;
}

export interface StudioBillingSummary {
  mode: "SUBSCRIPTION" | "REVENUE_SHARE";
  plan: "STANDARD" | "PREMIUM" | "STOREFRONT";
  cadence: "MONTHLY" | "YEARLY";
  status: "active" | "lapsed" | "revenue_share";
  commissionPercent: number | null;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  daysLeft: number | null;
  signup: { reference: string; amount: number; coverageMonths: number | null; date: string } | null;
  lastPayment: EarningEntry | null;
  // What this customer pays per period now, after its own terms.
  yourPrice?: { list: number; amount: number; percent: number; custom: boolean };
  terms?: {
    customPriceMonthly: number | null;
    discountPercent: number | null;
    discountEndsAt: string | null;
    note: string | null;
  };
  totalPaid: number;
  payments: EarningEntry[];
}

export interface StudioBillingInput {
  customPriceMonthly?: number | null;
  discountPercent?: number | null;
  discountEndsAt?: string | null;
  note?: string | null;
  plan?: "STANDARD" | "PREMIUM" | "STOREFRONT";
  cadence?: "MONTHLY" | "YEARLY";
  currentPeriodEnd?: string | null;
}

export interface BillingPromo {
  id: string;
  code: string;
  percentOff: number;
  plans: string[];
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}
export interface BillingPromoInput {
  code: string;
  percentOff: number;
  plans: string[];
  expiresAt?: string | null;
  maxUses?: number | null;
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

export interface PlatformActivityLogEntry {
  id: string;
  requestId: string;
  studioId: string | null;
  actorId: string | null;
  actorRole: string | null;
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  userAgent: string | null;
  createdAt: string;
}

export interface PlatformActivityLogPage {
  message: string;
  data: PlatformActivityLogEntry[];
  pagination: { limit: number; nextCursor: string | null; hasMore: boolean };
}

export interface ImpersonateResult {
  studio: { id: string; slug: string; name: string };
  user: { id: string; email: string; role: string };
}

export interface PlatformQueueCounts {
  active?: number;
  completed?: number;
  delayed?: number;
  failed?: number;
  waiting?: number;
  paused?: number;
  [k: string]: number | undefined;
}

export interface PlatformQueueFailure {
  id?: string;
  failedReason?: string;
  attemptsMade?: number;
  data?: unknown;
}

// `enabled: false` when REDIS_URL isn't configured — the other fields are then
// absent, so the UI must handle that case rather than assume counts exist.
export interface PlatformQueueStatus {
  message: string;
  data: {
    enabled: boolean;
    email?: { counts: PlatformQueueCounts; recentFailures: PlatformQueueFailure[] };
  };
}

// A recurring background job (see ELS-Server src/scheduler). Times are ISO.
export interface ScheduledJobDTO {
  key: string;
  label: string;
  description: string;
  schedule: string;
  enabled: boolean;
  running: boolean;
  // The last run started but its process died before finishing.
  interrupted: boolean;
  nextRunAt: string | null;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastStatus: "RUNNING" | "SUCCESS" | "FAILED" | null;
  // "schedule", or "manual:<email>" for a run started from the console.
  lastTrigger: string | null;
  lastResult: Record<string, unknown> | null;
  lastError: string | null;
  lastDurationMs: number | null;
  runCount: number;
  failureCount: number;
  updatedBy: string | null;
  updatedAt: string | null;
}

interface Envelope<T> {
  message: string;
  data: T;
}

// ---------------- API ----------------

export const platformApi = {
  async login(email: string, password: string, totp?: string): Promise<PlatformUser> {
    const res = await platformRequest<
      Envelope<{ user: PlatformUser }>
    >("/auth/login", { method: "POST", auth: false, body: { email, password, ...(totp ? { totp } : {}) } });
    platformStore.setUser(res.data.user);
    return res.data.user;
  },

  async forgotPassword(email: string): Promise<string> {
    const res = await platformRequest<Envelope<null> & { message: string }>(
      "/auth/forgot-password",
      { method: "POST", auth: false, body: { email } },
    );
    return res.message;
  },

  async resetPassword(token: string, password: string): Promise<string> {
    const res = await platformRequest<Envelope<null> & { message: string }>(
      "/auth/reset-password",
      { method: "POST", auth: false, body: { token, password } },
    );
    return res.message;
  },

  async logout() {
    try {
      await platformRequest<Envelope<null> & { message: string }>("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Clear local credentials even when the network is unavailable.
    } finally {
      platformStore.clear();
    }
  },

  async me(): Promise<PlatformUser> {
    return platformRequest<PlatformUser>("/me");
  },

  async listStudios(): Promise<StudioSummary[]> {
    return platformRequest<StudioSummary[]>("/studios");
  },

  // ---- Users (every studio) ----
  async listUsers(q: DirectoryQuery): Promise<DirectoryPage> {
    return toDirectoryPage(await platformRequest<RawDirectoryPage>(`/users?${directoryQuery(q)}`));
  },
  async getUser(id: string): Promise<DirectoryUserDetail> {
    return (await platformRequest<{ data: DirectoryUserDetail }>(`/users/${id}`)).data;
  },
  async updateUser(
    id: string,
    input: { fullName?: string | null; phone?: string | null; location?: string | null; email?: string },
  ): Promise<DirectoryUserDetail> {
    return (await platformRequest<{ data: DirectoryUserDetail }>(`/users/${id}`, { method: "PATCH", body: input })).data;
  },
  async deleteUser(id: string): Promise<void> {
    await platformRequest(`/users/${id}`, { method: "DELETE" });
  },

  async listEarnings(q: {
    studioId?: string;
    purpose?: EarningPurpose | "";
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }): Promise<EarningsPage> {
    const p = new URLSearchParams();
    if (q.studioId) p.set("studioId", q.studioId);
    if (q.purpose) p.set("purpose", q.purpose);
    if (q.from) p.set("from", q.from);
    if (q.to) p.set("to", q.to);
    p.set("page", String(q.page ?? 1));
    p.set("pageSize", String(q.pageSize ?? 20));
    const res = await platformRequest<{
      data: EarningEntry[];
      summary: EarningsPage["summary"];
      pagination: { page: number; pageSize: number; total: number };
    }>(`/earnings?${p.toString()}`);
    return { items: res.data, summary: res.summary, ...res.pagination };
  },

  async getAnalytics(): Promise<PlatformAnalytics> {
    const res = await platformRequest<Envelope<PlatformAnalytics>>("/analytics");
    return res.data;
  },

  async getBillingConfig(): Promise<PlatformBillingConfig> {
    const res = await platformRequest<Envelope<PlatformBillingConfig>>(
      "/billing-config",
    );
    return res.data;
  },

  async getSiteSettings(): Promise<PlatformSiteSettings> {
    return (await platformRequest<Envelope<PlatformSiteSettings>>("/site-settings")).data;
  },

  async updateSiteSettings(
    input: Partial<PlatformSiteSettings>,
  ): Promise<PlatformSiteSettings> {
    return (
      await platformRequest<Envelope<PlatformSiteSettings>>("/site-settings", {
        method: "PATCH",
        body: input,
      })
    ).data;
  },

  async updateBillingConfig(
    input: Partial<PlatformBillingConfig>,
  ): Promise<PlatformBillingConfig> {
    const res = await platformRequest<Envelope<PlatformBillingConfig>>(
      "/billing-config",
      { method: "PATCH", body: input },
    );
    return res.data;
  },

  // One customer's billing terms; anything left out is unchanged.
  async updateStudioBilling(id: string, input: StudioBillingInput): Promise<void> {
    await platformRequest(`/studios/${id}/billing`, { method: "PATCH", body: input });
  },

  async listBillingPromos(): Promise<BillingPromo[]> {
    return (await platformRequest<Envelope<BillingPromo[]>>("/billing-promos")).data;
  },
  async createBillingPromo(input: BillingPromoInput): Promise<void> {
    await platformRequest("/billing-promos", { method: "POST", body: input });
  },
  async setBillingPromoActive(id: string, active: boolean): Promise<void> {
    await platformRequest(`/billing-promos/${id}`, { method: "PATCH", body: { active } });
  },
  async deleteBillingPromo(id: string): Promise<void> {
    await platformRequest(`/billing-promos/${id}`, { method: "DELETE" });
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

  async deleteStudio(id: string): Promise<{ id: string; slug: string }> {
    const res = await platformRequest<Envelope<{ id: string; slug: string }>>(
      `/studios/${id}`,
      { method: "DELETE" },
    );
    return res.data;
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

  async setFeatureRequestFee(id: string, fee: number, monthly?: number): Promise<PlatformFeatureRequest> {
    const res = await platformRequest<Envelope<PlatformFeatureRequest>>(
      `/feature-requests/${id}/fee`,
      { method: "PATCH", body: { fee, ...(monthly ? { monthly } : {}) } },
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
    actionPrefix?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    const qs = new URLSearchParams();
    if (params?.studioId) qs.set("studioId", params.studioId);
    if (params?.action) qs.set("action", params.action);
    if (params?.actionPrefix) qs.set("actionPrefix", params.actionPrefix);
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await platformRequest<Envelope<AuditLogEntry[]>>(
      `/audit-logs${suffix}`,
    );
    return res.data;
  },
  async listActivityLogs(params: {
    cursor?: string;
    limit?: number;
    studioId?: string;
    method?: string;
    statusCode?: number;
  } = {}): Promise<PlatformActivityLogPage> {
    const qs = new URLSearchParams();
    if (params.cursor) qs.set("cursor", params.cursor);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.studioId) qs.set("studioId", params.studioId);
    if (params.method) qs.set("method", params.method);
    if (params.statusCode) qs.set("statusCode", String(params.statusCode));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return platformRequest<PlatformActivityLogPage>(`/activity-logs${suffix}`);
  },

  // ---- Transaction ledger (any studio, or platform-wide) ----

  async listTransactions(
    params: { studioId?: string } & LedgerFilters = {},
  ): Promise<{ entries: LedgerEntryDTO[]; nextCursor: string | null }> {
    const qs = new URLSearchParams(ledgerQuery(params));
    if (params.studioId) qs.set("studioId", params.studioId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await platformRequest<{
      message: string;
      entries: LedgerEntryDTO[];
      nextCursor: string | null;
    }>(`/transactions${suffix}`);
    return { entries: res.entries ?? [], nextCursor: res.nextCursor ?? null };
  },

  async transactionSummary(
    params: { studioId?: string; from?: string; to?: string } = {},
  ): Promise<LedgerSummaryDTO> {
    const qs = new URLSearchParams();
    if (params.studioId) qs.set("studioId", params.studioId);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await platformRequest<Envelope<LedgerSummaryDTO>>(
      `/transactions/summary${suffix}`,
    );
    return res.data;
  },

  // ---- Studio admin account recovery ----

  /**
   * Email a studio admin a password-reset link. There is no endpoint that
   * reveals an existing password: they are bcrypt hashes and cannot be read
   * back, so a reset is the only way to get a locked-out admin back in.
   */
  async sendStudioPasswordReset(
    studioId: string,
    userId?: string,
  ): Promise<{ message: string; data: { email: string; expiresAt: string } }> {
    return platformRequest<{
      message: string;
      data: { email: string; expiresAt: string };
    }>(`/studios/${studioId}/send-password-reset`, {
      method: "POST",
      body: userId ? { userId } : {},
    });
  },

  // ---- Background work ----

  async queues(): Promise<PlatformQueueStatus> {
    return platformRequest<PlatformQueueStatus>("/queues");
  },

  async jobs(): Promise<ScheduledJobDTO[]> {
    return (await platformRequest<Envelope<ScheduledJobDTO[]>>("/jobs")).data;
  },

  async setJobEnabled(key: string, enabled: boolean): Promise<ScheduledJobDTO> {
    return (
      await platformRequest<Envelope<ScheduledJobDTO>>(`/jobs/${encodeURIComponent(key)}`, {
        method: "PATCH",
        body: { enabled },
      })
    ).data;
  },

  async runJob(key: string): Promise<ScheduledJobDTO> {
    return (
      await platformRequest<Envelope<ScheduledJobDTO>>(
        `/jobs/${encodeURIComponent(key)}/run`,
        { method: "POST" },
      )
    ).data;
  },
};
