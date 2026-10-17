# Spec: ZipRun Delivery Partner Webhook

## Overview
ZipRun (the delivery partner) sends rider status updates, but nobody reads them today. This step adds a webhook that accepts ZipRun's payloads, converts them through a single **adapter** into our own `DeliveryUpdate` shape, stores them as `delivery_events`, and updates the order's status and ETA. ZipRun has no API docs, only sample payloads in `tests/fixtures/partner/`, so we work out the format from examples.

## Depends on
- 01-order-lookup

## Routes / entry points
- `POST /api/partner/webhook` (partner): header `x-ziprun-secret` must equal `PARTNER_WEBHOOK_SECRET`

## Database changes
None (uses `delivery_events`, `orders`).

## Files to create
- `lib/partner.ts`: `parsePartnerPayload(json): DeliveryUpdate` (pure) + `DeliveryUpdate` type
- `lib/data/deliveries.ts`: `applyDeliveryUpdate(update)` inserts event, updates order
- `app/api/partner/webhook/route.ts`
- `tests/fixtures/partner/*.json`: copied from `00-instructor-kit/inputs/partner-api-samples/`

## Business rules
1. `DeliveryUpdate = { orderId, status: 'out_for_delivery'|'delayed'|'delivered', eta: ISO|null, landmark: string|null, note: string|null, at: ISO, riderId: string|null }`
2. v1 status map: `OUT_FOR_DELIVERY→out_for_delivery`, `DELAYED→delayed`, `DELIVERED→delivered`. Unknown status → throw `PartnerPayloadError`.
3. Webhook returns `401` for a wrong/missing secret (constant-time compare), `400` for an invalid payload, `404` for an unknown order, `200 {ok:true}` otherwise.
4. `delivered` sets `orders.delivered_at`; `delayed`/`out_for_delivery` update `orders.eta` when provided.
5. Raw payload stored in `delivery_events.raw` for debugging.

## Tests to write
| Fixture | Expected `DeliveryUpdate` |
|---|---|
| `v1-out-for-delivery.json` | status out_for_delivery, eta ISO, landmark "Sony World Signal" |
| `v1-delayed.json` | status delayed, note = delay_reason |
| `v1-delivered.json` | status delivered, eta null |
| `invalid-unknown-status.json` | throws `PartnerPayloadError` |
| `{}` | throws `PartnerPayloadError` |

## Definition of done
- [ ] `curl -X POST /api/partner/webhook -H "x-ziprun-secret: …" -d @v1-delayed.json` → 200 and the customer's `/help` card shows "Delayed"
- [ ] Wrong secret → 401
- [ ] All fixture tests pass

## 🎭 Live surprise (instructor)
After this ships, drop `v2-in-transit.json` and `v2-delayed.json` into the fixtures and add the tests. They fail. The prompt is: *"ZipRun changed their format without telling us. Support v1 and v2."* Expected v2 mapping: `data.reference→orderId`, `state: in_transit→out_for_delivery, delayed→delayed, delivered→delivered`, `expected_at` epoch seconds → ISO, `updated_at` epoch → `at`, `courier_id→riderId`, landmark null.
