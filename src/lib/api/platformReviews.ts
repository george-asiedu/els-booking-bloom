import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Platform testimonials ----------------

export interface PlatformTestimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  content: string;
  rating: number;
}

export interface MyTestimonial extends PlatformTestimonial {
  approved: boolean;
  createdAt: string;
}

export const platformReviewsApi = {
  // Public: approved testimonials for the landing page.
  async listApproved(): Promise<PlatformTestimonial[]> {
    const res = await apiRequest<Envelope<PlatformTestimonial[]>>(
      "/platform-reviews",
    );
    return res.data;
  },
  async submit(input: {
    authorName: string;
    authorRole?: string;
    content: string;
    rating: number;
  }): Promise<MyTestimonial> {
    const res = await apiRequest<Envelope<MyTestimonial>>("/platform-reviews", {
      method: "POST",
      auth: true,
      body: input,
    });
    return res.data;
  },
  async listMine(): Promise<MyTestimonial[]> {
    const res = await apiRequest<Envelope<MyTestimonial[]>>(
      "/platform-reviews/mine",
      { auth: true },
    );
    return res.data;
  },
};
