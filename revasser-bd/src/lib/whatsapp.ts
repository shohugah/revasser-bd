// WhatsApp is a contact channel only. Orders are placed on the website (see src/lib/orders.ts).

/** Turns the ways a Bangladeshi mobile number gets typed into 8801XXXXXXXXX, or "" if it isn't one. */
export function toWhatsAppNumber(input: string): string {
  const digits = input
    .replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
    .replace(/\D/g, "")
    .replace(/^00/, "")
    .replace(/^(880|88)?0?(?=1[3-9]\d{8}$)/, "");
  return /^1[3-9]\d{8}$/.test(digits) ? `880${digits}` : "";
}

export const whatsAppChatUrl = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
