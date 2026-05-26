import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Aevaia",
  description: "Platform usage policies, billing terms, and user guidelines for Aevaia.",
};

const LAST_UPDATED = "18 May 2026";

export default function TermsPage() {
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
        <p className="text-xs text-neutral-600 mb-2">Last updated: {LAST_UPDATED}</p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-zinc-500 dark:text-neutral-500 text-sm leading-relaxed mb-10">
          By accessing or using Aevaia (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
          Please read them carefully before creating an account or making a purchase.
        </p>

        <div className="space-y-10">

          <section>
            <h2 className="text-base font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              These Terms constitute a legally binding agreement between you and Aevaia. If you do not agree to these
              Terms, you may not access or use the Platform. By registering an account, you confirm that you are at least
              16 years old and have the legal capacity to enter this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">2. Platform Description</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Aevaia is a digital gift-creation studio. It allows registered users to design interactive 3D gift
              experiences (&quot;Projects&quot;) that can be shared via a secure link with designated recipients. Features include
              AI-assisted copywriting, visual scene editing, and access-controlled gift viewing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">3. User Accounts</h2>
            <ul className="space-y-2 text-sm text-neutral-400 list-disc list-inside leading-relaxed">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate information during registration and keep it current.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must notify us immediately of any unauthorised account access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">4. Acceptable Use</h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-3">You agree <strong className="text-neutral-200">not</strong> to:</p>
            <ul className="space-y-2 text-sm text-neutral-400 list-disc list-inside leading-relaxed">
              <li>Upload or create content that is unlawful, abusive, defamatory, or infringes third-party rights.</li>
              <li>Use the Platform for commercial spam, phishing, or deceptive practices.</li>
              <li>Attempt to reverse-engineer, scrape, or disrupt the Platform.</li>
              <li>Share your account or resell access to the Platform.</li>
              <li>Use AI generation features to produce harmful, harassing, or illegal content.</li>
            </ul>
            <p className="text-sm text-neutral-400 leading-relaxed mt-3">
              We reserve the right to suspend or terminate accounts that violate these rules without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">5. Billing &amp; Payments</h2>
            <ul className="space-y-3 text-sm text-neutral-400 list-none leading-relaxed">
              <li>
                <strong className="text-neutral-200">One-time purchases.</strong> Tier upgrades (Intimate at €15, Event at €49) are one-time payments
                that unlock a single Project. There are no recurring subscription fees for gift tiers.
              </li>
              <li>
                <strong className="text-neutral-200">Payment processing.</strong> All payments are handled by Stripe. Your card details are never
                stored by Aevaia.
              </li>
              <li>
                <strong className="text-neutral-200">AI credits.</strong> Each account receives 10 complimentary AI Rewrite credits. Additional
                credits may be offered in future; any such purchase is non-refundable once used.
              </li>
              <li>
                <strong className="text-neutral-200">Refunds.</strong> Because digital gift projects are delivered immediately upon payment, all
                sales are final. If you experience a technical issue preventing delivery, contact support within 7 days
                and we will assess refund eligibility on a case-by-case basis.
              </li>
              <li>
                <strong className="text-neutral-200">Currency.</strong> All prices are displayed in Euros (EUR). Your card provider may apply
                conversion fees.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">6. Intellectual Property</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              You retain ownership of all content you create on Aevaia. By using the Platform, you grant us a
              limited, non-exclusive licence to host and serve your Projects solely for the purpose of delivering them
              to your designated recipients. We will never use your content for marketing without explicit consent.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed mt-3">
              Aevaia&apos;s platform code, design system, and brand assets are our exclusive property. Nothing in
              these Terms transfers any ownership of Platform IP to you.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">7. Availability &amp; Uptime</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We aim for high availability but do not guarantee uninterrupted access to the Platform. We may perform
              maintenance, deploy updates, or suspend the Platform for security reasons at any time. Purchased gift
              links are intended to be permanent; in the event of Platform discontinuation, we will provide at least
              90 days&apos; notice and facilitate data export.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">8. Limitation of Liability</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              To the fullest extent permitted by law, Aevaia is not liable for indirect, incidental, or consequential
              damages arising from your use of the Platform. Our total liability for any direct damages shall not exceed
              the amount you paid to Aevaia in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">9. Governing Law</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the Republic of Ireland.
              Any disputes shall be subject to the exclusive jurisdiction of the courts of Ireland.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">10. Changes to These Terms</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We may update these Terms at any time. We will notify registered users of material changes by email.
              Continued use of the Platform after such notification constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-200 dark:border-white/8 bg-zinc-100 dark:bg-neutral-900/40 p-6">
            <h2 className="text-base font-bold text-white mb-2">Questions?</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              If you have any questions about these Terms, please reach us via the{" "}
              <Link href="/contact" className="text-purple-400 hover:text-purple-300">support form</Link>.
            </p>
          </section>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/5 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
        <p className="text-xs text-neutral-700">© {new Date().getFullYear()} Aevaia</p>
        <div className="flex items-center gap-4 text-xs text-neutral-700">
          <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy</Link>
          <span>·</span>
          <Link href="/terms"   className="hover:text-neutral-400 transition-colors font-medium text-neutral-500">Terms</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-neutral-400 transition-colors">Support</Link>
        </div>
      </footer>
    </main>
  );
}
