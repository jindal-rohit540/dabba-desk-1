# Spec: Nightly Data-Quality Check

## Overview
Last Diwali, bad data quietly piled up (refunds larger than orders, dabbas stuck "on the way"). A scheduled job checks the data every night and the dashboard shows a **Data health** card, so problems are caught before customers notice.

## Depends on
- 03-owner-dashboard

## Routes / entry points
- `GET /api/cron/data-check` (cron): requires `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron sends this header automatically when `CRON_SECRET` is set.
- `vercel.json`: `{"crons":[{"path":"/api/cron/data-check","schedule":"30 17 * * *"}]}` (23:00 IST)

## Files to create
- `lib/data-checks.ts`: pure `findDataIssues({ orders, refunds, now })` → `Issue[]`
- `lib/data/data-checks.ts`: load inputs, insert `data_check_runs`, `latestRun()`
- `app/api/cron/data-check/route.ts`, `vercel.json`
- Dashboard "Data health" card

## Business rules (each produces an `Issue { code, severity, orderId?, message }`)
1. `REFUND_EXCEEDS_ORDER` (high): refund `amount_paise` > its order's `amount_paise`
2. `STUCK_ON_THE_WAY` (medium): status `out_for_delivery`/`delayed` and ETA more than 2 h ago
3. `DELIVERED_WITHOUT_TIME` (low): status `delivered` and `delivered_at` null
4. `NEGATIVE_AMOUNT` (high): `amount_paise` < 0
5. Wrong/missing bearer token → 401.

## Tests to write
One test per rule (positive and negative case), plus "no issues on clean data".

## Definition of done
- [ ] `curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/data-check` returns the issue list and stores a run
- [ ] Dashboard shows the latest run: ✅ or the issues with severity badges
- [ ] Cron visible in Vercel → Settings → Cron Jobs
