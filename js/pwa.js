/* ==========================================================
   Goddi · PWA install + service-worker registration
   - Registers /sw.js on load (offline cache after first visit)
   - Captures the beforeinstallprompt event on Android Chrome/Edge
     and exposes window.PWA.install() so any UI can trigger the
     native install dialog at the right moment.
   - On iOS Safari (no beforeinstallprompt), exposes a flag so
     the UI can show a manual "tap share → Add to Home Screen" hint.
   - Fires the prompt at the right moment — namely, AFTER a player
     finishes their first run (better conversion than splash-screen
     pestering on day one).
   ========================================================== */
(function () {
  'use strict';

  // ---- Register the service worker ----
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((e) => {
        console.warn('[PWA] service worker registration failed:', e);
      });
    });
  }

  // ---- iOS detection (no beforeinstallprompt, needs manual hint) ----
  const ua = navigator.userAgent || '';
  const isIos = /iPhone|iPad|iPod/i.test(ua) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true;

  // ---- Capture the deferred install prompt (Android/desktop Chrome) ----
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  // ---- Public API ----
  window.PWA = {
    // True if the OS supports a native install prompt right now.
    canInstall() { return !!deferredPrompt; },

    // True if we should show a manual iOS instruction instead.
    needsIosHint() { return isIos && !isStandalone; },

    // True if the user is already in the installed app shell.
    isStandalone() { return isStandalone; },

    // Fire the native install dialog. Resolves to true if the user accepted.
    async install() {
      if (!deferredPrompt) return false;
      const e = deferredPrompt;
      deferredPrompt = null;
      e.prompt();
      try {
        const choice = await e.userChoice;
        return choice && choice.outcome === 'accepted';
      } catch (_) {
        return false;
      }
    },

    // Mark the user as "don't bug me again this session"
    suppressForSession() {
      try { sessionStorage.setItem('goddi.pwa.suppressed', '1'); } catch (_) {}
    },
    isSuppressed() {
      try { return sessionStorage.getItem('goddi.pwa.suppressed') === '1'; }
      catch (_) { return false; }
    }
  };

  // ---- Auto-prompt logic: after first completed run only ----
  // The game emits a custom event on its window when a verdict screen mounts.
  // We listen and show our prompt at that moment if conditions are right.
  function maybeShowPrompt() {
    if (PWA.isStandalone() || PWA.isSuppressed()) return;
    if (!PWA.canInstall() && !PWA.needsIosHint()) return;
    // Has this player been prompted before across sessions? Only ask once.
    try {
      if (localStorage.getItem('goddi.pwa.askedOnce') === '1') return;
      localStorage.setItem('goddi.pwa.askedOnce', '1');
    } catch (_) {}
    showInstallSheet();
  }

  // Hook into the verdict screen mount. We poll briefly because the verdict
  // is rendered by game.js and may show after this script loads.
  window.addEventListener('goddi:verdict', maybeShowPrompt);

  // ---- Install sheet UI (built here to avoid touching index.html bloat) ----
  function showInstallSheet() {
    const isIosFlow = PWA.needsIosHint() && !PWA.canInstall();
    const sheet = document.createElement('div');
    sheet.id = 'goddi-pwa-sheet';
    sheet.innerHTML = `
      <div class="goddi-pwa__backdrop"></div>
      <div class="goddi-pwa__card" role="dialog" aria-modal="true" aria-labelledby="goddi-pwa-title">
        <div class="goddi-pwa__icon">
          <img src="/assets/icon-192.png" alt="" width="60" height="60" />
        </div>
        <h3 id="goddi-pwa-title" class="goddi-pwa__title">
          <span data-lang-bn>গদি ফোনে রাখবেন?</span>
          <span data-lang-en>Keep Goddi on your phone?</span>
        </h3>
        <p class="goddi-pwa__body">
          <span data-lang-bn>একটি আইকন হোম-স্ক্রিনে। ইন্টারনেট ছাড়াও খেলা যায়। কোনো অ্যাপ স্টোর নেই।</span>
          <span data-lang-en>An icon on your home screen. Works offline. No app store.</span>
        </p>
        ${isIosFlow ? `
          <div class="goddi-pwa__ios-steps">
            <div class="goddi-pwa__ios-step">
              <span class="goddi-pwa__ios-num">1</span>
              <span data-lang-bn>নিচের <strong>শেয়ার</strong> বোতামে চাপুন</span>
              <span data-lang-en>Tap the <strong>Share</strong> button below</span>
            </div>
            <div class="goddi-pwa__ios-step">
              <span class="goddi-pwa__ios-num">2</span>
              <span data-lang-bn>"<strong>হোম স্ক্রিনে যোগ করুন</strong>" বেছে নিন</span>
              <span data-lang-en>Choose "<strong>Add to Home Screen</strong>"</span>
            </div>
          </div>
        ` : `
          <button class="goddi-pwa__primary" type="button" id="goddi-pwa-install">
            <span data-lang-bn>হোম-স্ক্রিনে যোগ করুন</span>
            <span data-lang-en>Add to Home Screen</span>
          </button>
        `}
        <button class="goddi-pwa__dismiss" type="button" id="goddi-pwa-dismiss">
          <span data-lang-bn>এখন না</span>
          <span data-lang-en>Not now</span>
        </button>
      </div>`;
    document.body.appendChild(sheet);

    const close = () => {
      PWA.suppressForSession();
      sheet.classList.add('goddi-pwa--closing');
      setTimeout(() => sheet.remove(), 200);
    };
    sheet.querySelector('.goddi-pwa__backdrop').addEventListener('click', close);
    sheet.querySelector('#goddi-pwa-dismiss').addEventListener('click', close);
    const install = sheet.querySelector('#goddi-pwa-install');
    if (install) {
      install.addEventListener('click', async () => {
        const ok = await PWA.install();
        if (ok && window.Analytics) Analytics.track('pwa_installed', {});
        close();
      });
    }
    if (window.Analytics) Analytics.track('pwa_prompt_shown', {
      meta: { platform: isIosFlow ? 'ios' : 'android' }
    });
  }
})();
