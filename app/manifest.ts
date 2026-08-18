import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest. Next links it automatically.
//
// This is what Android uses when someone adds the site to their home screen,
// which matters more here than usual: the whole product is a link people open
// on a phone, and a saved link with a blank icon looks abandoned.
//
// The iOS equivalent is app/apple-icon.png, which iOS picks up on its own.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aevaia — digital invites, gifts and event pages",
    short_name: "Aevaia",
    description:
      "Hand-built invite pages, digital gifts and full event experiences. You send one link.",
    start_url: "/",
    display: "standalone",
    // Matches --bg in marketing.module.css, so the splash does not flash a
    // different colour before the page paints.
    background_color: "#0d0a12",
    theme_color: "#0d0a12",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
