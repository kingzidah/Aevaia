-- ═══════════════════════════════════════════════════════════════════════════
-- commissions — one row per job, created when someone completes /start
--
-- This is the record the whole payment lock hangs off. The `code` is what the
-- client is given; it is the only thing tying a person to their site, and it
-- must be unguessable because possession of it is what will eventually unlock
-- paid content.
--
-- The money columns exist from the start even though nothing writes to them
-- yet. Adding them now costs nothing and means phase two is a webhook plus a
-- read, rather than a migration against a table that already holds live jobs.
--
-- RLS is enabled with NO policies, deliberately. That makes the table
-- unreachable from the browser with the anon key — every read and write goes
-- through the service role on the server. Same posture as wedding_guests.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.commissions (
  id            uuid primary key default gen_random_uuid(),

  -- Client-facing reference, e.g. AV-K7M2QP. Unique; minted server-side with a
  -- CSPRNG over an alphabet with no I, L, O or U so it can be read aloud or
  -- typed off a phone screen without ambiguity.
  code          text        not null unique,

  -- Who they are
  name          text        not null,
  email         text        not null,
  phone         text,

  -- What they want
  occasion      text,
  event_date    text,                       -- free text on purpose: people write
                                            -- "late August" as often as a date
  names_on_site text,
  brief         text,
  package       text,

  -- Money. amount_* are in minor units (cents) to avoid float rounding.
  -- The gate opens when amount_paid >= amount_due AND amount_due > 0.
  currency      text        not null default 'EUR',
  amount_due    integer     not null default 0,
  amount_paid   integer     not null default 0,

  -- new | quoted | building | delivered | cancelled
  status        text        not null default 'new',

  -- Set once the site exists, so the code can resolve to something to serve.
  project_id    text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Lookups are always by code (the client's link) or by email (your admin view).
create index if not exists commissions_code_idx  on public.commissions (code);
create index if not exists commissions_email_idx on public.commissions (email);

-- Guard rails the application should not be trusted to enforce alone.
alter table public.commissions
  drop constraint if exists commissions_amounts_non_negative;
alter table public.commissions
  add constraint commissions_amounts_non_negative
  check (amount_due >= 0 and amount_paid >= 0);

alter table public.commissions enable row level security;

-- Keep updated_at honest without the application having to remember.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists commissions_touch_updated_at on public.commissions;
create trigger commissions_touch_updated_at
  before update on public.commissions
  for each row execute function public.touch_updated_at();
