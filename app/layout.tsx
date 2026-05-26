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

export const metadata: Metadata = {
  title: "Aevaia — Gift-Giving, Reimagined in 3D",
  description: "Build cinematic digital gift experiences with 3D canvases, AI-crafted copy, and a secure bouncer gate.",
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
