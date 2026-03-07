# Decisions Log — Project Soshi

Running log of all major strategic and product decisions. Append new entries at the bottom with date and rationale.

---

## Format

```
### [YYYY-MM-DD] — Decision Title
**Decision:** What was decided
**Rationale:** Why
**Alternatives considered:** What else was on the table
**Status:** Final / Revisit by [date]
```

---

## Log

### [2026-03-04] — MVP scope = Preneed Pipeline + Aftercare only
**Decision:** MVP ships with exactly two modules: preneed pipeline (kanban, 6-stage) and aftercare touchpoint scheduler (automated timeline). Shared contact database is the connective layer, not a third module.
**Rationale:** Narrowest slice that validates core thesis. Referral tracking, integrations, multi-location are all v2. Every interview persona described pain in these two areas.
**Alternatives considered:** Including referral tracking (Donna's use case), carrier reporting (Brett's use case). Both deferred — they add build time without validating the core preneed/aftercare thesis.
**Status:** Final

### [2026-03-04] — Primary persona = Next-gen director (28-42)
**Decision:** Build for next-gen directors first. Business managers (Sarah archetype) are secondary outreach targets.
**Rationale:** Fastest validation signal, lowest acquisition friction, most likely to self-serve onboarding. Design for them, sell to 55-65 second once product is validated.
**Alternatives considered:** Leading with owner-operators (Tom archetype). Rejected — slower adoption, higher support burden, less likely to give honest product feedback.
**Status:** Final

### [2026-03-04] — Stack = Supabase + Next.js + Vercel + Resend
**Decision:** No-code/vibe-coded stack at $0 infrastructure cost. Supabase (Postgres + Auth + Realtime), Next.js 14 App Router, Vercel hosting, Resend for transactional email.
**Rationale:** All free tier. Fast to demo. Supabase gives us Postgres (real database, not a toy), magic link auth (no password management), and RLS (multi-tenant from day one). Resend handles the daily digest email.
**Alternatives considered:** Bubble/Softr (too constraining for kanban UX), Rails (overkill for MVP), Firebase (vendor lock-in concerns).
**Status:** Final

### [2026-03-04] — Pricing = $99-$199/mo, month-to-month only
**Decision:** Three tiers ($99 Starter, $149 Growth, $199 Pro), no annual contracts.
**Rationale:** Industry pricing set by Osiris/Passare. Month-to-month is non-negotiable per Kyle interview ("Month to month or I'm out"). Flat per-location pricing for future multi-location tier.
**Alternatives considered:** Freemium (rejected — small market, need revenue signal early), annual discount (rejected — trust barrier too high at launch).
**Status:** Final

### [2026-03-04] — GTM = $0 organic only
**Decision:** No paid acquisition. Reddit, Facebook groups, LinkedIn, cold email, state FDA conventions.
**Rationale:** Validate product-market fit before spending. NFDA Convention (Charlotte, Oct 25-28 2026) is the forcing function for v1.
**Alternatives considered:** Google Ads for "funeral home CRM" (low volume, high CPC). Deferred to post-validation.
**Status:** Final

### [2026-03-04] — Development plan approved, 6-phase build
**Decision:** Build in 6 phases: Foundation → Pipeline → Follow-ups/Dashboard → Aftercare → Daily Digest/Mobile → Polish. Each phase ~1 day.
**Rationale:** Mirrors PRD §6.4 build sequence. Each phase has explicit completion criteria. Landing page and outreach are post-MVP — don't mix build and GTM.
**Alternatives considered:** Building landing page first to collect waitlist before coding. Rejected — the demo IS the validation tool per PRD §7 ("working demo in 2 days" was original target, expanded to 6 days for quality).
**Status:** Final

### [2026-03-06] — Schema column naming: `activity_type` and `touchpoint_type`
**Decision:** Use descriptive column names (`activity_type`, `touchpoint_type`) instead of bare `type` to avoid ambiguity and reserved-word conflicts.
**Rationale:** Discovered during seed data debugging. Bare `type` is a reserved word in many contexts and unclear when joining tables. The TypeScript types and app code already used the descriptive names — the seed SQL was the only mismatch.
**Alternatives considered:** Renaming schema columns to bare `type`. Rejected — descriptive names are better practice.
**Status:** Final

