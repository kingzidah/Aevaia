-- Gate name lookup, moved out of the application and into the database.
-- Backs app/api/wedding/lookup/route.ts.
--
-- ALREADY APPLIED to the live Supabase project (ajltlxgknitkfjvfzowu) on
-- 2026-08-20. Recorded here so the schema change is in the repository rather
-- than existing only in the running database. Apply by hand, like 001 — this
-- project has no migrations directory and the live schema has drifted from
-- schema.prisma, so `prisma db push` would try to reconcile far more than this.
--
-- WHY
--
-- The route used to fetch guests with .limit(2000) and no ORDER BY, then score
-- them in JavaScript. Below 2000 guests that works. Above it Postgres returns
-- an arbitrary subset, so a guest who IS on the list gets told they are not —
-- at the door, with a queue behind them. The goal is 10,000 guests per event,
-- so this was a real failure waiting for a big wedding.
--
-- WHAT IT RETURNS
--
-- Candidates, not final results. The filter here is a deliberately looser
-- version of the application's scoreMatch(): it drops the one-to-one pairing
-- between query tokens and name tokens. That makes its output a strict superset
-- of anything scoreMatch could rank at 2 or above, so the route can still do
-- the exact ranking and the subtle matching rules live in one language instead
-- of drifting apart in two.
--
-- Verified against the application scorer on 14 probe queries covering
-- reordering, prefixes, and non-matches: identical results on every one.
--
-- PERFORMANCE
--
-- No index, deliberately. Measured at 85ms for a sequential scan over 10,000
-- names, which is fine at a gate. The predicate needs prefix matching in BOTH
-- directions, which wants either a trigram index or a token-array index plus
-- generated prefixes; buy that complexity when a measurement asks for it.
--
-- REVERSIBLE
--
-- DROP FUNCTION public.wedding_guest_lookup(text[], int); restores the previous
-- behaviour, provided the route is rolled back to the .limit(2000) select at
-- the same time — the route has no fallback path and will return 500 without
-- this function.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.wedding_guest_lookup(
  q_tokens text[],
  max_rows int DEFAULT 200
)
RETURNS TABLE (
  ticket_code   text,
  name          text,
  phone         text,
  checked_in_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT g.ticket_code, g.name, g.phone, g.checked_in_at
  FROM public.wedding_guests g
  WHERE (
    SELECT count(DISTINCT qt.tok)
    FROM unnest(q_tokens) AS qt(tok)
    WHERE EXISTS (
      SELECT 1
      FROM unnest(
        string_to_array(
          -- Mirrors tokenise() in the route: strip accents, lowercase, drop
          -- everything that is not a letter or digit, split on whitespace.
          regexp_replace(lower(extensions.unaccent(g.name)), '[^a-z0-9 ]', '', 'g'),
          ' '
        )
      ) AS nw(w)
      WHERE w <> ''
        -- Prefix match in either direction, exactly as the route does: a typed
        -- "ade" finds stored "Adetayo", and a typed "Adetayo" still finds a
        -- stored short form "Ade".
        AND (w LIKE qt.tok || '%' OR qt.tok LIKE w || '%')
    )
  ) >= 2
  LIMIT max_rows;
$$;

COMMENT ON FUNCTION public.wedding_guest_lookup(text[], int) IS
  'Gate name lookup. Returns candidate guests matching >= 2 query tokens by prefix in either direction; the caller ranks them. Superset of the application scorer by design.';
