# Spec: Order Lookup

## Overview
Customers ask "where's my dabba?" 150+ times a day and wait hours for an answer. This step adds the **verified order lookup** that every later feature builds on: given a phone number and an order ID, load that customer's order, today's dabba (with rider and latest partner events) and tomorrow's dabba. Nothing is returned unless the phone and order ID belong together.

## Depends on
- Database schema + seed (checkpoint C)

## User stories
- As a customer, I want to identify myself with my phone and the order ID from my morning WhatsApp, so I can see my own order without creating an account.
- As the owner, I want no customer to be able to look up someone else's order by guessing a phone number.

## Routes / entry points
- `lib/data/orders.ts → findVerifiedCustomer(phone, orderId)` (server only)
- `/help` page shows a live status card for today's dabba (public)

## Database changes
None.

## Files to create
- `lib/data/orders.ts`: `findVerifiedCustomer`, `markOrderSkipped`
- `components/order-status-card.tsx`: preparing → on the way → delivered tracker
- `tests/fixtures/customer.ts`: shared fixture

## Files to change
- `app/help/page.tsx`

## Business rules
1. Phone input is normalised (`98450 12345`, `+91-…`, `0…` → `+91XXXXXXXXXX`). Order input is normalised (`dx10541` → `DX-10541`).
2. A customer is verified only if `orders.id = orderId AND orders.customer_id = customers.id AND customers.phone = phone`.
3. On mismatch, return `null`. The UI must not say *which* part was wrong.
4. "Today" and "tomorrow" are IST calendar dates.
5. `markOrderSkipped` only changes orders whose status is `scheduled`.

## Rules for implementation
- DB access only via `lib/data/*`, using `db()` from `lib/supabase/server.ts`
- IST via `lib/time.ts`; money in paise
- zod on all external input; no `any`
- No new dependencies

## Tests to write
| Function | Input | Expected |
|---|---|---|
| `normalizePhone` | `"98450 12345"`, `"+91-9845012345"`, `"09845012345"` | `"+919845012345"` |
| `normalizePhone` | `"12345"`, `""` | `null` |
| `normalizeOrderId` | `"dx10541"`, `"DX 10541"` | `"DX-10541"` |
| `istDate` | `2026-10-20T20:00Z` | `"2026-10-21"` (IST, not UTC) |

## Definition of done
- [ ] Entering the demo customer's phone + order ID on `/help` shows today's status card with meal, ETA and rider
- [ ] Entering a valid phone with someone else's order ID shows the generic "couldn't match" message
- [ ] All tests pass
