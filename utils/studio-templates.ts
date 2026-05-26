// ─────────────────────────────────────────────────────────────────────────────
// HeartCraft Studio — Onboarding Template Configurations
//
// Pre-loaded luxury layouts applied when a brand-new project has no saved data.
// Every template must conform to the canonical Block / Scene types.
// ─────────────────────────────────────────────────────────────────────────────

import type { Scene } from "@/types/studio";

// Particle preset IDs — must stay in sync with ParticlePreset in page.tsx
export type TemplateParticle = "falling-snow" | "glowing-embers" | "falling-blossoms" | null;

export interface TemplateConfig {
  id:          string;
  name:        string;
  tagline:     string;
  emoji:       string;
  accentColor: string; // Tailwind colour token for the selection card glow
  scenes:      Scene[];
  atmosphere: {
    particlePreset: TemplateParticle;
    theme:          string; // must be a key in the studio THEMES map
  };
}

// ── 1. Luxury Wedding Suite ───────────────────────────────────────────────────

export const WEDDING_SUITE_TEMPLATE: TemplateConfig = {
  id:          "wedding-suite",
  name:        "Luxury Wedding Suite",
  tagline:     "Crafted for your most important day",
  emoji:       "✨",
  accentColor: "violet",
  atmosphere: {
    particlePreset: "falling-snow",
    theme:          "minimalist",
  },
  scenes: [
    {
      id:   "ws-scene-ceremony",
      name: "Ceremony",
      blocks: [
        {
          id:      "ws-headline",
          type:    "headline",
          content: "The Wedding of Adrian & Sophia",
        },
        {
          id:      "ws-paragraph",
          type:    "paragraph",
          content: "Together with their families, they invite you to witness the beginning of forever.",
        },
        {
          id:         "ws-countdown",
          type:       "countdown",
          targetDate: "2026-09-20T14:00:00.000Z",
          properties: {
            title: "Until We Say I Do",
          },
        },
        {
          id:   "ws-map",
          type: "map",
          properties: {
            address: "The Savoy Hotel, Strand, London, WC2R 0EZ",
            title:   "Ceremony Venue",
          },
        },
      ],
    },
    {
      id:   "ws-scene-reception",
      name: "Reception",
      blocks: [
        {
          id:      "ws-reception-headline",
          type:    "headline",
          content: "Join Us for an Evening of Joy",
        },
        {
          id:   "ws-rsvp",
          type: "rsvp-form",
          properties: {
            title:       "Kindly Respond by August 1st",
            buttonLabel: "I Will Attend",
          },
        },
      ],
    },
  ],
};

// ── 2. Anniversary Milestone Vault ────────────────────────────────────────────

export const ANNIVERSARY_VAULT_TEMPLATE: TemplateConfig = {
  id:          "anniversary-vault",
  name:        "Anniversary Milestone",
  tagline:     "Every chapter, beautifully remembered",
  emoji:       "🌹",
  accentColor: "rose",
  atmosphere: {
    particlePreset: "glowing-embers",
    theme:          "dark-romance",
  },
  scenes: [
    {
      id:   "av-scene-story",
      name: "Our Story",
      blocks: [
        {
          id:      "av-headline",
          type:    "headline",
          content: "A Year Written in Stars",
        },
        {
          id:      "av-paragraph",
          type:    "paragraph",
          content: "Every moment with you is a treasure I carry in the softest corner of my heart.",
        },
        {
          id:     "av-carousel",
          type:   "carousel",
          images: [
            "https://picsum.photos/seed/av-mem-1/800/450",
            "https://picsum.photos/seed/av-mem-2/800/450",
            "https://picsum.photos/seed/av-mem-3/800/450",
          ],
          properties: {
            title: "Our Memories",
          },
        },
        {
          id:   "av-lottie",
          type: "lottie",
          properties: {
            title: "With Love",
          },
        },
      ],
    },
    {
      id:   "av-scene-message",
      name: "Love Letter",
      blocks: [
        {
          id:      "av-letter-headline",
          type:    "headline",
          content: "To You, On This Day",
        },
        {
          id:      "av-letter-body",
          type:    "paragraph",
          content: "Thank you for being my greatest adventure. Here is to every year that follows.",
        },
      ],
    },
  ],
};

// ── All templates in display order ────────────────────────────────────────────

export const ALL_TEMPLATES: TemplateConfig[] = [
  WEDDING_SUITE_TEMPLATE,
  ANNIVERSARY_VAULT_TEMPLATE,
];
