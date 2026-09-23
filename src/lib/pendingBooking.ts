// Remembers a booking a guest started filling out, so it can be restored after
// they log in / sign up and are redirected back to /book. The design-reference
// image (a File) can't be serialised, so it isn't preserved — everything else
// (service, date, time, contact, add-ons, options) is.
const KEY = "pendingBooking";

export interface PendingBooking {
  fullName?: string;
  phone?: string;
  email?: string;
  service?: string;
  date?: string; // ISO date string
  time?: string;
  notes?: string;
  addOns?: Record<string, number>;
  applyPoints?: boolean;
  paymentMethod?: "full" | "partial";
  referral?: string;
}

export const setPendingBooking = (b: PendingBooking) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* ignore */
  }
};

export const takePendingBooking = (): PendingBooking | null => {
  try {
    const v = localStorage.getItem(KEY);
    if (!v) return null;
    localStorage.removeItem(KEY);
    return JSON.parse(v) as PendingBooking;
  } catch {
    return null;
  }
};
