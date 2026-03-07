# Tasks — Project Soshi

## Active

### MVP Build — "The Preneed Engine"
Stack: Supabase + Next.js (App Router) + Vercel + Resend
Target: Working demo in 6 build days
Source spec: `soshi-prd.docx` §4–§6

---

#### Phase 1 — Foundation (Day 1) ✅
Goal: Auth works, schema is live, app shell renders with nav.

- [x] Init Next.js 14 project (App Router, TypeScript, Tailwind)
- [x] Create Supabase schema SQL migration (`supabase/schema.sql`)
- [x] Implement auth (magic link via Supabase Auth)
- [x] Build app shell: sidebar nav (Dashboard, Pipeline, Aftercare, Contacts, Import CSV, Settings)
- [x] Create Supabase project, enable Row Level Security, run migration
- [x] Seed data script (`supabase/seed.sql`): 10 contacts, 8 prospects across all stages, 3 aftercare cases with touchpoint history
- [x] Local environment running: auth works, seed data loaded, all pages render
- [x] Create GitHub repo (`soshi-app`), push to GitHub
- [ ] Connect to Vercel, deploy

**Data Model (core tables):**
```
organizations (id, name, created_at)
profiles (id, user_id, org_id, full_name, role)
contacts (id, org_id, first_name, last_name, phone, email, address, relationship_notes, communication_pref, created_at, updated_at)
preneed_prospects (id, org_id, contact_id, stage, disposition_pref, estimated_budget, lead_source, next_followup_date, followup_note, last_contact_date, created_at, updated_at)
activities (id, prospect_id, contact_id, user_id, activity_type, note, created_at)
aftercare_cases (id, org_id, contact_id, deceased_name, service_date, status, created_at)
aftercare_touchpoints (id, case_id, touchpoint_type, label, due_date, status, completed_at, note, skip_reason)
```

---

#### Phase 2 — Preneed Pipeline (Day 2) ✅
Goal: Full kanban pipeline with contact management.

- [x] Contact CRUD: add/edit/delete contacts with all fields from PRD
- [x] Preneed prospect creation (linked to contact)
- [x] Kanban board: 6 columns (Prospect → Contacted → Interested → Quoted → Follow-up → Converted)
- [x] Drag-and-drop stage transitions
- [x] Prospect card shows: name, disposition, days since last contact (red highlight if >30), next follow-up date
- [x] Activity log per prospect: timestamped notes, auto-logged stage changes
- [x] Click into prospect → detail view with full history
- [x] **Done when:** User can add a contact, create a preneed prospect, drag it through pipeline stages, log activities, and see days-since-last-contact on each card.

---

#### Phase 3 — Follow-ups & Dashboard (Day 3) ✅
Goal: Never miss a follow-up. At-a-glance visibility.

- [x] Follow-up reminder system: set next follow-up date + note on any prospect
- [x] CSV import for contacts (map columns → contact fields)
- [x] Dashboard: active prospects, overdue follow-ups, conversion rate, aftercare cases, pipeline breakdown bar chart, "Needs Attention" list, recently added prospects
- [x] Due Today and Overdue views (integrated into dashboard "Needs Attention" panel)
- [x] **Done when:** Dashboard loads with real numbers from seed data. Overdue follow-ups are visually flagged. CSV import functional.

---

#### Phase 4 — Aftercare System (Day 4) ✅
Goal: Automatic aftercare timelines, no configuration needed.

- [x] Aftercare case creation: enter deceased name + service date → auto-generate touchpoint timeline
- [x] Default touchpoint schedule: 2-week call, 1-month grief resource email, 3-month check-in call, 6-month check-in, 11-month pre-anniversary, 1-year anniversary card/call
- [x] Touchpoint timeline view per case (vertical timeline, status per touchpoint)
- [x] Touchpoint actions: mark complete (with note), skip (with reason)
- [x] Aftercare list view: all active cases with expandable touchpoint timelines
- [x] One-click aftercare-to-preneed conversion
- [x] **Done when:** User can create an aftercare case, see the auto-generated timeline, complete/skip touchpoints, and convert an aftercare family to a preneed prospect.

---

