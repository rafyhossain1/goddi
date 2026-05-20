-- ============================================================
-- 002 · Add per-mission leaderboards
-- ------------------------------------------------------------
-- Goddi is an anthology: missions have different lengths
-- (Campaign = 1825 days, Survive Covid = 730). Ranking every
-- run by raw `days` in one pool let Campaign permanently
-- dominate Covid. This adds a `mission` column so each mission
-- gets its own leaderboard.
--
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- 1. Add the column. Existing rows default to 'campaign' (the only
--    mission that existed before Covid launched). NOT NULL so every
--    future insert must declare its mission.
ALTER TABLE public.goddi_runs
  ADD COLUMN IF NOT EXISTS mission TEXT NOT NULL DEFAULT 'campaign';

-- 2. Index matching the per-mission leaderboard query:
--    WHERE mission = $1 ORDER BY days DESC, created_at DESC LIMIT 10
CREATE INDEX IF NOT EXISTS goddi_runs_mission_days_idx
  ON public.goddi_runs (mission, days DESC, created_at DESC);

-- 3. (Optional) The old global days index is now redundant for the
--    leaderboard but harmless to keep; drop it only if you want to
--    slim the table:
-- DROP INDEX IF EXISTS goddi_runs_days_idx;

-- ------------------------------------------------------------
-- NOTE on existing data: any Covid test runs submitted before this
-- migration were stored without a mission and will be labelled
-- 'campaign' by the DEFAULT above. Pre-launch test data — clean up
-- manually if needed, e.g.:
--   DELETE FROM public.goddi_runs WHERE player_name IN ('Test','...');
-- ============================================================
