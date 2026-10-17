# DabbaDesk — Product Requirements

## Problem
Dabba Express delivers ~1,500 lunch tiffins a day across Bengaluru. Between 11:30 and 14:00, 300+ support messages arrive on WhatsApp/email. Two people answer by hand from a spreadsheet, so replies take **2–3 hours** and customers churn (~40 last month).

## Users
| User | Need |
|---|---|
| **Customer** (office-goer) | "Where's my dabba?", skip tomorrow, report a problem, get an instant and *correct* answer about their own order |
| **Owner** (Meera, Suresh) | See what's coming in, what was auto-handled, what needs a human. Phone-friendly. |
| **Support staff** (Pooja, Swati) | Only handle the hard cases. |

## Goals (how we know it worked)
| Metric | Before | Target |
|---|---|---|
| Median first reply time | ~2 h | < 10 s |
| Messages handled without a human | 0 % | > 60 % |
| Wrong answers about an order | unknown | 0 (answers only from DB rows) |

## Scope v1 (this week)
1. **Customer help page** `/help`: customer enters phone + order ID + message → instant reply grounded in their order data.
2. **Automatic triage** of every message: `order_status`, `skip_day`, `refund`, `complaint`, `other`.
3. **Safe actions:**
   - `skip_day`: skip tomorrow's dabba automatically if before the 21:00 IST cut-off.
   - `refund`: **log** a refund request only. **AI never approves or pays money.** A human approves.
4. **Owner dashboard** `/dashboard` (login required): KPIs, inbox with "needs human" filter, refunds queue, today's deliveries, data health.
5. **Delivery partner (ZipRun) webhook**: rider status/ETA updates stream into our DB.
6. **Privacy:** phone numbers and addresses masked in the dashboard; never sent to the LLM.

## Later
- Pause subscription (requested "by Friday")
- WhatsApp channel (answer where customers already are)
- Nightly data-quality check
- Diwali readiness (3× load)

## Non-goals
- Payments, menu management, rider app.
- Customer accounts and passwords (phone + order ID is the identity check).

## Open questions
- Exact skip cut-off time? (assumed 21:00 IST the night before)
- Can small refunds be auto-approved later? (No for v1.)
- Does ZipRun have API docs? (We only have sample payloads.)
