import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://revasserbd.shop"),
  title: {
    default: "REVASSER BD — Everything You Love, All in One Place",
    template: "%s | REVASSER BD",
  },
  description:
    "Shop premium jewellery, fashion, watches, electronics, bags, beauty, and home essentials across all 64 districts of Bangladesh with Cash on Delivery.",
  openGraph: {
    title: "REVASSER BD — Everything You Love, All in One Place",
    description:
      "Modern multi-category ecommerce destination in Bangladesh. Fast delivery inside & outside Dhaka.",
    url: "https://revasserbd.shop",
    siteName: "REVASSER BD",
    locale: "en_BD",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#FAF8F5] text-[#18181B]">
        {children}
      </body>
    </html>
  );
}
