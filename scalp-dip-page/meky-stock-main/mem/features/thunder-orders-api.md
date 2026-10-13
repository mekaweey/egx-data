---
name: Thunder Orders API
description: Real captured request/response shape for POST orders, GET orders, status fields, and what's still unknown (FILLED response)
type: feature
---

# Thunder Orders API — Captured 2026-06-21 (Sunday, market closed)

## POST create order
`POST https://prod.thndr.app/market-service/orders?market=egypt`

Request:
```json
{
  "amount": 1,
  "asset_class": "STOCK",
  "asset_id": "ab4d9c02-bc69-4c14-bffd-6b1d74c47618",
  "is_limit": false,
  "order_type": "BUY",   // or "SELL"
  "price": 0.915,         // sent even for market orders (= last known price)
  "source": "WEB",
  "stock_id": "ACAMD"
}
```

Response `201 Created` (market CLOSED — no fill):
```json
{
  "id": "58297930",
  "order_number": "58297930",
  "stock_id": "ACAMD",
  "asset_id": "ab4d9c02-bc69-4c14-bffd-6b1d74c47618",
  "symbol_code": "EGS72AQ1C016",
  "amount": 1.0,
  "amount_filled": 0.0,
  "total_fees": 0.0,
  "price": 0.0,
  "market_price": 0.0,
  "is_limit": false,
  "execution_type": "NO_FILL",
  "time_in_force": "gtc",
  "time_in_force_date": "2027-06-21T07:03:55Z",
  "settlement": "SETTLED",
  "order_type": "BUY",
  "order_status": "PENDING",
  "order_status_details": "PENDING_SUBMIT",
  "user_id": "agNXlg7PhfZY3vX3wqfuIRhtCpr2",
  "created_at": "2026-06-21T07:03:55Z",
  "updated_at": "2026-06-21T07:03:55Z",
  "custodian": "THN",
  "asset_class": "STOCK",
  "market_name": "egypt"
}
```

## Extension interceptor: what to capture
- `id` / `order_number` (نفس القيمة) → store as `metadata.thunder_order_id`
- `order_status` + `order_status_details` → maps to pending_orders.status
- `execution_type` → "NO_FILL" | (TBD when filled)
- `amount_filled` + `price` (actual fill) → for outcome logging

## Status mapping (initial)
- order_status=PENDING + status_details=PENDING_SUBMIT → our `confirmed` (sent to broker, not yet executed)
- order_status=FILLED / EXECUTED → our `confirmed` + register position (TBD: confirm exact value)
- order_status=REJECTED / CANCELLED → our `error` / `cancelled`

## Still unknown (capture when market opens)
1. **FILLED response shape** — exact values of `order_status`, `execution_type`, `amount_filled`, `price` after real execution. NEEDED before any auto-confirm logic.
2. Whether server pushes status updates via long-poll `pRTLPCB` or only via fresh `GET /orders` calls.
3. Rejection examples (insufficient balance, halted stock, outside price band).

## Safety rule
لا تـ auto-confirm أي شيء قبل ما نشوف response الـ FILLED الحقيقي. مرحلة 1 من الـ extension (read-only ticks) آمنة. مرحلة الـ orders تنتظر بيانات السوق المفتوح.