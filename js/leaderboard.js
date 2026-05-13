/* ==========================================================
   Leaderboard — Supabase-backed
   Reads/writes the public.goddi_runs table via PostgREST.
   No SDK dependency — plain fetch().

   To enable, paste your anon key below. The URL is the existing
   SBYC Supabase project (or change it if you use a different one).
   ========================================================== */
(function () {
  'use strict';

  // ----- CONFIG -----
  const SUPABASE_URL      = 'https://kafvftjcvnvtklqwanrm.supabase.co';
  // Public "publishable" key — safe to expose; RLS policies on goddi_runs
  // enforce read/insert-only access from this key.
  const SUPABASE_ANON_KEY = 'sb_publishable_dOxFoPfs_kKu8H3zoZkVng_w7JlM5Es';
  // ------------------

  const TABLE = 'goddi_runs';

  function isConfigured() {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  function headers(extra) {
    return Object.assign({
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type':  'application/json'
    }, extra || {});
  }

  // Submit a run. Returns the inserted row (so we can highlight it in the
  // leaderboard view), or null on failure. Failure is non-fatal — the game
  // continues normally if Supabase is down or unconfigured.
  async function submit(run) {
    if (!isConfigured()) return null;
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/' + TABLE, {
        method:  'POST',
        headers: headers({ 'Prefer': 'return=representation' }),
        body:    JSON.stringify(run)
      });
      if (!res.ok) {
        console.warn('Leaderboard submit failed:', res.status, await res.text());
        return null;
      }
      const rows = await res.json();
      return Array.isArray(rows) ? rows[0] : rows;
    } catch (e) {
      console.warn('Leaderboard submit error:', e);
      return null;
    }
  }

  // Fetch top N runs by days, optional filter window.
  // window: 'all' | 'week' | 'day'
  async function topRuns(opts) {
    if (!isConfigured()) return [];
    opts = opts || {};
    const limit  = opts.limit || 10;
    const window_ = opts.window || 'all';

    let url = SUPABASE_URL + '/rest/v1/' + TABLE
            + '?select=*'
            + '&order=days.desc,created_at.desc'
            + '&limit=' + limit;

    if (window_ === 'week') {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      url += '&created_at=gte.' + encodeURIComponent(since);
    } else if (window_ === 'day') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      url += '&created_at=gte.' + encodeURIComponent(since);
    }

    try {
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) {
        console.warn('Leaderboard fetch failed:', res.status);
        return [];
      }
      return await res.json();
    } catch (e) {
      console.warn('Leaderboard fetch error:', e);
      return [];
    }
  }

  // Player's rank — how many runs have more days than the given one?
  // Returns 1-based rank or null if not configured / network error.
  async function rankFor(run) {
    if (!isConfigured() || !run) return null;
    try {
      // Count runs strictly better than this one
      const url = SUPABASE_URL + '/rest/v1/' + TABLE
                + '?select=id&days=gt.' + run.days;
      const res = await fetch(url, {
        headers: headers({ 'Prefer': 'count=exact' })
      });
      if (!res.ok) return null;
      // count is returned in Content-Range header as "0-9/total"
      const cr = res.headers.get('content-range') || '';
      const m = cr.match(/\/(\d+)$/);
      return m ? (parseInt(m[1], 10) + 1) : null;
    } catch (e) {
      return null;
    }
  }

  window.Leaderboard = {
    isConfigured: isConfigured,
    submit:       submit,
    topRuns:      topRuns,
    rankFor:      rankFor
  };
})();
