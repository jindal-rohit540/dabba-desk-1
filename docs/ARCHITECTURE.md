# DabbaDesk — Architecture

## System overview

```mermaid
flowchart LR
  subgraph Users
    C[Customer<br/>phone browser]
    O[Owner<br/>dashboard]
    W[WhatsApp<br/>via Twilio]
    Z[ZipRun<br/>delivery partner]
  end

  subgraph Vercel["Vercel (Next.js App Router)"]
    H["/help<br/>Server Action"]
    D["/dashboard<br/>Server Components"]
    P[proxy.ts<br/>Clerk auth guard]
    API1["/api/partner/webhook"]
    API2["/api/whatsapp"]
    CRON["/api/cron/data-check<br/>(Vercel Cron)"]
    LIB["lib/<br/>triage · refunds · partner · pii · etl"]
  end

  subgraph External
    SB[(Supabase<br/>Postgres)]
    AI[Claude API<br/>claude-opus-5-5]
    CK[Clerk]
  end

  C --> H
  O --> P --> D
  W --> API2
  Z --> API1
  H & API2 --> LIB
  API1 --> LIB
  D --> LIB
  CRON --> LIB
  LIB -->|secret key, server only| SB
  LIB -->|masked context only| AI
  P <--> CK
```

## Request flow: "Where's my dabba?"

```mermaid
sequenceDiagram
  actor Cust as Customer
  participant Help as /help (Server Action)
  participant DB as Supabase
  participant Claude as Claude API
  Cust->>Help: phone + order ID + "where is my dabba?"
  Help->>DB: verify phone ↔ order, load order, rider, delivery events
  alt phone/order mismatch
    Help-->>Cust: "We couldn't verify that order" (no data leaked)
  else verified
    Help->>Claude: message + masked order context (no phone/address)
    Claude-->>Help: {category, reply, needs_human, refund_reason}
    Help->>Help: deterministic action (skip / log refund), never money
    Help->>DB: insert message (category, reply, response_ms)
    Help-->>Cust: reply + live status card
  end
```

## Data model

```mermaid
erDiagram
  customers ||--o{ subscriptions : has
  customers ||--o{ orders : places
  subscriptions ||--o{ orders : generates
  riders ||--o{ orders : delivers
  orders ||--o{ delivery_events : tracks
  orders ||--o{ refunds : may_have
  customers ||--o{ messages : sends
  orders ||--o{ messages : about

  customers {
    uuid id PK
    text name
    text phone UK
    text area
    text office_address
  }
  subscriptions {
    uuid id PK
    uuid customer_id FK
    text plan
    int price_per_meal_paise
    text status
    date paused_until
  }
  riders {
    text id PK
    text name
    text phone
    text zone
  }
  orders {
    text id PK
    uuid customer_id FK
    date delivery_date
    text meal
    int quantity
    int amount_paise
    text status
    text rider_id FK
    timestamptz eta
  }
  delivery_events {
    bigint id PK
    text order_id FK
    text status
    text note
    timestamptz at
    jsonb raw
  }
  refunds {
    uuid id PK
    text order_id FK
    text reason
    int amount_paise
    text status
    text source
  }
  messages {
    uuid id PK
    text channel
    text phone
    text body
    text category
    text reply
    bool needs_human
    text status
    int response_ms
  }
  data_check_runs {
    bigint id PK
    timestamptz ran_at
    int issue_count
    jsonb issues
  }
```

## Key decisions
| Decision | Why |
|---|---|
| Supabase is accessed **server-side only** with the secret key (`lib/supabase/server.ts`, `import "server-only"`) | One access path makes it easy to review. No Row-Level Security policies needed on day one. |
| The LLM **classifies and phrases** the reply; **code decides actions** | Money and data changes must be deterministic and testable. |
| Customer identity = phone **and** order ID | Phone alone would let anyone read anyone's order. |
| Money as integer **paise** | No floating-point rounding bugs in refunds. |
| All dates/times in **IST** (`Asia/Kolkata`) | The business runs in Bengaluru. |
| Clerk guards `/dashboard` in `proxy.ts` *and* the page calls `auth()` | Defence in depth. The proxy alone is only an optimistic check. |
| Partner payloads go through an **adapter** (`lib/partner.ts`) | ZipRun changes formats without notice; only one file has to change. |

## LLM choice
- **Model:** `claude-opus-5-5` via `@anthropic-ai/sdk`, with `effort: "low"` (it's a short classification-and-reply task, so speed matters).
- **Structured output** (Zod schema) so the category is always valid JSON.
- **Server-side refusal fallback** (`fallbacks: "default"`) enabled.
- The prompt says: answer only from the provided rows; if the answer isn't there, say a human will reply.
