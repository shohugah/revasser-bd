import { NextResponse } from "next/server";

// Admin pages are never cached, indexed or shown inside another site.
export function middleware() {
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  res.headers.set("X-Frame-Options", "DENY");
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
