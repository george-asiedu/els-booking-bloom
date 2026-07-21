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

export type ServiceCategory = "nails" | "lashes" | "hair";
export type ServiceCategoryEnum = "NAILS" | "LASHES" | "HAIR";

export interface ServiceDTO {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration: string;
  price: number;
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

export interface AppointmentDTO {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  service_id: string;
  appointment_date: string; // yyyy-MM-dd
  appointment_time: string;
  notes: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  user_id: string | null;
  created_at: string;
  services: AppointmentServiceDTO | null;
}

// ---------------- Raw server shapes ----------------

interface RawService {
  id: string;
  name: string;
  category: ServiceCategoryEnum;
  description: string | null;
  duration: string;
  price: number;
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
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  userId: string | null;
  createdAt: string;
  service?: {
    id: string;
    name: string;
    duration: string;
    price: number;
    category: ServiceCategoryEnum;
  } | null;
}

// ---------------- Normalizers ----------------

const toDateOnly = (iso: string): string => {
  // Server stores appointmentDate at UTC midnight; take the calendar date.
  return iso.slice(0, 10);
};

const normalizeService = (s: RawService): ServiceDTO => ({
  id: s.id,
  name: s.name,
  category: s.category.toLowerCase() as ServiceCategory,
  description: s.description ?? "",
  duration: s.duration,
  price: s.price,
  popular: s.popular,
  active: s.active,
  image_url: s.imageUrl,
});

const normalizeAppointment = (a: RawAppointment): AppointmentDTO => ({
  id: a.id,
  full_name: a.fullName,
  phone: a.phone,
  email: a.email,
  service_id: a.serviceId,
  appointment_date: toDateOnly(a.appointmentDate),
  appointment_time: a.appointmentTime,
  notes: a.notes,
  status: a.status.toLowerCase() as AppointmentDTO["status"],
  user_id: a.userId,
  created_at: a.createdAt,
  services: a.service
    ? {
        id: a.service.id,
        name: a.service.name,
        duration: a.service.duration,
        price: a.service.price,
        category: a.service.category.toLowerCase() as ServiceCategory,
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

// ---------------- Services ----------------

const toCategoryEnum = (c: string): ServiceCategoryEnum => {
  const upper = c.toUpperCase();
  if (upper === "LASHES") return "LASHES";
  if (upper === "HAIR") return "HAIR";
  return "NAILS";
};

export interface ServiceInput {
  name: string;
  category: string;
  description?: string;
  duration: string;
  price: number;
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
      body: { ...input, category: toCategoryEnum(input.category) },
    });
    return normalizeService(res.data);
  },

  async update(id: string, input: Partial<ServiceInput>): Promise<ServiceDTO> {
    const body: Record<string, unknown> = { ...input };
    if (input.category) body.category = toCategoryEnum(input.category);
    const res = await apiRequest<Envelope<RawService>>(`/services/${id}`, {
      method: "PUT",
      auth: true,
      body,
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

// ---------------- Appointments ----------------

export interface CreateAppointmentInput {
  full_name: string;
  phone: string;
  email?: string | null;
  service_id: string;
  appointment_date: string; // yyyy-MM-dd
  appointment_time: string;
  notes?: string | null;
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
    const res = await apiRequest<Envelope<RawAppointment>>("/appointments", {
      method: "POST",
      auth: true, // optionalAuth server-side; token attached if present
      body: {
        fullName: input.full_name,
        phone: input.phone,
        ...(input.email ? { email: input.email } : {}),
        serviceId: input.service_id,
        appointmentDate: input.appointment_date,
        appointmentTime: input.appointment_time,
        ...(input.notes ? { notes: input.notes } : {}),
      },
    });
    return normalizeAppointment(res.data);
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
  active: boolean;
  created_at: string;
}

interface RawGalleryImage {
  id: string;
  title: string | null;
  category: ServiceCategoryEnum;
  imageUrl: string;
  active: boolean;
  createdAt: string;
}

const normalizeGalleryImage = (g: RawGalleryImage): GalleryImageDTO => ({
  id: g.id,
  title: g.title ?? "",
  category: g.category.toLowerCase() as ServiceCategory,
  image_url: g.imageUrl,
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
    form.append("category", toCategoryEnum(category));
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
