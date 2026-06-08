"use client";

import { useState } from "react";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-[#050505] text-neutral-900 dark:text-white transition-colors duration-300">

      {/* Content */}
      <div className="flex flex-col items-center text-center w-full">

        {/* Wordmark */}
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 mb-12">
          AEVAIA
        </p>

        {/* Headline */}
        <h1 className="text-3xl md:text-5xl font-light text-center max-w-2xl leading-tight text-neutral-900 dark:text-neutral-200">
          The future of digital gifting and event experiences is almost here.
        </h1>

        {/* Subheadline */}
        <p className="text-neutral-500 dark:text-neutral-400 mt-4 text-center text-sm md:text-base max-w-md">
          AEVAIA is an invite-only platform. Join the waitlist for early access.
        </p>

        {/* Form / success state */}
        <div className="mt-10 w-full max-w-md">
          {submitted ? (
            <p className="text-purple-600 dark:text-purple-400 font-medium mt-6">
              You&apos;re on the list. We&apos;ll be in touch.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-center gap-3 w-full"
            >
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="bg-neutral-100 border border-neutral-300 text-neutral-900 placeholder-neutral-400
                           dark:bg-neutral-900 dark:border-neutral-800 dark:text-white dark:placeholder-neutral-600
                           focus:border-purple-500 dark:focus:border-purple-500
                           rounded-full px-6 py-3 w-full text-sm outline-none transition-colors"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Join Waitlist
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-8 text-xs text-neutral-400 dark:text-neutral-600">
        Powered by AEVAIA
      </p>

    </main>
  );
}
