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
  }): Promise<FeatureRequestDTO> {
    const res = await apiRequest<Envelope<FeatureRequestDTO>>(
      "/feature-requests",
      { method: "POST", auth: true, body: input },
    );
    return res.data;
  },
};
