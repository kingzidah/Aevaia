import type { Metadata } from "next";
import { LegalPage, LegalSections, Todo, L, type LegalSection } from "../legal-shell";

// ── Terms of Service ──────────────────────────────────────────────────
//
// Rewritten for the business that actually exists. The previous version
// described the self-serve Studio — tier upgrades, AI credits, account
// suspension — none of which is sold, and all of which contradicted the pricing
// on the home page. A terms page describing a different product is worse than
// none: it is the document a dispute gets argued from.
//
// TODO-OPERATOR markers are points that need a decision rather than drafting.
// They are visible on the page on purpose.

export const metadata: Metadata = {
  title: "Terms — Aevaia",
  description: "Terms for commissioned work: delivery, revisions, hosting and renewal.",
};

const UPDATED = "20 August 2026";

const SECTIONS: LegalSection[] = [
  {
    n: "01",
    title: "What these terms cover",
    body: (
      <>
        Aevaia designs and hand-builds digital invitations, gifts and event pages
        to order. These terms apply when you commission that work. They do not
        cover any self-serve product — none is currently sold.
      </>
    ),
  },
  {
    n: "02",
    title: "How a commission starts",
    body: (
      <>
        You send a brief. I reply with a fixed price and what it includes. Nothing
        is built, and nothing is owed, until you agree that price in writing —
        a message is enough.
      </>
    ),
  },
  {
    n: "03",
    title: "What you get",
    body: (
      <>
        A single web page at its own link, built to the scope agreed. Prices are
        listed on the home page: events at €249, €749 and from €1,200; gifts at
        €79, €149 and from €399. A rush option on gift tiers delivers within 48
        hours for €40 more.
      </>
    ),
  },
  {
    n: "04",
    title: "Turnaround",
    body: (
      <>
        Usually 7–10 days from the day you approve the scope. Rush work on gift
        tiers is 48 hours. Delays caused by waiting on your photos, names, or
        answers do not count toward that time.
      </>
    ),
  },
  {
    n: "05",
    title: "Revisions",
    body: (
      <>
        Bespoke tiers include three rounds of revisions. Other tiers include one
        round covering corrections to what was agreed. Changes to the scope
        itself — new scenes, a different concept — are quoted separately.
      </>
    ),
  },
  {
    n: "06",
    title: "Hosting and renewal",
    body: (
      <>
        Every price includes your link live for one year from delivery. After
        that it is €29 per year to keep it online. If a renewal is not paid the
        page is taken down; it is not deleted immediately, so it can be restored.{" "}
        <Todo>state how long a lapsed page is retained before deletion.</Todo>
      </>
    ),
  },
  {
    n: "07",
    title: "Payment",
    body: (
      <>
        Invoiced directly. <Todo>state your deposit terms — how much is due up front, when the balance is due, and whether the link is withheld until the balance clears.</Todo>
      </>
    ),
  },
  {
    n: "08",
    title: "Refunds",
    body: (
      <>
        <Todo>state your refund position — typically: a deposit covers work already done and is non-refundable once building has started, with a full refund if nothing has been built yet. Decide this before you take a first payment, not during a dispute.</Todo>
      </>
    ),
  },
  {
    n: "09",
    title: "Your photos and content",
    body: (
      <>
        You keep ownership of everything you send — photographs, words, music,
        names. By sending them you confirm you have the right to use them, and
        you allow me to use them for the purpose of building and hosting your
        page.
      </>
    ),
  },
  {
    n: "10",
    title: "Showing your work in my portfolio",
    body: (
      <>
        I may show a commission as an example of my work. If you would rather I
        did not, say so and I will not — before or after delivery. Where a page
        contains personal photographs or private messages, I will ask first
        rather than assume.
      </>
    ),
  },
  {
    n: "11",
    title: "Guest data",
    body: (
      <>
        Where a page collects RSVPs or issues tickets, the guest information
        belongs to you. How it is stored and for how long is set out in the{" "}
        <a href="/privacy" style={{ color: "var(--violet-light)" }}>privacy notice</a>.
      </>
    ),
  },
  {
    n: "12",
    title: "What I am responsible for",
    body: (
      <>
        I will build what was agreed and keep it online for the period paid for.
        I cannot guarantee uninterrupted availability — pages depend on hosting
        and network providers outside my control. Liability is limited to the
        amount you paid for the commission.
      </>
    ),
  },
  {
    n: "13",
    title: "Governing law",
    body: (
      <>
        <Todo>state the country whose law applies and where disputes are handled. This follows from the operator details on the Impressum.</Todo>
      </>
    ),
  },
  {
    n: "14",
    title: "Changes",
    body: (
      <>
        These terms may change. The version that applies to your commission is
        the one in force on the day you agreed the price.
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of service"
      updated={UPDATED}
      intro={
        <>
          Plain terms for commissioned work. If anything here is unclear,{" "}
          <L href="/contact">ask</L> before you agree a price rather than after.
        </>
      }
    >
      <LegalSections sections={SECTIONS} />
    </LegalPage>
  );
}
