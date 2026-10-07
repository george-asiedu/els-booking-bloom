import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

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
