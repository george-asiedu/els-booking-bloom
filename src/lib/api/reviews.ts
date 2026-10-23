import { apiRequest } from "../apiClient";
import { CursorPage, Envelope, cursorPage, cursorQuery } from "./core";

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
    const res = await apiRequest<Envelope<RawReview[]>>(`/reviews/all?${cursorQuery(undefined, 100)}`, {
      auth: true,
    });
    return res.data.map(normalizeReview);
  },
  async listAllPage(cursor?: string | null, limit = 25): Promise<CursorPage<ReviewDTO>> {
    const res = await apiRequest<Envelope<RawReview[]>>(`/reviews/all?${cursorQuery(cursor, limit)}`, { auth: true });
    return { ...cursorPage(res), items: res.data.map(normalizeReview) };
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
