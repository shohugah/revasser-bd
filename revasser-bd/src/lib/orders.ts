import "server-only";

// Orders are stored in the owner's Google Sheet through a small Apps Script (see order-sheet/Code.gs).
// Both values are set in Vercel → Settings → Environment Variables. The secret never reaches the browser.
const SCRIPT_URL = process.env.ORDERS_SCRIPT_URL?.trim() ?? "";
const SECRET = process.env.ORDERS_SECRET?.trim() ?? "";

// ORDERS_ALLOW_LOCAL lets the test suite point at a stand-in sheet on this computer. Never set it on Vercel.
const LOCAL_TEST = process.env.ORDERS_ALLOW_LOCAL === "1" && SCRIPT_URL.startsWith("http://127.0.0.1:");

export const ordersReady = () => (SCRIPT_URL.startsWith("https://script.google.com/") || LOCAL_TEST) && SECRET.length >= 32;

export async function callOrderSheet<T extends object>(payload: Record<string, unknown>): Promise<T & { error?: string }> {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, secret: SECRET }),
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`Order sheet answered ${res.status}`);
  // Apps Script shows an HTML page instead of JSON when the deployment is wrong.
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Order sheet did not answer with JSON. Check the web app deployment.");
  }
}

/** Like R251127-7KQ2M: the Dhaka date plus five characters that are hard to misread. */
export function newOrderNo() {
  const dhaka = new Date(Date.now() + 6 * 3_600_000).toISOString().slice(2, 10).replace(/-/g, "");
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const random = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => alphabet[b % alphabet.length]).join("");
  return `R${dhaka}-${random}`;
}

/** Removes control characters and trims to a length. Newlines survive only where allowed. */
export function clean(value: unknown, max: number, multiline = false) {
  if (typeof value !== "string") return "";
  const pattern = multiline ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g;
  return value.replace(pattern, " ").trim().slice(0, max);
}
