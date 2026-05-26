"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

// ── Shared brand tokens ──────────────────────────────────────────────────────
// Applied to every Clerk surface (SignIn, SignUp, UserButton, UserProfile)
// so the entire auth flow shares one consistent design language.
const BRAND_SHARED = {
  colorPrimary: "#a855f7",  // purple-500 — matches the Studio credits pill and nav active states
  borderRadius: "0.75rem",  // rounded-xl for all Clerk inputs, buttons, and badges
  fontFamily:   "inherit",  // use the app's Inter / Playfair stack
  fontSize:     "0.875rem", // text-sm
} as const;

// Dark-mode appearance: base theme + dark background tokens + brand overrides.
const DARK_APPEARANCE = {
  baseTheme: dark,
  variables: {
    ...BRAND_SHARED,
    colorBackground:      "#111111",  // neutral-900 — Clerk card and dropdown bg
    colorInputBackground: "#0a0a0a",  // neutral-950 — form fields (slightly deeper)
    colorText:            "#ffffff",
    colorTextSecondary:   "#a3a3a3",  // neutral-400
    colorNeutral:         "#737373",  // neutral-500
    colorDanger:          "#f87171",  // red-400
  },
} as const;

// Light-mode appearance: no dark base theme, only override the brand primary
// and radius so Clerk's default light surfaces are used everywhere else.
const LIGHT_APPEARANCE = {
  variables: {
    ...BRAND_SHARED,
    colorPrimary: "#9333ea",  // purple-600 — slightly deeper for light-bg contrast
  },
} as const;

export function ClerkThemeSync({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <ClerkProvider
      appearance={resolvedTheme === "dark" ? DARK_APPEARANCE : LIGHT_APPEARANCE}
    >
      {children}
    </ClerkProvider>
  );
}
