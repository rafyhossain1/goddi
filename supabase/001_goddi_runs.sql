-- Goddi leaderboard schema
-- Paste this into Supabase → SQL Editor → New Query → Run

-- 1. The table
CREATE TABLE IF NOT EXISTS public.goddi_runs (
  id            BIGSERIAL PRIMARY KEY,
  player_name   TEXT NOT NULL,
  party_id      TEXT NOT NULL,
  outcome       TEXT NOT NULL CHECK (outcome IN ('win', 'death')),
  tier          TEXT CHECK (tier IS NULL OR tier IN ('clean', 'standard', 'compromised')),
  death_cause   TEXT,
  days          INTEGER NOT NULL CHECK (days >= 0 AND days <= 1825),
  janata        INTEGER CHECK (janata BETWEEN 0 AND 100),
  dol           INTEGER CHECK (dol BETWEEN 0 AND 100),
  proshashon    INTEGER CHECK (proshashon BETWEEN 0 AND 100),
  tohobil       INTEGER CHECK (tohobil BETWEEN 0 AND 100),
  flags         TEXT[],
  lang          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for the leaderboard queries we expect
CREATE INDEX IF NOT EXISTS goddi_runs_days_idx
  ON public.goddi_runs (days DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS goddi_runs_created_idx
  ON public.goddi_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS goddi_runs_tier_days_idx
  ON public.goddi_runs (tier, days DESC) WHERE tier IS NOT NULL;

-- 3. Row-level security: anyone can read, anyone can insert (no auth needed),
--    nobody can update or delete from the client.
ALTER TABLE public.goddi_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goddi_runs_public_read"   ON public.goddi_runs;
DROP POLICY IF EXISTS "goddi_runs_public_insert" ON public.goddi_runs;

CREATE POLICY "goddi_runs_public_read"
  ON public.goddi_runs FOR SELECT
  USING (true);

CREATE POLICY "goddi_runs_public_insert"
  ON public.goddi_runs FOR INSERT
  WITH CHECK (
    -- Enforce sane bounds at the policy level too (belt + suspenders)
    days >= 0 AND days <= 1825
    AND length(player_name) BETWEEN 1 AND 40
    AND outcome IN ('win', 'death')
    AND (tier IS NULL OR tier IN ('clean', 'standard', 'compromised'))
    AND janata BETWEEN 0 AND 100
    AND dol BETWEEN 0 AND 100
    AND proshashon BETWEEN 0 AND 100
    AND tohobil BETWEEN 0 AND 100
  );

-- 4. (Optional) A simple leaderboard view for top runs
CREATE OR REPLACE VIEW public.goddi_top_runs AS
SELECT
  id,
  player_name,
  party_id,
  outcome,
  tier,
  death_cause,
  days,
  janata, dol, proshashon, tohobil,
  flags,
  lang,
  created_at
FROM public.goddi_runs
ORDER BY days DESC, created_at DESC
LIMIT 100;

-- 5. Grant access for the public-anon role
GRANT SELECT ON public.goddi_runs        TO anon;
GRANT INSERT ON public.goddi_runs        TO anon;
GRANT USAGE  ON SEQUENCE public.goddi_runs_id_seq TO anon;
GRANT SELECT ON public.goddi_top_runs    TO anon;
