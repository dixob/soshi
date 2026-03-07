# Handoff Document — Project Soshi

**Date:** 2026-03-07
**Last session:** Phase 6b build (multi-format import + scan-to-contact) + loading skeletons
**Deployment:** Live at trysoshi.com (Vercel, state: READY)

---

## What Was Built This Session

### 1. Phase 6b — Multi-Format Import Hub
Replaced the CSV-only import page with a unified 3-card hub supporting all file types.

**New import page (`/import`):**
| Card | Action |
|------|--------|
| Upload File | Drag-drop zone, accepts `.csv`, `.xlsx`, `.pdf` |
| Scan a Card | Links to `/import/scan` (camera/upload → AI extraction) |
| Download Template | Downloads `soshi-contact-template.csv` |

**4 data ingestion pipelines:**
| Format | Parser | Location |
|--------|--------|----------|
| CSV | PapaParse (client-side) | `import/page.tsx` |
| Excel (.xlsx) | ExcelJS (server-side) | `/api/parse-file` → `parse-excel.ts` |
| PDF | unpdf + Claude Haiku (server-side) | `/api/parse-file` → `parse-pdf.ts` |
| Photo scan | Claude Haiku 4.5 vision | `/api/scan-contact` → pre-filled form |

All non-CSV formats route through `/api/parse-file` which detects file type via magic bytes (`file-type` npm), then returns `{ headers, rows }` for the existing column-mapping UI.

