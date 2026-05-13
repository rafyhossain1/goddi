/* ==========================================================
   Goddi — Analytics (Supabase events)
   Fire-and-forget event logger. No PII, no fingerprinting,
   no cookies. Session ID is a UUIDv4 in sessionStorage that
   resets when the browser is closed.

   Public API:
     Analytics.track(eventType, payload?)
     Analytics.sessionId

   Events flow:
     game.js  →  Analytics.track('card_decision', {...})
                    ↓ fetch(keepalive: true)
                  Supabase /rest/v1/goddi_events
                    ↓ RLS-checked INSERT
                  Postgres row → /stats dashboard reads aggregates

   Disabled automatically on localhost / file:// so dev sessions
   don't pollute the production data.
   ========================================================== */
(function () {
  'use strict';

  // ----- CONFIG (mirrors leaderboard.js) -----
  const SUPABASE_URL = 'https://kafvftjcvnvtklqwanrm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_dOxFoPfs_kKu8H3zoZkVng_w7JlM5Es';
  // -------------------------------------------

  const ENDPOINT = SUPABASE_URL + '/rest/v1/goddi_events';
  const SESSION_KEY = 'goddi.session';

  // Keep this list in sync with the RLS CHECK constraint on goddi_events.
  // Any event whose type is not in this set is dropped silently — the API
  // would reject it anyway, but checking client-side saves a round-trip.
  const VALID_TYPES = new Set([
    'session_start',
    'screen_enter',
    'run_start',
    'run_end',
    'card_decision',
    'year_crossed',
    'achievement_unlock',
    'share_click',
    'cameo_click',
    'credits_click',
    'language_toggle'
  ]);

  // Auto-disable in dev so we don't muddy real data.
  const DISABLED = (
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '' ||
    location.protocol === 'file:'
  );

  // ---------- Session id ----------
  // crypto.randomUUID() is the right answer on modern browsers; we fall
  // back to a manual v4 for older Safari just in case.
  function uuidv4() {
    if (window.crypto && typeof crypto.randomUUID === 'function') {
      try { return crypto.randomUUID(); } catch (_) { /* fall through */ }
    }
    const b = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0'));
    return h.slice(0, 4).join('') + '-' +
           h.slice(4, 6).join('') + '-' +
           h.slice(6, 8).join('') + '-' +
           h.slice(8, 10).join('') + '-' +
           h.slice(10, 16).join('');
  }

  let _sid = null;
  function getSessionId() {
    if (_sid) return _sid;
    try {
      _sid = sessionStorage.getItem(SESSION_KEY);
      if (!_sid) {
        _sid = uuidv4();
        sessionStorage.setItem(SESSION_KEY, _sid);
      }
    } catch (_) {
      // sessionStorage disabled (private browsing on old iOS, etc).
      // Generate one per page-load — events still aggregate, sessions
      // just can't be chained.
      _sid = uuidv4();
    }
    return _sid;
  }

  // ---------- Send ----------
  function track(eventType, payload) {
    if (DISABLED) return;
    if (!VALID_TYPES.has(eventType)) return;

    const row = Object.assign({
      session_id: getSessionId(),
      event_type: eventType
    }, payload || {});

    // Strip null/undefined values so we send clean rows
    Object.keys(row).forEach(k => {
      if (row[k] === null || row[k] === undefined || row[k] === '') delete row[k];
    });

    try {
      // fetch(..., {keepalive:true}) is the modern sendBeacon replacement —
      // allows custom headers (apikey, Authorization) AND survives page unload.
      fetch(ENDPOINT, {
        method: 'POST',
        keepalive: true,
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal'
        },
        body: JSON.stringify(row)
      }).catch(() => { /* silent — analytics never break gameplay */ });
    } catch (_) { /* silent */ }
  }

  // Fire session_start automatically once per page load.
  function autoStart() { track('session_start'); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart);
  } else {
    autoStart();
  }

  window.Analytics = {
    track:     track,
    sessionId: getSessionId
  };
})();
