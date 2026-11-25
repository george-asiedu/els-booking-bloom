import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Feature requests (studio -> platform) ----------------

export type FeatureRequestStatus =
  | "NEW"
  | "PLANNED"
  | "IN_PROGRESS"
  | "DONE"
  | "DECLINED";

export interface FeatureRequestDTO {
  id: string;
  title: string;
  description: string;
  status: FeatureRequestStatus;
  /** A one-off fee set by Zuri (GHS). Null until decided; 0 is free. */
  feeAmount?: number | null;
  // Added to the plan price every month after the first billing.
  monthlyFee?: number | null;
  /** Pictures attached to the request (up to 5). */
  images?: string[];
  createdAt: string;
}

export const featureRequestsApi = {
  async list(): Promise<FeatureRequestDTO[]> {
    const res = await apiRequest<Envelope<FeatureRequestDTO[]>>(
      "/feature-requests",
      { auth: true },
    );
    return res.data;
  },

  async create(input: {
    title: string;
    description: string;
    images?: string[];
  }): Promise<FeatureRequestDTO> {
    const res = await apiRequest<Envelope<FeatureRequestDTO>>(
      "/feature-requests",
      { method: "POST", auth: true, body: input },
    );
    return res.data;
  },
  async withdraw(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/feature-requests/${id}/withdraw`, { method: "POST", auth: true });
  },
};
