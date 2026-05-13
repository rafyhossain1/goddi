# Goddi · গদি

Reigns-style satirical card-swipe game about Dhaka ward politics. Soft-marketing for South Baridhara Youth Club (SBYC).

**Target deployment:** `godi.sbyc.cloud` (Netlify, static hosting)

---

## What's in the box

- Bilingual: English + বাংলা. Toggle persists across reloads.
- 4 stat bars: Janata (people) · Dol (party) · Proshashon (admin) · Tohobil (treasury). Die at 0 or 100 on any of them.
- 62 cards covering a 5-year tenure: 6 stub cards + 50 named-incident cards + 5 milestones + 7 multi-card arcs (PA scandal, tower collapse, Karim Miah callback, mosque/Imam, anti-corruption, SBYC, activist youth).
- Story flags. Choices set flags; later cards gate on them.
- Per-party dialogue variants (seeded; expand as needed).
- 3-tier win screens: **সততা / INTEGRITY** (zero dirty flags), **জয় / VICTORY** (mixed), **মূল্য / PRICE PAID** (corrupt survival).
- Cinematic multi-paragraph epilogue composed from the player's actual flag history.
- Active-arc stamps in the HUD (PA, Tower, Audit, Vote-buying, Defection).
- Stat-change preview during drag — see the +/− pips before you commit.
- Danger-zone pulse on any stat ≤20 or ≥80.
- Year-transition chapter cards (Year 2 মৌসুম, Year 3 উত্তাপ, Year 4 ঝড়, Year 5 সমাপ্তি).
- Web Audio synthesized SFX (stamp thud, paper slap, verdict sting), with mute toggle.

---

## Run it locally

```
cd goddi
python3 -m http.server 8765
# open http://localhost:8765/
```

(Or any static file server — there is no build step.)

---

## Test the engine

```
node tests/simulate.js
```

Runs 1000 Monte Carlo playthroughs across all parties + 200-run strategy batches (clean / dirty / balanced / smart-clean / human-like) + scripted arc traces + repetition-invariant check. Should report `No repetition violations detected.` and ~200/200 wins on smart-clean (all INTEGRITY tier).

---

## Structure

```
goddi/
  index.html          main entry, all screens in one document
  404.html            paper-themed not-found page
  netlify.toml        deploy config, security headers, cache rules
  robots.txt, sitemap.xml
  css/styles.css      paper/ink aesthetic, mobile-first
  js/i18n.js          language toggle + Bangla digit / date helpers
  js/audio.js         Web Audio synthesizer (Sfx module)
  js/portraits.js     archetype-glyph stamp renderer
  js/swipe.js         touch + mouse gesture engine
  js/epilogue.js      multi-paragraph end-of-run composer
  js/game.js          state machine, data loading, card logic, HUD
  data/cards.json     62 cards with full bilingual prose + flag/arc/year gating
  data/parties.json   4 party definitions with stat modifiers
  data/game_overs.json 8 death screens + 3 win tiers
  assets/favicon.svg  stamp seal with গ
  assets/og-image.svg apple-touch-icon.svg  (CONVERT TO PNG BEFORE DEPLOY)
  tests/simulate.js   Monte Carlo + invariant test harness
  tests/rewrite_dialog.js  one-off helper for batch dialogue updates
  docs/session2-outline.md content design doc for the 60-card pass
```

---

## Pre-deploy checklist

- [ ] Convert `assets/og-image.svg` → `og-image.png` (1200×630). Required for Facebook/WhatsApp/Twitter previews.
- [ ] Convert `assets/apple-touch-icon.svg` → `apple-touch-icon.png` (180×180). Required for iOS home-screen.
- [ ] `node tests/simulate.js` — should pass all invariants.
- [ ] Confirm DNS for `godi.sbyc.cloud` → Netlify.
- [ ] Push to GitHub; Netlify auto-deploys from main.

## Deploy

```
git add -A
git commit -m "..."
git push origin main
```
