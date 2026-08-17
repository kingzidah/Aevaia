"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { marketingFontVars } from "./marketing-fonts";
import s from "./marketing.module.css";

// ── Contact details ───────────────────────────────────────────────────────────
// WHATSAPP_NUMBER is digits only, international format, no + or spaces —
// that is what wa.me requires. The prefill is unchanged.
const WHATSAPP_NUMBER = "4917675460351"; // WhatsApp Business, +49 176 75460351
const CONTACT_EMAIL = "helloaevaia@gmail.com";
const WHATSAPP_PREFILL = "Hi! I'd like an Aevaia site built for my event.";

// ── Pricing ───────────────────────────────────────────────────────────────────
// PLACEHOLDER NUMBERS — change these to your real prices before advertising.
const CURRENCY = "€";

// Stated identically on every tier and in step 04, from one constant.
const HOSTING_TERM = "Your own link, live for a year. After that it's €29/year to keep it up.";

type Package = {
  id: string;
  name: string;
  price: number;
  from: boolean;
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
const WORK = [
  {
    title: "Opeyemi & Uriel",
    kind: "Wedding",
    href: "https://opeyemianduriel.aevaia.com",
    image: "/wedding-demo/assets/couple1.jpg",
    accent: "violet" as const,
    blurb:
      "A full wedding invite with RSVP, a swipeable gallery, digital tickets, and a QR gate scanner the door staff used on the night to check guests in live.",
    tags: ["Invite", "RSVP", "Tickets & QR", "Gate scanner", "Live count"],
  },
  {
    title: "Jasmine",
    kind: "Birthday gift",
    href: "https://jasmine.aevaia.com",
    image: "/jasmine-og.png",
    accent: "magenta" as const,
    blurb:
      "A one-of-a-kind birthday experience — an envelope that blooms open, a candle you blow out through your phone's microphone, a rotating soundtrack, and easter eggs hidden for repeat visits.",
    tags: ["Bespoke", "Music", "Animation", "Easter eggs"],
  },
  {
    // The first one ever built, and the piece that started the studio.
    //
    // Deliberately has NO href. The real site carries five photographs of a
    // named private person and a letter written to her; putting it behind a
    // public link would publish both to anyone the URL reaches. The cover is a
    // screenshot of the opening screen only — no photographs render on it.
    // What is shown here is the craft, not her gift.
    title: "Yvana",
    kind: "Birthday gift",
    href: null,
    image: "/hero-yvana.png",
    accent: "magenta" as const,
    blurb:
      "The first one, and the reason the studio exists. A “no” button that runs away from your thumb, a candle blown out through the microphone, a stack of photos that fans open when you tap it, a letter that types itself alongside a voice note, and a shell game hiding the real present.",
    tags: ["Bespoke", "Mic candle", "Animation", "Voice note", "Game"],
  },
];

// ── The door ──────────────────────────────────────────────────────────────────
const DOOR_FEATURES = [
  { title: "Digital tickets", body: "Every guest gets a unique code and a QR they can keep on their phone." },
  { title: "Gate check-in", body: "A scanner page for your door staff. No app to install, no accounts." },
  { title: "Live guest count", body: "See exactly how many people are inside, as they arrive." },
];

// ── Everything else ───────────────────────────────────────────────────────────
const CAPABILITIES = [
  { title: "Invite pages", body: "Your date, your photos, your words — not a template with your name pasted in." },
  { title: "RSVP & guest list", body: "Guests reply on the page. You watch the list fill up." },
  { title: "Photo galleries", body: "Swipeable carousels that feel good on a phone, not a grid of thumbnails." },
  { title: "Music & sound", body: "A soundtrack that fades in, ducks under text, and does not annoy anyone." },
  { title: "Animated scenes", body: "Envelopes that open, letters that unfold, moments that land." },
  { title: "Countdowns", body: "Time to the day, ticking, on every phone that opens the link." },
  { title: "Hidden easter eggs", body: "Rewards for the people who come back and look twice." },
  { title: "Your own link", body: "yourname.aevaia.com, or a page on your own domain if you have one." },
  { title: "Works everywhere", body: "Old Androids, new iPhones, slow data. Tested on real phones." },
];

// ── How it works ──────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Message me", body: "WhatsApp or the form below. Tell me the occasion and the date." },
  { n: "02", title: "You approve the scope", body: "I come back with what I'd build and a fixed price. No surprises later." },
  { n: "03", title: "I build it by hand", body: "Usually 7–10 days from the day you approve the scope. Tight date? Ask — rush is often possible." },
  { n: "04", title: "You get your link", body: `Share it however you like. ${HOSTING_TERM}` },
];

