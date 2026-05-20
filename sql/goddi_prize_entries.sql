-- ============================================================
-- Goddi prize-lottery infrastructure
--
-- ENTRY RULES (matches the public /rules page):
--   clean win        → 2 entries
--   standard win     → 1 entry
--   compromised win  → 1 entry
--   anything else    → 0 entries (not eligible)
--   cap: 5 total entries per phone number
--
-- TABLES:
--   goddi_prize_entries        — one row per "earn entries" event
--
-- FUNCTIONS:
--   record_prize_entry()       — called by the game; idempotent-safe
--   goddi_draw_winner()        — admin-only weighted random pick
--
-- To deploy: paste this whole file into Supabase SQL editor and run.
-- Idempotent: safe to re-run if you tweak the rules.
-- ============================================================

CREATE TABLE IF NOT EXISTS goddi_prize_entries (
  id          BIGSERIAL PRIMARY KEY,
  phone       TEXT NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT,
  tier        TEXT NOT NULL CHECK (tier IN ('clean','standard','compromised')),
  entries     INT  NOT NULL CHECK (entries IN (1,2)),
  run_days    INT,
  language    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_ip   TEXT
);

CREATE INDEX IF NOT EXISTS goddi_prize_entries_phone   ON goddi_prize_entries (phone);
CREATE INDEX IF NOT EXISTS goddi_prize_entries_created ON goddi_prize_entries (created_at DESC);

-- Lock the table down. Anon never reads/updates/deletes; inserts go via RPC.
ALTER TABLE goddi_prize_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon can do nothing directly" ON goddi_prize_entries;
-- (deliberately no policies — anon has no direct access; RPC is the only way in)


-- ============================================================
-- record_prize_entry() — the only way anon writes to the entries table
-- ============================================================
-- Returns JSON: { ok: bool, entries_added: int, total_so_far: int, error?: text }
-- Anti-abuse: enforces the 5-entry cap, validates BD phone format,
-- and rejects payloads with bad tiers / inputs.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_prize_entry(
  p_phone     TEXT,
  p_name      TEXT,
  p_email     TEXT,
  p_tier      TEXT,
  p_run_days  INT DEFAULT NULL,
  p_language  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized_phone TEXT;
  v_entries          INT;
  v_existing_total   INT;
BEGIN
  -- Normalize phone to canonical 11-digit form (01XXXXXXXXX)
  -- Accept "01...", "+8801...", "8801..." with optional spaces/dashes
  v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  IF v_normalized_phone LIKE '880%' AND length(v_normalized_phone) = 13 THEN
    v_normalized_phone := '0' || substr(v_normalized_phone, 4);
  END IF;

  -- Must be 11 digits starting with 01
  IF v_normalized_phone !~ '^01[3-9][0-9]{8}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_phone');
  END IF;

  -- Tier check — clean gets 2 entries, standard and compromised get 1 each
  IF p_tier NOT IN ('clean','standard','compromised') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_tier');
  END IF;
  v_entries := CASE p_tier WHEN 'clean' THEN 2 ELSE 1 END;

  -- Name sanity
  IF p_name IS NULL OR length(trim(p_name)) BETWEEN 1 AND 40 IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_name');
  END IF;

  -- Email format (very loose, optional)
  IF p_email IS NOT NULL AND length(p_email) > 0 AND p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  -- Cap check: total entries so far on this phone
  SELECT COALESCE(SUM(entries), 0) INTO v_existing_total
    FROM goddi_prize_entries
   WHERE phone = v_normalized_phone;

  IF v_existing_total >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cap_reached',
                              'total_so_far', v_existing_total);
  END IF;

  -- Trim entries down so we don't blow past 5
  IF v_existing_total + v_entries > 5 THEN
    v_entries := 5 - v_existing_total;
  END IF;

  -- Anti-spam: same phone can't insert more than once every 5 seconds
  IF EXISTS (
    SELECT 1 FROM goddi_prize_entries
     WHERE phone = v_normalized_phone
       AND created_at > NOW() - INTERVAL '5 seconds'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_fast');
  END IF;

  -- Insert
  INSERT INTO goddi_prize_entries
    (phone, name, email, tier, entries, run_days, language)
  VALUES
    (v_normalized_phone, trim(p_name), nullif(trim(p_email),''),
     p_tier, v_entries, p_run_days, p_language);

  RETURN jsonb_build_object(
    'ok', true,
    'entries_added', v_entries,
    'total_so_far', v_existing_total + v_entries
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_prize_entry(TEXT,TEXT,TEXT,TEXT,INT,TEXT) TO anon;


-- ============================================================
-- goddi_draw_winner() — admin function to pick a weighted-random
-- winner across all entries in a date range. Same password gate
-- as goddi_admin_stats() so /stats can call it.
-- ============================================================
-- Returns one row: the winning entry (with phone redacted to last 4).
-- Re-roll: just call it again — it does NOT mark anyone as "won."
-- That's a manual step; the admin records the winner separately.
-- ============================================================
CREATE OR REPLACE FUNCTION public.goddi_draw_winner(
  p_password   TEXT,
  p_since      TIMESTAMPTZ DEFAULT NULL,
  p_until      TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Password read from goddi_config (set once via sql/000_config_setup.sql),
  -- NOT in this file — so it ships in the public repo with no secret. Uses
  -- the same 'admin_password' key as the stats RPC.
  expected_password TEXT;
  v_row             RECORD;
  v_total_entries   BIGINT;
  v_total_phones    BIGINT;
BEGIN
  SELECT value INTO expected_password FROM goddi_config WHERE key = 'admin_password';
  IF p_password IS NULL OR expected_password IS NULL OR p_password <> expected_password THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Aggregate stats for the draw
  SELECT
    COALESCE(SUM(entries), 0),
    COUNT(DISTINCT phone)
  INTO v_total_entries, v_total_phones
  FROM goddi_prize_entries
  WHERE (p_since IS NULL OR created_at >= p_since)
    AND (p_until IS NULL OR created_at <  p_until);

  IF v_total_entries = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_entries');
  END IF;

  -- Weighted random: pick a single row, weighted by the entries count.
  -- We expand by `generate_series(1, entries)` so a row with 2 entries
  -- has twice the odds. Then ORDER BY random() LIMIT 1.
  SELECT e.*, gs
    INTO v_row
    FROM goddi_prize_entries e
    CROSS JOIN LATERAL generate_series(1, e.entries) AS gs
   WHERE (p_since IS NULL OR e.created_at >= p_since)
     AND (p_until IS NULL OR e.created_at <  p_until)
   ORDER BY random()
   LIMIT 1;

  RETURN jsonb_build_object(
    'ok',            true,
    'winner_name',   v_row.name,
    'winner_phone_last4', right(v_row.phone, 4),
    'winner_email',  v_row.email,
    'winner_tier',   v_row.tier,
    'winner_entry_id', v_row.id,
    'pool_total_entries', v_total_entries,
    'pool_total_phones',  v_total_phones,
    'drawn_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.goddi_draw_winner(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
