-- ============================================================
-- goddi_admin_stats(password) — single RPC the /stats dashboard calls.
--
-- Pattern: SECURITY DEFINER function that bypasses RLS to compute
-- aggregates, password-gated so the anon role can only read aggregates
-- (no raw event rows). Lighter than enabling Supabase Auth for solo admin.
--
-- To use:
--   1. CHANGE the password below before running.
--   2. Run this whole file in the Supabase SQL editor.
--   3. Paste the same password into the /stats dashboard when prompted.
--
-- To rotate the password later: re-run this file with a new value.
-- ============================================================

CREATE OR REPLACE FUNCTION public.goddi_admin_stats(p text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Dashboard password — the only thing protecting your /stats page.
  -- NEVER commit a real password here: this file ships in the repo. Set the
  -- real value directly in Supabase (edit the line below in the SQL editor,
  -- run it, then discard — do not push the real value back to git).
  -- To rotate: pick a new value, run the file in Supabase, update the
  -- /stats dashboard prompt to match.
  expected_password CONSTANT text := 'CHANGE_ME_IN_SUPABASE';

  result jsonb;
BEGIN
  IF p IS NULL OR p <> expected_password THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Compute every aggregate the dashboard might want in one trip.
  SELECT jsonb_build_object(

    -- ===== Headline counters =====
    'sessions_total',
      (SELECT COUNT(DISTINCT session_id) FROM goddi_events),
    'sessions_today',
      (SELECT COUNT(DISTINCT session_id) FROM goddi_events
        WHERE event_at >= CURRENT_DATE),
    'sessions_7d',
      (SELECT COUNT(DISTINCT session_id) FROM goddi_events
        WHERE event_at >= NOW() - INTERVAL '7 days'),

    'runs_started',
      (SELECT COUNT(*) FROM goddi_events WHERE event_type = 'run_start'),
    'runs_ended',
      (SELECT COUNT(*) FROM goddi_events WHERE event_type = 'run_end'),

    'runs_completed_total',
      (SELECT COUNT(*) FROM goddi_runs),
    'runs_completed_today',
      (SELECT COUNT(*) FROM goddi_runs WHERE created_at >= CURRENT_DATE),
    'runs_completed_7d',
      (SELECT COUNT(*) FROM goddi_runs WHERE created_at >= NOW() - INTERVAL '7 days'),

    'wins',
      (SELECT COUNT(*) FROM goddi_runs WHERE outcome = 'win'),
    'deaths',
      (SELECT COUNT(*) FROM goddi_runs WHERE outcome = 'death'),

    -- ===== Funnel: each step =====
    -- The screen_enter event is fired every time goto() runs, so even
    -- multiple visits within a session count once per visit.
    'funnel', (
      SELECT jsonb_object_agg(screen, ct)
      FROM (
        SELECT meta->>'screen' AS screen, COUNT(DISTINCT session_id)::int AS ct
        FROM goddi_events
        WHERE event_type = 'screen_enter'
        GROUP BY 1
      ) f
    ),

    -- ===== Background popularity =====
    'backgrounds', (
      SELECT jsonb_object_agg(background, ct)
      FROM (
        SELECT background, COUNT(DISTINCT session_id)::int AS ct
        FROM goddi_events
        WHERE event_type = 'run_start' AND background IS NOT NULL
        GROUP BY 1
      ) b
    ),

    -- ===== Party popularity =====
    'parties', (
      SELECT jsonb_object_agg(party, ct)
      FROM (
        SELECT party, COUNT(DISTINCT session_id)::int AS ct
        FROM goddi_events
        WHERE event_type = 'run_start' AND party IS NOT NULL
        GROUP BY 1
      ) p
    ),

    -- ===== Language split =====
    'languages', (
      SELECT jsonb_object_agg(language, ct)
      FROM (
        SELECT language, COUNT(DISTINCT session_id)::int AS ct
        FROM goddi_events
        WHERE event_type = 'session_start' AND language IS NOT NULL
        GROUP BY 1
      ) l
    ),

    -- ===== Top cards by appearance + decision split =====
    -- card_id, times_seen, left_pct, right_pct
    'cards', (
      SELECT jsonb_agg(row)
      FROM (
        SELECT jsonb_build_object(
          'card_id',  card_id,
          'total',    COUNT(*)::int,
          'left_pct', ROUND(100.0 *
                       COUNT(*) FILTER (WHERE decision = 'left')::numeric
                     / NULLIF(COUNT(*),0), 1),
          'right_pct', ROUND(100.0 *
                       COUNT(*) FILTER (WHERE decision = 'right')::numeric
                     / NULLIF(COUNT(*),0), 1)
        ) AS row
        FROM goddi_events
        WHERE event_type = 'card_decision' AND card_id IS NOT NULL
        GROUP BY card_id
        ORDER BY COUNT(*) DESC
        LIMIT 30
      ) c
    ),

    -- ===== Achievement unlock counts =====
    'achievements', (
      SELECT jsonb_object_agg(achievement_id, ct)
      FROM (
        SELECT achievement_id, COUNT(DISTINCT session_id)::int AS ct
        FROM goddi_events
        WHERE event_type = 'achievement_unlock' AND achievement_id IS NOT NULL
        GROUP BY 1
      ) a
    ),

    -- ===== Click metrics =====
    'share_clicks',   (SELECT COUNT(*) FROM goddi_events WHERE event_type = 'share_click'),
    'cameo_clicks',   (SELECT COUNT(*) FROM goddi_events WHERE event_type = 'cameo_click'),
    'credits_clicks', (SELECT COUNT(*) FROM goddi_events WHERE event_type = 'credits_click'),
    'language_toggles', (SELECT COUNT(*) FROM goddi_events WHERE event_type = 'language_toggle'),

    -- ===== Win tier distribution =====
    'win_tiers', (
      SELECT jsonb_object_agg(tier, ct)
      FROM (
        SELECT tier, COUNT(*)::int AS ct
        FROM goddi_runs
        WHERE outcome = 'win' AND tier IS NOT NULL
        GROUP BY 1
      ) wt
    ),

    -- ===== Death cause distribution =====
    'death_causes', (
      SELECT jsonb_object_agg(death_cause, ct)
      FROM (
        SELECT death_cause, COUNT(*)::int AS ct
        FROM goddi_runs
        WHERE outcome = 'death' AND death_cause IS NOT NULL
        GROUP BY 1
      ) dc
    ),

    -- ===== Daily session sparkline — last 30 days =====
    'daily_sessions_30d', (
      SELECT jsonb_agg(jsonb_build_object('d', d, 'c', c) ORDER BY d)
      FROM (
        SELECT (event_at::date)::text AS d,
               COUNT(DISTINCT session_id)::int AS c
        FROM goddi_events
        WHERE event_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY 1
      ) ds
    ),

    -- ===== Year reach — how many sessions made it past each year boundary =====
    -- year_crossed event records the new year value in meta->>'year'
    'year_reach', (
      SELECT jsonb_object_agg(year, ct)
      FROM (
        SELECT (meta->>'year') AS year,
               COUNT(DISTINCT session_id)::int AS ct
        FROM goddi_events
        WHERE event_type = 'year_crossed'
        GROUP BY 1
      ) yr
    ),

    -- ===== Prize entry aggregates =====
    -- All from goddi_prize_entries table. Phones are masked client-side
    -- to last-4 so the dashboard never exposes the full number.
    'prize_total_entries',
      (SELECT COALESCE(SUM(entries), 0)::int FROM goddi_prize_entries),
    'prize_unique_phones',
      (SELECT COUNT(DISTINCT phone)::int FROM goddi_prize_entries),
    'prize_entries_today',
      (SELECT COALESCE(SUM(entries), 0)::int FROM goddi_prize_entries
        WHERE created_at >= CURRENT_DATE),
    'prize_entries_7d',
      (SELECT COALESCE(SUM(entries), 0)::int FROM goddi_prize_entries
        WHERE created_at >= NOW() - INTERVAL '7 days'),

    -- Tier distribution — entries earned by tier
    'prize_by_tier', (
      SELECT jsonb_object_agg(tier, total)
      FROM (
        SELECT tier, COALESCE(SUM(entries), 0)::int AS total
        FROM goddi_prize_entries
        GROUP BY tier
      ) t
    ),

    -- Daily entries sparkline (last 30 days)
    'prize_daily_30d', (
      SELECT jsonb_agg(jsonb_build_object('d', d, 'e', e) ORDER BY d)
      FROM (
        SELECT (created_at::date)::text AS d,
               COALESCE(SUM(entries), 0)::int AS e
        FROM goddi_prize_entries
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY 1
      ) pd
    ),

    -- Recent 20 entries — name + masked phone + tier + entries + when
    'prize_recent', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name',         name,
          'phone_last4',  right(phone, 4),
          'phone_masked', '+' || repeat('*', greatest(length(phone) - 4, 0))
                          || right(phone, 4),
          'tier',         tier,
          'entries',      entries,
          'run_days',     run_days,
          'language',     language,
          'created_at',   created_at
        ) ORDER BY created_at DESC
      )
      FROM (
        SELECT * FROM goddi_prize_entries
        ORDER BY created_at DESC
        LIMIT 20
      ) pr
    ),

    'generated_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Anon can call the function; the password gate inside is the real lock.
GRANT EXECUTE ON FUNCTION public.goddi_admin_stats(text) TO anon;
