-- ============================================================
-- 000 · Admin config (run ONCE, privately, in the Supabase SQL editor)
-- ------------------------------------------------------------
-- Holds the single admin password used by the /stats dashboard and the
-- prize-draw helper. Keeping it in a table (not in the .sql files) means
-- the RPC files ship in the PUBLIC repo with no secret, and you can
-- re-upload them as-is forever.
--
-- HOW TO USE:
--   1. Replace the placeholder value below with a FRESH secret.
--      (Do NOT reuse 'sbyc@1212' — that string was committed to the public
--       repo earlier and is considered compromised.)
--   2. Run this file in the Supabase SQL editor.
--   3. Do NOT commit your real secret back into this file — leave the
--      placeholder when you push.
--   4. Paste the SAME secret into the /stats login prompt.
--
-- To rotate later: just re-run this file with a new value.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.goddi_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Lock it down: enable RLS and define NO policies, so the anon/public role
-- has zero access. The SECURITY DEFINER functions (goddi_admin_stats and the
-- prize-draw helper) run as the table owner and bypass RLS to read it.
ALTER TABLE public.goddi_config ENABLE ROW LEVEL SECURITY;

-- >>> EDIT THIS VALUE IN SUPABASE ONLY — keep the placeholder in git <<<
INSERT INTO public.goddi_config (key, value)
VALUES ('admin_password', 'SET_A_FRESH_SECRET_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
-- ============================================================
