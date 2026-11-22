// Orders are sent by the customer from their own WhatsApp; nothing is stored on a server.

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

export interface WhatsAppOrder {
  storeName: string;
  reference: string;
  items: { name: string; option: string; price: number | null; quantity: number }[];
  deliveryFee: number;
  deliveryLabel: string;
  payment: string;
  trxId: string;
  customerName: string;
  phone: string;
  email: string;
  district: string;
  area: string;
  address: string;
  notes: string;
}

const taka = (n: number) => `৳${n.toLocaleString("en-US")}`;

export function whatsAppOrderUrl(number: string, o: WhatsAppOrder): string {
  const unpriced = o.items.some((i) => i.price === null);
  const subtotal = o.items.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0);
  const lines = [
    `*New order: ${o.storeName}*`,
    `Reference: ${o.reference}`,
    "",
    ...o.items.map((i, n) => {
      const title = `${n + 1}. ${i.name}${i.option ? ` (${i.option})` : ""}`;
      const amount =
        i.price === null ? `${i.quantity} x price to confirm` : `${i.quantity} x ${taka(i.price)} = ${taka(i.price * i.quantity)}`;
      return `${title}\n   ${amount}`;
    }),
    "",
    ...(unpriced ? [] : [`Subtotal: ${taka(subtotal)}`]),
    `Delivery (${o.deliveryLabel}): ${taka(o.deliveryFee)}`,
    unpriced ? "*Total: please confirm*" : `*Total: ${taka(subtotal + o.deliveryFee)}*`,
    `Payment: ${o.payment}${o.trxId ? ` (TrxID: ${o.trxId})` : ""}`,
    "",
    `Name: ${o.customerName}`,
    `Mobile: ${o.phone}`,
    ...(o.email ? [`Email: ${o.email}`] : []),
    `Address: ${o.address}`,
    `Area: ${o.area}`,
    `District: ${o.district}`,
    ...(o.notes ? [`Note: ${o.notes}`] : []),
  ];
  return whatsAppChatUrl(number, lines.join("\n"));
}
