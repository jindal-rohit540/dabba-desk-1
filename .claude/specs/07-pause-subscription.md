# Spec: Pause Subscription

## Overview
Customers travelling for Diwali have to message "skip, skip, skip" every day. Meera wants a **pause button by Friday**. A verified customer can pause their subscription until a date. Every scheduled dabba in that range is skipped, and DabbaDesk knows about the pause.

## Depends on
- 01-order-lookup, 02-message-triage

## Routes / entry points
- Server Action `pauseSubscription` in `app/help/actions.ts` (public, requires phone + order ID verification)
- "Pause my subscription" panel on `/help` (shown after a successful verification)

## Database changes
None (`subscriptions.status`, `subscriptions.paused_until` already exist).

## Files to create / change
- `lib/pause.ts`: pure `validatePause({ from, until, now })`
- `lib/data/subscriptions.ts`: `pauseSubscription(customerId, from, until)` updates subscription and skips scheduled orders in range
- `components/pause-panel.tsx`, `app/help/actions.ts`

## Business rules
1. Pause starts **tomorrow** if before 21:00 IST today, otherwise the day after tomorrow.
2. `until` must be ≥ start and ≤ 30 days from today.
3. Only `scheduled` orders between start and until (inclusive) become `skipped`.
4. Subscription becomes `paused` with `paused_until = until`.
5. Response tells the customer how many dabbas were skipped and when deliveries resume (`until + 1`).

## Tests to write
| `validatePause` input | Expected |
|---|---|
| now 10:00 IST, until +3 days | ok, start = tomorrow |
| now 21:30 IST, until +3 days | ok, start = day after tomorrow |
| until before start | error |
| until > 30 days | error |

## Definition of done
- [ ] Verified customer pauses until a date; orders in range show `skipped` in Supabase
- [ ] "Where's my dabba?" during a pause says the subscription is paused and when it resumes