### [2026-03-06] — Supabase `handle_new_user` trigger needs `set search_path = public`
**Decision:** All Supabase `security definer` functions must include `set search_path = public`.
**Rationale:** Without it, the trigger couldn't find `organizations` and `profiles` tables, causing "Database error saving new user" on first signup. Supabase-specific gotcha with RLS-enabled schemas.
**Alternatives considered:** None — required fix.
**Status:** Final

### [2026-03-06] — Primary domain = trysoshi.com
**Decision:** Register `trysoshi.com` as the primary product domain. Production URL: `https://trysoshi.com`.
**Rationale:** `soshi.com`, `soshi.app`, and `soshi.io` are all taken. `vigil.care` (considered) is also taken and carries a conflicting brand identity (Vigil Health Solutions, memory care). `.care` TLD offers no SEO advantage over `.com`. `trysoshi.com` is available at $11.25/yr, maintains brand name consistency, works well in CTAs and outreach, and unlocks `@trysoshi.com` for Resend email domain verification.
**Alternatives considered:** `vigil.care` (taken, wrong association), `getsoshi.com` (equal option, less action-oriented), `preneed.app` (high keyword SEO value but limits brand story and future scope), `soshi.co` (unconfirmed availability, worth monitoring).
**Status:** Final

### [2026-03-06] — Vercel cron downgraded to daily (Hobby plan limit)
**Decision:** Changed `vercel.json` cron from `*/30 * * * *` to `0 13 * * *` (1pm UTC daily).
**Rationale:** Vercel Hobby plan limits cron jobs to once per day. The digest logic already handles per-user timezone windows internally, so the trade-off is acceptable for MVP. Upgrade to Pro to restore 30-min polling when revenue justifies it.
**Alternatives considered:** Upgrade to Vercel Pro immediately (deferred — not worth cost at MVP stage).
**Status:** Final — revisit when upgrading to Vercel Pro

### [2026-03-06] — Magic link auth loop fix (trigger + middleware + callback)
**Decision:** Three-part fix for "magic link → login screen → email rate limit" loop.
**Root cause:** `handle_new_user` is a `security definer` function without `set search_path = public`. Postgres uses `pg_catalog` as the default search path when running as the function owner, so it can't find `organizations` or `profiles` in `public`. The trigger throws, the `auth.users` INSERT is rolled back, and Supabase redirects to `/auth/callback` with `?error=...` instead of `?code=...`. The callback found no `code`, silently redirected to `/login`, and the user retried — hitting Supabase's rate limit.
**Fixes applied:**
1. `supabase/schema.sql` — added `set search_path = public` to `handle_new_user` function signature. ⚠️ Must also re-run in Supabase SQL Editor to patch the live instance.
2. `src/middleware.ts` — added (was missing entirely). Required by `@supabase/ssr` to refresh expiring access tokens on every server request. Without it, sessions die silently after 1 hour.
3. `src/app/auth/callback/route.ts` — now handles `?error=` params from Supabase upstream, logs failures with context, and passes the error to the login page via query param instead of silently dropping it.
4. `src/app/(auth)/login/page.tsx` — now reads `?error=` on mount and surfaces a human-readable message so users know not to retry.
**Alternatives considered:** None — all three changes are required.
**Status:** Final

### [2026-03-07] — First-time user tutorial: welcome tour + getting started checklist
**Decision:** Add two onboarding aids for new users landing on the dashboard: a 4-step spotlight tour and a persistent checklist card.
**Rationale:** After the 3-step onboarding wizard (firm name → user name), users landed on an empty dashboard with no guidance. The tour points out key navigation and features. The checklist gives actionable next steps (add contact, create prospect, set digest time, import CSV).
**Implementation:** Tour uses `createPortal` + `getBoundingClientRect()` with CSS box-shadow spotlight cutout. Checklist items computed reactively from Zustand store. Both persist via `profiles.preferences` JSONB column (`tour_completed`, `checklist_dismissed`).
**Alternatives considered:** Single full-screen wizard (rejected — too heavy), video tutorial (rejected — too passive), tooltips-only without checklist (rejected — no persistent progress tracking).
**Status:** Final

