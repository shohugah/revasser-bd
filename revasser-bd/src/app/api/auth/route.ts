import { NextRequest, NextResponse } from "next/server";
import { getContent } from "@/lib/content";
import { COOKIE, MAX_AGE, currentUser, sessionValue, verifyGoogleToken } from "@/lib/session";

export const dynamic = "force-dynamic";

// Only our own pages may sign someone in or out.
const sameSite = (req: NextRequest) => {
  const origin = req.headers.get("origin");
  return !!origin && new URL(origin).host === req.headers.get("host");
};

export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}

export async function POST(req: NextRequest) {
  if (!sameSite(req)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  try {
    const { credential } = await req.json();
    const user = await verifyGoogleToken(String(credential ?? ""), getContent().checkout.googleClientId);
    const value = user && sessionValue(user);
    if (!user || !value) return NextResponse.json({ error: "Google sign-in did not work. Please try again." }, { status: 401 });
    const res = NextResponse.json({ user });
    res.cookies.set(COOKIE, value, { httpOnly: true, secure: process.env.ORDERS_ALLOW_LOCAL !== "1", sameSite: "lax", path: "/", maxAge: MAX_AGE });
    return res;
  } catch (err) {
    console.error("Sign-in failed:", err);
    return NextResponse.json({ error: "Google sign-in did not work. Please try again." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!sameSite(req)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const res = NextResponse.json({ user: null });
  res.cookies.delete(COOKIE);
  return res;
}
