import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The optimiser only ever handles our own files, so it cannot be used as an open proxy.
    localPatterns: [{ pathname: "/brand/**" }, { pathname: "/uploads/**" }],
    qualities: [72],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
  },
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/category/trending-products", destination: "/shop/best-sellers", permanent: true },
      { source: "/category/:slug", destination: "/shop/:slug", permanent: true },
      { source: "/favicon.ico", destination: "/icon.png", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
