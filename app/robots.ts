import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aevaia.com";

/**
 * Served at /robots.txt.
 *
 * The disallow list matters more here than on a typical site. Without it,
 * crawlers will happily index a client's private wedding invite, the owner's
 * commission inbox, and the gate scanner. A guest list turning up in search
 * results is a real problem for the client, not a tidiness issue.
 *
 * Note this only governs well-behaved crawlers — it is not access control. The
 * admin inbox and the Studio are protected in proxy.ts; this stops them being
 * advertised.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",          // the owner's commission inbox — real client contact details
        "/api/",           // nothing here is a page
        "/studio",         // unlaunched
        "/workspace",
        "/dashboard",
        "/settings",
        "/wedding/scan",   // the gate scanner
        "/p/",             // published client gift pages, reachable only by link
        "/gift/",
        "/maintenance",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
