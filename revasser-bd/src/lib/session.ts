import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

// Sign-in with Google: the browser gets an ID token from Google, we verify it here and
// keep a signed, HttpOnly cookie. No passwords and no client secret are involved.

export interface User { email: string; name: string }
export const COOKIE = "rv_session";
export const MAX_AGE = 60 * 60 * 24 * 30;

const LOCAL = process.env.ORDERS_ALLOW_LOCAL === "1";
// Tests point this at stand-in keys on this computer. It is ignored unless ORDERS_ALLOW_LOCAL=1.
const CERTS = (LOCAL && process.env.GOOGLE_CERTS_URL) || "https://www.googleapis.com/oauth2/v3/certs";

// Derived from the order secret, so there is no extra setting to manage.
const key = () => {
  const secret = process.env.ORDERS_SECRET?.trim() ?? "";
  return secret.length >= 32 ? crypto.createHmac("sha256", secret).update("revasser-session-v1").digest() : null;
};
const sign = (data: string, k: Buffer) => crypto.createHmac("sha256", k).update(data).digest("base64url");
const json = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

export async function verifyGoogleToken(token: string, clientId: string): Promise<User | null> {
  const [head, body, signature] = token.split(".");
  if (!clientId || !head || !body || !signature) return null;
  const { alg, kid } = json(head);
  if (alg !== "RS256") return null;
  const res = await fetch(CERTS, { next: { revalidate: 3600 } });
  const jwk = ((await res.json()).keys as (crypto.JsonWebKey & { kid: string })[]).find((k) => k.kid === kid);
  if (!jwk) return null;
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  if (!crypto.verify("RSA-SHA256", Buffer.from(`${head}.${body}`), publicKey, Buffer.from(signature, "base64url"))) return null;
  const c = json(body);
  const now = Date.now() / 1000;
  if (!["accounts.google.com", "https://accounts.google.com"].includes(c.iss) || c.aud !== clientId) return null;
  if (!(c.exp > now) || c.email_verified !== true || typeof c.email !== "string") return null;
  return { email: c.email.toLowerCase(), name: String(c.name ?? "").slice(0, 80) };
}

export function sessionValue(user: User): string | null {
  const k = key();
  if (!k) return null;
  const data = Buffer.from(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString("base64url");
  return `${data}.${sign(data, k)}`;
}

export async function currentUser(): Promise<User | null> {
  const k = key();
  const [data, mac] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  if (!k || !data || !mac) return null;
  const expected = Buffer.from(sign(data, k));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  const v = json(data);
  return v.exp > Date.now() / 1000 ? { email: v.email, name: v.name } : null;
}
