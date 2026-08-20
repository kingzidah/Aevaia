// ── The work ─────────────────────────────────────────────────────────────────
//
// Single source of truth for the portfolio, shared by the home page (which
// shows the first three) and /work (which shows all of them, with the longer
// story). Kept out of both page files so a new piece is added once.
//
// `href` is what a visitor opens. For the wedding that is deliberately the DEMO
// and not the couple's live invite — see the note on that entry.

export type Accent = "violet" | "magenta";

export interface Piece {
  /** Stable slug, used as the React key and the anchor on /work. */
  slug: string;
  title: string;
  kind: string;
  /** When it was delivered. Shown on /work; a portfolio with no dates reads as stock. */
  delivered: string;
  href?: string;
  /** True when href points at a replica rather than the real client site. */
  demo?: boolean;
  image: string;
  accent: Accent;
  /** One or two sentences. Used on the home page cards. */
  blurb: string;
  /** The longer version, /work only: what the problem was and what was built. */
  story?: string;
  tags: string[];
}

export const WORK: Piece[] = [
  {
    slug: "opeyemi-uriel",
    title: "Opeyemi & Uriel",
    kind: "Wedding",
    delivered: "2026",
    // Points at the DEMO, not the couple's live invite. Their wedding is
    // 28 November 2026 and their guest list is being built right now — the real
    // site's RSVP writes straight into it, so every portfolio visitor who
    // clicked through could add a row. The demo is letter-for-letter identical
    // and mints its ticket in the browser, writing nowhere.
    href: "/demo/wedding/index.html",
    demo: true,
    image: "/wedding-demo/assets/couple1.jpg",
    accent: "violet",
    blurb:
      "A full wedding invite with RSVP, a swipeable gallery, digital tickets, and a QR gate scanner the door staff used on the night to check guests in live.",
    story:
      "The hard part of a wedding is not the invitation, it is the door. Who actually said yes, who turned up, and how the people on the door tell the difference without a queue forming. Every guest who RSVPs gets a unique code and a QR they keep on their phone, drawn on the device itself so it still works on weak venue wifi. The door staff open a scanner page — no app, no accounts — and the couple watch the count climb as people arrive. Guests who lose the ticket can be found by name at the gate.",
    tags: ["Invite", "RSVP", "Tickets & QR", "Gate scanner", "Live count"],
  },
  {
    slug: "jasmine",
    title: "Jasmine",
    kind: "Birthday gift",
    delivered: "2026",
    href: "https://jasmine.aevaia.com",
    image: "/jasmine-og.png",
    accent: "magenta",
    blurb:
      "A one-of-a-kind birthday experience — an envelope that blooms open, a candle you blow out through your phone's microphone, a rotating soundtrack, and easter eggs hidden for repeat visits.",
    story:
      "Built to be opened once on the day and then opened again. The envelope blooms rather than cutting to the message, the candle goes out when you actually blow at the phone, and the soundtrack rotates between four songs so the second visit is not the first visit repeated. Things are hidden for whoever comes back.",
    tags: ["Bespoke", "Music", "Animation", "Easter eggs"],
  },
  {
    slug: "yvana",
    title: "Yvana",
    kind: "Birthday gift",
    delivered: "2026",
    href: "https://yvana.aevaia.com",
    image: "/hero-yvana.png",
    accent: "magenta",
    blurb:
      "The first one, and the reason the studio exists. A “no” button that runs away from your thumb, a candle blown out through the microphone, a stack of photos that fans open when you tap it, a letter that types itself alongside a voice note, and a shell game hiding the real present.",
    story:
      "The first one ever built, and the piece the studio came out of. It was made for one person before there was a business, which is why it does things no template does: the “no” button runs from your thumb, the photo stack fans open when tapped, the letter types itself beside a voice note, and the real present is hidden under a shell game you have to play.",
    tags: ["Bespoke", "Mic candle", "Animation", "Voice note", "Game"],
  },
];
