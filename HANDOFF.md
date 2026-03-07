# Handoff Document — Project Soshi

**Date:** 2026-03-07
**Last session:** Tutorial feature + onboarding friction research
**Deployment:** Live at trysoshi.com (Vercel, state: READY)

---

## What Was Built This Session

### 1. Marketing Website + Dual Auth (commit `5a11194`)
- Added `(marketing)` route group with landing page at `/`, `/about`, `/contact`
- Added password-based login alongside existing magic link auth
- Login page: email + password form with "Send magic link" toggle
- Signup page: email + password + confirm password
- Marketing header/footer components
- All routes working, deployed

### 2. Sidebar Logo Links Home (commit `e10accd`)
- Changed Soshi logo in sidebar from plain text to `<Link href="/">`
- Users can always return to marketing site / home

### 3. First-Time User Tutorial (commit `c64d160`)
- **Welcome Tour** (`src/components/WelcomeTour.tsx`): 4-step tooltip overlay (desktop), 2-step (mobile). Uses `createPortal`, `getBoundingClientRect()`, CSS box-shadow spotlight cutout. Targets elements via `data-tour-target` attributes.
- **Getting Started Checklist** (`src/components/GettingStartedChecklist.tsx`): 5 items (account setup, add contact, create prospect, set digest time, import CSV). Progress bar. Auto-checks as user completes tasks. Dismissible.
- **Database:** Added `preferences jsonb NOT NULL DEFAULT '{}'` column to `profiles` table (user must have already run this migration in Supabase SQL Editor)
- **Store:** Added `markTourCompleted()` and `dismissChecklist()` methods
- **Persistence:** Tour/checklist state stored in `profile.preferences` JSONB: `{ tour_completed: true, checklist_dismissed: true }`

---

## What Was Researched (Not Built)

### Data Migration Friction Mitigation
Funeral home directors face high friction moving existing contact data into Soshi. Five strategies analyzed:

1. **Quick-add forms everywhere** — Low effort, moderate impact. Add inline "add contact" from pipeline/aftercare pages.
2. **Guided CSV template** — Low effort, high impact. Downloadable template with correct headers + sample rows.
3. **Scan-to-contact (photo OCR)** — Medium effort, high impact. Use Claude Haiku vision to extract structured contact data from photos.
4. **Concierge onboarding** — Zero dev, highest impact. "Email us your spreadsheet, we'll import it."
5. **Start empty, build as you go** — Already supported. Messaging tweak to make this feel intentional.

### Scan-to-Contact: Best Approach
- **Recommended:** AI vision model (Claude Haiku 4.5) — NOT traditional OCR
- **Cost:** ~$0.003 per scan ($3 per 1,000 scans)
- **Why Haiku:** Lowest hallucination rate (0.09%), structured JSON output, zero client bundle impact
- **Architecture:** Phone camera → file upload → Next.js API route (`/api/scan-contact`) → Claude Haiku → structured JSON → pre-filled form → user reviews → save
- **Rejected:** Tesseract.js (15MB bundle, poor handwriting, needs second LLM pass), Google Cloud Vision (still needs LLM structuring pass), AWS Textract ($0.05/page, overkill)

### Universal File Ingestion Pipeline
Research completed on supporting non-CSV imports. Recommended architecture:

| Format | Parser | Priority |
|--------|--------|----------|
| Excel (.xlsx) | ExcelJS (MIT, actively maintained) | **MVP** |
| CSV | PapaParse (already installed) | **Done** |
| PDF | unpdf + Claude Vision fallback | **MVP** |
| Google Sheets | CSV export URL (no API key needed) | Nice to have |
| vCard (.vcf) | `vcf` npm package | Later |
| Word (.docx) | mammoth → Claude extraction | Later |
| Photos | Claude Vision (scan-to-contact) | **MVP** |

**Architecture:** Universal upload endpoint detects file type via magic bytes (`file-type` npm), routes to appropriate parser, normalizes to row objects, reuses existing column-mapping UI. Claude Vision is the fallback for anything parsers can't handle.

