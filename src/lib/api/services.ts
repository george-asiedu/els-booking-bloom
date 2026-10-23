import { apiRequest } from "../apiClient";
import { CursorPage, Envelope, cursorPage, cursorQuery, uploadStudioMedia } from "./core";
import { RawService, ServiceDTO, normalizeService } from "./models";

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
  image?: File;
  imageUrl?: string | null;
}

const serviceFormData = (input: ServiceInput): FormData => {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || key === "image") return;
    if (value === null) form.append(key, "");
    else form.append(key, String(value));
  });
  if (input.image) form.append("image", input.image);
  return form;
};

export const servicesApi = {
  async listActive(): Promise<ServiceDTO[]> {
    const res = await apiRequest<Envelope<RawService[]>>(`/services?${cursorQuery(undefined, 100)}`);
    return res.data.map(normalizeService);
  },

  async listActivePage(cursor?: string | null, limit = 24): Promise<CursorPage<ServiceDTO>> {
    const res = await apiRequest<Envelope<RawService[]>>(`/services?${cursorQuery(cursor, limit)}`);
    return { ...cursorPage(res), items: res.data.map(normalizeService) };
  },

  async listAll(): Promise<ServiceDTO[]> {
    const res = await apiRequest<Envelope<RawService[]>>(`/services/all?${cursorQuery(undefined, 100)}`, {
      auth: true,
    });
    return res.data.map(normalizeService);
  },

  async listAllPage(cursor?: string | null, limit = 25): Promise<CursorPage<ServiceDTO>> {
    const res = await apiRequest<Envelope<RawService[]>>(`/services/all?${cursorQuery(cursor, limit)}`, { auth: true });
    return { ...cursorPage(res), items: res.data.map(normalizeService) };
  },

  async create(input: ServiceInput): Promise<ServiceDTO> {
    const imageUrl = input.image ? await uploadStudioMedia(input.image, "services") : input.imageUrl;
    const payload = { ...input, image: undefined, imageUrl };
    const res = await apiRequest<Envelope<RawService>>("/services", {
      method: "POST",
      auth: true,
      body: payload,
    });
    return normalizeService(res.data);
  },

  async update(id: string, input: Partial<ServiceInput>): Promise<ServiceDTO> {
    const imageUrl = input.image ? await uploadStudioMedia(input.image, "services") : input.imageUrl;
    const payload = { ...input, image: undefined, imageUrl };
    const res = await apiRequest<Envelope<RawService>>(`/services/${id}`, {
      method: "PUT",
      auth: true,
      body: payload,
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
