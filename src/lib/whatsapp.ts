// WhatsApp click-to-chat links (https://wa.me/<number>?text=<message>).
//
// wa.me only works with the full international number, digits only: a local
// "024 555 0142" must become "233245550142" or the link opens nothing. Every
// WhatsApp link in the app goes through here, and a number that can't be made
// valid gives null, so callers hide the button instead of showing a dead one.

// Numbers written the local way (leading 0) are Ghanaian.
const DEFAULT_COUNTRY_CODE = "233";

/** A number in international digits-only form, or null if it isn't usable. */
export const toWhatsappNumber = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+")) {
    // Already international: "+233 24 555 0142".
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2); // "00233…" international dialling prefix
  } else if (digits.startsWith("0")) {
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1); // local "024…"
  } else if (digits.length === 9) {
    digits = DEFAULT_COUNTRY_CODE + digits; // local without the 0: "24…"
  }
  // E.164 numbers are at most 15 digits; anything under 10 is a fragment.
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
};

/**
 * A wa.me link to `raw`, optionally with a pre-filled message (the sender still
 * taps send), or null when the number can't receive WhatsApp messages.
 */
export const whatsappLink = (
  raw: string | null | undefined,
  message?: string,
): string | null => {
  const number = toWhatsappNumber(raw);
  if (!number) return null;
  return message
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${number}`;
};

/** "+233 24 555 0142" for display; falls back to the raw text. */
export const formatWhatsappNumber = (raw: string | null | undefined): string => {
  const n = toWhatsappNumber(raw);
  if (!n) return raw ?? "";
  if (n.startsWith(DEFAULT_COUNTRY_CODE) && n.length === 12) {
    const local = n.slice(3);
    return `+${DEFAULT_COUNTRY_CODE} ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  return `+${n}`;
};
