// Build a click-to-send WhatsApp deep link with a pre-filled message.
// Opens the chat with the given number; the sender still taps "send".
export const whatsappLink = (phone: string, message: string): string => {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};