### [2026-03-07] — Scan-to-contact approach: Claude Haiku vision (not traditional OCR)
**Decision:** Use Claude Haiku 4.5 vision API for photo-to-contact extraction instead of traditional OCR (Tesseract.js, Google Cloud Vision, AWS Textract).
**Rationale:** Traditional OCR gives raw text, still needs a second LLM pass to structure into contact fields. Claude Vision does recognition AND structuring in one call. Haiku has the lowest hallucination rate (0.09%) — critical for contact data. Cost is ~$0.003/scan ($3 per 1,000 scans). Zero client-side bundle impact (all server-side). Tesseract.js rejected for 15MB bundle, poor handwriting accuracy, and needing a second pass. AWS Textract rejected at $0.05/page (16x more expensive).
**Alternatives considered:** Tesseract.js (poor handwriting, huge bundle), Google Cloud Vision ($0.0015/page but still needs structuring pass), AWS Textract ($0.05/page, overkill), Gemini Flash (cheaper at $0.0002/scan but higher hallucination risk).
**Status:** Final

### [2026-03-07] — Universal file ingestion: ExcelJS over SheetJS, hybrid PDF approach
**Decision:** Support Excel (.xlsx), PDF, vCard (.vcf), and Word (.docx) imports via a universal upload endpoint. Use ExcelJS for Excel parsing (not SheetJS). Use unpdf + Claude Vision fallback for PDFs.
**Rationale:** SheetJS (`xlsx` on npm) is frozen at v0.18.5 with unpatched CVEs (including ReDoS CVE-2024-22363). Maintainer pulled from npm and distributes only via custom CDN — non-standard and risky for production. ExcelJS is MIT, actively maintained, works in Node.js API routes. PDF table extraction is inherently unreliable with pure-JS parsers, so the hybrid approach (try unpdf text extraction first, fall back to Claude Vision for scanned/complex PDFs) is the right call.
**Alternatives considered:** SheetJS (CVE risk, non-standard distribution), pdf-parse (unmaintained), client-side processing (would bloat bundle).
**Status:** Final

### [2026-03-07] — QA bug sweep: denormalize org_id onto activities and touchpoints
**Decision:** Add `org_id` columns to `activities` and `aftercare_touchpoints` tables instead of relying on nested subquery RLS policies through parent tables.
**Rationale:** RLS policies that join through `preneed_prospects` or `aftercare_cases` to reach `organizations` are fragile and slow. Adding `org_id` directly enables simple single-column RLS (`org_id = get_user_org_id()`). Required coordinated changes: schema.sql (columns + indexes + policies) and store.ts (4 insert points now include org_id).
**Alternatives considered:** Keeping nested subquery RLS (rejected — performance and complexity cost). Using Postgres views (rejected — still need underlying RLS).
**Status:** Final

### [2026-03-07] — QA bug sweep: split RLS policies per-operation
**Decision:** Replace single "ALL" RLS policies with granular SELECT/INSERT/UPDATE/DELETE policies on `profiles` and `organizations` tables.
**Rationale:** Single "ALL" policies allowed any org member to delete or modify other members' profiles and mutate organization records. Split policies enforce: SELECT is org-wide (see your colleagues), but INSERT/UPDATE/DELETE are restricted to own row (profiles) or org owner (organizations).
**Alternatives considered:** None — this is a security fix, not a design choice.
**Status:** Final

### [2026-03-07] — QA bug sweep: cron changed to hourly for timezone coverage
**Decision:** Changed Vercel cron from `0 13 * * *` (once daily at 1pm UTC) to `0 * * * *` (hourly). The digest route already has per-user timezone + 30-minute window logic.
**Rationale:** A single daily fire at 1pm UTC only hits ET users at 8am. Users in PT, CT, MT, or international timezones would never receive digests at their configured time. Hourly fire lets the route's internal timezone matching work correctly for all users.
**Alternatives considered:** Keeping daily and converting user times to UTC (rejected — doesn't work for a single daily fire covering all timezones).
**Status:** Final — requires Vercel Pro for sub-daily cron; on Hobby plan this may not work

### [2026-03-07] — QA bug sweep: Intl.DateTimeFormat for serverless timezone handling
**Decision:** Use `Intl.DateTimeFormat` with `formatToParts()` for timezone conversion in the digest route, replacing `toLocaleString` round-trip parsing.
**Rationale:** `toLocaleString` output format varies by Node.js version and OS locale settings. In Vercel's serverless environment, this produced unreliable timezone conversions. `Intl.DateTimeFormat` is spec-compliant and returns structured parts, eliminating locale-dependent string parsing.
**Alternatives considered:** `date-fns-tz` (rejected — adding a dependency for one use case), manual UTC offset calculation (rejected — doesn't handle DST).
**Status:** Final
