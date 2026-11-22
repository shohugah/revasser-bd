// Orders are sent by the customer from their own WhatsApp; nothing is stored here.

/** Turns the ways a Bangladeshi mobile number gets typed into 8801XXXXXXXXX, or "" if it isn't one. */
export function toWhatsAppNumber(input: string): string {
  const digits = input
    .replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
    .replace(/\D/g, "")
    .replace(/^00/, "")
    .replace(/^(880|88)?0?(?=1[3-9]\d{8}$)/, "");
  return /^1[3-9]\d{8}$/.test(digits) ? `880${digits}` : "";
}

export interface WhatsAppOrder {
  storeName: string;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  deliveryLabel: string;
  payment: string;
  trxId: string;
  customerName: string;
  phone: string;
  district: string;
  area: string;
  address: string;
}

const taka = (n: number) => `৳${n.toLocaleString("en-US")}`;

export function whatsAppOrderUrl(number: string, o: WhatsAppOrder): string {
  const lines = [
    `*New order: ${o.storeName}*`,
    "",
    ...o.items.map((i, n) => `${n + 1}. ${i.name}\n   ${i.quantity} x ${taka(i.price)} = ${taka(i.price * i.quantity)}`),
    "",
    `Subtotal: ${taka(o.subtotal)}`,
    `Delivery (${o.deliveryLabel}): ${taka(o.deliveryFee)}`,
    `*Total: ${taka(o.subtotal + o.deliveryFee)}*`,
    `Payment: ${o.payment}${o.trxId ? ` (TrxID: ${o.trxId})` : ""}`,
    "",
    `Name: ${o.customerName}`,
    `Mobile: ${o.phone}`,
    `Address: ${o.address}`,
    `Area: ${o.area}`,
    `District: ${o.district}`,
  ];
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}
