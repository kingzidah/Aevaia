import Link from "next/link";
import type { Metadata } from "next";

// Legally-required operator disclosure (§5 DDG / §18 MStV in Germany, and the
// equivalent trader-identification duty elsewhere in the EU). A commercial site
// addressing a German market must carry one, and it must be reachable in two
// clicks from any page — hence the footer link on the home page.
//
// EVERY field below is a TODO-OPERATOR placeholder on purpose. None of these
// details can be inferred from the codebase, and inventing a name, an address
// or a VAT status would be worse than leaving the page visibly incomplete:
// a wrong Impressum is itself the offence this page exists to avoid.
export const metadata: Metadata = {
  title: "Impressum — Aevaia",
  description: "Operator information and legal disclosure for Aevaia.",
};

const CONTACT_EMAIL = "helloaevaia@gmail.com";

function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm text-neutral-400 leading-relaxed">
      <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400">
        TODO-OPERATOR
      </span>{" "}
      — {children}
    </span>
  );
}

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-neutral-950 text-zinc-900 dark:text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-14 border-b border-zinc-200 dark:border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center
                          shadow-[0_0_12px_rgba(168,85,247,0.5)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">Aevaia</span>
        </Link>
        <Link href="/" className="text-xs text-neutral-500 hover:text-white transition-colors">← Home</Link>
      </nav>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">Impressum</h1>
        <p className="text-zinc-500 dark:text-neutral-500 mb-10 text-sm">
          Operator information and legal disclosure.
        </p>

        {/* Completion banner — deliberately loud. This page is published but not
            yet valid, and that must be obvious to whoever opens it next. */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-5 mb-10">
          <p className="text-sm text-amber-200 leading-relaxed">
            <strong className="font-semibold">This page is incomplete.</strong> Every field below
            is a placeholder. Until they are filled in, this disclosure does not satisfy the
            legal requirement it exists to meet.
          </p>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-3">
              Responsible party
            </h2>
            <Todo>
              full legal name of the person or company operating this site. If a registered
              company, give the exact registered name and legal form.
            </Todo>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-3">
              Postal address
            </h2>
            <Todo>
              full street address, postcode, city and country. A PO box is not sufficient —
              this must be an address at which the operator can be served.
            </Todo>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-3">
              Contact
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-purple-400 hover:text-purple-300">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="mt-2">
              <Todo>
                telephone number. A contact telephone number is generally expected alongside the
                email address; confirm what is required for the operator&apos;s jurisdiction and
                legal form.
              </Todo>
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-3">
              VAT status
            </h2>
            <Todo>
              VAT identification number, or an explicit statement that the operator is not
              VAT-registered (for example a small-business exemption). State which applies —
              do not leave this silent.
            </Todo>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-3">
              Register entry
            </h2>
            <Todo>
              commercial register, register number and registering court, if the operator is a
              registered company. Delete this section entirely if trading as a sole trader with
              no register entry.
            </Todo>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-3">
              Responsible for content
            </h2>
            <Todo>
              name and address of the person responsible for editorial content, where this
              differs from the responsible party above.
            </Todo>
          </section>

          <section>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-3">
              Online dispute resolution
            </h2>
            <Todo>
              confirm whether a reference to the EU ODR platform and a statement on willingness
              to participate in consumer arbitration is required for this operator, and add the
              wording if so.
            </Todo>
          </section>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/5 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
        <p className="text-xs text-neutral-700">© {new Date().getFullYear()} Aevaia</p>
        <div className="flex items-center gap-4 text-xs text-neutral-700">
          <Link href="/impressum" className="hover:text-neutral-400 transition-colors font-medium text-neutral-500">Impressum</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-neutral-400 transition-colors">Terms</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-neutral-400 transition-colors">Support</Link>
        </div>
      </footer>
    </main>
  );
}
