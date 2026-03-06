# Soshi — Project Memory

**Status:** Pre-build, validation phase
**Codename:** Soshi (product name TBD — see brand-voice guide for recommendations)
**Last updated:** 2026-03-04

---

## What It Is
A purpose-built CRM for independent funeral homes (~15,200 locations in the US). The product targets the white space between case management software (crowded) and actual relationship/pipeline management (empty). No modern standalone CRM exists for this industry.

## The Core Thesis
Independent funeral homes lose preneed revenue because they have no system to nurture the 2+ year consideration cycle from first inquiry to signed contract. They also underinvest in aftercare (post-service follow-up), which is the highest-NPS touchpoint and the most effective preneed lead generator. A simple, radically easy CRM that manages these two workflows is the entire MVP.

## MVP Scope (decided 2026-03-04)
**"The Preneed Engine"** — two modules only:
1. **Preneed Pipeline** — kanban, 6-stage: Prospect → Contacted → Quoted → Considering → Follow-up → Converted
2. **Aftercare Touchpoint Scheduler** — automated timeline: 2-week call, 1-month grief email, 6-month check-in, 1-year anniversary

NOT in MVP: referral tracking, lead capture/integrations, reputation management, multi-location, QuickBooks sync

## Build Approach
No-code / vibe-coded. Stack recommendation: Supabase (free) + Next.js + Vercel (free) + Resend (free email tier). Target: working demo in 2 days.

## Target Persona (primary)
**Next-gen director** — 28–42, recently inherited or purchased family funeral home, tech-comfortable, actively seeking modern tools, active on LinkedIn and Reddit. Fastest validation signal, lowest acquisition friction.

**Secondary persona:** Owner-operator 55–65 (the actual checkbook for most purchases — sell to them once product is validated with next-gen).

## Pricing (planned)
- Starter: $99/mo — core CRM + preneed pipeline + aftercare automation
- Growth: $149/mo — + marketing automation, referral tracking, integrations
- Pro: $199/mo — + multi-location, advanced analytics, API
- Month-to-month only, no contracts, flat per-location pricing

## Market Context (key numbers)
- ~15,200 independent funeral homes, $15B+ combined revenue
- <25% use any lead management software
- 71% have no written marketing plan
- 69% consumer interest in preneed planning; only 17% have done it → 2+ year nurture window
- Preneed CRM adoption = 60% avg increase in preneed production (Homesteaders data)
- 62% cremation rate (up from 47% in 2014), compressing margins → CRM is existential, not optional
- 50-60% of owners retiring in 5 years → urgency + new younger buyers entering market

## Competitive Position
No direct CRM competitor. Closest: SRS "Prospect" (old, expensive, basic), Homesteaders EnGauge (Salesforce-based, partner-exclusive, preneed only), Tribute Lead Logic (lead capture only, not full CRM). Tribute Technology is the biggest strategic threat — $1B+ roll-up that could add CRM to its ecosystem.

## GTM Approach ($0 budget)
Organic only: Reddit (r/askfuneraldirectors), Facebook groups (Funeral Director Success Network, Funeral Industry Think Tank), LinkedIn outreach to next-gen directors, cold email to recently-acquired/new owners, state FDA conventions. NFDA Convention (Charlotte, Oct 25-28 2026) is the major milestone for v1.

## Key Documents
- `research/market-brief.md` — Full market research brief
- `soshi-prd.docx` — PRD with simulated interviews and MVP spec
- `marketing/soshi-brand-voice.docx` — Brand voice guide + product name options
- `marketing/soshi-competitive-brief.docx` — Competitive analysis
- `marketing/soshi-gtm-plan.docx` — GTM strategy
- `marketing/soshi-copy.docx` — Landing page copy + email sequences

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-04 | MVP = preneed pipeline + aftercare only | Narrowest slice that validates core thesis; referrals and integrations are v2 |
| 2026-03-04 | Primary persona = next-gen director (28-42) | Fastest validation signal; design for them, sell to 55-65 second |
| 2026-03-04 | Build = no-code/vibe-coded (Supabase + Next.js + Vercel) | $0 infrastructure, fast to demo |
| 2026-03-04 | Pricing = $99-$199/mo, no contracts | Industry standard set by Osiris/Passare; month-to-month reduces barrier |
| 2026-03-04 | GTM = $0 organic only | Validate before spending; Reddit, FB groups, LinkedIn, cold email |
