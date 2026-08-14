"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// ── Contact details ───────────────────────────────────────────────────────────
// Kept together at the top so they can be changed without reading the markup.
// WHATSAPP_NUMBER is digits only, international format, no + or spaces —
// that is what wa.me requires.
const WHATSAPP_NUMBER = "4917675460351"; // WhatsApp Business, +49 176 75460351
const CONTACT_EMAIL = "helloaevaia@gmail.com";
const WHATSAPP_PREFILL = "Hi! I'd like an Aevaia site built for my event.";

// ── Pricing ───────────────────────────────────────────────────────────────────
// PLACEHOLDER NUMBERS — change these to your real prices before advertising.
// Every price on the page reads from here, so this block is the only edit needed.
const CURRENCY = "€";

// Stated identically on every tier and in step 04. Hosting was previously
// described three different ways on one page ("live for a year", "it stays
// live", "I keep it running"), which is the kind of contradiction a buyer
// notices and a seller then has to argue about later.
const HOSTING_TERM = "Your own link, live for a year. After that it's €29/year to keep it up.";

type Package = {
  id: string;
  name: string;
  price: number;
  from: boolean;     // true renders "from €X" rather than a flat price
  tagline: string;
  features: string[];
  featured?: boolean;
};

const PACKAGES: Package[] = [
  {
    id: "invite",
    name: "The Invite",
    price: 149,
    from: false,
    tagline: "One beautiful page for one beautiful day.",
    features: [
      "A single-page invite, designed around your photos",
      "Countdown to the date",
      "RSVP that lands in your inbox",
      "Venue details, map and directions",
      "Built for phones first — it opens perfectly in WhatsApp",
      HOSTING_TERM,
    ],
  },
  {
    id: "event",
    name: "The Full Event",
    price: 349,
    from: false,
    tagline: "The invite, the guest list, and the door.",
    featured: true,
    features: [
      "Everything in The Invite",
      "Swipeable photo gallery",
      "Background music and sound",
      "Guest list with live RSVP tracking",
      "Digital tickets with a QR code for every guest",
      "A gate scanner your bouncers can use on any phone",
      "Live checked-in count on the night",
      HOSTING_TERM,
    ],
  },
  {
    id: "bespoke",
    name: "Bespoke",
    price: 599,
    from: true,
    tagline: "Something nobody has seen before.",
    features: [
      "Built from scratch around your idea",
      "Custom animated scenes and interactions",
      "Personal voice notes, letters, hidden messages",
      "Easter eggs that reward people for coming back",
      "Your own subdomain — yourname.aevaia.com",
      "Three rounds of revisions included.",
      HOSTING_TERM,
    ],
  },
];

// ── The work ──────────────────────────────────────────────────────────────────
// Real, live, hand-built pieces. To add another, add one object here.
const WORK = [
  {
    title: "Opeyemi & Uriel",
    kind: "Wedding",
    href: "https://opeyemianduriel.aevaia.com",
    image: "/wedding-demo/assets/couple1.jpg",
    blurb:
      "A full wedding invite with RSVP, a swipeable gallery, digital tickets, and a QR gate scanner the door staff used on the night to check guests in live.",
    tags: ["Invite", "RSVP", "Tickets & QR", "Gate scanner", "Live count"],
  },
  {
    title: "Jasmine",
    kind: "Birthday gift",
    href: "https://jasmine.aevaia.com",
    image: "/jasmine-og.png",
    blurb:
      "A one-of-a-kind birthday experience — an envelope that blooms open, a candle you blow out through your phone's microphone, a rotating soundtrack, and easter eggs hidden for repeat visits.",
    tags: ["Bespoke", "Music", "Animation", "Easter eggs"],
  },
];

// ── The door ──────────────────────────────────────────────────────────────────
// Ticketing, check-in and headcount are pulled out of the main grid and shown
// first, as a named group. They are the part almost nobody else offers, and the
// part that turns a pretty invite into something that runs an actual event — so
// burying them ninth in an alphabetical-looking grid undersold them.
const DOOR_FEATURES = [
  { title: "Digital tickets", body: "Every guest gets a unique code and a QR they can keep on their phone.", dot: "from-fuchsia-400 to-pink-500" },
  { title: "Gate check-in", body: "A scanner page for your door staff. No app to install, no accounts.", dot: "from-pink-400 to-rose-500" },
  { title: "Live guest count", body: "See exactly how many people are inside, as they arrive.", dot: "from-rose-400 to-amber-400" },
];

