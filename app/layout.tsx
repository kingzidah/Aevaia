import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Playfair_Display, Cinzel } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkThemeSync } from "@/components/ClerkThemeSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

// Note: this is the card people see when the link is pasted into WhatsApp,
// Instagram or an ad — so it describes the service being sold today (hand-built
// invites and event pages), not the self-serve builder still in development.
export const metadata: Metadata = {
  // Required for the Open Graph image below to resolve. Without it Next emits a
  // relative og:image path, and WhatsApp, Instagram and iMessage all need an
  // absolute URL — they would silently show no picture at all.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aevaia.com"),

  title: "Aevaia — Digital invites, gifts and event pages, made by hand",
  description:
    "Custom invite pages, digital gifts and full event experiences — RSVP, galleries, music, digital tickets and gate check-in. Designed and built for your day. Send one link.",
  openGraph: {
    title: "Aevaia — Digital invites, gifts and event pages, made by hand",
    description:
      "Your day deserves more than a flyer in the group chat. Hand-built invite pages, digital gifts and event experiences.",
    type: "website",
    url: "/",
    siteName: "Aevaia",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Aevaia — hand-built invites, gifts and event pages" }],
  },
  // WhatsApp reads Open Graph, but iMessage and X prefer the Twitter card, and
  // summary_large_image is what produces a full-width picture rather than a
  // thumbnail beside the text.
  twitter: {
    card: "summary_large_image",
    title: "Aevaia — Digital invites, gifts and event pages, made by hand",
    description:
      "Your day deserves more than a flyer in the group chat. Hand-built invite pages, digital gifts and event experiences.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${playfair.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-zinc-50 dark:bg-neutral-950 text-zinc-900 dark:text-white transition-colors duration-200"
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ClerkThemeSync>
            {children}
          </ClerkThemeSync>
        </ThemeProvider>
      </body>
    </html>
  );
}