#### Phase 5 — Daily Digest & Mobile (Day 5)
Goal: The "8am email" that Sarah described. Mobile-usable.

- [x] Daily digest email via Resend + Vercel Cron: fires at 8am user's timezone
  - Created `src/app/api/digest/route.ts` (edge runtime, timezone-aware, 30-min window)
  - Added `vercel.json` with cron config (every 30 min)
  - Uses Resend REST API, authenticated via `CRON_SECRET`
  - **Still needs:** Resend account + API key, env vars on Vercel (see below)
- [x] Digest content: today's follow-ups (preneed), today's aftercare touchpoints, overdue items from both
- [x] Each item in digest is a deep link back to the relevant record
- [x] Responsive design pass: all views usable on mobile (pipeline scrolls horizontally, cards are tap-friendly)
  - Kanban: snap-scroll columns, 75vw width on mobile
  - ProspectDetail: responsive padding, stacked activity input, larger tap targets
  - Aftercare: larger touchpoint action buttons, touch feedback
  - Global: 44px min tap targets on touch, iOS zoom prevention, hide-scrollbar utility
  - Layout: top padding for mobile hamburger menu
- [ ] **Done when:** User receives a daily email listing all due items. Clicking any item opens the correct record. Pipeline and aftercare views are usable on a phone.

