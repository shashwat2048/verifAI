import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://verifai-ai.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${APP_URL}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${APP_URL}/analyze`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/reports`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/sign-in`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}


