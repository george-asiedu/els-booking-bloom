// Resource layer over the ELS-Server API.
// Normalizes server payloads (camelCase, UPPER_CASE enums, ISO dates) into the
// snake_case / lowercase shapes the existing components already consume, so the
// migration off Supabase is a drop-in at the data-fetching layer.

import { apiRequest, tokenStore, AuthUser, ApiError } from "./apiClient";

interface Envelope<T> {
  message: string;
  data: T;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ---------------- Types (component-facing) ----------------

// Category is now a dynamic, admin-managed slug (e.g. "nails", "makeup-glam").
export type ServiceCategory = string;

export interface ServiceDTO {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration: string;
  price: number;
  promo_price: number | null;
  on_promo: boolean;
  effective_price: number; // promo_price when on promo, else price
  popular: boolean;
  active: boolean;
  image_url: string | null;
}

export interface AppointmentServiceDTO {
  id: string;
  name: string;
  duration: string;
  price: number;
  category: ServiceCategory;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentType = "full" | "partial";

export interface PaymentInfoDTO {
  status: PaymentStatus;
  type: PaymentType;
  amount: number; // amount charged/paid in this transaction
  total_amount: number; // full amount due for the booking
  balance: number; // total_amount - amount (0 for full payments)
  reference: string | null;
  channel: string | null;
  paid_at: string | null;
}

export interface AppointmentDTO {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  service_id: string;
  appointment_date: string; // yyyy-MM-dd
  appointment_time: string;
  notes: string | null;
  design_image_url: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  user_id: string | null;
  created_at: string;
  total_price: number;
  discount_amount: number;
  points_redeemed: number;
  amount_due: number;
  payment: PaymentInfoDTO | null;
  services: AppointmentServiceDTO | null;
}

// ---------------- Raw server shapes ----------------

interface RawService {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration: string;
  price: number;
  promoPrice: number | null;
  popular: boolean;
  active: boolean;
  imageUrl: string | null;
}

interface RawAppointment {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string | null;
  designImageUrl: string | null;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  userId: string | null;
  createdAt: string;
  totalPrice: number | null;
  discountAmount: number;
  pointsRedeemed: number;
  payment?: {
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    type: "FULL" | "PARTIAL";
    amount: number;
    totalAmount: number;
    reference: string | null;
    channel: string | null;
    paidAt: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
    duration: string;
    price: number;
    category: string;
  } | null;
}

// ---------------- Normalizers ----------------

const toDateOnly = (iso: string): string => {
  // Server stores appointmentDate at UTC midnight; take the calendar date.
  return iso.slice(0, 10);
};

const normalizeService = (s: RawService): ServiceDTO => {
  const onPromo = s.promoPrice != null && s.promoPrice < s.price;
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description ?? "",
    duration: s.duration,
    price: s.price,
    promo_price: s.promoPrice,
    on_promo: onPromo,
    effective_price: onPromo ? (s.promoPrice as number) : s.price,
    popular: s.popular,
    active: s.active,
    image_url: s.imageUrl,
  };
};

const normalizeAppointment = (a: RawAppointment): AppointmentDTO => ({
  id: a.id,
  full_name: a.fullName,
  phone: a.phone,
  email: a.email,
  service_id: a.serviceId,
  appointment_date: toDateOnly(a.appointmentDate),
  appointment_time: a.appointmentTime,
  notes: a.notes,
  design_image_url: a.designImageUrl,
  status: a.status.toLowerCase() as AppointmentDTO["status"],
  user_id: a.userId,
  created_at: a.createdAt,
  total_price: a.totalPrice ?? 0,
  discount_amount: a.discountAmount ?? 0,
  points_redeemed: a.pointsRedeemed ?? 0,
  amount_due: (a.totalPrice ?? 0) - (a.discountAmount ?? 0),
  payment: a.payment
    ? {
        status: a.payment.status.toLowerCase() as PaymentStatus,
        type: a.payment.type.toLowerCase() as PaymentType,
        amount: a.payment.amount,
        total_amount: a.payment.totalAmount,
        balance: Math.max(0, a.payment.totalAmount - a.payment.amount),
        reference: a.payment.reference,
        channel: a.payment.channel,
        paid_at: a.payment.paidAt,
      }
    : null,
  services: a.service
    ? {
        id: a.service.id,
        name: a.service.name,
        duration: a.service.duration,
        price: a.service.price,
        category: a.service.category,
      }
    : null,
});

// ---------------- Auth ----------------

export interface SignupPayload {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  referralCode?: string;
}

const persistAuth = (data: { user: AuthUser; token: TokenPair }): AuthUser => {
  tokenStore.setToken(data.token.accessToken);
  tokenStore.setUser(data.user);
  return data.user;
};

export const authApi = {
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await apiRequest<Envelope<{ user: AuthUser; token: TokenPair }>>(
      "/auth/login",
      { method: "POST", body: { email, password } },
    );
    return persistAuth(res.data);
  },

