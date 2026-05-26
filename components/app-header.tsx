"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/theme-toggle";

interface AppHeaderProps {
  /** Optional extra controls rendered left of the user button (e.g. AI Battery widget) */
  actions?: React.ReactNode;
  // userName / userEmail kept for backward compatibility but no longer rendered
  // here — Clerk's UserButton displays the identity internally.
  userName?:  string | null;
  userEmail?: string;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "My Gifts"  },
  { href: "/settings",  label: "Settings"  },
];

export default function AppHeader({ actions }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-14
                    bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl
                    border-b border-zinc-200 dark:border-white/5">

      {/* ── Left: Logo + nav links ─────────────────────────────────────── */}
      <div className="flex items-center gap-7">
        <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center
                          shadow-[0_0_12px_rgba(168,85,247,0.5)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white
                           group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
            Aevaia
          </span>
        </Link>

        {/* Primary nav links — hidden on mobile to avoid overflow */}
        <ul className="hidden sm:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => {
            // Active if the pathname starts with the link's href, except
            // /studio must be an exact match so it doesn't light up on /settings.
            const isActive = href === "/studio"
              ? pathname === "/studio" || pathname.startsWith("/studio/")
              : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-300"
                      : "text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Right: actions slot + theme toggle + Clerk UserButton ─────── */}
      <div className="flex items-center gap-3">
        {actions}

        <ThemeToggle variant="icon" />

        {/* Clerk managed account button — handles profile, sign-out, and MFA */}
        {/* afterSignOutUrl is set via NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL env var in Clerk v7 */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 ring-2 ring-purple-500/40 hover:ring-purple-500/70 transition-all shadow-[0_0_14px_rgba(168,85,247,0.25)]",
            },
          }}
        >
          {/* Custom menu items appended to Clerk's default profile links */}
          <UserButton.MenuItems>
            <UserButton.Link
              label="Dashboard"
              labelIcon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              }
              href="/dashboard"
            />
            <UserButton.Link
              label="Support"
              labelIcon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              }
              href="/contact"
            />
          </UserButton.MenuItems>
        </UserButton>
      </div>
    </nav>
  );
}
