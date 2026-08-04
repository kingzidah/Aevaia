"use client";

// ── Root error boundary ───────────────────────────────────────────────────────
// Catches errors thrown in the root layout and React render errors that no
// nested boundary handled. This is the last line of defence, so it reports to
// Sentry before rendering a fallback.
//
// Must stay a client component ("use client" above) or it will not catch.
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