  async signup(payload: SignupPayload): Promise<AuthUser> {
    const res = await apiRequest<Envelope<{ user: AuthUser; token: TokenPair }>>(
      "/auth/signup",
      { method: "POST", body: payload },
    );
    return persistAuth(res.data);
  },

  logout() {
    tokenStore.clear();
  },

  async forgotPassword(email: string): Promise<string> {
    const res = await apiRequest<{ message: string }>(
      "/auth/forgot-password",
      { method: "POST", body: { email } },
    );
    return res.message;
  },

  async resetPassword(token: string, password: string): Promise<string> {
    const res = await apiRequest<{ message: string }>(
      `/auth/reset-password/${token}`,
      { method: "POST", body: { password } },
    );
    return res.message;
  },
};

// ---------------- Studio (storefront branding/content/features) ----------------

export interface StudioFeatureFlags {
  commerce: boolean;
  loyalty: boolean;
  referrals: boolean;
  reviews: boolean;
  gallery: boolean;
  onlinePayments: boolean;
  productsInBooking: boolean;
}

export interface StudioFeatureCard {
  title: string;
  description: string;
  icon?: string;
}

export interface StudioConfigDTO {
  name: string;
  slug: string;
  branding: {
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
    fontFamily: string | null;
  };
  content: {
    heroHeadline: string | null;
    heroSubtext: string | null;
    aboutText: string | null;
    featureCards: StudioFeatureCard[] | null;
    showTestimonials: boolean;
  };
  settings: StudioFeatureFlags;
}

export const studioApi = {
  async getConfig(): Promise<StudioConfigDTO> {
    const res = await apiRequest<Envelope<StudioConfigDTO>>("/studio");
    return res.data;
  },
};

// ---- Admin: the studio's own branding + landing content ----

export interface StudioBrandingDTO {
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
}

export interface StudioContentDTO {
  heroHeadline: string | null;
  heroSubtext: string | null;
  aboutText: string | null;
  featureCards: StudioFeatureCard[] | null;
  showTestimonials: boolean;
}

export interface BrandingUpdateInput {
  primaryColor?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  logo?: File | null;
  removeLogo?: boolean;
}

export const studioAdminApi = {
  async getBranding(): Promise<StudioBrandingDTO> {
    const res = await apiRequest<Envelope<StudioBrandingDTO>>("/studio/branding", {
      auth: true,
    });
    return res.data;
  },

  async updateBranding(input: BrandingUpdateInput): Promise<StudioBrandingDTO> {
    const form = new FormData();
    if (input.primaryColor !== undefined)
      form.append("primaryColor", input.primaryColor ?? "");
    if (input.accentColor !== undefined)
      form.append("accentColor", input.accentColor ?? "");
    if (input.fontFamily !== undefined)
      form.append("fontFamily", input.fontFamily ?? "");
    if (input.removeLogo) form.append("removeLogo", "true");
    if (input.logo) form.append("logo", input.logo);

    const res = await apiRequest<Envelope<StudioBrandingDTO>>("/studio/branding", {
      method: "PUT",
      auth: true,
      formData: form,
    });
    return res.data;
  },

  async getContent(): Promise<StudioContentDTO> {
    const res = await apiRequest<Envelope<StudioContentDTO>>("/studio/content", {
      auth: true,
    });
    return res.data;
  },

  async updateContent(
    input: Partial<StudioContentDTO>,
  ): Promise<StudioContentDTO> {
    const res = await apiRequest<Envelope<StudioContentDTO>>("/studio/content", {
      method: "PUT",
      auth: true,
      body: input,
    });
    return res.data;
  },
};

// ---------------- Services ----------------

export interface ServiceInput {
  name: string;
  category: string;
  description?: string;
  duration: string;
  price: number;
  promoPrice?: number | null;
  popular?: boolean;
  active?: boolean;
}

