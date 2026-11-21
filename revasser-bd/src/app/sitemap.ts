import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://revasserbd.shop";
  const categorySlugs = [
    "jewellery-accessories",
    "fashion-clothing",
    "electronics-technology",
    "watches",
    "bags-footwear",
    "beauty-personal-care",
    "home-living",
    "lifestyle-products",
    "new-arrivals",
    "trending-products",
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...categorySlugs.map((slug) => ({
      url: `${baseUrl}/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
