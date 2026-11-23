import { apiRequest } from "@/lib/apiClient";
import { uploadStudioMedia } from "@/lib/api/core";

export interface StaffDTO {
  id: string;
  name: string;
  role: string | null;
  photoUrl: string | null;
  /** Services this person does; empty means all. */
  serviceIds: string[];
  active?: boolean;
  order?: number;
}

export interface StaffInput {
  name: string;
  role?: string | null;
  serviceIds: string[];
  active: boolean;
  photo?: File | null;
  photoUrl?: string | null;
}

const body = async (input: Partial<StaffInput>) => ({
  ...input,
  photo: undefined,
  ...(input.photo ? { photoUrl: await uploadStudioMedia(input.photo, "staff") } : {}),
});

export const staffApi = {
  async listActive(): Promise<StaffDTO[]> {
    return (await apiRequest<{ data: StaffDTO[] }>("/staff")).data;
  },
  async listAll(): Promise<StaffDTO[]> {
    return (await apiRequest<{ data: StaffDTO[] }>("/staff/all", { auth: true })).data;
  },
  async create(input: StaffInput): Promise<StaffDTO> {
    return (await apiRequest<{ data: StaffDTO }>("/staff", { method: "POST", auth: true, body: await body(input) })).data;
  },
  async update(id: string, input: Partial<StaffInput>): Promise<StaffDTO> {
    return (await apiRequest<{ data: StaffDTO }>(`/staff/${id}`, { method: "PUT", auth: true, body: await body(input) })).data;
  },
  async remove(id: string): Promise<void> {
    await apiRequest(`/staff/${id}`, { method: "DELETE", auth: true });
  },
};

/** Whether a staff member does a service (no list means they do them all). */
export const doesService = (s: StaffDTO, serviceId: string | undefined) =>
  !serviceId || !s.serviceIds.length || s.serviceIds.includes(serviceId);