export const servicesApi = {
  async listActive(): Promise<ServiceDTO[]> {
    const res = await apiRequest<Envelope<RawService[]>>("/services");
    return res.data.map(normalizeService);
  },

  async listAll(): Promise<ServiceDTO[]> {
    const res = await apiRequest<Envelope<RawService[]>>("/services/all", {
      auth: true,
    });
    return res.data.map(normalizeService);
  },

  async create(input: ServiceInput): Promise<ServiceDTO> {
    const res = await apiRequest<Envelope<RawService>>("/services", {
      method: "POST",
      auth: true,
      body: input,
    });
    return normalizeService(res.data);
  },

  async update(id: string, input: Partial<ServiceInput>): Promise<ServiceDTO> {
    const res = await apiRequest<Envelope<RawService>>(`/services/${id}`, {
      method: "PUT",
      auth: true,
      body: input,
    });
    return normalizeService(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/services/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

// ---------------- Categories ----------------

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  order: number;
}

export const categoriesApi = {
  async listActive(): Promise<CategoryDTO[]> {
    const res = await apiRequest<Envelope<CategoryDTO[]>>("/categories");
    return res.data;
  },

  async listAll(): Promise<CategoryDTO[]> {
    const res = await apiRequest<Envelope<CategoryDTO[]>>("/categories/all", {
      auth: true,
    });
    return res.data;
  },

  async create(name: string): Promise<CategoryDTO> {
    const res = await apiRequest<Envelope<CategoryDTO>>("/categories", {
      method: "POST",
      auth: true,
      body: { name },
    });
    return res.data;
  },

  async update(
    id: string,
    input: { name?: string; active?: boolean; order?: number },
  ): Promise<CategoryDTO> {
    const res = await apiRequest<Envelope<CategoryDTO>>(`/categories/${id}`, {
      method: "PUT",
      auth: true,
      body: input,
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/categories/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

// ---------------- Appointments ----------------

export interface CreateAppointmentInput {
  full_name: string;
  phone: string;
  email?: string | null;
  service_id: string;
  appointment_date: string; // yyyy-MM-dd
  appointment_time: string;
  notes?: string | null;
  design_image?: File | null;
  apply_points?: boolean;
}

// ---------------- Profile ----------------

export interface ProfileDTO {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  location: string | null;
}

interface RawProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  location: string | null;
}

const mapProfile = (p: RawProfile): ProfileDTO => ({
  full_name: p.fullName,
  email: p.email,
  phone: p.phone,
  avatar_url: p.avatar,
  location: p.location,
});

export interface ProfileUpdateInput {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  avatar?: File | null;
}

export const profileApi = {
  // Returns null when the user has no profile yet (server responds 404).
  async getMine(): Promise<ProfileDTO | null> {
    try {
      const res = await apiRequest<Envelope<RawProfile>>("/profile/me", {
        auth: true,
      });
      return mapProfile(res.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async update(input: ProfileUpdateInput): Promise<ProfileDTO> {
    const form = new FormData();
    if (input.fullName) form.append("fullName", input.fullName);
    if (input.email) form.append("email", input.email);
    if (input.phone) form.append("phone", input.phone);
    if (input.location) form.append("location", input.location);
    if (input.avatar) form.append("image", input.avatar);

    const res = await apiRequest<Envelope<RawProfile>>("/profile/me", {
      method: "POST",
      auth: true,
      formData: form,
    });
    return mapProfile(res.data);
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<string> {
    const res = await apiRequest<{ message: string }>("/profile/me/password", {
      method: "POST",
      auth: true,
      body: { currentPassword, newPassword },
    });
    return res.message;
  },
};

// ---------------- Loyalty & Referral ----------------

export interface LoyaltyPointsDTO {
  points: number;
  lifetime_points: number;
}

export interface LoyaltyTransactionDTO {
  id: string;
  points: number;
  type: string;
  description: string | null;
  created_at: string;
}

export interface ReferralCodeDTO {
  code: string;
  uses: number;
}

export const accountApi = {
  async getLoyalty(): Promise<LoyaltyPointsDTO> {
    const res = await apiRequest<
      Envelope<{ points: number; lifetimePoints: number }>
    >("/account/loyalty", { auth: true });
    return {
      points: res.data.points,
      lifetime_points: res.data.lifetimePoints,
    };
  },

  async getTransactions(): Promise<LoyaltyTransactionDTO[]> {
    const res = await apiRequest<
      Envelope<
        {
          id: string;
          points: number;
          type: string;
          description: string | null;
          createdAt: string;
        }[]
      >
    >("/account/loyalty/transactions", { auth: true });
    return res.data.map((t) => ({
      id: t.id,
      points: t.points,
      type: t.type,
      description: t.description,
      created_at: t.createdAt,
    }));
  },

  async getReferral(): Promise<ReferralCodeDTO> {
    const res = await apiRequest<Envelope<{ code: string; uses: number }>>(
      "/account/referral",
      { auth: true },
    );
    return { code: res.data.code, uses: res.data.uses };
  },

  async redeem(
    points: number,
  ): Promise<{ points: number; redeemed: number; ghsValue: number }> {
    const res = await apiRequest<
      Envelope<{ points: number; redeemed: number; ghsValue: number }>
    >("/account/loyalty/redeem", {
      method: "POST",
      auth: true,
      body: { points },
    });
    return res.data;
  },
};

// ---------------- Contact info ----------------

export interface ContactInfoDTO {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  tiktok: string | null;
  address: string | null;
  showPhone: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
  showInstagram: boolean;
  showTiktok: boolean;
  showAddress: boolean;
}

export const contactInfoApi = {
  async get(): Promise<ContactInfoDTO> {
    const res = await apiRequest<Envelope<ContactInfoDTO>>("/contact-info");
    return res.data;
  },

  async update(input: Partial<ContactInfoDTO>): Promise<ContactInfoDTO> {
    const res = await apiRequest<Envelope<ContactInfoDTO>>("/contact-info", {
      method: "PUT",
      auth: true,
      body: input,
    });
    return res.data;
  },
};

export const appointmentsApi = {
  async create(input: CreateAppointmentInput): Promise<AppointmentDTO> {
    // Sent as multipart so an optional design reference image can be attached.
    const form = new FormData();
    form.append("fullName", input.full_name);
    form.append("phone", input.phone);
    if (input.email) form.append("email", input.email);
    form.append("serviceId", input.service_id);
    form.append("appointmentDate", input.appointment_date);
    form.append("appointmentTime", input.appointment_time);
    if (input.notes) form.append("notes", input.notes);
    if (input.design_image) form.append("designImage", input.design_image);
    if (input.apply_points) form.append("applyPoints", "true");

    const res = await apiRequest<Envelope<RawAppointment>>("/appointments", {
      method: "POST",
      auth: true, // optionalAuth server-side; token attached if present
      formData: form,
    });
    return normalizeAppointment(res.data);
  },

  // Time slots already taken for a date (so the picker can exclude them).
  async takenSlots(date: string): Promise<string[]> {
    const res = await apiRequest<Envelope<string[]>>(
      `/appointments/availability?date=${encodeURIComponent(date)}`,
    );
    return res.data;
  },

  async listMine(): Promise<AppointmentDTO[]> {
    const res = await apiRequest<Envelope<RawAppointment[]>>(
      "/appointments/me",
      { auth: true },
    );
    return res.data.map(normalizeAppointment);
  },

  async listAll(): Promise<AppointmentDTO[]> {
    const res = await apiRequest<Envelope<RawAppointment[]>>("/appointments", {
      auth: true,
    });
    return res.data.map(normalizeAppointment);
  },

  async updateStatus(
    id: string,
    status: AppointmentDTO["status"],
  ): Promise<AppointmentDTO> {
    const res = await apiRequest<Envelope<RawAppointment>>(
      `/appointments/${id}/status`,
      {
        method: "PATCH",
        auth: true,
        body: { status: status.toUpperCase() },
      },
    );
    return normalizeAppointment(res.data);
  },
};

// ---------------- Payments ----------------

export interface PaymentSettingsDTO {
  enabled: boolean;
  allow_full: boolean;
  allow_partial: boolean;
  deposit_percent: number;
}

interface RawPaymentSettings {
  enabled: boolean;
  allowFull: boolean;
  allowPartial: boolean;
  depositPercent: number;
}

const normalizePaymentSettings = (
  s: RawPaymentSettings,
): PaymentSettingsDTO => ({
  enabled: s.enabled,
  allow_full: s.allowFull,
  allow_partial: s.allowPartial,
  deposit_percent: s.depositPercent,
});

export interface InitializePaymentResult {
  authorization_url: string;
  reference: string;
  amount: number;
  type: "FULL" | "PARTIAL";
}

interface RawInitialize {
  authorizationUrl: string;
  reference: string;
  amount: number;
  type: "FULL" | "PARTIAL";
}

// Receipt shape returned by verify (payment + its appointment/service).
export interface PaymentReceiptDTO {
  status: PaymentStatus;
  type: PaymentType;
  amount: number;
  total_amount: number;
  balance: number;
  reference: string | null;
  channel: string | null;
  paid_at: string | null;
  full_name: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
}

interface RawVerify {
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  type: "FULL" | "PARTIAL";
  amount: number;
  totalAmount: number;
  reference: string | null;
  channel: string | null;
  paidAt: string | null;
  appointment?: {
    fullName: string;
    appointmentDate: string;
    appointmentTime: string;
    service?: { name: string } | null;
  } | null;
}

export const paymentsApi = {
  async getSettings(): Promise<PaymentSettingsDTO> {
    const res = await apiRequest<Envelope<RawPaymentSettings>>(
      "/payments/settings",
    );
    return normalizePaymentSettings(res.data);
  },

  async updateSettings(input: {
    enabled?: boolean;
    allowFull?: boolean;
    allowPartial?: boolean;
    depositPercent?: number;
  }): Promise<PaymentSettingsDTO> {
    const res = await apiRequest<Envelope<RawPaymentSettings>>(
      "/payments/settings",
      { method: "PUT", auth: true, body: input },
    );
    return normalizePaymentSettings(res.data);
  },

  async initialize(
    appointmentId: string,
    type: "FULL" | "PARTIAL",
  ): Promise<InitializePaymentResult> {
    const res = await apiRequest<Envelope<RawInitialize>>(
      "/payments/initialize",
      { method: "POST", auth: true, body: { appointmentId, type } },
    );
    return {
      authorization_url: res.data.authorizationUrl,
      reference: res.data.reference,
      amount: res.data.amount,
      type: res.data.type,
    };
  },

  async verify(reference: string): Promise<PaymentReceiptDTO> {
    const res = await apiRequest<Envelope<RawVerify>>(
      `/payments/verify?reference=${encodeURIComponent(reference)}`,
      { auth: true },
    );
    return mapVerify(res.data);
  },

  // Combined booking + products charge — returns service payment and/or order.
  async verifyCombined(
    reference: string,
  ): Promise<{ payment: PaymentReceiptDTO | null; order: OrderDTO | null }> {
    const res = await apiRequest<
      Envelope<{ payment: RawVerify | null; order: RawOrder | null }>
    >(`/payments/verify-combined?reference=${encodeURIComponent(reference)}`, {
      auth: true,
    });
    return {
      payment: res.data.payment ? mapVerify(res.data.payment) : null,
      order: res.data.order ? normalizeOrder(res.data.order) : null,
    };
  },
};

const mapVerify = (p: RawVerify): PaymentReceiptDTO => ({
  status: p.status.toLowerCase() as PaymentStatus,
  type: p.type.toLowerCase() as PaymentType,
  amount: p.amount,
  total_amount: p.totalAmount,
  balance: Math.max(0, p.totalAmount - p.amount),
  reference: p.reference,
  channel: p.channel,
  paid_at: p.paidAt,
  full_name: p.appointment?.fullName ?? "",
  service_name: p.appointment?.service?.name ?? "your service",
  appointment_date: p.appointment?.appointmentDate?.slice(0, 10) ?? "",
  appointment_time: p.appointment?.appointmentTime ?? "",
});

// ---------------- Commerce: products ----------------

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  cost_price: number;
  promo_price: number | null;
  on_promo: boolean;
  effective_price: number;
  image_url: string | null;
  category: string;
  stock: number;
  track_stock: boolean;
  in_stock: boolean;
  active: boolean;
  popular: boolean;
}

interface RawProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  costPrice?: number;
  promoPrice: number | null;
  imageUrl: string | null;
  category: string;
  stock: number;
  trackStock: boolean;
  active: boolean;
  popular: boolean;
}

const normalizeProduct = (p: RawProduct): ProductDTO => {
  const onPromo = p.promoPrice != null && p.promoPrice < p.price;
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: p.price,
    cost_price: p.costPrice ?? 0,
    promo_price: p.promoPrice,
    on_promo: onPromo,
    effective_price: onPromo ? (p.promoPrice as number) : p.price,
    image_url: p.imageUrl,
    category: p.category,
    stock: p.stock,
    track_stock: p.trackStock,
    in_stock: !p.trackStock || p.stock > 0,
    active: p.active,
    popular: p.popular,
  };
};

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  promoPrice?: number | null;
  category: string;
  stock?: number;
  trackStock?: boolean;
  active?: boolean;
  popular?: boolean;
  image?: File | null;
}

const productForm = (input: Partial<ProductInput>): FormData => {
  const form = new FormData();
  if (input.name !== undefined) form.append("name", input.name);
  if (input.description !== undefined) form.append("description", input.description);
  if (input.price !== undefined) form.append("price", String(input.price));
  if (input.costPrice !== undefined) form.append("costPrice", String(input.costPrice));
  if (input.promoPrice !== undefined && input.promoPrice !== null)
    form.append("promoPrice", String(input.promoPrice));
  if (input.promoPrice === null) form.append("promoPrice", "");
  if (input.category !== undefined) form.append("category", input.category);
  if (input.stock !== undefined) form.append("stock", String(input.stock));
  if (input.trackStock !== undefined)
    form.append("trackStock", String(input.trackStock));
  if (input.active !== undefined) form.append("active", String(input.active));
  if (input.popular !== undefined) form.append("popular", String(input.popular));
  if (input.image) form.append("image", input.image);
  return form;
};

export const productsApi = {
  async listActive(): Promise<ProductDTO[]> {
    const res = await apiRequest<Envelope<RawProduct[]>>("/products");
    return res.data.map(normalizeProduct);
  },
  async listAll(): Promise<ProductDTO[]> {
    const res = await apiRequest<Envelope<RawProduct[]>>("/products/all", {
      auth: true,
    });
    return res.data.map(normalizeProduct);
  },
  async getOne(id: string): Promise<ProductDTO> {
    const res = await apiRequest<Envelope<RawProduct>>(`/products/${id}`);
    return normalizeProduct(res.data);
  },
  async create(input: ProductInput): Promise<ProductDTO> {
    const res = await apiRequest<Envelope<RawProduct>>("/products", {
      method: "POST",
      auth: true,
      formData: productForm(input),
    });
    return normalizeProduct(res.data);
  },
  async update(id: string, input: Partial<ProductInput>): Promise<ProductDTO> {
    const res = await apiRequest<Envelope<RawProduct>>(`/products/${id}`, {
      method: "PUT",
      auth: true,
      formData: productForm(input),
    });
    return normalizeProduct(res.data);
  },
  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/products/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

export const productCategoriesApi = {
  async listActive(): Promise<CategoryDTO[]> {
    const res = await apiRequest<Envelope<CategoryDTO[]>>("/product-categories");
    return res.data;
  },
  async listAll(): Promise<CategoryDTO[]> {
    const res = await apiRequest<Envelope<CategoryDTO[]>>(
      "/product-categories/all",
      { auth: true },
    );
    return res.data;
  },
  async create(name: string): Promise<CategoryDTO> {
    const res = await apiRequest<Envelope<CategoryDTO>>("/product-categories", {
      method: "POST",
      auth: true,
      body: { name },
    });
    return res.data;
  },
  async update(
    id: string,
    input: { name?: string; active?: boolean; order?: number },
  ): Promise<CategoryDTO> {
    const res = await apiRequest<Envelope<CategoryDTO>>(
      `/product-categories/${id}`,
      { method: "PUT", auth: true, body: input },
    );
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/product-categories/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

// ---------------- Commerce: cart ----------------

export interface CartItemDTO {
  product_id: string;
  name: string;
  unit_price: number;
  image_url: string | null;
  quantity: number;
  line_total: number;
  in_stock: boolean;
  max_qty: number | null; // null when stock isn't tracked
}

export interface CartDTO {
  items: CartItemDTO[];
  subtotal: number;
  count: number;
}

interface RawCart {
  items: {
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: number;
      promoPrice: number | null;
      imageUrl: string | null;
      stock: number;
      trackStock: boolean;
      active: boolean;
    };
  }[];
}

const normalizeCart = (c: RawCart | null): CartDTO => {
  const items = (c?.items ?? []).map((it) => {
    const p = it.product;
    const onPromo = p.promoPrice != null && p.promoPrice < p.price;
    const unit = onPromo ? (p.promoPrice as number) : p.price;
    return {
      product_id: it.productId,
      name: p.name,
      unit_price: unit,
      image_url: p.imageUrl,
      quantity: it.quantity,
      line_total: Math.round(unit * it.quantity * 100) / 100,
      in_stock: p.active && (!p.trackStock || p.stock > 0),
      max_qty: p.trackStock ? p.stock : null,
    };
  });
  const subtotal =
    Math.round(items.reduce((s, i) => s + i.line_total, 0) * 100) / 100;
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return { items, subtotal, count };
};

export const cartApi = {
  async getMine(): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart | null>>("/cart", {
      auth: true,
    });
    return normalizeCart(res.data);
  },
  async addItem(productId: string, quantity = 1): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart>>("/cart/items", {
      method: "POST",
      auth: true,
      body: { productId, quantity },
    });
    return normalizeCart(res.data);
  },
  async updateItem(productId: string, quantity: number): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart>>("/cart/items", {
      method: "PUT",
      auth: true,
      body: { productId, quantity },
    });
    return normalizeCart(res.data);
  },
  async removeItem(productId: string): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart>>(
      `/cart/items/${productId}`,
      { method: "DELETE", auth: true },
    );
    return normalizeCart(res.data);
  },
  async clear(): Promise<CartDTO> {
    const res = await apiRequest<Envelope<RawCart>>("/cart", {
      method: "DELETE",
      auth: true,
    });
    return normalizeCart(res.data);
  },
};

// ---------------- Commerce: orders ----------------

export type OrderStatus = "pending_payment" | "paid" | "fulfilled" | "cancelled";
export type Fulfillment = "pickup" | "delivery";

export interface OrderItemDTO {
  name: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  line_total: number;
  profit: number;
}

export interface OrderDTO {
  id: string;
  order_number: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  delivery_address: string | null;
  delivery_phone: string | null;
  subtotal: number;
  discount_amount: number;
  points_redeemed: number;
  delivery_fee: number;
  total: number;
  profit: number; // Σ (unit-cost)×qty, excludes delivery — commerce revenue
  reference: string | null;
  paid_at: string | null;
  created_at: string;
  is_guest: boolean;
  appointment_id: string | null;
  items: OrderItemDTO[];
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
}

interface RawOrder {
  id: string;
  orderNumber: string;
  status: "PENDING_PAYMENT" | "PAID" | "FULFILLED" | "CANCELLED";
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  subtotal: number;
  discountAmount?: number;
  pointsRedeemed?: number;
  deliveryFee: number;
  total: number;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
  userId?: string | null;
  appointmentId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items: { name: string; unitPrice: number; costPrice?: number; quantity: number }[];
  user?: { email: string; profile?: { fullName: string | null } | null } | null;
}

const normalizeOrder = (o: RawOrder): OrderDTO => {
  const items = o.items.map((i) => {
    const cost = i.costPrice ?? 0;
    return {
      name: i.name,
      unit_price: i.unitPrice,
      cost_price: cost,
      quantity: i.quantity,
      line_total: Math.round(i.unitPrice * i.quantity * 100) / 100,
      profit: Math.round((i.unitPrice - cost) * i.quantity * 100) / 100,
    };
  });
  const profit =
    Math.round(items.reduce((s, i) => s + i.profit, 0) * 100) / 100;
  return {
    id: o.id,
    order_number: o.orderNumber,
    status: o.status.toLowerCase() as OrderStatus,
    fulfillment: o.fulfillment.toLowerCase() as Fulfillment,
    delivery_address: o.deliveryAddress,
    delivery_phone: o.deliveryPhone,
    subtotal: o.subtotal,
    discount_amount: o.discountAmount ?? 0,
    points_redeemed: o.pointsRedeemed ?? 0,
    delivery_fee: o.deliveryFee,
    total: o.total,
    profit,
    reference: o.reference,
    paid_at: o.paidAt,
    created_at: o.createdAt,
    is_guest: !o.userId,
    appointment_id: o.appointmentId ?? null,
    items,
    customer_name: o.customerName ?? o.user?.profile?.fullName ?? null,
    customer_email: o.customerEmail ?? o.user?.email ?? null,
    customer_phone: o.customerPhone ?? null,
  };
};

export interface CheckoutInput {
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryAddress?: string;
  deliveryPhone?: string;
  applyPoints?: boolean;
  referralCode?: string;
}

export interface GuestCheckoutInput {
  items: { productId: string; quantity: number }[];
  name: string;
  email: string;
  phone: string;
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryAddress?: string;
  deliveryPhone?: string;
  referralCode?: string;
}

export interface CheckoutResult {
  authorization_url: string;
  reference: string;
  order_id: string;
  order_number: string;
  total: number;
}

interface RawCheckout {
  authorizationUrl: string;
  reference: string;
  orderId: string;
  orderNumber?: string;
  total: number;
}

const mapCheckout = (d: RawCheckout): CheckoutResult => ({
  authorization_url: d.authorizationUrl,
  reference: d.reference,
  order_id: d.orderId,
  order_number: d.orderNumber ?? "",
  total: d.total,
});

export const ordersApi = {
  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    const res = await apiRequest<Envelope<RawCheckout>>("/orders/checkout", {
      method: "POST",
      auth: true,
      body: input,
    });
    return mapCheckout(res.data);
  },

  async guestCheckout(input: GuestCheckoutInput): Promise<CheckoutResult> {
    const res = await apiRequest<Envelope<RawCheckout>>(
      "/orders/guest-checkout",
      { method: "POST", body: input },
    );
    return mapCheckout(res.data);
  },

  async bookingCheckout(input: {
    appointmentId: string;
    items: { productId: string; quantity: number }[];
    serviceType?: "FULL" | "PARTIAL";
    referralCode?: string;
  }): Promise<CheckoutResult & { service_due_now: number; product_subtotal: number }> {
    const res = await apiRequest<
      Envelope<RawCheckout & { serviceDueNow: number; productSubtotal: number }>
    >("/orders/booking-checkout", { method: "POST", auth: true, body: input });
    return {
      ...mapCheckout(res.data),
      service_due_now: res.data.serviceDueNow,
      product_subtotal: res.data.productSubtotal,
    };
  },
  async listMine(): Promise<OrderDTO[]> {
    const res = await apiRequest<Envelope<RawOrder[]>>("/orders/me", {
      auth: true,
    });
    return res.data.map(normalizeOrder);
  },
  async listAll(): Promise<OrderDTO[]> {
    const res = await apiRequest<Envelope<RawOrder[]>>("/orders", {
      auth: true,
    });
    return res.data.map(normalizeOrder);
  },
  async verify(reference: string): Promise<OrderDTO> {
    const res = await apiRequest<Envelope<RawOrder>>(
      `/orders/verify?reference=${encodeURIComponent(reference)}`,
      { auth: true },
    );
    return normalizeOrder(res.data);
  },
  async updateStatus(id: string, status: OrderStatus): Promise<OrderDTO> {
    const res = await apiRequest<Envelope<RawOrder>>(`/orders/${id}/status`, {
      method: "PATCH",
      auth: true,
      body: { status: status.toUpperCase() },
    });
    return normalizeOrder(res.data);
  },
};

// ---------------- Commerce: settings ----------------

export interface CommerceSettingsDTO {
  enabled: boolean;
  enable_pickup: boolean;
  enable_delivery: boolean;
  delivery_fee: number;
}

interface RawCommerceSettings {
  enabled: boolean;
  enablePickup: boolean;
  enableDelivery: boolean;
  deliveryFee: number;
}

const normalizeCommerceSettings = (
  s: RawCommerceSettings,
): CommerceSettingsDTO => ({
  enabled: s.enabled,
  enable_pickup: s.enablePickup,
  enable_delivery: s.enableDelivery,
  delivery_fee: s.deliveryFee,
});

export const commerceApi = {
  async getSettings(): Promise<CommerceSettingsDTO> {
    const res = await apiRequest<Envelope<RawCommerceSettings>>(
      "/commerce/settings",
    );
    return normalizeCommerceSettings(res.data);
  },
  async updateSettings(input: {
    enabled?: boolean;
    enablePickup?: boolean;
    enableDelivery?: boolean;
    deliveryFee?: number;
  }): Promise<CommerceSettingsDTO> {
    const res = await apiRequest<Envelope<RawCommerceSettings>>(
      "/commerce/settings",
      { method: "PUT", auth: true, body: input },
    );
    return normalizeCommerceSettings(res.data);
  },
};

// ---------------- Reviews ----------------

export interface ReviewDTO {
  id: string;
  rating: number;
  content: string;
  approved: boolean;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  services: { name: string } | null;
}

interface RawReview {
  id: string;
  rating: number;
  content: string | null;
  approved: boolean;
  createdAt: string;
  user?: { email: string; profile?: { fullName: string | null } | null } | null;
  service?: { name: string } | null;
}

const normalizeReview = (r: RawReview): ReviewDTO => ({
  id: r.id,
  rating: r.rating,
  content: r.content ?? "",
  approved: r.approved,
  created_at: r.createdAt,
  profiles: r.user
    ? {
        full_name: r.user.profile?.fullName || "Anonymous",
        email: r.user.email,
      }
    : null,
  services: r.service ? { name: r.service.name } : null,
});

export interface CreateReviewInput {
  rating: number;
  content: string;
  serviceId?: string;
  appointmentId?: string;
}

export const reviewsApi = {
  async listApproved(): Promise<ReviewDTO[]> {
    const res = await apiRequest<Envelope<RawReview[]>>("/reviews");
    return res.data.map(normalizeReview);
  },

  async listAll(): Promise<ReviewDTO[]> {
    const res = await apiRequest<Envelope<RawReview[]>>("/reviews/all", {
      auth: true,
    });
    return res.data.map(normalizeReview);
  },

  async create(input: CreateReviewInput): Promise<ReviewDTO> {
    const res = await apiRequest<Envelope<RawReview>>("/reviews", {
      method: "POST",
      auth: true,
      body: {
        rating: input.rating,
        content: input.content,
        ...(input.serviceId ? { serviceId: input.serviceId } : {}),
        ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
      },
    });
    return normalizeReview(res.data);
  },

  async setApproved(id: string, approved: boolean): Promise<ReviewDTO> {
    const res = await apiRequest<Envelope<RawReview>>(`/reviews/${id}/approve`, {
      method: "PATCH",
      auth: true,
      body: { approved },
    });
    return normalizeReview(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/reviews/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

// ---------------- Gallery ----------------

export interface GalleryImageDTO {
  id: string;
  title: string;
  category: ServiceCategory;
  image_url: string;
  media_type: "image" | "video";
  active: boolean;
  created_at: string;
}

interface RawGalleryImage {
  id: string;
  title: string | null;
  category: string;
  imageUrl: string;
  mediaType?: "IMAGE" | "VIDEO";
  active: boolean;
  createdAt: string;
}

const normalizeGalleryImage = (g: RawGalleryImage): GalleryImageDTO => ({
  id: g.id,
  title: g.title ?? "",
  category: g.category,
  image_url: g.imageUrl,
  media_type: g.mediaType === "VIDEO" ? "video" : "image",
  active: g.active,
  created_at: g.createdAt,
});

export const galleryApi = {
  async listActive(): Promise<GalleryImageDTO[]> {
    const res = await apiRequest<Envelope<RawGalleryImage[]>>("/gallery");
    return res.data.map(normalizeGalleryImage);
  },

  async listAll(): Promise<GalleryImageDTO[]> {
    const res = await apiRequest<Envelope<RawGalleryImage[]>>("/gallery/all", {
      auth: true,
    });
    return res.data.map(normalizeGalleryImage);
  },

  async upload(
    file: File,
    title: string,
    category: string,
  ): Promise<GalleryImageDTO> {
    const form = new FormData();
    form.append("image", file);
    form.append("title", title);
    form.append("category", category);
    const res = await apiRequest<Envelope<RawGalleryImage>>("/gallery", {
      method: "POST",
      auth: true,
      formData: form,
    });
    return normalizeGalleryImage(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/gallery/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

// ---------------- Business Hours ----------------

export interface BusinessHourDTO {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

interface RawBusinessHour {
  id: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

const normalizeBusinessHour = (h: RawBusinessHour): BusinessHourDTO => ({
  id: h.id,
  day_of_week: h.dayOfWeek,
  open_time: h.openTime,
  close_time: h.closeTime,
  is_closed: h.isClosed,
});

export const businessHoursApi = {
  async list(): Promise<BusinessHourDTO[]> {
    const res = await apiRequest<Envelope<RawBusinessHour[]>>(
      "/business-hours",
    );
    return res.data.map(normalizeBusinessHour);
  },

  async update(
    id: string,
    input: {
      open_time?: string | null;
      close_time?: string | null;
      is_closed?: boolean;
    },
  ): Promise<BusinessHourDTO> {
    const body: Record<string, unknown> = {};
    if (input.open_time !== undefined) body.openTime = input.open_time;
    if (input.close_time !== undefined) body.closeTime = input.close_time;
    if (input.is_closed !== undefined) body.isClosed = input.is_closed;
    const res = await apiRequest<Envelope<RawBusinessHour>>(
      `/business-hours/${id}`,
      { method: "PUT", auth: true, body },
    );
    return normalizeBusinessHour(res.data);
  },
};
