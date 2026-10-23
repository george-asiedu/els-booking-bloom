import type { BusySlot } from "./api";

/**
 * Slot arithmetic for the booking picker.
 *
 * Times reach us in two notations — the picker's own labels are 12-hour
 * ("10:00 AM") while the API normalises to 24-hour — so everything here works
 * in minutes since midnight rather than comparing strings.
 */
export const parseTimeMinutes = (raw: string | null | undefined): number | null => {
  if (!raw) return null;
  const text = raw.trim().toLowerCase();

  const twelve = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/.exec(text);
  if (twelve) {
    let hour = Number(twelve[1]);
    const mins = Number(twelve[2] ?? 0);
    if (hour < 1 || hour > 12 || mins > 59) return null;
    // 12 AM is midnight, 12 PM is noon.
    if (twelve[3] === "am") hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
    return hour * 60 + mins;
  }

  const twentyFour = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    const mins = Number(twentyFour[2]);
    if (hour > 23 || mins > 59) return null;
    return hour * 60 + mins;
  }
  return null;
};

/** Minutes from a human duration ("2 hrs", "45 min"); null when unreadable. */
export const parseDurationMinutes = (
  duration: string | null | undefined,
): number | null => {
  if (!duration) return null;
  const text = duration.toLowerCase().trim();
  const combined =
    /^(\d+)\s*(?:h|hr|hrs|hour|hours|:)\s*(\d{1,2})\s*(?:m|min|mins|minutes)?$/.exec(
      text,
    );
  if (combined) return Number(combined[1]) * 60 + Number(combined[2]);
  const value = /(\d+(?:\.\d+)?)/.exec(text);
  if (!value) return null;
  const n = Number(value[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (/\b(m|min|mins|minute|minutes)\b/.test(text)) return Math.round(n);
  if (/\b(h|hr|hrs|hour|hours)\b/.test(text)) return Math.round(n * 60);
  return Math.round(n * 60);
};

/**
 * Whether a candidate slot collides with anything already booked.
 *
 * Mirrors the server's rule exactly, so the picker never offers a time the
 * server will refuse: half-open intervals (a booking ending at 12:00 does not
 * clash with one starting at 12:00), and an unknown length still collides on
 * an identical start.
 */
export const slotIsBusy = (
  slotLabel: string,
  serviceMinutes: number | null,
  busy: BusySlot[],
): boolean => {
  const start = parseTimeMinutes(slotLabel);
  if (start === null) return false;
  const end = start + (serviceMinutes ?? 0);

  return busy.some((b) => {
    const otherStart = parseTimeMinutes(b.start) ?? parseTimeMinutes(b.label);
    if (otherStart === null) return false;
    const otherEnd = otherStart + (b.minutes || 0);
    return start === otherStart || (start < otherEnd && otherStart < end);
  });
};

/** Does this slot run past closing? `closeTime` may be 12- or 24-hour. */
export const slotRunsPastClose = (
  slotLabel: string,
  serviceMinutes: number | null,
  closeTime: string | null | undefined,
): boolean => {
  const start = parseTimeMinutes(slotLabel);
  const close = parseTimeMinutes(closeTime);
  if (start === null || close === null || !serviceMinutes) return false;
  return start + serviceMinutes > close;
};