const MARQUEE = "WEDDINGS · BIRTHDAYS · ENGAGEMENTS · NAMING CEREMONIES · GIFTS · EVENT PAGES ·";

export default function MarketingHomePage() {
  const [email, setEmail] = useState("");
  const [waitlistState, setWaitlistState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [waitlistError, setWaitlistError] = useState("");

  const [enquiry, setEnquiry] = useState({
    name: "", email: "", phone: "", event_type: "", event_date: "", message: "",
  });
  const [chosenPackage, setChosenPackage] = useState("");
  const [enquiryState, setEnquiryState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [enquiryError, setEnquiryError] = useState("");

  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;

  // ── Scroll reveal ───────────────────────────────────────────────────────────
  useEffect(() => {
    const nodes = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? [],
    );
    if (nodes.length === 0) return;

    nodes.forEach(n => n.classList.add(s.revealInit));

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.classList.add(s.revealIn);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    nodes.forEach(n => io.observe(n));
    return () => io.disconnect();
  }, []);

  // ── Nav background on scroll ────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Body scroll lock while the mobile overlay is open. Cleared on unmount so a
  // client-side navigation away from an open menu cannot leave the app frozen.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Smooth anchor scroll with a 70px offset for the fixed nav.
  function goTo(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.pageYOffset - 70;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  function onAnchor(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    setMenuOpen(false);
    goTo(id);
  }

  // Picking a package tags the enquiry. The API schema has no package column,
  // so the choice rides at the top of the message field — no migration needed.
  function choosePackage(name: string) {
    setChosenPackage(name);
    goTo("enquiry");
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

  return (
    <div
      ref={rootRef}
      className={`${s.site} ${marketingFontVars}`}
    >
      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <div className={`${s.nav} ${navScrolled ? s.navScrolled : ""}`}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <span className={s.wordmark}>AEVAIA</span>

          <nav className={s.navLinks}>
            <a href="#work" className={s.navLink} onClick={e => onAnchor(e, "work")}>work</a>
            <a href="#make" className={s.navLink} onClick={e => onAnchor(e, "make")}>what i make</a>
            <a href="#pricing" className={s.navLink} onClick={e => onAnchor(e, "pricing")}>pricing</a>
            <a href="#enquiry" className={s.navCta} onClick={e => onAnchor(e, "enquiry")}>message me</a>
          </nav>

          <button
            type="button"
            className={s.menuBtn}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? "close" : "menu"}
          </button>
        </div>
      </div>

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      <div className={`${s.overlay} ${menuOpen ? s.overlayOpen : ""}`}>
        <a href="#work" className={s.overlayLink} onClick={e => onAnchor(e, "work")}>Work</a>
        <a href="#make" className={s.overlayLink} onClick={e => onAnchor(e, "make")}>What I make</a>
        <a href="#pricing" className={s.overlayLink} onClick={e => onAnchor(e, "pricing")}>Pricing</a>
        <a href="#enquiry" className={s.overlayLink} onClick={e => onAnchor(e, "enquiry")}>Start</a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={s.btnWhatsapp}
          style={{ marginTop: 22 }}
        >
          Message me
        </a>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <header className={s.hero}>
        <div className={s.heroGlow} aria-hidden />
        <div className={s.heroGlow2} aria-hidden />

        <div className={s.wrap} style={{ position: "relative" }}>
          <div className={s.marqueeMask} data-reveal aria-hidden>
            <div className={s.marqueeTrack}>
              <span>{MARQUEE}</span>
              <span>{MARQUEE}</span>
            </div>
          </div>

          <div className={s.heroGrid}>
            <div>
              <h1 className={s.h1} data-reveal>
                Your day deserves more than a{" "}
                <em className={s.gradText}>flyer in the group chat.</em>
              </h1>

              <p
                className={s.body}
                style={{ maxWidth: 520, marginBottom: 30, transitionDelay: ".08s" }}
                data-reveal
              >
                I hand-build the invite, the gift, the whole event page — designed around
                your photos, your music and your date. You send one link. Send me your
                photos, the names and the date — I do the rest.
              </p>

              <div
                style={{ display: "flex", gap: 12, flexWrap: "wrap", transitionDelay: ".16s" }}
                data-reveal
              >
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={s.btnWhatsapp}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                    <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" />
                    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
                  </svg>
                  Start on WhatsApp
                </a>
                <a href="#work" className={s.btnGhost} onClick={e => onAnchor(e, "work")}>
                  See the work
                </a>
              </div>

              {/* Trust line. Deliberately NOT .label — that class is uppercase
                  mono for index eyebrows, and a full sentence set in it reads
                  like a system message rather than a human one. */}
              <p
                className={s.bodySm}
                style={{ marginTop: 30, color: "var(--faint)", transitionDelay: ".24s" }}
                data-reveal
              >
                Every piece below was built by hand, for a real person, for a real date.
              </p>
            </div>

            {/* A real screenshot of a real delivered site, in a phone, because
                that is the form the client actually receives it in. Replaced the
                proposal photo that used to sit here — that sold an event, and a
                studio that builds websites should show a website. Swap the src
                and the caption to feature a different piece. */}
            <div style={{ position: "relative", transitionDelay: ".14s" }} data-reveal>
              <div className={s.phone}>
                <span className={s.phoneNotch} aria-hidden />
                <div className={s.phoneScreen}>
                  <Image
                    src="/hero-jasmine.png"
                    alt="Jasmine's birthday gift site, open on a phone"
                    fill
                    priority
                    sizes="(max-width: 880px) 300px, 300px"
                  />
                </div>
              </div>
              <span className={s.phoneCaption}>
                Jasmine&apos;s birthday gift ·{" "}
                <a href="https://jasmine.aevaia.com" target="_blank" rel="noopener noreferrer">
                  open it
                </a>
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }} data-reveal>
            <div className={s.scrollCue} aria-hidden>
              <span className={s.scrollDot} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Selected work ──────────────────────────────────────────────────── */}
      <section id="work" className={s.section}>
        <div className={s.wrap}>
          <div className={s.sectionHead} data-reveal>
            <span className={s.label}>01 / Selected work</span>
            <span className={s.labelQuiet}>two are live</span>
          </div>

          {/* Was "Open them. They are live right now." Yvana's piece is private
              and cannot be opened, so that line no longer told the truth. The
              count is stated instead — it still invites the click, and it does
              not promise something one of the three cards cannot deliver. */}
          <h2 className={s.h2} style={{ marginBottom: 34 }} data-reveal>
            Three built by hand. Two you can open right now.
          </h2>

          <div className={s.workGrid}>
            {WORK.map((piece, i) => {
              // A piece without an href is private work — it renders as a card
              // rather than a link, so there is nothing to click through to.
              const Card = piece.href ? "a" : "div";
              const linkProps = piece.href
                ? { href: piece.href, target: "_blank", rel: "noopener noreferrer" }
                : {};
              return (
              <Card
                key={piece.title}
                {...linkProps}
                className={s.workCard}
                data-reveal
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className={s.workPhoto}>
                  <Image
                    src={piece.image}
                    alt={`${piece.title} — ${piece.kind}`}
                    fill
                    sizes="(max-width: 880px) 100vw, 50vw"
                  />
                  <span
                    className={s.workPill}
                    style={{ color: piece.accent === "violet" ? "var(--violet-lighter)" : "var(--magenta-light)" }}
                  >
                    {piece.kind}
                  </span>
                </div>

                <div style={{ padding: "20px 20px 22px" }}>
                  <div className={s.workTitle}>{piece.title}</div>
                  <p className={s.bodySm} style={{ margin: "6px 0 14px", fontSize: 14 }}>
                    {piece.blurb}
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                    {piece.tags.map(tag => (
                      <span key={tag} className={piece.accent === "violet" ? s.chipViolet : s.chipMagenta}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: piece.href
                        ? (piece.accent === "violet" ? "var(--violet-light)" : "var(--magenta-light)")
                        : "var(--faint)",
                    }}
                  >
                    {piece.href ? "Open the live site →" : "Private — built for one person"}
                  </span>
                </div>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What I make ────────────────────────────────────────────────────── */}
      <section id="make" className={s.section}>
        <div className={s.wrap}>
          <div className={s.sectionHead} data-reveal>
            <span className={s.label}>02 / What I make</span>
          </div>

          <h2 className={s.h2} style={{ marginBottom: 34 }} data-reveal>
            Anything you can describe, I can put on a link.
          </h2>

          <div className={s.labelQuiet} style={{ marginBottom: 14 }} data-reveal>The door</div>
          <div className={s.trio}>
            {DOOR_FEATURES.map((item, i) => (
              <div key={item.title} className={s.doorCard} data-reveal style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className={s.doorBar} />
                <div className={s.doorTitle}>{item.title}</div>
                <div className={s.featBody}>{item.body}</div>
              </div>
            ))}
          </div>

          <div className={s.labelQuiet} style={{ marginBottom: 14 }} data-reveal>And everything else</div>
          <div className={s.featGrid}>
            {CAPABILITIES.map((item, i) => (
              <div key={item.title} className={s.featCard} data-reveal style={{ transitionDelay: `${(i % 2) * 0.05}s` }}>
                <div className={s.featTitle}>{item.title}</div>
                <div className={s.featBody}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className={s.section}>
        <div className={s.wrap}>
          <div className={s.sectionHead} data-reveal>
            <span className={s.label}>03 / Pricing</span>
          </div>

          <h2 className={s.h2} style={{ marginBottom: 34 }} data-reveal>
            A fixed price, agreed before anything is built.
          </h2>

          <div className={s.priceGrid}>
            {PACKAGES.map((pkg, i) => (
              <div
                key={pkg.id}
                className={pkg.featured ? s.tierFeatured : s.tier}
                data-reveal
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                {pkg.featured && <span className={s.tierBadge}>Most chosen</span>}

                <div className={s.tierName}>{pkg.name}</div>
                <div className={s.tierTagline}>{pkg.tagline}</div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                  {pkg.from && (
                    <span className={s.label} style={{ letterSpacing: ".04em" }}>from</span>
                  )}
                  <span className={`${s.tierPrice} ${pkg.featured ? s.gradText : ""}`}>
                    {CURRENCY}{pkg.price}
                  </span>
                </div>

                <div className={s.tierFeatures}>
                  {pkg.features.map(f => <span key={f}>{f}</span>)}
                </div>

                <button
                  type="button"
                  onClick={() => choosePackage(pkg.name)}
                  className={pkg.featured ? s.tierCtaSolid : s.tierCtaGhost}
                >
                  Start with {pkg.name}
                </button>
              </div>
            ))}
          </div>

          <p className={s.bodySm} style={{ margin: "22px 0 0", maxWidth: 620, color: "var(--faint)" }} data-reveal>
            Prices are for the build. Something unusual in mind, or a date that is very
            close? Message me — I&apos;ll tell you honestly what is possible.
          </p>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.wrap}>
          <div className={s.sectionHead} data-reveal>
            <span className={s.label}>04 / How it works</span>
          </div>

          <h2 className={s.h2} style={{ marginBottom: 40 }} data-reveal>
            Four steps, and one of them is yours.
          </h2>

          <div className={s.steps}>
            {STEPS.map((step, i) => (
              <div key={step.n} className={s.step} data-reveal style={{ transitionDelay: `${(i % 2) * 0.08}s` }}>
                <div className={`${s.stepNum} ${s.gradText}`}>{step.n}</div>
                <div className={s.stepTitle}>{step.title}</div>
                <div className={s.bodySm}>{step.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enquiry ────────────────────────────────────────────────────────── */}
      <section id="enquiry" className={s.section}>
        <div className={s.wrap}>
          <div className={s.panel}>
            <div className={s.panelGlow} aria-hidden />

            <div style={{ position: "relative" }}>
              <span className={s.label} data-reveal>05 / Start here</span>

              <h2 className={s.h2} style={{ margin: "12px 0 10px", maxWidth: 560 }} data-reveal>
                Tell me about the day.
              </h2>

              <p className={s.bodySm} style={{ maxWidth: 540, margin: "0 0 26px" }} data-reveal>
                The fastest way is WhatsApp — most people get a reply the same day. If you
                would rather write it out, the form works just as well.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }} data-reveal>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={s.btnWhatsapp}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                    <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" />
                    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
                  </svg>
                  WhatsApp
                </a>
                <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Aevaia — build request")}`} className={s.btnGhost}>
                  Email
                </a>
              </div>

              {enquiryState === "done" ? (
                <div data-reveal>
                  <p className={`${s.h2} ${s.gradText}`} style={{ fontSize: 32, margin: 0 }}>Got it.</p>
                  <p className={s.bodySm} style={{ marginTop: 8 }}>I&apos;ll get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleEnquiry} className={s.formGrid} data-reveal>
                  {chosenPackage && (
                    <div
                      className={s.full}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 12, padding: "12px 16px", borderRadius: 10,
                        background: "rgba(139,63,255,.14)", fontSize: 14,
                      }}
                    >
                      <span>Package: <strong>{chosenPackage}</strong></span>
                      <button
                        type="button"
                        onClick={() => setChosenPackage("")}
                        style={{
                          background: "none", border: "none", color: "var(--muted)",
                          fontSize: 13, cursor: "pointer", minHeight: 44, padding: "0 8px",
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <input
                    required placeholder="Your name" className={`${s.input} ${s.full}`}
                    value={enquiry.name}
                    onChange={e => setEnquiry({ ...enquiry, name: e.target.value })}
                  />
                  <input
                    required type="email" placeholder="Your email" className={s.input}
                    value={enquiry.email}
                    onChange={e => setEnquiry({ ...enquiry, email: e.target.value })}
                  />
                  <input
                    placeholder="Phone / WhatsApp (optional)" className={s.input}
                    value={enquiry.phone}
                    onChange={e => setEnquiry({ ...enquiry, phone: e.target.value })}
                  />
                  <input
                    placeholder="Occasion (wedding, birthday…)" className={s.input}
                    value={enquiry.event_type}
                    onChange={e => setEnquiry({ ...enquiry, event_type: e.target.value })}
                  />
                  <input
                    placeholder="Event date" className={s.input}
                    value={enquiry.event_date}
                    onChange={e => setEnquiry({ ...enquiry, event_date: e.target.value })}
                  />
                  <textarea
                    rows={3} placeholder="What are you imagining?" className={`${s.textarea} ${s.full}`}
                    value={enquiry.message}
                    onChange={e => setEnquiry({ ...enquiry, message: e.target.value })}
                  />
                  <button type="submit" disabled={enquiryState === "sending"} className={`${s.btnGrad} ${s.full}`}>
                    {enquiryState === "sending" ? "Sending…" : "Send enquiry"}
                  </button>
                  {enquiryState === "error" && (
                    <p className={`${s.formError} ${s.full}`}>{enquiryError}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Coming later — waitlist ────────────────────────────────────────── */}
      <section className={s.section} style={{ padding: "40px 0 80px" }}>
        <div className={s.wrap} style={{ textAlign: "center" }} data-reveal>
          <span className={s.label}>Coming later</span>

          <h2
            className={s.h2}
            style={{ fontSize: "clamp(24px,3.4vw,38px)", margin: "14px auto 10px", maxWidth: 640 }}
          >
            For makers, later
          </h2>

          <p className={s.bodySm} style={{ maxWidth: 480, margin: "0 auto 22px" }}>
            I&apos;m building a studio for people who want to make their own. Different
            thing, different day — leave your email if that&apos;s you.
          </p>

          {waitlistState === "done" ? (
            <p className={s.gradText} style={{ fontWeight: 700 }}>
              You&apos;re on the list. I&apos;ll be in touch.
            </p>
          ) : (
            <form
              onSubmit={handleWaitlist}
              style={{ display: "flex", gap: 10, maxWidth: 440, margin: "0 auto", flexWrap: "wrap" }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={s.input}
                style={{ flex: 1, minWidth: 200 }}
              />
              <button type="submit" disabled={waitlistState === "sending"} className={s.btnViolet}>
                {waitlistState === "sending" ? "Joining…" : "Join waitlist"}
              </button>
            </form>
          )}

          {waitlistState === "error" && (
            <p className={s.formError} style={{ marginTop: 12 }}>{waitlistError}</p>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footerInner}`}>
          <span className={s.wordmark} style={{ fontSize: 15 }}>AEVAIA</span>
          <div className={s.footerLinks}>
            <a href="/contact" className={s.footerLink}>Contact</a>
            <a href="/impressum" className={s.footerLink}>Impressum</a>
            <a href="/privacy" className={s.footerLink}>Privacy</a>
            <a href="/terms" className={s.footerLink}>Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