// ── Everything else ───────────────────────────────────────────────────────────
// `dot` is the gradient on each card's marker — the colour rotation is what
// keeps this grid from reading as a wall of identical tiles.
const CAPABILITIES = [
  { title: "Invite pages", body: "Your date, your photos, your words — not a template with your name pasted in.", dot: "from-violet-400 to-fuchsia-500" },
  { title: "RSVP & guest list", body: "Guests reply on the page. You watch the list fill up.", dot: "from-fuchsia-400 to-pink-500" },
  { title: "Photo galleries", body: "Swipeable carousels that feel good on a phone, not a grid of thumbnails.", dot: "from-amber-400 to-yellow-300" },
  { title: "Music & sound", body: "A soundtrack that fades in, ducks under text, and does not annoy anyone.", dot: "from-teal-300 to-emerald-400" },
  { title: "Animated scenes", body: "Envelopes that open, letters that unfold, moments that land.", dot: "from-sky-400 to-violet-500" },
  { title: "Countdowns", body: "Time to the day, ticking, on every phone that opens the link.", dot: "from-indigo-400 to-purple-500" },
  { title: "Hidden easter eggs", body: "Rewards for the people who come back and look twice.", dot: "from-purple-400 to-fuchsia-500" },
  { title: "Your own link", body: "yourname.aevaia.com, or a page on your own domain if you have one.", dot: "from-fuchsia-400 to-violet-500" },
  { title: "Works everywhere", body: "Old Androids, new iPhones, slow data. Tested on real phones.", dot: "from-rose-400 to-purple-500" },
];

// ── How it works ──────────────────────────────────────────────────────────────
// Step 02 was titled with a first-person plural, and step 03 originally read
// "from the day <plural> agree scope". Both are reworded to the second person
// ("you approve the scope") because the page is now singular throughout, and a
// solo operator writing as a company is exactly the tell this removes.
const STEPS = [
  { n: "01", title: "Message me", body: "WhatsApp or the form below. Tell me the occasion and the date." },
  { n: "02", title: "You approve the scope", body: "I come back with what I'd build and a fixed price. No surprises later." },
  { n: "03", title: "I build it by hand", body: "Usually 7–10 days from the day you approve the scope. Tight date? Ask — rush is often possible." },
  { n: "04", title: "You get your link", body: `Share it however you like. ${HOSTING_TERM}` },
];

