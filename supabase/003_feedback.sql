-- ============================================================
-- 004 · In-game feedback / bug reports
-- ------------------------------------------------------------
-- A lightweight feedback box on the splash screen writes here.
-- Same trust model as goddi_runs: the anon (publishable) key can
-- INSERT only; nobody can read/update/delete from the client.
-- Read submissions from the Supabase dashboard table editor
-- (service role), where RLS does not apply.
--
-- Run once in the Supabase SQL editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.goddi_feedback (
  id          BIGSERIAL PRIMARY KEY,
  -- the message itself; capped so a bot can't dump megabytes
  message     TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  -- optional way to reach the player back (name / phone / email / FB) — free text
  contact     TEXT CHECK (contact IS NULL OR char_length(contact) <= 120),
  -- context auto-captured by the client to make reports actionable
  mission     TEXT,
  day         INTEGER,
  lang        TEXT,
  app_version TEXT,
  user_agent  TEXT,
  screen      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS goddi_feedback_created_idx
  ON public.goddi_feedback (created_at DESC);

-- Row-level security: anyone may insert, nobody may read/update/delete
-- via the anon key.
ALTER TABLE public.goddi_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS goddi_feedback_insert ON public.goddi_feedback;
CREATE POLICY goddi_feedback_insert
  ON public.goddi_feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- (No SELECT/UPDATE/DELETE policy => those are denied for anon.)
-- ============================================================
