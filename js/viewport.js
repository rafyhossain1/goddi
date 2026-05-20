/* ==========================================================
   Goddi · Viewport height lock
   ----------------------------------------------------------
   Problem: in-app browsers (Messenger, Instagram, Facebook)
   and older iOS report 100vh as the *largest* possible
   viewport — ignoring their own top ("Done"/URL) and bottom
   toolbars. Anything sized to that height hides behind the
   chrome, clipping the top/bottom of the page.

   Fix: window.innerHeight reflects the actually-visible
   WebView area (the app's toolbars are native, not part of
   the web viewport), so we mirror it into the --app-height
   CSS variable. All full-height layout in styles.css sizes
   off --app-height instead of vh/inset:0.

   We deliberately use innerHeight (not visualViewport) as the
   primary source so the on-screen keyboard on the name screen
   doesn't shrink the whole layout.
   ========================================================== */
(function () {
  var docEl = document.documentElement;

  function setAppHeight() {
    var h = window.innerHeight;
    if (h) docEl.style.setProperty('--app-height', h + 'px');
  }

  // Measure immediately (the CSS 100dvh/100vh fallback covers the gap
  // before this script runs).
  setAppHeight();

  // Re-measure on the events that change the visible area. In-app
  // browsers frequently report a stale height on first paint and settle
  // a few hundred ms later, so we also re-measure after a short delay.
  window.addEventListener('resize', setAppHeight, { passive: true });
  window.addEventListener('orientationchange', function () {
    setAppHeight();
    setTimeout(setAppHeight, 300);
  });
  window.addEventListener('load', function () {
    setAppHeight();
    setTimeout(setAppHeight, 300);
  });
})();