// A soft drifting colour cloud. These replace the divider lines as the way the
// page gets structure — light pools instead of rules.
function Orb({
  className,
  duration = "24s",
  delay = "0s",
}: {
  className: string;
  duration?: string;
  delay?: string;
}) {
  return (
    <div
      aria-hidden
      className={`aevaia-orb pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{ animation: `orb-drift ${duration} ease-in-out infinite`, animationDelay: delay }}
    />
  );
}

export default function StudioLandingPage() {
  const [email, setEmail] = useState("");
  const [waitlistState, setWaitlistState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [waitlistError, setWaitlistError] = useState("");

  const [enquiry, setEnquiry] = useState({
    name: "", email: "", phone: "", event_type: "", event_date: "", message: "",
  });
  const [chosenPackage, setChosenPackage] = useState("");
  const [enquiryState, setEnquiryState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [enquiryError, setEnquiryError] = useState("");

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;

  // Scroll reveal. The markup ships visible; this hides the elements on mount
  // and fades them back in as they enter view, so a visitor with JS blocked
  // still sees the whole page rather than a blank one.
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (nodes.length === 0) return;

    nodes.forEach(node => node.classList.add("reveal-init"));

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("reveal-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  // Picking a package scrolls to the form and remembers the choice. The enquiry
  // API's schema has no package column, so the choice rides along at the top of
  // the message field rather than requiring a database migration.
  function choosePackage(name: string) {
    setChosenPackage(name);
    document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleWaitlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || waitlistState === "sending") return;
    setWaitlistState("sending");
    setWaitlistError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setWaitlistError(data?.error ?? "Something went wrong. Please try again.");
        setWaitlistState("error");
        return;
      }
      setWaitlistState("done");
    } catch {
      setWaitlistError("No connection. Please try again.");
      setWaitlistState("error");
    }
  }

  async function handleEnquiry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enquiryState === "sending") return;
    setEnquiryState("sending");
    setEnquiryError("");

    // Prefix the chosen package onto the message, staying inside the schema's
    // 2 000-character limit even if the visitor writes a long brief.
    const message = chosenPackage
      ? `[Package: ${chosenPackage}]\n${enquiry.message}`.slice(0, 2000)
      : enquiry.message;

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...enquiry, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEnquiryError(data?.error ?? "Something went wrong. Please try again.");
        setEnquiryState("error");
        return;
      }
      setEnquiryState("done");
    } catch {
      setEnquiryError("No connection. Please try again.");
      setEnquiryState("error");
    }
  }

  // ── Shared class recipes ────────────────────────────────────────────────────
  const field =
    "bg-black/[0.04] dark:bg-white/[0.04] text-neutral-900 placeholder-neutral-400 " +
    "dark:text-white dark:placeholder-neutral-500 " +
    "focus:bg-black/[0.06] dark:focus:bg-white/[0.07] " +
    "focus:ring-2 focus:ring-fuchsia-500/50 " +
    "rounded-2xl px-5 py-3.5 w-full text-sm outline-none transition-all";

  const section = "w-full max-w-6xl mx-auto px-6";

  const eyebrow =
    "text-[11px] font-semibold tracking-[0.28em] uppercase " +
    "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 " +
    "bg-clip-text text-transparent";

  // Surfaces get depth from tint and glow, never from a border.
  const card =
    "rounded-[28px] bg-white/70 dark:bg-white/[0.035] backdrop-blur-sm " +
    "shadow-[0_20px_60px_-32px_rgba(120,60,200,0.55)] " +
    "dark:shadow-[0_20px_70px_-34px_rgba(190,100,255,0.5)] " +
    "transition-all duration-500";

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-white " +
    "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-[length:200%_100%] bg-left " +
    "hover:bg-right shadow-[0_10px_40px_-12px_rgba(217,70,239,0.75)] " +
    "hover:shadow-[0_14px_50px_-10px_rgba(217,70,239,0.95)] " +
    "transition-all duration-500 hover:-translate-y-0.5";

  const ghostBtn =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium " +
    "bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.11] " +
    "transition-all duration-300 hover:-translate-y-0.5";

  // Section separation without rules: a colour wash that fades to nothing at
  // both edges, so there is never a hard line between two sections.
  const wash =
    "bg-gradient-to-b from-transparent via-fuchsia-500/[0.055] to-transparent " +
    "dark:via-fuchsia-500/[0.07]";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#FDFAF7] dark:bg-[#0B0710] text-neutral-900 dark:text-white transition-colors duration-300">

      {/* ── Ambient colour field ─────────────────────────────────────────────
          Fixed behind everything. This is what makes the page feel warm
          rather than like a document.                                       */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <Orb className="w-[46rem] h-[46rem] -top-56 -left-40 bg-violet-500/25 dark:bg-violet-600/25" duration="26s" />
        <Orb className="w-[38rem] h-[38rem] top-[8%] -right-40 bg-fuchsia-500/20 dark:bg-fuchsia-600/22" duration="31s" delay="-6s" />
        <Orb className="w-[34rem] h-[34rem] top-[45%] -left-32 bg-amber-400/16 dark:bg-amber-500/14" duration="29s" delay="-12s" />
        <Orb className="w-[40rem] h-[40rem] bottom-[2%] -right-32 bg-pink-500/18 dark:bg-pink-600/20" duration="34s" delay="-3s" />
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────────
          No bottom border — it separates by blur and translucency alone.    */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FDFAF7]/70 dark:bg-[#0B0710]/70">
        <nav className={`${section} flex items-center justify-between h-16`}>
          <span className="text-xs font-semibold tracking-[0.3em] uppercase bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
            AEVAIA
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-500 dark:text-neutral-400">
            <a href="#work" className="hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors">Work</a>
            <a href="#make" className="hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors">What I make</a>
            <a href="#pricing" className="hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors">Pricing</a>
            <a href="#enquiry" className="hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors">Start</a>
          </div>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={primaryBtn + " !py-2 !px-5"}>
            Message me
          </a>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className={`relative ${section} pt-20 pb-28 md:pt-32 md:pb-36 text-center flex flex-col items-center`}>
        {/* Occasion words above the fold: a visitor arriving cold needs to see
            their own event named before they will read anything else. */}
        <p className={eyebrow} data-reveal>Weddings · Birthdays · Engagements · Naming ceremonies</p>

        <h1
          className="font-[family-name:var(--font-playfair)] text-[2.6rem] leading-[1.08] md:text-6xl lg:text-7xl font-light mt-7 max-w-4xl"
          data-reveal
          style={{ transitionDelay: "60ms" }}
        >
          Your day deserves more than{" "}
          <span className="aevaia-gradient-text italic">a flyer in the group chat.</span>
        </h1>

        <p
          className="text-neutral-600 dark:text-neutral-400 mt-7 text-base md:text-lg max-w-2xl leading-relaxed"
          data-reveal
          style={{ transitionDelay: "120ms" }}
        >
          I hand-build the invite, the gift, the whole event page — designed around your
          photos, your music and your date. You send one link. Send me your photos, the
          names and the date — I do the rest.
        </p>

        <div
          className="mt-11 flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-md"
          data-reveal
          style={{ transitionDelay: "180ms" }}
        >
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-white bg-[#25D366] hover:bg-[#1eb857] shadow-[0_10px_40px_-12px_rgba(37,211,102,0.8)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" />
              <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
            </svg>
            Start on WhatsApp
          </a>
          <a href="#work" className={ghostBtn + " flex-1"}>
            See the work
          </a>
        </div>

        <p
          className="mt-9 text-xs text-neutral-500 dark:text-neutral-500"
          data-reveal
          style={{ transitionDelay: "240ms" }}
        >
          Every piece below was built by hand, for a real person, for a real date.
        </p>
      </section>

      {/* ── Work ─────────────────────────────────────────────────────────────── */}
      <section id="work" className={`relative ${wash} py-24 md:py-32`}>
        <div className={section}>
          <p className={eyebrow} data-reveal>Selected work</p>
          <h2
            className="font-[family-name:var(--font-playfair)] text-3xl md:text-5xl font-light mt-4 max-w-2xl"
            data-reveal
            style={{ transitionDelay: "60ms" }}
          >
            Open them. They are live right now.
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mt-14">
            {WORK.map((piece, i) => (
              <a
                key={piece.title}
                href={piece.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block overflow-hidden hover:-translate-y-2 hover:shadow-[0_36px_90px_-30px_rgba(217,70,239,0.6)] ${card}`}
                data-reveal
                style={{ transitionDelay: `${i * 110}ms` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={piece.image}
                    alt={`${piece.title} — ${piece.kind}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                  />
                  {/* Warms the photo into the card instead of cutting it off. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.2em] text-white/95 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full">
                    {piece.kind}
                  </span>
                </div>

                <div className="p-7">
                  <h3 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-light">
                    {piece.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 leading-relaxed">
                    {piece.blurb}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-5">
                    {piece.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/12 to-fuchsia-500/12 text-violet-700 dark:text-fuchsia-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-2 mt-7 text-sm font-medium bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                    Open the live site
                    <span className="text-fuchsia-500 transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── What I make ──────────────────────────────────────────────────────── */}
      <section id="make" className={`relative ${section} py-24 md:py-32`}>
        <p className={eyebrow} data-reveal>What I make</p>
        <h2
          className="font-[family-name:var(--font-playfair)] text-3xl md:text-5xl font-light mt-4 max-w-2xl"
          data-reveal
          style={{ transitionDelay: "60ms" }}
        >
          Anything you can describe, I can put on a link.
        </h2>

        {/* ── The door ────────────────────────────────────────────────────────
            Given its own heading, warmer surface and larger type so it reads as
            a capability nobody else is offering, rather than three more tiles. */}
        <div className="mt-14" data-reveal>
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-light">
            The door
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl">
            Most invites stop once the guest has replied. These three run the night itself.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {DOOR_FEATURES.map((item, i) => (
            <div
              key={item.title}
              className={
                "p-7 hover:-translate-y-1.5 " + card + " " +
                "bg-gradient-to-b from-fuchsia-500/[0.13] to-violet-500/[0.05] " +
                "dark:from-fuchsia-500/[0.16] dark:to-violet-600/[0.06] " +
                "shadow-[0_24px_70px_-30px_rgba(217,70,239,0.7)]"
              }
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className={`block w-10 h-1.5 rounded-full bg-gradient-to-r ${item.dot}`} />
              <h4 className="text-lg font-medium mt-4">{item.title}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        {/* ── Everything else ─────────────────────────────────────────────── */}
        <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-neutral-500 dark:text-neutral-500 mt-16" data-reveal>
          And everything else
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {CAPABILITIES.map((item, i) => (
            <div
              key={item.title}
              className={`p-6 hover:-translate-y-1.5 hover:bg-white/90 dark:hover:bg-white/[0.07] ${card}`}
              data-reveal
              style={{ transitionDelay: `${(i % 3) * 80}ms` }}
            >
              <span className={`block w-8 h-1.5 rounded-full bg-gradient-to-r ${item.dot}`} />
              <h4 className="text-base font-medium mt-4">{item.title}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className={`relative ${wash} py-24 md:py-32`}>
        <div className={section}>
          <p className={eyebrow} data-reveal>Pricing</p>
          <h2
            className="font-[family-name:var(--font-playfair)] text-3xl md:text-5xl font-light mt-4 max-w-2xl"
            data-reveal
            style={{ transitionDelay: "60ms" }}
          >
            A fixed price, agreed before anything is built.
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-14 items-start">
            {PACKAGES.map((pkg, i) => (
              <div
                key={pkg.id}
                className={
                  "relative p-8 flex flex-col h-full hover:-translate-y-2 " + card + " " +
                  (pkg.featured
                    ? "bg-gradient-to-b from-fuchsia-500/[0.13] to-violet-500/[0.06] dark:from-fuchsia-500/[0.16] dark:to-violet-600/[0.07] " +
                      "shadow-[0_30px_90px_-30px_rgba(217,70,239,0.75)] md:-mt-4 md:mb-4"
                    : "")
                }
                data-reveal
                style={{ transitionDelay: `${i * 110}ms` }}
              >
                {pkg.featured && (
                  <span className="self-start text-[10px] uppercase tracking-[0.2em] text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 rounded-full mb-5">
                    Most chosen
                  </span>
                )}

                <h3 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-light">
                  {pkg.name}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{pkg.tagline}</p>

                <p className="mt-7 flex items-baseline gap-2">
                  {pkg.from && (
                    <span className="text-sm text-neutral-500 dark:text-neutral-500">from</span>
                  )}
                  <span className="font-[family-name:var(--font-playfair)] text-5xl font-light bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
                    {CURRENCY}{pkg.price}
                  </span>
                </p>

                <ul className="mt-7 space-y-3.5 flex-1">
                  {pkg.features.map(feature => (
                    <li key={feature} className="flex gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                      <span className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => choosePackage(pkg.name)}
                  className={(pkg.featured ? primaryBtn : ghostBtn) + " mt-9 w-full"}
                >
                  Start with {pkg.name}
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-10 max-w-2xl" data-reveal>
            Prices are for the build. Something unusual in mind, or a date that is very
            close? Message me — I&apos;ll tell you honestly what is possible.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className={`relative ${section} py-24 md:py-32`}>
        <p className={eyebrow} data-reveal>How it works</p>
        <h2
          className="font-[family-name:var(--font-playfair)] text-3xl md:text-5xl font-light mt-4 max-w-2xl"
          data-reveal
          style={{ transitionDelay: "60ms" }}
        >
          Four steps, and one of them is yours.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">
          {STEPS.map((step, i) => (
            <div key={step.n} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="font-[family-name:var(--font-playfair)] text-5xl font-light bg-gradient-to-br from-violet-500/70 via-fuchsia-500/70 to-amber-500/70 bg-clip-text text-transparent">
                {step.n}
              </span>
              <h3 className="text-base font-medium mt-4">{step.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Enquiry ──────────────────────────────────────────────────────────── */}
      <section id="enquiry" className={`relative ${wash} py-24 md:py-32`}>
        <div className={`${section} max-w-2xl`}>
          <p className={eyebrow} data-reveal>Start here</p>
          <h2
            className="font-[family-name:var(--font-playfair)] text-3xl md:text-5xl font-light mt-4"
            data-reveal
            style={{ transitionDelay: "60ms" }}
          >
            Tell me about the day.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-5 text-sm leading-relaxed" data-reveal>
            The fastest way is WhatsApp — most people get a reply the same day. If you would
            rather write it out, the form works just as well.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-3" data-reveal>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-medium text-white bg-[#25D366] hover:bg-[#1eb857] shadow-[0_10px_40px_-12px_rgba(37,211,102,0.8)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" />
                <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
              </svg>
              WhatsApp
            </a>
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Aevaia — build request")}`} className={ghostBtn + " flex-1"}>
              Email
            </a>
          </div>

          {enquiryState === "done" ? (
            <div className={`mt-10 p-8 text-center ${card}`}>
              <p className="font-[family-name:var(--font-playfair)] text-2xl font-light bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
                Got it.
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                I&apos;ll get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEnquiry} className={`flex flex-col gap-3 mt-8 p-7 ${card}`} data-reveal>
              {chosenPackage && (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-5 py-3.5">
                  <span className="text-sm">
                    Package: <strong className="font-medium">{chosenPackage}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setChosenPackage("")}
                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
              <input
                required placeholder="Your name" className={field}
                value={enquiry.name}
                onChange={e => setEnquiry({ ...enquiry, name: e.target.value })}
              />
              <input
                required type="email" placeholder="Your email" className={field}
                value={enquiry.email}
                onChange={e => setEnquiry({ ...enquiry, email: e.target.value })}
              />
              <input
                placeholder="Phone / WhatsApp (optional)" className={field}
                value={enquiry.phone}
                onChange={e => setEnquiry({ ...enquiry, phone: e.target.value })}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  placeholder="Occasion (wedding, birthday…)" className={field}
                  value={enquiry.event_type}
                  onChange={e => setEnquiry({ ...enquiry, event_type: e.target.value })}
                />
                <input
                  placeholder="Event date" className={field}
                  value={enquiry.event_date}
                  onChange={e => setEnquiry({ ...enquiry, event_date: e.target.value })}
                />
              </div>
              <textarea
                rows={4} placeholder="What are you imagining? (optional)"
                className={field + " resize-none"}
                value={enquiry.message}
                onChange={e => setEnquiry({ ...enquiry, message: e.target.value })}
              />
              <button type="submit" disabled={enquiryState === "sending"} className={primaryBtn + " mt-1 disabled:opacity-60"}>
                {enquiryState === "sending" ? "Sending…" : "Send enquiry"}
              </button>
              {enquiryState === "error" && (
                <p className="text-red-500 dark:text-red-400 text-xs">{enquiryError}</p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ── Builder waitlist ─────────────────────────────────────────────────── */}
      <section className={`relative ${section} py-20`}>
        <div className={`max-w-3xl mx-auto text-center flex flex-col items-center p-10 ${card}`} data-reveal>
          {/* Previously "One day you'll be able to build this yourself", which
              told a visitor about to pay for a hand-built site that they should
              wait and do it themselves for free. Reframed for a different
              audience — makers — so it no longer competes with the sale. */}
          <p className={eyebrow}>Coming later</p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-light mt-4">
            For makers, later
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-3 text-sm max-w-lg">
            I&apos;m building a studio for people who want to make their own. Different
            thing, different day — leave your email if that&apos;s you.
          </p>

          <div className="mt-7 w-full max-w-md">
            {waitlistState === "done" ? (
              <p className="font-medium bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                You&apos;re on the list. I&apos;ll be in touch.
              </p>
            ) : (
              <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={field.replace("rounded-2xl", "rounded-full")}
                />
                <button type="submit" disabled={waitlistState === "sending"} className={ghostBtn + " whitespace-nowrap shrink-0 disabled:opacity-60"}>
                  {waitlistState === "sending" ? "Joining…" : "Join waitlist"}
                </button>
              </form>
            )}
            {waitlistState === "error" && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-3">{waitlistError}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className={`relative ${section} py-12`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase bg-gradient-to-r from-violet-500/70 to-fuchsia-500/70 bg-clip-text text-transparent">
            AEVAIA
          </span>
          <div className="flex items-center gap-6 text-xs text-neutral-500 dark:text-neutral-500">
            <a href="/contact" className="hover:text-fuchsia-500 transition-colors">Contact</a>
            <a href="/impressum" className="hover:text-fuchsia-500 transition-colors">Impressum</a>
            <a href="/privacy" className="hover:text-fuchsia-500 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-fuchsia-500 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
