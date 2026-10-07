import { apiRequest } from "../apiClient";
import { CursorPage, Envelope, cursorPage, cursorQuery, uploadStudioMedia } from "./core";
import { BusySlot } from "./ledger";
import { AppointmentDTO, RawAppointment, normalizeAppointment } from "./models";

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


export const appointmentsApi = {
  async create(input: CreateAppointmentInput): Promise<AppointmentDTO> {
    const designImageUrl = input.design_image ? await uploadStudioMedia(input.design_image, "appointments") : undefined;

    const res = await apiRequest<Envelope<RawAppointment>>("/appointments", {
      method: "POST",
      auth: true, // optionalAuth server-side; token attached if present
      body: { fullName: input.full_name, phone: input.phone, email: input.email, serviceId: input.service_id, appointmentDate: input.appointment_date, appointmentTime: input.appointment_time, notes: input.notes, applyPoints: input.apply_points ? "true" : undefined, designImageUrl },
    });
    return normalizeAppointment(res.data);
  },

  // Time slots already taken for a date (so the picker can exclude them).
  /**
   * Slots blocked on a date, accounting for how long each booking runs.
   *
   * `takenSlots` remains the exact start times. `busySlots` is what a picker
   * should use: a 4-hour service starting at 10:00 blocks 11:00 too, and the
   * server refuses those, so offering them would just produce errors.
   */
  async busySlots(date: string): Promise<BusySlot[]> {
    const res = await apiRequest<Envelope<string[]> & { busy?: BusySlot[] }>(
      `/appointments/availability?date=${encodeURIComponent(date)}`,
    );
    return res.busy ?? [];
  },

  async takenSlots(date: string): Promise<string[]> {
    const res = await apiRequest<Envelope<string[]>>(
      `/appointments/availability?date=${encodeURIComponent(date)}`,
    );
    return res.data;
  },

  async listMine(): Promise<AppointmentDTO[]> {
    const res = await apiRequest<Envelope<RawAppointment[]>>(`/appointments/me?${cursorQuery(undefined, 100)}`, { auth: true });
    return res.data.map(normalizeAppointment);
  },

  async listMinePage(cursor?: string | null, limit = 25): Promise<CursorPage<AppointmentDTO>> {
    const res = await apiRequest<Envelope<RawAppointment[]>>(`/appointments/me?${cursorQuery(cursor, limit)}`, { auth: true });
    return { ...cursorPage(res), items: res.data.map(normalizeAppointment) };
  },

  async listAll(): Promise<AppointmentDTO[]> {
    const res = await apiRequest<Envelope<RawAppointment[]>>(`/appointments?${cursorQuery(undefined, 100)}`, {
      auth: true,
    });
    return res.data.map(normalizeAppointment);
  },

  async listAllPage(cursor?: string | null, limit = 25): Promise<CursorPage<AppointmentDTO>> {
    const res = await apiRequest<Envelope<RawAppointment[]>>(`/appointments?${cursorQuery(cursor, limit)}`, { auth: true });
    return { ...cursorPage(res), items: res.data.map(normalizeAppointment) };
  },

  // Analytics needs the full date range for correct totals; fetch bounded pages
  // sequentially instead of making one unbounded API response.
  async listAllForAnalytics(): Promise<AppointmentDTO[]> {
    const all: AppointmentDTO[] = [];
    let cursor: string | null = null;
    do {
      const page = await appointmentsApi.listAllPage(cursor, 100);
      all.push(...page.items);
      cursor = page.hasMore ? page.nextCursor : null;
    } while (cursor);
    return all;
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

  // Swap the booked service (admin). Re-prices the booking, and may trigger a
  // refund or leave a balance due — the server returns which.
  async changeService(
    id: string,
    serviceId: string,
  ): Promise<{
    message: string;
    data: {
      newDue: number;
      netPaid: number;
      refunded: number;
      balanceDue: number;
    };
  }> {
    return apiRequest(`/appointments/${id}/service`, {
      method: "PATCH",
      auth: true,
      body: { serviceId },
    });
  },

  // Move a booking to a new slot. The server enforces the rules (no clash, not
  // cancelled or completed, not the same slot) and emails the customer.
  async reschedule(
    id: string,
    input: { date: string; time: string; reason?: string },
  ): Promise<AppointmentDTO> {
    const res = await apiRequest<Envelope<RawAppointment>>(
      `/appointments/${id}/reschedule`,
      { method: "PATCH", auth: true, body: input },
    );
    return normalizeAppointment(res.data);
  },

  // Permanently removes a booking (studio admin). Cancelling sets a status;
  // this deletes the record outright, so callers confirm first.
  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/appointments/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};