**Key warning:** Avoid SheetJS (`xlsx` on npm) — frozen with unpatched CVEs, maintainer distributes new versions only via custom CDN. Use ExcelJS instead.

**New dependencies needed:** `exceljs`, `file-type`, `unpdf`, `@anthropic-ai/sdk`

---

## Next Steps (Priority Order)

### Immediate (build next)
1. **Guided CSV template** (~30 min) — Downloadable template file, instructions on import page, add `communication_pref` to import mappings
2. **Scan-to-contact** (~2-3 hrs) — API route + camera input component + pre-filled form
3. **Universal file ingestion** (~3-4 hrs) — Excel support via ExcelJS, PDF via unpdf + Claude fallback, file type detection
4. **Update import page UI** — Single "Import Contacts" page that accepts any file format, detects type, routes to parser

### Ongoing Phase 6 items (from TASKS.md)
- [ ] Empty states with helpful prompts
- [ ] Loading states, error handling, toast notifications
- [ ] Basic settings page (org name, user profile, notification prefs)
- [ ] Wire toast notifications to store actions

### QA items still open
- [ ] Fix digest cron timing (UTC-only; needs per-user timezone or Vercel Pro)
- [ ] Add cascade warning to contact deletion
- [ ] Remove duplicate Next.js config files
- [ ] Add `contact` field to `PreneedProspect` type

---

## Architecture Reference

### Tech Stack
- **Framework:** Next.js 14.2.35 (App Router, TypeScript, Tailwind CSS)
- **Database:** Supabase (PostgreSQL + RLS + Auth)
- **State:** Zustand v5
- **Hosting:** Vercel (Hobby plan, auto-deploy from GitHub main)
- **Email:** Resend (not yet configured — needs API key + domain verification)
- **Icons:** Lucide React
- **CSV:** PapaParse

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/store.ts` | Zustand store — all state + actions |
| `src/types/database.ts` | TypeScript interfaces for all tables |
| `src/app/(dashboard)/import/page.tsx` | CSV import (to be expanded to universal import) |
| `src/app/(dashboard)/contacts/page.tsx` | Contact list + creation form |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard with tutorial integration |
| `src/components/WelcomeTour.tsx` | Welcome tour overlay |
| `src/components/GettingStartedChecklist.tsx` | Getting started checklist |
| `src/components/Sidebar.tsx` | Navigation sidebar |
| `src/app/api/digest/route.ts` | Daily digest email cron (Node.js runtime) |
| `supabase/schema.sql` | Database schema (source of truth) |

### Route Groups
- `(marketing)` — Public pages: `/`, `/about`, `/contact`
- `(auth)` — Login/signup: `/login`, `/signup`
- `(onboarding)` — 3-step wizard: `/onboarding`
- `(dashboard)` — Protected app: `/dashboard`, `/pipeline`, `/contacts`, `/aftercare`, `/import`, `/settings`

### Deployment
- **Vercel project:** `prj_la1ruRuJSZui66P7SxwiuLFkGKt1`
- **Vercel org:** `team_mOgQhWioh4WOSJuFSEbnDNHs`
- **Domain:** trysoshi.com
- **Auto-deploys:** Push to `main` → Vercel builds and deploys

### Database Notes
- `profiles.preferences` — JSONB column for user prefs (`tour_completed`, `checklist_dismissed`)
- All tables have RLS policies scoped to `org_id`
- `handle_new_user` trigger creates org + profile on signup (needs `set search_path = public`)
- ⚠️ Confirm the trigger has been patched in live Supabase (not just in schema.sql)

---

## Recent Git History
```
c64d160 feat: add first-time user tutorial (welcome tour + getting started checklist)
e10accd fix: make Soshi logo in sidebar a link back to home page
5a11194 feat: add marketing website + dual auth (password + magic link)
95fabac fix: switch auth callback to client-side page to fix login redirect loop
1e14df8 fix: auth callback cookie handling + QA improvements
c7c2246 fix: resolve magic link auth loop (trigger search_path + middleware + callback errors)
```
