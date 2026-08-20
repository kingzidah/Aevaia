// ── Testimonials ─────────────────────────────────────────────────────────────
//
// EMPTY ON PURPOSE, and it must stay that way until real quotes exist.
//
// Every section that reads from this array renders nothing while it is empty,
// so the page is complete either way. Do not seed it with plausible-sounding
// placeholders "just to see the layout" — a fabricated review of a real
// business, attributed to a named person, is not a design placeholder. It is
// the thing itself, and it ships the moment someone forgets to take it out.
//
// To fill it: ask the three people whose work is already live. Their sites were
// delivered, so the ask is natural, and a single honest sentence from Jasmine or
// from the couple is worth more than any copy on the home page.
//
// A quote needs consent to publish, the same as a photograph. `attribution` is
// how they want to be credited — a first name is fine, initials are fine.

export interface Testimonial {
  /** The quote, in their words. Do not tidy it into marketing voice. */
  quote: string;
  /** How they asked to be credited. */
  attribution: string;
  /** What was built for them, e.g. "Wedding invite". */
  context: string;
}

export const TESTIMONIALS: Testimonial[] = [];