**Env vars needed on Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL (already have)
NEXT_PUBLIC_SUPABASE_ANON_KEY (already have)
SUPABASE_SERVICE_ROLE_KEY (get from Supabase dashboard → Settings → API)
CRON_SECRET (generate any random string)
RESEND_API_KEY (from Resend dashboard after signup)
RESEND_FROM_EMAIL (e.g., Soshi <digest@soshi.app> — needs domain verification in Resend)
NEXT_PUBLIC_APP_URL (your Vercel deployment URL)
```

---

#### Phase 6 — Polish & Demo-Ready (Day 6)
Goal: Ready for the first 10 discovery calls.

- [x] Onboarding flow: 3-step wizard (firm name → user name → done), welcome tour (4-step tooltip overlay), getting started checklist (5 items with progress bar)
- [x] Marketing website: landing page, about, contact pages with dual auth (password + magic link)
- [ ] Empty states with helpful prompts (no contacts yet, no prospects yet, etc.)
- [x] Demo seed data: realistic funeral home data (Oak Valley Memorial, 8 prospects across stages, 3 aftercare cases with full touchpoint timelines)
- [ ] Loading states, error handling, toast notifications
- [ ] Basic settings: org name, user profile, notification preferences
- [ ] **Done when:** A funeral director could sign up, import their spreadsheet, and be fully productive within 60 minutes. Demo mode tells a compelling story.

---

---

#### Phase 6b — Onboarding Friction Mitigation ✅
Goal: Reduce data migration friction for funeral directors moving from physical/spreadsheet records to Soshi.

- [x] **Guided CSV template**: Downloadable .csv template with correct headers + 2 sample rows, `communication_pref` added to import field mappings
- [x] **Scan-to-contact**: Photo → Claude Haiku 4.5 vision → structured JSON → pre-filled ContactForm. API route `/api/scan-contact`, camera input, review/correct UX with confidence badge
- [x] **Universal file ingestion**: Accept .xlsx (ExcelJS), .pdf (unpdf + Claude Haiku). Upload endpoint detects file type via magic bytes (`file-type`), routes to parser, normalizes to row objects, reuses column-mapping UI
- [x] **Update import page UI**: 3-card hub (Upload File, Scan a Card, Download Template) accepting CSV/Excel/PDF
- [x] **Loading skeletons**: All main pages show skeleton screens during initial data load via `dataLoading` store flag
- [x] **Done:** User can upload Excel, CSV, PDF, or photo and get contacts imported with minimal manual entry.

**New dependencies needed:** `exceljs`, `file-type`, `unpdf`, `@anthropic-ai/sdk`

---

### Post-MVP (Do Not Start Until MVP Is Validated)

#### Landing Page & Waitlist
- [x] Marketing site on same Vercel project (landing, about, contact pages)
- [ ] Email capture form (Supabase insert or Resend list)
- [ ] Copy from `marketing/soshi-copy.docx`

#### Validation Outreach (Weeks 1-2 post-demo)
- [ ] 10 discovery calls using script from PRD §7.2
- [ ] Target: r/askfuneraldirectors, Facebook groups, LinkedIn next-gen directors
- [ ] Success criteria: 3 of 5 say they'd pay → proceed to v1

---

#### QA Bug Sweep (from QA-BUG-REPORT.md, 2026-03-07)
Full report: `QA-BUG-REPORT.md` (75 bugs across P0/P1/P2/P3)

**P0 — Blockers (3/3 complete):**
- [x] BUG-001: Added `preferences jsonb` column to profiles table in schema.sql
- [x] BUG-002: Added `/api/` to public paths in middleware.ts (cron was getting 401)
- [x] BUG-003: Changed cron to hourly in vercel.json (was daily, missed all non-ET timezones)

**P1 — High (14/14 complete):**
- [x] BUG-004: Added error handling + optimistic update + rollback to moveProspect()
- [x] BUG-005: Removed `/onboarding` from public paths in middleware.ts
- [x] BUG-006: Changed `getSession()` to `getUser()` in auth callback (Supabase deprecation)
- [x] BUG-007: Added initialization guard to Zustand store (prevent double-init race)
- [x] BUG-008: Added `redirectTo` search param preservation in middleware
- [x] BUG-009: Changed CSV import from batch insert to individual inserts with per-row errors
- [x] BUG-010: Added useEffect to WelcomeTour to clamp step index on resize
- [x] BUG-011: Refactored PIPELINE_STAGES to hex colors + separate bg/border Tailwind classes
- [x] BUG-012: Replaced `toLocaleString` round-trip with `Intl.DateTimeFormat` in digest
- [x] BUG-013: Added useEffect sync for settings page when org/profile change
- [x] BUG-014: Added org_id to activities table + index + simplified RLS policies
- [x] BUG-015: Added org_id to aftercare_touchpoints table + index + simplified RLS
- [x] BUG-016: Split profiles RLS into SELECT (org-wide) / INSERT+UPDATE+DELETE (own-row)
- [x] BUG-017: Split organizations RLS into SELECT / INSERT+UPDATE+DELETE (owner restriction)

**P2 — Medium (4/30 complete, 26 remaining):**
- [x] BUG-028: Fixed midnight-crossing window check in digest time comparison
- [x] BUG-031: Added `escapeHtml()` helper for XSS prevention in digest email
- [x] BUG-032: Added saving/disabled state to settings save button
- [x] BUG-033: Changed sidebar logo link from `/` to `/dashboard`
- [ ] BUG-018: Add duplicate conversion guard to convertToProspect()
- [ ] BUG-019: Add org_id filter on fetch queries (defense-in-depth)
- [ ] BUG-020: Fix timezone off-by-one for follow-up date comparisons
- [ ] BUG-021: Fix contact update propagation to prospect cards
- [ ] BUG-022: Fix Excel formula cells producing [object Object]
- [ ] BUG-023–027, 029, 030, 034–047: See QA-BUG-REPORT.md

**P3 — Low (0/28, deferred):**
- [ ] BUG-048–075: See QA-BUG-REPORT.md

**Files modified (12):** schema.sql, middleware.ts, store.ts, database.ts, WelcomeTour.tsx, pipeline/page.tsx, settings/page.tsx, import/page.tsx, digest/route.ts, Sidebar.tsx, vercel.json, auth/callback/page.tsx

⚠️ **Supabase action required:** Re-run `schema.sql` in Supabase SQL Editor to apply schema changes (new columns on activities/aftercare_touchpoints, updated RLS policies).

---

## Waiting On
_Nothing yet_

## Someday
- Multi-location support (Brett persona)
- QuickBooks integration (Brett dealbreaker for his tier)
- Carrier reporting (NGL, Homesteaders, FDLIC templates)
- Referral tracking module
- Lead capture / website integration
- Reputation management
- Mobile native app

## Done
- [x] Market research and competitive analysis
- [x] PRD with simulated interviews
- [x] Brand voice guide
- [x] Competitive brief
- [x] GTM plan
- [x] Landing page copy and email sequences
