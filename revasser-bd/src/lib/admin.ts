import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "./session";

// The admin area has its own short session, separate from the customer sign-in.
// Only the Google emails listed in ADMIN_EMAILS (Vercel setting) may use it.

export const ADMIN_COOKIE = "rv_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 8;

const allowed = () =>
  (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(/[,\s;]+/).filter((e) => e.includes("@"));
export const isAdminEmail = (email: string) => allowed().includes(email.toLowerCase());
export const adminReady = () => allowed().length > 0 && !!key();

function key() {
  const secret = process.env.ORDERS_SECRET?.trim() ?? "";
  return secret.length >= 32 ? crypto.createHmac("sha256", secret).update("revasser-admin-v1").digest() : null;
}
const sign = (data: string, k: Buffer) => crypto.createHmac("sha256", k).update(data).digest("base64url");

export function adminSessionValue(user: User): string | null {
  const k = key();
  if (!k || !isAdminEmail(user.email)) return null;
  const data = Buffer.from(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE })).toString("base64url");
  return `${data}.${sign(data, k)}`;
}

/** The signed-in admin, or null. The allow-list is checked every time, so removing an email locks it out at once. */
export async function currentAdmin(): Promise<User | null> {
  const k = key();
  const [data, mac] = ((await cookies()).get(ADMIN_COOKIE)?.value ?? "").split(".");
  if (!k || !data || !mac) return null;
  const expected = Buffer.from(sign(data, k));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  const v = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  return v.exp > Date.now() / 1000 && isAdminEmail(v.email) ? { email: v.email, name: v.name } : null;
}

/** Call at the top of every admin page. Layouts alone do not re-run on every navigation. */
export async function requireAdmin(): Promise<User> {
  return (await currentAdmin()) ?? redirect("/admin/login");
}

// Slows down repeated attempts. Memory is per server instance, so this is a brake, not a wall.
const hits = new Map<string, { count: number; reset: number }>();
export function tooMany(id: string, limit = 10, windowMs = 10 * 60_000) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const h = hits.get(id);
  if (!h || h.reset < now) {
    hits.set(id, { count: 1, reset: now + windowMs });
    return false;
  }
  return ++h.count > limit;
}
