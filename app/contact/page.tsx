"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/app-header";

export default function ContactPage() {
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      setEmail("");
      setMessage("");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-neutral-950 text-zinc-900 dark:text-white flex flex-col">
      {/* Nav */}
      <AppHeader />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20
                            items-center justify-center mb-5 shadow-[0_0_24px_rgba(168,85,247,0.15)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">Get in Touch</h1>
            <p className="text-zinc-500 dark:text-neutral-500 text-sm leading-relaxed">
              Have a question, issue, or feedback? We usually respond within 24 hours.
            </p>
          </div>

          {/* Success banner */}
          {sent && (
            <div className="mb-6 flex items-start gap-3 px-5 py-4 rounded-2xl
                            bg-green-500/8 border border-green-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-400 shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-400">Message received!</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Thanks for reaching out. We will get back to you at the email you provided.
                </p>
              </div>
            </div>
          )}

          {/* Form card */}
          {!sent && (
            <div className="bg-white dark:bg-neutral-900/60 border border-zinc-200 dark:border-white/8 rounded-3xl overflow-hidden
                            shadow-[0_0_60px_rgba(0,0,0,0.06)] dark:shadow-[0_0_60px_rgba(0,0,0,0.4)]">
              <div className="h-0.5 w-full bg-linear-to-r from-purple-600/60 via-pink-500/60 to-purple-600/60" />
              <form onSubmit={handleSubmit} className="p-8 space-y-5">

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500/60
                               focus:ring-1 focus:ring-purple-500/30 rounded-xl px-4 py-3 text-sm text-white
                               placeholder:text-neutral-600 outline-none transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your issue or question in detail…"
                    rows={6}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500/60
                               focus:ring-1 focus:ring-purple-500/30 rounded-xl px-4 py-3 text-sm text-white
                               placeholder:text-neutral-600 outline-none transition-all resize-none"
                  />
                  <p className="text-[10px] text-neutral-700 mt-1">{message.trim().length} / 2000 characters</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-400">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50
                             text-white font-bold text-sm transition-all flex items-center justify-center gap-2
                             shadow-[0_0_24px_rgba(168,85,247,0.3)] hover:shadow-[0_0_36px_rgba(168,85,247,0.5)]"
                >
                  {sending && (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  {sending ? "Sending…" : "Send Message"}
                </button>
              </form>
            </div>
          )}

          {/* Already-sent CTA */}
          {sent && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Send another message
              </button>
            </div>
          )}

          {/* Footer links */}
          <div className="flex items-center justify-center gap-4 mt-10 text-xs text-neutral-700">
            <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms"   className="hover:text-neutral-400 transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/"        className="hover:text-neutral-400 transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
