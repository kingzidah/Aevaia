"use client";

import { useState } from "react";

// ── Contact details ───────────────────────────────────────────────────────────
// Kept together at the top so they can be changed without reading the markup.
// WHATSAPP_NUMBER is digits only, international format, no + or spaces —
// that is what wa.me requires.
const WHATSAPP_NUMBER = "4917675460351"; // WhatsApp Business, +49 176 75460351
const CONTACT_EMAIL = "helloaevaia@gmail.com";
const WHATSAPP_PREFILL =
  "Hi! I'd like an Aevaia invite built for my event.";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [waitlistState, setWaitlistState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [waitlistError, setWaitlistError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [enquiry, setEnquiry] = useState({
    name: "", email: "", phone: "", event_type: "", event_date: "", message: "",
  });
  const [enquiryState, setEnquiryState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [enquiryError, setEnquiryError] = useState("");

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;

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
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enquiry),
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

  const field =
    "bg-neutral-100 border border-neutral-300 text-neutral-900 placeholder-neutral-400 " +
    "dark:bg-neutral-900 dark:border-neutral-800 dark:text-white dark:placeholder-neutral-600 " +
    "focus:border-purple-500 dark:focus:border-purple-500 " +
    "rounded-2xl px-4 py-3 w-full text-sm outline-none transition-colors";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-white dark:bg-[#050505] text-neutral-900 dark:text-white transition-colors duration-300">
      <div className="flex flex-col items-center text-center w-full max-w-md">

        {/* Wordmark */}
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 mb-10">
          AEVAIA
        </p>

        {/* Headline */}
        <h1 className="text-3xl md:text-5xl font-light max-w-2xl leading-tight text-neutral-900 dark:text-neutral-200">
          The future of digital gifting and event experiences is almost here.
        </h1>

        <p className="text-neutral-500 dark:text-neutral-400 mt-4 text-sm md:text-base max-w-md">
          The self-serve builder is still in the works. Join the waitlist for early access —
          or if your date is coming up, we&apos;ll build yours by hand in the meantime.
        </p>

        {/* ── Waitlist ─────────────────────────────────────────────────────── */}
        <div className="mt-10 w-full">
          {waitlistState === "done" ? (
            <p className="text-purple-600 dark:text-purple-400 font-medium">
              You&apos;re on the list. We&apos;ll be in touch.
            </p>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={field.replace("rounded-2xl", "rounded-full") + " px-6"}
              />
              <button
                type="submit"
                disabled={waitlistState === "sending"}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                {waitlistState === "sending" ? "Joining…" : "Join Waitlist"}
              </button>
            </form>
          )}
          {waitlistState === "error" && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-3">{waitlistError}</p>
          )}
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 w-full my-10">
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
            or
          </span>
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>

        {/* ── Manual build ─────────────────────────────────────────────────── */}
        <h2 className="text-xl md:text-2xl font-light text-neutral-900 dark:text-neutral-200">
          Need one before then?
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-3 text-sm">
          Wedding, birthday, or anything worth remembering — we&apos;ll design and build it for you
          personally, the same way we built the invites already out there. Tell us your date
          and we&apos;ll take it from there.
        </p>

        {/* Direct contact */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-3 w-full">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1eb857] text-white px-5 py-3 rounded-full text-sm font-medium transition-colors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" />
              <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
            </svg>
            WhatsApp
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Aevaia — build request")}`}
            className="flex-1 inline-flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 hover:border-purple-500 dark:hover:border-purple-500 text-neutral-900 dark:text-white px-5 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Email
          </a>
        </div>

        {/* Form */}
        {enquiryState === "done" ? (
          <p className="text-purple-600 dark:text-purple-400 font-medium mt-8">
            Got it — we&apos;ll get back to you shortly.
          </p>
        ) : (
          <div className="w-full mt-4">
            {!formOpen ? (
              <button
                onClick={() => setFormOpen(true)}
                className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 underline underline-offset-4 transition-colors"
              >
                or leave your details here
              </button>
            ) : (
              <form onSubmit={handleEnquiry} className="flex flex-col gap-3 text-left">
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
                  rows={3} placeholder="Anything you'd like us to know (optional)"
                  className={field + " resize-none"}
                  value={enquiry.message}
                  onChange={e => setEnquiry({ ...enquiry, message: e.target.value })}
                />
                <button
                  type="submit"
                  disabled={enquiryState === "sending"}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors"
                >
                  {enquiryState === "sending" ? "Sending…" : "Send enquiry"}
                </button>
                {enquiryState === "error" && (
                  <p className="text-red-500 dark:text-red-400 text-xs">{enquiryError}</p>
                )}
              </form>
            )}
          </div>
        )}
      </div>

      <p className="mt-16 text-xs text-neutral-400 dark:text-neutral-600">
        Powered by AEVAIA
      </p>
    </main>
  );
}
