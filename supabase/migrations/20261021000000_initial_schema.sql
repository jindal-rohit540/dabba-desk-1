-- DabbaDesk initial schema
-- Money is integer paise. Timestamps are timestamptz. Business dates are IST calendar dates.

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique check (phone ~ '^\+91[6-9][0-9]{9}$'),
  area text not null,
  office_address text not null,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  plan text not null,
  price_per_meal_paise integer not null check (price_per_meal_paise > 0),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  paused_until date,
  created_at timestamptz not null default now(),
  unique (customer_id)
);

create table riders (
  id text primary key,
  name text not null,
  phone text not null,
  zone text not null
);

create table orders (
  id text primary key check (id ~ '^DX-[0-9]+$'),
  customer_id uuid not null references customers (id) on delete cascade,
  delivery_date date not null,
  meal text not null,
  quantity integer not null default 1 check (quantity between 1 and 10),
  amount_paise integer not null check (amount_paise >= 0), -- line total (price × quantity)
  status text not null check (
    status in ('scheduled', 'preparing', 'out_for_delivery', 'delayed', 'delivered', 'skipped', 'cancelled')
  ),
  rider_id text references riders (id),
  eta timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz not null default now()
);
create index orders_customer_date_idx on orders (customer_id, delivery_date);
create index orders_date_status_idx on orders (delivery_date, status);

create table delivery_events (
  id bigint generated always as identity primary key,
  order_id text not null references orders (id) on delete cascade,
  status text not null,
  note text,
  landmark text,
  eta timestamptz,
  at timestamptz not null,
  source text not null default 'ziprun',
  raw jsonb not null
);
create index delivery_events_order_idx on delivery_events (order_id, at desc);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  reason text not null,
  amount_paise integer not null check (amount_paise >= 0),
  status text not null default 'requested' check (status in ('requested', 'approved', 'paid', 'rejected')),
  source text not null default 'dabbadesk' check (source in ('dabbadesk', 'spreadsheet', 'whatsapp')),
  notes text,
  created_at timestamptz not null default now()
);
create index refunds_status_idx on refunds (status, created_at desc);

create table messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('web', 'whatsapp', 'email')),
  customer_id uuid references customers (id) on delete set null,
  order_id text references orders (id) on delete set null,
  phone text,
  body text not null,
  category text check (category in ('order_status', 'skip_day', 'refund', 'complaint', 'other')),
  reply text,
  handled_by text not null default 'ai' check (handled_by in ('ai', 'human')),
  needs_human boolean not null default false,
  status text not null default 'open' check (status in ('open', 'auto_resolved', 'resolved')),
  response_ms integer,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);
create index messages_created_idx on messages (created_at desc);
create index messages_status_idx on messages (status, needs_human);

create table data_check_runs (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  issue_count integer not null,
  issues jsonb not null
);

-- All access goes through the server with the secret key.
-- Enable RLS with no policies so the public/anon key can read nothing.
alter table customers enable row level security;
alter table subscriptions enable row level security;
alter table riders enable row level security;
alter table orders enable row level security;
alter table delivery_events enable row level security;
alter table refunds enable row level security;
alter table messages enable row level security;
alter table data_check_runs enable row level security;
