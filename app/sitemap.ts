import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aevaia.com";

/**
 * Served at /sitemap.xml.
 *
 * Deliberately lists only the marketing surfaces. Client subdomains are NOT
 * included: those pages belong to the people they were built for and are shared
 * by link, not discovered through search. Someone finding a stranger's wedding
 * invite via Google is exactly the outcome to avoid.
 *
 * The demo copy is included — it is marketing, it is meant to be found, and it
 * writes nowhere.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${BASE}/`,                        lastModified: now, changeFrequency: "weekly",  priority: 1 },
    { url: `${BASE}/start`,                   lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/work`,                    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/demo/wedding/index.html`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/impressum`,               lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/privacy`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,                   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
