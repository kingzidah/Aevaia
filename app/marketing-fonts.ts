import { Archivo, IBM_Plex_Mono, Playfair_Display } from "next/font/google";

// Shared by the marketing routes (/ and /start) so both render in the same
// faces from a single set of font instances. Declared here rather than in
// app/layout.tsx on purpose: the root layout is shared with the studio, the
// workspace and every other route, and none of them should inherit these.
//
// The variables are consumed only inside marketing.module.css.

export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--mk-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--mk-mono",
  display: "swap",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--mk-serif",
  display: "swap",
});

/** Apply to the root element of a marketing route. */
export const marketingFontVars = `${archivo.variable} ${plexMono.variable} ${playfair.variable}`;