### 2. Scan-to-Contact (Claude Vision)
- **API route:** `src/app/api/scan-contact/route.ts` — Auth check, 10MB limit, image/* validation, base64 → Claude Haiku 4.5 → structured JSON with confidence score
- **UI:** `src/app/(dashboard)/import/scan/page.tsx` — 3-stage flow: Capture (camera/upload) → Processing (spinner + preview) → Review (pre-filled ContactForm + confidence badge + raw text toggle)
- **Cost:** ~$0.003 per scan

### 3. Shared Components Extracted
- **`ContactForm.tsx`** — Extracted from `contacts/page.tsx` into standalone component with optional `title` prop. Used by both contacts page and scan review.
- **`import-fields.ts`** — Shared `FIELD_MAPPINGS`, `autoMapColumns()`, `ParsedData` type. Used by import page.

### 4. Loading Skeletons
- **`PageSkeleton.tsx`** — 6 skeleton components: `StatCardSkeleton`, `CardSkeleton`, `TableSkeleton`, `KanbanSkeleton`, `AftercareSkeleton`, `DashboardSkeleton`
- **Store:** Added `dataLoading` boolean + `Promise.all` for parallel fetching in `initialize()`
- **All main pages** (dashboard, pipeline, contacts, aftercare) show skeletons during initial data load

### 5. QA Fixes
- `addActivity` toast gap fixed — error handling + toast notifications on store actions
- CSV import now uses batch inserts (50 rows per batch via Supabase array insert)
- Sidebar: "Import CSV" → "Import"
- `communication_pref` added to import field mappings

---

## New Files Created

| File | Purpose |
|------|---------|
| `public/soshi-contact-template.csv` | Downloadable CSV template with correct headers + sample rows |
| `src/lib/import-fields.ts` | Shared FIELD_MAPPINGS, autoMapColumns, ParsedData type |
| `src/components/ContactForm.tsx` | Extracted reusable contact form |
| `src/components/PageSkeleton.tsx` | Skeleton loading components for all pages |
| `src/app/api/scan-contact/route.ts` | Claude Haiku vision scan-to-contact endpoint |
| `src/app/(dashboard)/import/scan/page.tsx` | Scan UI (capture → process → review) |
| `src/lib/parsers/parse-excel.ts` | ExcelJS parser for .xlsx files |
| `src/lib/parsers/parse-pdf.ts` | unpdf + Claude Haiku parser for PDFs |
| `src/app/api/parse-file/route.ts` | Universal file parsing endpoint |

**New dependencies:** `exceljs`, `file-type`, `unpdf`, `@anthropic-ai/sdk`

---

## Next Steps (Priority Order)

### Immediate
1. **Empty states with helpful prompts** — No contacts yet, no prospects yet, etc.
2. **Basic settings page** — Org name, user profile, notification preferences
3. **Wire remaining toast notifications** — System exists, connect to all store actions

### QA Items Still Open
- [ ] Fix digest cron timing (UTC-only; needs per-user timezone or Vercel Pro)
- [ ] Add cascade warning to contact deletion (prospects + aftercare silently destroyed)
- [ ] Remove duplicate Next.js config files (keep one of `next.config.mjs` / `next.config.ts`)
- [ ] Add `contact` field to `PreneedProspect` type (or generate Supabase types)
- [ ] Remove unused deps: `@hello-pangea/dnd`, `resend`
- [ ] Add org_id filter to digest touchpoints query
- [ ] Add pagination to list views

---

## Architecture Reference

### Tech Stack
- **Framework:** Next.js 14.2.35 (App Router, TypeScript, Tailwind CSS)
- **Database:** Supabase (PostgreSQL + RLS + Auth)
- **State:** Zustand v5
- **AI:** Claude Haiku 4.5 (scan-to-contact, PDF parsing)
- **Hosting:** Vercel (Hobby plan, auto-deploy from GitHub main)
- **Email:** Resend (not yet configured — needs API key + domain verification)
- **Icons:** Lucide React
- **Parsing:** PapaParse (CSV), ExcelJS (Excel), unpdf (PDF)

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/store.ts` | Zustand store — all state + actions + dataLoading |
| `src/types/database.ts` | TypeScript interfaces for all tables |
| `src/app/(dashboard)/import/page.tsx` | Universal import hub (CSV/Excel/PDF) |
| `src/app/(dashboard)/import/scan/page.tsx` | Scan-to-contact UI |
| `src/app/api/scan-contact/route.ts` | Claude Vision scan endpoint |
| `src/app/api/parse-file/route.ts` | Universal file parsing endpoint |
| `src/lib/parsers/parse-excel.ts` | Excel parser |
| `src/lib/parsers/parse-pdf.ts` | PDF parser (unpdf + Claude) |
| `src/lib/import-fields.ts` | Shared import utilities |
| `src/components/ContactForm.tsx` | Reusable contact form |
| `src/components/PageSkeleton.tsx` | Loading skeleton components |
| `src/components/Sidebar.tsx` | Navigation sidebar |
| `src/app/api/digest/route.ts` | Daily digest email cron |
| `supabase/schema.sql` | Database schema (source of truth) |

### Route Groups
- `(marketing)` — Public pages: `/`, `/about`, `/contact`
- `(auth)` — Login/signup: `/login`, `/signup`
- `(onboarding)` — 3-step wizard: `/onboarding`
- `(dashboard)` — Protected app: `/dashboard`, `/pipeline`, `/contacts`, `/aftercare`, `/import`, `/import/scan`, `/settings`

### Deployment
- **Vercel project:** `prj_la1ruRuJSZui66P7SxwiuLFkGKt1`
- **Vercel org:** `team_mOgQhWioh4WOSJuFSEbnDNHs`
- **Domain:** trysoshi.com
- **Auto-deploys:** Push to `main` → Vercel builds and deploys

### Env Vars Needed on Vercel
```
NEXT_PUBLIC_SUPABASE_URL (already configured)
NEXT_PUBLIC_SUPABASE_ANON_KEY (already configured)
SUPABASE_SERVICE_ROLE_KEY (already configured)
CRON_SECRET (already configured)
RESEND_API_KEY (from Resend dashboard after signup)
RESEND_FROM_EMAIL (needs domain verification in Resend)
NEXT_PUBLIC_APP_URL (already configured)
ANTHROPIC_API_KEY (from Anthropic console — needed for scan + PDF parsing)
```

### Database Notes
- `profiles.preferences` — JSONB column for user prefs (`tour_completed`, `checklist_dismissed`)
- All tables have RLS policies scoped to `org_id`
- `handle_new_user` trigger creates org + profile on signup (needs `set search_path = public`)
- Confirm the trigger has been patched in live Supabase (not just in schema.sql)
