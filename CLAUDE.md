# CLAUDE.md

@AGENTS.md

## Project overview

DabbaDesk is the customer-support desk for **Dabba Express**, a lunch-tiffin delivery business in Bengaluru (~1,500 dabbas/day). Customers get instant, correct answers about their own order. The owner sees everything on a dashboard. Product context: `docs/PRD.md`. Diagrams: `docs/ARCHITECTURE.md`.

---

## Architecture

```
dabbadesk/
├── app/
│   ├── page.tsx                 # Landing page (public)
│   ├── help/                    # Customer help desk (public): page + actions.ts (Server Actions)
│   ├── dashboard/               # Owner dashboard (auth.protect() in the page)
│   ├── sign-in/[[...sign-in]]/  # Clerk sign-in page
│   └── api/
│       ├── partner/webhook/     # ZipRun delivery updates (shared-secret header)
│       ├── cron/data-check/     # Nightly data-quality job (Vercel Cron, CRON_SECRET)
│       └── whatsapp/            # Twilio WhatsApp webhook (stretch)
├── components/                  # Shared UI (server components unless they need state)
├── lib/
│   ├── supabase/server.ts       # The ONLY place a Supabase client is created (server-only)
│   ├── data/                    # All DB queries, one file per area (orders, messages, refunds, dashboard…)
│   ├── triage.ts                # OpenAI call: classify + reply (structured output)
│   ├── handle-message.ts        # Orchestration: verify → triage → deterministic actions → store (injectable deps)
│   ├── refunds.ts · skip.ts · pause.ts   # Business rules (pure, unit-tested)
│   ├── partner.ts               # ZipRun payload adapter v1 + v2 (pure, unit-tested)
│   ├── pii.ts · secrets.ts      # Masking helpers, constant-time secret compare
│   ├── data-checks.ts · metrics.ts       # Nightly data-quality rules, dashboard maths
│   ├── whatsapp.ts              # Order-ID extraction + TwiML
│   ├── format.ts · time.ts      # formatINR (paise), IST date helpers
│   └── etl/clean.ts             # CSV cleaning used by scripts/seed.ts
├── supabase/migrations/         # SQL migrations (never edit an applied migration; add a new one)
├── scripts/seed.ts              # Loads data/raw/*.csv → cleans → upserts into Supabase
├── data/raw/                    # Messy CSV exports from the business (input, read-only)
└── tests/                       # Vitest unit tests, fixtures in tests/fixtures/
```

**Where things belong:**
- DB queries → `lib/data/*` only. Never call Supabase from a page, component or route directly.
- Business rules (money, skips, masking, partner parsing) → pure functions in `lib/` with tests.
- LLM calls → `lib/triage.ts` only. Actions after triage → `lib/handle-message.ts` (never inside the prompt).
- New page → `app/<route>/page.tsx`. Mutations → Server Actions in that route's `actions.ts`.

---

## Code style

- TypeScript strict. No `any`; parse external input with **zod**.
- Server Components by default. Add `"use client"` only for interactivity.
- Tailwind v4 utility classes using the theme tokens in `app/globals.css` (`bg-brand`, `text-ink`, …). No hard-coded hex colours in components.
- Icons from `lucide-react`.
- Money is **integer paise** everywhere; format with `formatINR()` from `lib/format.ts`.
- Times are **IST**; use helpers in `lib/time.ts`, never `new Date().toLocaleString()` ad hoc.
- Error handling: route handlers return proper status codes (`400/401/404`), never stack traces.

---

## Tech constraints

- **Next.js 16 App Router**. `cacheComponents` is **disabled** for simplicity. Data pages use `export const dynamic = "force-dynamic"`.
- **Auth: Clerk.** `proxy.ts` only runs `clerkMiddleware()`. Every owner page calls `await auth.protect()` and every owner Server Action checks `auth()`. Don't use `createRouteMatcher` (deprecated).
- **DB: Supabase Postgres** via `@supabase/supabase-js`, **server-side only** with `SUPABASE_SECRET_KEY`. No browser Supabase client.
- **LLM: OpenAI** via the `openai` SDK (Responses API + `zodTextFormat`), model from `OPENAI_MODEL` (default `gpt-5-mini`). Never send phone numbers or addresses to the model.
- **Tests: Vitest.** No new dependencies without saying so first.

---

## Business rules (do not break)

- **The AI never approves or pays refunds.** It may only *log* a refund request (`status = 'requested'`).
- A customer is verified only when **phone + order ID match**. Never reveal data on a mismatch.
- Skip requests are allowed until **21:00 IST the night before** delivery.
- The refund amount can never exceed what the customer paid for that order.

---

## Subagent policy

- Use the **Explore** subagent for codebase research before implementing a feature.
- Use **reference-scout** when a task resembles something in `../REFERENCE spendly-main`.
- After implementing a spec: `/test-feature <spec>` (test-writer → test-runner), then `/code-review-feature <spec>`.
- In plan mode, use the built-in Plan subagent.

---

## Commands

```bash
npm run dev          # http://localhost:3000
npm test             # vitest run (all)
npx vitest run tests/refunds.test.ts   # one file
npm run lint
npm run typecheck
npm run db:seed -- --reset --live   # wipe + reload demo data; today's deliveries at "lunch rush" now
npm run smoke:ai                    # one real OpenAI call to check the key
npm run partner:send -- v1-delayed DX-10542   # simulate a ZipRun webhook
```

---

## Workflow

- Never commit to `main` directly. One branch per spec: `feature/<slug>`.
- Specs live in `.claude/specs/NN-slug.md` and are the source of truth for tests.
- Every PR gets a Vercel Preview URL. Merging to `main` deploys to production.

---

## Warnings

- **Never read, print or edit `.env*` files.** Ask the human to set env vars.
- **Never edit an applied migration.** Create a new one.
- `data/raw/*.csv` is *input*. Don't "fix" it by hand; fix the cleaning code.
- The ZipRun API format **changes without notice**; all parsing goes through `lib/partner.ts`.
