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
| F1 | **High** | `/api/auth/*`, `/api/settings/*` | Dual auth: Clerk + custom JWT (`jose`/`bcryptjs`, `hc_auth` cookie) active simultaneously; settings routes broken for Clerk users | **Partially mitigated** — `lib/system-user.ts` already consolidated on Clerk; settings routes still call `lib/session.ts` — full removal pending user confirmation on legacy accounts |
| F2 | **High** | `lib/rate-limit.ts` | In-memory `Map` rate limiter reset on every serverless cold start; ineffective on Vercel multi-instance deployments | **Open** — Replacement with Upstash Redis pending env var provisioning |
| S3 | **High** | `proxy.ts` | No startup assertion on `NODE_ENV`; auth guard silently disabled on misconfigured hosts | **Fixed** — Module-level assertion throws if `NODE_ENV` is not `"development"`, `"production"`, or `"test"` |
| S4 | **High** | `lib/rate-limit.ts` | `getIp()` reads raw `x-forwarded-for` — trivially spoofed on non-Vercel hosts | **Open** — Fix coupled to F2 Upstash migration |
| S5 | **High** | `/api/ai/generate` | Non-atomic credit read+decrement — concurrent requests both pass the credit check before either decrements (race condition) | **Open** — Replace with single `updateMany` where `aiCredits: { gt: 0 }` |
| F3 | **Medium** | `/api/ai/*`, `/api/chat`, `/api/orchestrator` | No system-prompt delimiter separating system instructions from user content; indirect injection via block content not guarded | **Open** — Delimiter injection guard pending |
| F5 | **Medium** | `next.config.ts` | No security headers: no CSP, no `X-Frame-Options`, no HSTS, no `X-Content-Type-Options` | **Open** — CSP to be deployed in report-only mode first |
| F6 | **Medium** | `next.config.ts` | (Same as F5) | **Open** |
| S6/F8 | **Low** | `.gitignore` | `dev.db` (SQLite) not excluded — local database may be accidentally committed | **Open** |
| F7 | **Low** | CI/CD | No automated dependency audit or secrets scan on PRs | **Fixed** — GitHub Actions workflow added (`.github/workflows/security.yml`) |
| S7 | **Info** | `/api/publish` | Service-role Supabase key used for a write that RLS could handle | **Accepted** — Key is server-side only; Zod validation and Clerk auth guard are the primary controls |

### Commits on `security-hardening`

| Commit | Change |
|--------|--------|
| `dd8e73a` | Group 1: harden `/api/publish` — auth guard, Zod validation, no error leakage (F4 + S7) |
| `f6104a2` | Group 2a: `proxy.ts` startup assertion for `NODE_ENV` (S3) |
| *(this branch)* | Group 4/5: DOMPurify XSS sanitization (S1, S2); CI workflow (F7); SECURITY.md |

---

## Open Items (must complete before next production deploy)

1. **F1 — Remove custom JWT**: Rewrite `/api/settings/billing-portal` and `/api/settings/profile` to use Clerk `auth()`, then delete `/api/auth/*`, `lib/session.ts`, and remove `jose`/`bcryptjs` from `package.json`. Confirm no legacy password-auth accounts exist before migrating.
2. **F2 + S4 — Upstash Redis rate limiter**: Replace `lib/rate-limit.ts` with `@upstash/ratelimit`; fix `getIp()` to prefer `x-real-ip`.
3. **S5 — Atomic credit deduction**: Replace the read+write in `/api/ai/generate` with a single `prisma.usageTracking.updateMany` guarded by `aiCredits: { gt: 0 }`.
4. **F3 — Prompt injection guard**: Add `\n\n---USER INPUT---\n` delimiter in all LLM prompt constructors; add system-level instruction to ignore user-segment instructions.
5. **F5/F6 — Security headers + CSP**: Add `Content-Security-Policy-Report-Only` header to `next.config.ts`; review report logs before switching to enforcement mode.
6. **S6/F8 — `.gitignore`**: Add `*.db` entry.
7. **npm audit**: Address 2 high vulnerabilities surfaced by `npm audit`.

---

## Key Rotation Required

If any of the following keys appear in `git log` output (not just the working tree), they must be rotated immediately — deletion alone is not sufficient once a secret is in git history:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `CLERK_SECRET_KEY`
- `OPENROUTER_API_KEY` / `REPLICATE_API_TOKEN`
- `JWT_SECRET` / any `hc_auth` signing key

Run `git log -p --all -S "sk_live_" --` and equivalents to verify no live keys were ever committed.
