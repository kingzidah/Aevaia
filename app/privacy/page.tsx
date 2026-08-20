import type { Metadata } from "next";
import { LegalPage, LegalSections, Todo, L, type LegalSection } from "../legal-shell";

// ── Privacy notice ───────────────────────────────────────────────────────────
//
// Rewritten for the business that exists. The previous version described the
// self-serve Studio: account registration, project content, AI credit
// consumption, tier upgrades, and a /settings page for correcting your data.
// None of that is reachable — visitors cannot register, and /settings redirects.
//
// It also contained a false security claim. It said passwords are "hashed with
// bcrypt (cost factor 12)"; this application does not store passwords at all,
// Clerk handles authentication. Inventing a security control in a privacy
// notice is the worst kind of wrong: it is the sentence a regulator reads first.
//
// The guest-data section is the one that matters commercially — it covers other
// people's names and phone numbers, held on a client's behalf — and it is still
// the operator's to complete. Those TODO-OPERATOR markers are visible on the
// page on purpose.

export const metadata: Metadata = {
  title: "Privacy — Aevaia",
  description: "What Aevaia collects, why, and how long it is kept.",
};

const UPDATED = "20 August 2026";

const SECTIONS: LegalSection[] = [
  {
    n: "01",
    title: "Who this covers",
    body: (
      <>
        Aevaia hand-builds digital invitations, gifts and event pages to order.
        This notice covers visitors to this site, people who send a brief, and
        guests who respond on a page built for a client.
      </>
    ),
  },
  {
    n: "02",
    title: "What is collected when you enquire",
    body: (
      <>
        When you start a commission you give a name, a way to reach you — email,
        WhatsApp or Instagram — the occasion, a date, and whatever you write in
        the brief. That is stored so the work can be quoted and built. Nothing
        else is asked for.
      </>
    ),
  },
  {
    n: "03",
    title: "What is collected automatically",
    body: (
      <>
        Standard server logs: the page requested, a timestamp, browser type and
        IP address. They exist to keep the site up and to stop abuse, and they
        are not used to build a profile of you.
      </>
    ),
  },
  {
    n: "04",
    title: "Guest data on a commissioned page",
    body: (
      <>
        Where a page collects RSVPs or issues tickets, the guest information
        belongs to the client who commissioned it, and is held on their behalf.
        This is other people&apos;s personal data, so the specifics matter:
        <br />
        <br />
        <Todo>
          list every field collected from a guest — name, phone, email, RSVP
          status, ticket code, check-in time — and mark which are required.
        </Todo>
        <br />
        <br />
        <Todo>
          name each system that receives guest data and the region it is hosted
          in, including any automation or spreadsheet destination.
        </Todo>
        <br />
        <br />
        <Todo>
          state the retention period after the event date, and what happens to
          the guest list at the end of it.
        </Todo>
        <br />
        <br />
        <Todo>
          state whether Aevaia acts as controller or processor for guest data,
          who the counterparty is, and whether a written agreement governs it.
        </Todo>
      </>
    ),
  },
  {
    n: "05",
    title: "Who else sees it",
    body: (
      <>
        Only the services needed to run the site, each under their own terms:
        Vercel for hosting, Supabase for the database (EU region), and Resend for
        email. Your data is never sold, and it is not used for advertising.
      </>
    ),
  },
  {
    n: "06",
    title: "Cookies",
    body: (
      <>
        No advertising or tracking cookies are set. Signing in — which only the
        operator does — uses a session cookie from Clerk. Visitor numbers are
        counted in aggregate without cookies or cross-site identifiers.
      </>
    ),
  },
  {
    n: "07",
    title: "How long it is kept",
    body: (
      <>
        Enquiries that do not become commissions are kept for twelve months, so
        a returning conversation makes sense. Records of paid work are kept as
        long as tax and accounting rules require. Guest data follows the
        retention period in section 04.
      </>
    ),
  },
  {
    n: "08",
    title: "Your rights",
    body: (
      <>
        You can ask what is held about you, have it corrected, or have it
        deleted, and you can complain to your local data-protection authority.
        Ask by email and you will get an answer within 30 days. If you are a
        guest on someone&apos;s event page, that page&apos;s owner is the person to ask
        first — pass the request on and it will be actioned.
      </>
    ),
  },
  {
    n: "09",
    title: "Security",
    body: (
      <>
        Everything is served over HTTPS. Access to the database is limited to
        the operator and to the server itself; guest lists are not readable from
        the browser. No payment card details are stored — payment is invoiced
        directly.
      </>
    ),
  },
  {
    n: "10",
    title: "Changes",
    body: (
      <>
        This notice may be updated. The date at the top reflects the most recent
        revision, and any significant change will be described rather than
        slipped in quietly.
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy notice"
      updated={UPDATED}
      intro={
        <>
          What is collected, why, and how long it is kept. If you would rather
          ask a person, <L href="/contact">just ask</L>.
        </>
      }
    >
      <LegalSections sections={SECTIONS} />
    </LegalPage>
  );
}
