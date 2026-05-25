# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email **tayoagbomabiwon8ub@gmail.com** with:
- A description of the vulnerability and its impact
- Steps to reproduce (proof-of-concept if possible)
- Any suggested remediation

You will receive an acknowledgement within 48 hours and a resolution timeline within 7 days.

---

## Supported Versions

Only the latest production deployment of HeartCraft is actively maintained.

---

## Security Audit — May 2025

A full manual security audit was conducted on the `security-hardening` branch covering authentication, authorization, input validation, rate limiting, injection attacks, and secrets hygiene.

### Findings and Status

| ID | Severity | Surface | Finding | Status |
|----|----------|---------|---------|--------|
| F4 | **Critical** | `/api/publish` | No auth check; `user_id` taken from request payload (identity spoofing); no input validation; raw Supabase error leaked to client | **Fixed** — Clerk `auth()` guard; `user_id` from session only; Zod `publishSchema` validation; generic 500 response |
| S1 | **Critical** | `GiftViewer.tsx` | `dangerouslySetInnerHTML` on `block.content` / `headlineHtml` / `paragraphHtml` — stored XSS hitting all public gift viewers | **Fixed** — `DOMPurify.sanitize()` via `isomorphic-dompurify` on all three call sites |
| S2 | **Critical** | `vector-art.tsx` | `dangerouslySetInnerHTML` on user-pasted SVG code — `<svg onload=...>`, `<img onerror=...>`, `<foreignObject>` vectors all live | **Fixed** — `DOMPurify.sanitize()` with `USE_PROFILES: { svg: true }` and `FORBID_TAGS: ["script", "foreignObject"]` |
| F1 | **High** | `/api/auth/*`, `/api/settings/*` | Dual auth: Clerk + custom JWT (`jose`/`bcryptjs`, `hc_auth` cookie) active simultaneously; settings routes broken for Clerk users | **Fixed** — Custom JWT system fully removed; `/api/auth/*` deleted; `lib/session.ts` deleted; `jose`/`bcryptjs` uninstalled; settings routes migrated to Clerk `auth()` |
| F2 | **High** | `lib/rate-limit.ts` | In-memory `Map` rate limiter reset on every serverless cold start; ineffective on Vercel multi-instance deployments | **Fixed** — Replaced with Upstash Redis `@upstash/ratelimit` sliding-window limiter; shared state across all serverless instances |
| S3 | **High** | `proxy.ts` | No startup assertion on `NODE_ENV`; auth guard silently disabled on misconfigured hosts | **Fixed** — Module-level assertion throws if `NODE_ENV` is not `"development"`, `"production"`, or `"test"` |
| S4 | **High** | `lib/rate-limit.ts` | `getIp()` reads raw `x-forwarded-for` — trivially spoofed on non-Vercel hosts | **Fixed** — `getIp()` now prefers `x-real-ip` (Vercel-managed, unforgeable); `x-forwarded-for` used only as fallback |
| S5 | **High** | `/api/ai/generate` | Non-atomic credit read+decrement — concurrent requests both pass the credit check before either decrements (race condition) | **Fixed** — Single `updateMany where aiCredits: { gt: 0 }` executes before AI call; count===0 gate returns 403; credit refunded on dual-model failure |
| F3 | **Medium** | `/api/ai/*`, `/api/chat`, `/api/orchestrator` | No system-prompt delimiter separating system instructions from user content; indirect injection via block content not guarded | **Fixed** — `---SOURCE TEXT---` / `---USER INPUT---` delimiter added to all three routes; anti-injection rule added to every system prompt |
| F5 | **Medium** | `next.config.ts` | No security headers: no CSP, no `X-Frame-Options`, no HSTS, no `X-Content-Type-Options` | **Fixed** — Full header suite enforced; CSP deployed in `Content-Security-Policy-Report-Only` mode |
| F6 | **Medium** | `next.config.ts` | (Same as F5) | **Fixed** — See F5 |
| S6/F8 | **Low** | `.gitignore` | `dev.db` (SQLite) not excluded — local database may be accidentally committed | **Fixed** — `*.db`, `*.db-journal`, `*.db-shm`, `*.db-wal` added to `.gitignore` |
| F7 | **Low** | CI/CD | No automated dependency audit or secrets scan on PRs | **Fixed** — GitHub Actions workflow added (`.github/workflows/security.yml`) |
| S7 | **Info** | `/api/publish` | Service-role Supabase key used for a write that RLS could handle | **Accepted** — Key is server-side only; Zod validation and Clerk auth guard are the primary controls |

### Commits on `security-hardening`

| Commit | Change |
|--------|--------|
| `dd8e73a` | Group 1: harden `/api/publish` — auth guard, Zod validation, no error leakage (F4 + S7) |
| `f6104a2` | Group 2a: `proxy.ts` startup assertion for `NODE_ENV` (S3) |
| `876cc35` | Group 4/5: DOMPurify XSS sanitization (S1, S2); CI workflow (F7); SECURITY.md |
| `5eadc5d` | Groups 2b + 3: Remove custom JWT (F1); Upstash Redis rate limiter (F2, S4); atomic credit guard (S5); settings routes → Clerk (F1); privacy page updated |
| *(pending)* | Group 4 + remaining: Prompt injection guards (F3); security headers + CSP report-only (F5/F6); `.gitignore` db exclusion (S6) |

---

## Open Items (must complete before next production deploy)

1. **npm audit — 2 HIGH CVEs** (cannot be fixed without upstream releases):
   - `js-cookie ≤3.0.5` (via `@clerk/shared`) — prototype hijack in `assign()`. Wait for Clerk to ship a patched `@clerk/shared`. Non-breaking `npm audit fix` available but only bumps Clerk's transitive dep — confirm with Clerk changelog before running.
   - `@hono/node-server <1.19.13` (via `@prisma/dev`) — middleware bypass. Only fixable with `npm audit fix --force`, which would downgrade `prisma` to `6.19.3` (breaking). Wait for Prisma to release a fixed version.
2. **CSP enforcement** — Switch `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in `next.config.ts` after monitoring browser console for violations in staging. Watch especially for Clerk and Stripe script sources.
3. **CSP nonce** — Long-term: replace `'unsafe-inline'` in `script-src` with per-request nonces via Next.js middleware for stronger XSS protection.

---

## Key Rotation Required

If any of the following keys appear in `git log` output (not just the working tree), they must be rotated immediately — deletion alone is not sufficient once a secret is in git history:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `CLERK_SECRET_KEY`
- `OPENROUTER_API_KEY` / `REPLICATE_API_TOKEN`
- `JWT_SECRET` / any `hc_auth` signing key

Run `git log -p --all -S "sk_live_" --` and equivalents to verify no live keys were ever committed.
