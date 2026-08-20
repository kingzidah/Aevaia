import type { Metadata } from "next";
import { LegalPage, IncompleteNotice, Todo, L } from "../legal-shell";
import s from "../marketing.module.css";

// ── Impressum ────────────────────────────────────────────────────────────────
//
// Legally-required operator disclosure (§5 DDG / §18 MStV in Germany, and the
// equivalent trader-identification duty elsewhere in the EU). A commercial site
// addressing a German market must carry one, reachable in two clicks from any
// page — hence the footer link everywhere.
//
// EVERY field is still a TODO-OPERATOR placeholder, on purpose. None can be
// inferred from the codebase, and inventing a name, an address or a VAT status
// would be worse than leaving the page visibly incomplete: a wrong Impressum is
// itself the offence this page exists to avoid.
//
// Restyled onto the marketing design system — it was the most jarring of the
// three, since it is the page a cautious buyer clicks before paying.

export const metadata: Metadata = {
  title: "Impressum — Aevaia",
  description: "Operator information and legal disclosure for Aevaia.",
};

const CONTACT_EMAIL = "helloaevaia@gmail.com";

const FIELDS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Responsible party",
    body: (
      <Todo>
        full legal name of the person or company operating this site. If a
        registered company, give the exact registered name and legal form.
      </Todo>
    ),
  },
  {
    title: "Postal address",
    body: (
      <Todo>
        full street address, postcode, city and country. A PO box is not
        sufficient — this must be an address at which the operator can be served.
      </Todo>
    ),
  },
  {
    title: "Contact",
    body: (
      <>
        Email: <L href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</L>
        <br />
        <br />
        <Todo>
          telephone number. One is generally expected alongside the email
          address; confirm what is required for the operator&apos;s jurisdiction
          and legal form.
        </Todo>
      </>
    ),
  },
  {
    title: "VAT status",
    body: (
      <Todo>
        VAT identification number, or an explicit statement that the operator is
        not VAT-registered (for example a small-business exemption). State which
        applies — do not leave this silent.
      </Todo>
    ),
  },
  {
    title: "Register entry",
    body: (
      <Todo>
        commercial register, register number and registering court, if the
        operator is a registered company. Delete this section entirely if
        trading as a sole trader with no register entry.
      </Todo>
    ),
  },
  {
    title: "Responsible for content",
    body: (
      <Todo>
        name and address of the person responsible for editorial content, where
        that is required separately from the responsible party above.
      </Todo>
    ),
  },
  {
    title: "Online dispute resolution",
    body: (
      <>
        The European Commission provides a platform for online dispute
        resolution at{" "}
        <L href="https://ec.europa.eu/consumers/odr">ec.europa.eu/consumers/odr</L>.
        <br />
        <br />
        <Todo>
          state whether the operator is willing or obliged to take part in
          dispute resolution before a consumer arbitration board.
        </Todo>
      </>
    ),
  },
];

export default function ImpressumPage() {
  return (
    <LegalPage
      eyebrow="Impressum"
      title="Operator information"
      intro="The legal disclosure required of a commercial site."
    >
      <IncompleteNotice>
        <strong>This page is incomplete.</strong> Every field below is a
        placeholder. Until they are filled in, this disclosure does not satisfy
        the legal requirement it exists to meet.
      </IncompleteNotice>

      <div style={{ marginTop: 34 }}>
        {FIELDS.map(f => (
          <div key={f.title} className={s.step} style={{ marginBottom: 26 }}>
            <div className={s.stepTitle}>{f.title}</div>
            <div className={s.bodySm} style={{ maxWidth: 620 }}>{f.body}</div>
          </div>
        ))}
      </div>
    </LegalPage>
  );
}
