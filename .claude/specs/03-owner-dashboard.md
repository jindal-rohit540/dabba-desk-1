# Spec: Owner Dashboard with Clerk Login

## Overview
Meera wants one screen, on her phone, showing what's coming in, what DabbaDesk handled by itself, and what needs a human. This step protects `/dashboard` with **Clerk** and builds the dashboard: KPI tiles (including the before/after reply time), an inbox with a "needs human" filter and a "mark resolved" action, the refunds queue with approve/reject, and today's deliveries.

## Depends on
- 02-message-triage

## User stories
- As the owner, I sign in (Google or email) and land on the dashboard; strangers can't.
- As the owner, I see today's messages, % auto-handled, and median reply time vs before DabbaDesk.
- As support staff, I filter to "needs human", read the AI's reply, and mark a message resolved.
- As the owner, I approve or reject refund requests. That's the only place money is approved.

## Routes / entry points
- `proxy.ts`: `export default clerkMiddleware()` (attaches the session; protects nothing by itself)
- `app/sign-in/[[...sign-in]]/page.tsx`: Clerk `<SignIn />`
- `GET /dashboard` (owner): Server Component, starts with `await auth.protect()`
- Server Actions in `app/dashboard/actions.ts` (owner, each calls `auth()`): `resolveMessage(id)`, `decideRefund(id, "approved" | "rejected")`

## Database changes
None.

## Files to create
- `proxy.ts`, `app/sign-in/[[...sign-in]]/page.tsx`
- `app/dashboard/actions.ts`
- `lib/data/dashboard.ts`: `getKpis(date)`, `listMessages({ needsHumanOnly, limit })`, `listRefunds({ status })`, `listTodaysDeliveries(date)`
- `lib/metrics.ts`: pure `median(numbers)`, `autoHandledRate(messages)`
- `components/dashboard/*`: KPI tile, inbox, refunds table, deliveries list

## Files to change
- `app/layout.tsx`: wrap in `<ClerkProvider>`; header shows `<UserButton />` when signed in
- `app/dashboard/page.tsx`

## Business rules
1. Unauthenticated `GET /dashboard` → redirected to sign-in (via `auth.protect()` in the page).
2. Every dashboard Server Action calls `auth()` and throws if there's no `userId` (Server Actions are public endpoints).
3. Only refunds in `requested` can be approved/rejected.
4. KPIs for "today" use IST.
5. "Before DabbaDesk" median = median `response_ms` of `handled_by='human'` messages; "now" = median of `handled_by='ai'` today.
6. Restrict who can sign in via Clerk dashboard → **Restrictions → Allowlist** (no code).

## Rules for implementation
- Use `@clerk/nextjs` (`ClerkProvider`, `clerkMiddleware`, `auth`, `Show`, `UserButton`, `SignIn`). Next.js 16 uses **`proxy.ts`**, not `middleware.ts`. **Don't use `createRouteMatcher`** (deprecated in Clerk 7; put checks in each page/action).
- Locally, run `npx clerk@latest init --accountless` once to get temporary dev keys (no account needed). On Vercel, set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
- Dashboard page: `export const dynamic = "force-dynamic"`.
- Use the `dabba-ui` skill for layout; must work at 375px wide.

## Tests to write
| Unit | Case | Expected |
|---|---|---|
| `median` | [] / [5] / [1,3,2] / [1,2,3,4] | null / 5 / 2 / 2.5 |
| `autoHandledRate` | 3 AI no-human, 1 AI needs-human, 2 human | 0.5 (3 of 6) |
| `autoHandledRate` | [] | 0 |

## Definition of done
- [ ] Logged out → `/dashboard` redirects to sign-in
- [ ] Logged in → KPI tiles, inbox, refunds, deliveries visible with seeded data
- [ ] "Needs human" filter works; "Mark resolved" updates the row
- [ ] Approving a refund changes its status; the AI path can't
- [ ] Usable on a phone-width screen
