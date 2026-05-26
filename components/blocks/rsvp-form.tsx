"use client";

import { useState } from "react";

interface BlockProperties {
  text?: string;
  title?: string;
  accentColor?: string;
  buttonLabel?: string;
}

interface Props {
  properties?: BlockProperties;
  /** Gift / project ID passed by the viewer. When absent (studio preview) the
   *  form simulates a local submission without hitting the API. */
  giftId?: string;
}

type Attendance = "yes" | "no" | null;

export default function RsvpForm({ properties, giftId }: Props = {}) {
  const eventName   = properties?.title      ?? "RSVP";
  const submitLabel = properties?.buttonLabel ?? "Send RSVP";
  const [name,        setName]        = useState("");
  const [attendance,  setAttendance]  = useState<Attendance>(null);
  const [message,     setMessage]     = useState("");
  const [submitted,   setSubmitted]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || attendance === null) return;

    // Studio preview mode — no giftId, simulate locally.
    if (!giftId) { setSubmitted(true); return; }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          gift_id:    giftId,
          guest_name: name.trim(),
          attending:  attendance === "yes",
          message:    message.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Something went wrong." }));
        setSubmitError(error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="w-full px-6 py-10 flex flex-col items-center gap-4 text-center"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.06))",
            border: "1px solid rgba(168,85,247,0.3)",
            boxShadow: "0 0 24px rgba(168,85,247,0.15)",
          }}
        >
          ✓
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-white tracking-wide">Response Received</p>
          <p className="text-xs text-neutral-500">
            {attendance === "yes"
              ? "We look forward to celebrating with you."
              : "Thank you for letting us know."}
          </p>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all resize-none";

  return (
    <div className="w-full px-5 pt-5 pb-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-1 pb-1">
        <p
          className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {eventName}
        </p>
        <p className="text-[10px] text-neutral-600 tracking-wide">
          Please confirm your attendance
        </p>
      </div>

      {/* Guest name */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 block">
          Guest Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className={inputCls}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Attendance toggle */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 block">
          Attending?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["yes", "no"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={(e) => { e.stopPropagation(); setAttendance(opt); }}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                attendance === opt
                  ? opt === "yes"
                    ? "border-emerald-500/60 bg-emerald-500/12 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "border-red-500/50 bg-red-500/10 text-red-300"
                  : "border-white/10 bg-white/4 text-neutral-500 hover:border-white/20 hover:text-neutral-300"
              }`}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {opt === "yes" ? "Yes, with pleasure" : "Regrettably, no"}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 block">
          Personal Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave a note for the host…"
          rows={3}
          className={inputCls}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Error */}
      {submitError && (
        <p className="text-[10px] text-red-400 text-center leading-snug">
          {submitError}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
        disabled={!name.trim() || attendance === null || isSubmitting}
        className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.18em] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          fontFamily: "'Cinzel', serif",
          background: "linear-gradient(135deg, rgba(30,12,48,0.95) 0%, rgba(20,8,38,0.98) 100%)",
          border: "1px solid rgba(168,85,247,0.35)",
          color: "#e9d5ff",
          boxShadow: name.trim() && attendance !== null && !isSubmitting
            ? "0 0 20px rgba(168,85,247,0.18), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "none",
        }}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Sending…
          </>
        ) : submitLabel}
      </button>
    </div>
  );
}
