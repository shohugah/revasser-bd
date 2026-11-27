import { NextRequest, NextResponse } from "next/server";
import { getContent } from "@/lib/content";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, adminReady, adminSessionValue, tooMany } from "@/lib/admin";
import { verifyGoogleToken } from "@/lib/session";

export const dynamic = "force-dynamic";

const sameSite = (req: NextRequest) => {
  const origin = req.headers.get("origin");
  return !!origin && new URL(origin).host === req.headers.get("host");
};
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
const options = { httpOnly: true, secure: process.env.ORDERS_ALLOW_LOCAL !== "1", sameSite: "strict" as const, path: "/" };

export async function POST(req: NextRequest) {
  if (!sameSite(req)) return fail("Not allowed.", 403);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (tooMany(`admin-login:${ip}`)) return fail("Too many attempts. Please wait ten minutes.", 429);
  if (!adminReady()) return fail("Admin access is not set up yet. Add ADMIN_EMAILS in Vercel.", 503);
  try {
    const { credential } = await req.json();
    const token = String(credential ?? "");
    const user = await verifyGoogleToken(token, getContent().checkout.googleClientId);
    // Admin sign-in must use a fresh Google token, not one saved from earlier.
    const issued = user ? Number(JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).iat) : 0;
    if (!user || !(Date.now() / 1000 - issued < 600)) return fail("Google sign-in did not work. Please try again.", 401);
    const value = adminSessionValue(user);
    if (!value) {
      console.warn("Admin sign-in refused for a Google account that is not on the list.");
      return fail("This Google account is not an admin.", 403);
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, value, { ...options, maxAge: ADMIN_MAX_AGE });
    return res;
  } catch (err) {
    console.error("Admin sign-in failed:", err);
    return fail("Google sign-in did not work. Please try again.", 400);
  }
}

export async function DELETE(req: NextRequest) {
  if (!sameSite(req)) return fail("Not allowed.", 403);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...options, maxAge: 0 });
  return res;
}
