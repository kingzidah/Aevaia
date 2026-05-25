import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — HeartCraft",
  description: "How HeartCraft collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "18 May 2026";

export default function PrivacyPage() {
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
          <span className="font-bold text-sm tracking-tight">HeartCraft</span>
        </Link>
        <Link href="/" className="text-xs text-neutral-500 hover:text-white transition-colors">← Home</Link>
      </nav>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 py-16 prose prose-invert prose-sm prose-neutral">
        <p className="text-xs text-neutral-600 not-prose mb-2">Last updated: {LAST_UPDATED}</p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white not-prose mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 dark:text-neutral-500 not-prose mb-10 text-sm">
          HeartCraft (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your personal information. This policy
          explains what data we collect, why we collect it, and how you can control it.
        </p>

        <div className="space-y-10">
          {/* Section 1 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">1. Information We Collect</h2>
            <ul className="space-y-2 text-sm text-neutral-400 list-disc list-inside leading-relaxed">
              <li><strong className="text-neutral-200">Account data</strong> — your email address, display name, and hashed password when you register.</li>
              <li><strong className="text-neutral-200">Project content</strong> — the scenes, text, images, and settings you create in the Studio.</li>
              <li><strong className="text-neutral-200">Guest-list data</strong> — names you upload for the Event tier bouncer gate; stored only for your gift.</li>
              <li><strong className="text-neutral-200">Payment data</strong> — processed entirely by Stripe. We store only a Stripe Customer ID reference; no card numbers are held by HeartCraft.</li>
              <li><strong className="text-neutral-200">Usage data</strong> — AI credit usage counts and request timestamps for billing and abuse prevention.</li>
              <li><strong className="text-neutral-200">Support messages</strong> — your email and message when you contact us via the support form.</li>
              <li><strong className="text-neutral-200">Technical data</strong> — device type, browser, and IP address logged automatically for security and debugging.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">2. How We Use Your Data</h2>
            <ul className="space-y-2 text-sm text-neutral-400 list-disc list-inside leading-relaxed">
              <li>To operate and personalise your Studio experience.</li>
              <li>To enforce the bouncer gate so only invited guests can view your gift.</li>
              <li>To process payments and fulfil tier upgrades via Stripe.</li>
              <li>To track AI credit consumption and prevent abuse.</li>
              <li>To respond to support inquiries.</li>
              <li>To improve platform stability, performance, and security.</li>
            </ul>
            <p className="text-sm text-neutral-500 mt-3">
              We do <strong className="text-neutral-300">not</strong> sell your personal data to third parties, and we do not use it for advertising.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">3. Cookies &amp; Local Storage</h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-3">
              HeartCraft uses <strong className="text-neutral-200">Clerk</strong> for authentication. Clerk sets httpOnly, Secure session cookies to maintain your login state; these are managed automatically and expire with your session.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Gift viewer pages use a short-lived cookie (<code className="text-purple-300 text-xs">hc_gift_&#123;id&#125;</code>) to remember that
              you have passed the bouncer gate on that device. No analytics or advertising cookies are set.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">4. Data Sharing</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We share your data only with the following sub-processors, each under their own privacy terms:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-400 list-disc list-inside leading-relaxed">
              <li><strong className="text-neutral-200">Supabase</strong> — secure PostgreSQL database hosting (EU region).</li>
              <li><strong className="text-neutral-200">Stripe</strong> — payment processing.</li>
              <li><strong className="text-neutral-200">OpenRouter / Google / OpenAI</strong> — AI text generation (your prompts are sent to generate responses; they are not used to train third-party models under current agreements).</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">5. Data Retention</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Account and project data is retained for as long as your account is active. If you request account deletion,
              we will remove your personal data within 30 days. Support ticket records are retained for 12 months for audit purposes.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">6. Your Rights</h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-2">
              Under applicable data-protection law (including GDPR where relevant), you have the right to:
            </p>
            <ul className="space-y-1 text-sm text-neutral-400 list-disc list-inside leading-relaxed">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data via the <Link href="/settings" className="text-purple-400 hover:text-purple-300">Settings</Link> page.</li>
              <li>Request deletion of your account and all associated data.</li>
              <li>Lodge a complaint with your local data-protection authority.</li>
            </ul>
            <p className="text-sm text-neutral-400 mt-3">
              To exercise any of these rights, contact us via the{" "}
              <Link href="/contact" className="text-purple-400 hover:text-purple-300">support form</Link>.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">7. Security</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              All data is transmitted over TLS. Passwords are hashed with bcrypt (cost factor 12) and never stored in plain text.
              Payment data never transits HeartCraft servers. We review and update our security practices regularly.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">8. Changes to This Policy</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We may update this policy from time to time. The &quot;Last updated&quot; date at the top of this page reflects the most
              recent revision. Continued use of HeartCraft after changes constitutes acceptance.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-zinc-200 dark:border-white/8 bg-zinc-100 dark:bg-neutral-900/40 p-6">
            <h2 className="text-base font-bold text-white mb-2">Contact</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Questions about this policy? Reach us via the{" "}
              <Link href="/contact" className="text-purple-400 hover:text-purple-300">support form</Link>{" "}
              and we will respond within 48 hours.
            </p>
          </section>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/5 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
        <p className="text-xs text-neutral-700">© {new Date().getFullYear()} HeartCraft</p>
        <div className="flex items-center gap-4 text-xs text-neutral-700">
          <Link href="/privacy" className="hover:text-neutral-400 transition-colors font-medium text-neutral-500">Privacy</Link>
          <span>·</span>
          <Link href="/terms"   className="hover:text-neutral-400 transition-colors">Terms</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-neutral-400 transition-colors">Support</Link>
        </div>
      </footer>
    </main>
  );
}
