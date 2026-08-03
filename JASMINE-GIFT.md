# Jasmine — Interactive Digital Birthday Gift

**Live:** https://jasmine.aevaia.com
**Source:** [`public/jasmine/index.html`](public/jasmine/index.html) (single self-contained file)

A hand-built, mobile-first, **gamified digital birthday card** — a short interactive experience that unfolds one scene at a time: light a candle and make a wish, blow it out, open a letter, play a quick game, and reach a personal birthday message. It hides a layer of Easter eggs that reward repeat viewing.

---

## 1. What it is

A private, link-shared gift (no login, no app install). Opening `jasmine.aevaia.com` on a phone plays a self-contained, animated experience with sound, haptics, and hidden surprises. It is deliberately intimate and understated rather than flashy.

- **Audience:** one person (Jasmine), shared as a link.
- **Device:** designed for phones (works on desktop too).
- **Tone:** warm, subtle, celebratory.

---

## 2. The experience (scene flow)

The card advances one full-screen "scene" at a time with a soft blur cross-fade between them:

1. **Landing** — "Hi Jasmine," + a playful **YES / NO** prompt (the NO button runs away, then gives in).
2. **Candle / Make a Wish** — "Close your eyes and make a wish…" → then blow the candle out (via the **microphone**, with a **tap-to-blow** fallback). The flame reacts live to your breath.
3. **Envelope reveal** — a glowing envelope: "There's a letter waiting for you." Tap the envelope (it blooms open) *or* the button to continue.
4. **Letter** — a typewriter-animated personal letter, signed by hand.
5. **Catch game** — catch 20 falling smiles in a basket ("one for every year"), steered by **tilting the phone** or sliding.
6. **Finale** — an expanding birthday card with a closing message and confetti.

---

## 3. Features

**Visual & motion**
- Full-screen scene system with blur/scale cross-fade transitions.
- Ambient effects: aurora background, floating orbs, drifting sparkles, cursor trail.
- Live-reacting candle flame; blooming envelope; typewriter letter; expanding finale card.
- Confetti & fireworks (canvas-confetti) on celebratory beats.

**Interaction**
- **Microphone blow-detection** to blow out the candle (raw mic stream + live flame feedback), with a reliable tap-to-blow fallback.
- **Tilt controls** (device orientation) to steer the catch game, alongside touch.
- **Haptics** (vibration) on key moments.

**Theming**
- **Light (default) / Dark toggle** via a 🌙 button — dark is a bespoke plum night-sky, not an inversion. Choice is remembered per device.

**Sound**
- A synthesized **Web Audio** sound engine (no audio files) — clicks, chimes, pops, a win fanfare. *(Background music is pending a supplied MP3.)*

**Share preview**
- Open Graph / Twitter card so the link unfurls in WhatsApp/iMessage as a designed card ("A little surprise — For Jasmine"), image at [`public/jasmine-og.png`](public/jasmine-og.png).

**Accessibility / robustness**
- Respects `prefers-reduced-motion`.
- Uses `100dvh` so nothing is cut off by mobile browser toolbars.
- Graceful fallbacks (tap-to-blow if mic is blocked).

---

## 4. Easter eggs (hidden features)

Designed so she keeps discovering things on repeat views:

| Egg | Trigger |
|-----|---------|
| Secret P.S. | Tap the finale title **5×** |
| Return-visitor lines | Reopen the link & reach the finale (message changes by visit count) |
| Hidden-star hunt | Tap 3 faint ✨ (landing top-right, candle bottom-left, letter top-left) |
| Shake burst | Shake the phone → confetti + sparkles |
| Relight the candle | Long-press the just-blown candle → relights to blow again |
| Midnight mode | Tap the 🌙 **5× fast** → drifting shooting stars |
| Hidden letter line | Long-press the letter → a secret extra line |
| Idle magic | Sit still ~13s → a shooting star drifts by |
| Bonus mini-game | Find all 3 stars → a 🎁 on the finale → a "blow out 3 candles" bonus |

Persistence uses `localStorage` (keys: `jasmine-theme`, `jasmine-visits`, `jasmine-ps`, `jasmine-stars`). **Note:** these are per-device — the recipient's phone starts completely fresh regardless of testing done elsewhere.

---

## 5. Tech & architecture

- **One self-contained file:** `public/jasmine/index.html` — inline CSS + vanilla JavaScript, no build step, no framework.
- **External resources (CDN only):** canvas-confetti, Google Fonts (Parisienne, Cormorant Garamond, Quicksand), Font Awesome icons. No local media.
- **Browser APIs used:** Web Audio, `getUserMedia` (mic), `DeviceOrientation`/`DeviceMotion`, `localStorage`, Vibration.
- **Hosting:** Vercel, on the parent Next.js project (`aevaia`). The site is served on its own subdomain via a rewrite in [`proxy.ts`](proxy.ts): any hostname containing `jasmine` is rewritten to `/jasmine/*` **before** auth, so the page is fully public. `jasmine.aevaia.com` is attached to the project as a production domain.

---

## 6. Running & updating

- **Edit:** change `public/jasmine/index.html`.
- **Deploy:** commit + push to `main` → Vercel auto-builds production → live at `jasmine.aevaia.com` within ~1 minute. (Hard-refresh on device; static HTML can be cached.)
- **Local preview:** open the file directly, or `npm run dev` and visit `jasmine.localhost:3000` (the `includes('jasmine')` host rule fires there too).

---

## 7. Known notes / browser support

- **Microphone blow requires a real browser** (Safari / Chrome) over HTTPS. **Opera Mini cannot use the mic** (it's a proxy browser) — tap-to-blow always works as a fallback.
- **Tilt & shake need Motion permission** on iPhone — granted when tapping "I made my wish" / "One last surprise" (choose *Allow "Motion & Orientation"*). Android needs no prompt.
- Preview link cards are cached by messaging apps; add `?v=1` to force a fresh unfurl.

---

*Built as a personal gift. The letter copy is being finalized with the sender's approved text.*
