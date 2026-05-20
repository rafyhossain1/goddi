/* ==========================================================
   Goddi · Service Worker
   Strategy:
     - App shell (HTML/CSS/JS/JSON/fonts/icons) — cache on install,
       update in background, fall back to cache when offline.
     - Supabase API (PostgREST), Cloudflare beacons, Turnstile —
       never cached, always go to network. Fail silently if offline.
     - Bump CACHE_VERSION whenever you ship breaking content/code
       changes; the old cache is purged on activate.
   ========================================================== */
const CACHE_VERSION = 'goddi-v7-2026-05-20';
const SHELL = [
  '/',
  '/index.html',
  '/rules.html',
  '/about.html',
  '/css/styles.css',
  '/js/viewport.js',
  '/js/i18n.js',
  '/js/swipe.js',
  '/js/audio.js',
  '/js/portraits.js',
  '/js/epilogue.js',
  '/js/sharecard.js',
  '/js/analytics.js',
  '/js/leaderboard.js',
  '/js/achievements.js',
  '/js/pwa.js',
  '/js/game.js',
  '/data/cards.json',
  '/data/cards-covid.json',
  '/data/missions.json',
  '/data/characters.json',
  '/data/parties.json',
  '/data/game_overs.json',
  '/data/sponsors.json',
  '/assets/favicon.svg',
  '/assets/apple-touch-icon.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/sbyc-logo.png',
  '/assets/ambient.mp3',
  '/manifest.json'
];

// ---- Install: prime the cache ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // addAll is atomic — if any file 404s the whole install fails.
      // Use individual put() so a missing optional file doesn't block install.
      return Promise.all(SHELL.map((url) =>
        fetch(url, { cache: 'reload' })
          .then((res) => res.ok ? cache.put(url, res) : null)
          .catch(() => null)
      ));
    }).then(() => self.skipWaiting())
  );
});

// ---- Activate: clean old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ---- Fetch: shell-first for same-origin, passthrough for everything else ----
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GETs. Everything else (POST to Supabase, etc.) → network.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Same-origin GETs (the app itself) — stale-while-revalidate.
  // Returns cached copy immediately if present, refreshes cache in background.
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // External: Google Fonts CSS/font files — cache-first (rarely change).
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Everything else (Supabase, Cloudflare, Turnstile, etc.) — network only.
  // Falls through to default browser handling.
});

// ---- Cache strategies ----
async function staleWhileRevalidate(req) {
  const cache  = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  // Return cache immediately if available; otherwise wait for network.
  return cached || fetchPromise || new Response('Offline', { status: 503 });
}

async function cacheFirst(req) {
  const cache  = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return new Response('Offline', { status: 503 });
  }
}

// ---- Listen for "skipWaiting" so the page can prompt-and-update ----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
