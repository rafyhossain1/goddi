/* ==========================================================
   Goddi — Main game loop (Phase 1)
   - Data loading (cards, parties, game-overs)
   - State machine
   - Screen routing
   - Card rendering + swipe wiring
   - Stat effects + game-over detection
   - Language-aware rendering
   ========================================================== */
(function () {
  'use strict';

  // ---------- Constants ----------
  // Inline SVG icons — unified filled-silhouette style, Bangladesh-grounded.
  // Designed to read at ~18px inside the seal ring.

  // জনতা — raised fist (solidarity / voter voice)
  const ICON_JANATA = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.5 18.5 H17.5 V22 H6.5 Z"/>
    <rect x="8.5" y="12" width="7" height="7"/>
    <path d="M7.5 7 Q7.5 3 11 3 L13.5 3 Q17 3 17 7 V12.5 H7.5 Z"/>
    <path d="M17 8.5 Q19 8.5 19 10 Q19 11.5 17 11.5 Z"/>
  </svg>`;

  // দল — rectangular flag with a circular disc cutout
  // (evokes Bangladesh flag geometry without naming a specific party)
  const ICON_DOL = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="5" y="3" width="1.8" height="18" rx="0.4"/>
    <path fill-rule="evenodd" d="M6.8 4 L19 4 L19 12 L6.8 12 Z M12.6 6 A2 2 0 1 1 12.6 10 A2 2 0 1 1 12.6 6 Z"/>
  </svg>`;

  // প্রশাসন — government cockade / medallion with ribbon tails
  // (evokes official seal / bureaucracy iconography)
  const ICON_PROSHASHON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8.5 13 L6.5 21.5 L9.6 19.3 L11.6 15.2 Z"/>
    <path d="M15.5 13 L17.5 21.5 L14.4 19.3 L12.4 15.2 Z"/>
    <path fill-rule="evenodd" d="M12 2 A6 6 0 1 1 12 14 A6 6 0 1 1 12 2 Z M12 5.2 A2.8 2.8 0 1 1 12 10.8 A2.8 2.8 0 1 1 12 5.2 Z"/>
    <circle cx="12" cy="8" r="1.1"/>
  </svg>`;

  // তহবিল — coin stamped with the taka (৳) symbol
  // (unmistakably Bangladeshi currency signifier)
  const ICON_TOHOBIL = `<svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9.2" fill="currentColor"/>
    <circle cx="12" cy="12" r="7.6" fill="none" stroke="#f1e9d6" stroke-width="0.6" stroke-opacity="0.55"/>
    <text x="12" y="12.6" font-size="13" font-weight="700"
          text-anchor="middle" dominant-baseline="central"
          fill="#f1e9d6"
          font-family="Hind Siliguri, 'Noto Sans Bengali', sans-serif">৳</text>
  </svg>`;

  const STATS = [
    { key: 'janata',     iconSvg: ICON_JANATA,     name_bn: 'জনতা',     name_en: 'People',   color: 'var(--stat-janata)' },
    { key: 'dol',        iconSvg: ICON_DOL,        name_bn: 'দল',       name_en: 'Party',    color: 'var(--stat-dol)' },
    { key: 'proshashon', iconSvg: ICON_PROSHASHON, name_bn: 'প্রশাসন',  name_en: 'Admin',    color: 'var(--stat-proshashon)' },
    { key: 'tohobil',    iconSvg: ICON_TOHOBIL,    name_bn: 'তহবিল',    name_en: 'Treasury', color: 'var(--stat-tohobil)' }
  ];

  // Map a stat that hit 0 or 100 to a death key in game_overs.json
  const DEATH_MAP = {
    janata:     { low: 'janata_low',     high: 'janata_high' },
    dol:        { low: 'dol_low',        high: 'dol_high' },
    proshashon: { low: 'proshashon_low', high: 'proshashon_high' },
    tohobil:    { low: 'tohobil_low',    high: 'tohobil_high' }
  };

  // ---------- State ----------
  const state = {
    data: { cards: [], parties: [], gameOvers: null, characters: {} },
    player: { name: '', party: null },
    stats: { janata: 50, dol: 50, proshashon: 50, tohobil: 50 },
    day: 0,
    year: 1,
    cardUseCounts: {},    // { cardId: numTimesShown }
    currentCard: null,
    inFlight: false, // true while a card is animating out
    seenFirstCard: false,
    // Session 2 additions:
    flags: [],            // Set-of-strings story flags (membership = "this happened")
    forceNextCardId: null,// If set, pickNextCard MUST return this card ID next
    // Session 4 — character intros: track which named characters the player
    // has already met so we only show the bio overlay on first appearance.
    introducedPortraits: {}
  };

  // How many times a given card may appear in a single run.
  // - oneshot:true → 1
  // - Anything with force_on_day or requires_flags → 1 (milestone / arc piece)
  // - Otherwise → 2 (recurring grievance)
  function maxUsesFor(card) {
    if (card.oneshot) return 1;
    if (typeof card.force_on_day === 'number') return 1;
    if (Array.isArray(card.requires_flags) && card.requires_flags.length) return 1;
    return 2;
  }
  function timesUsed(cardId) {
    return state.cardUseCounts[cardId] || 0;
  }

  // ---------- Data loading ----------
  async function loadData() {
    const [cards, parties, gameOvers, characters] = await Promise.all([
      fetch('/data/cards.json').then(r => r.json()),
      fetch('/data/parties.json').then(r => r.json()),
      fetch('/data/game_overs.json').then(r => r.json()),
      // Character bios are optional — if the file is missing we just skip intros
      fetch('/data/characters.json').then(r => r.ok ? r.json() : { characters: {} }).catch(() => ({ characters: {} }))
    ]);
    state.data.cards      = cards.cards;
    state.data.parties    = parties.parties;
    state.data.gameOvers  = gameOvers;
    state.data.characters = (characters && characters.characters) || {};
  }

  // ---------- Screen routing ----------
  function goto(screen) {
    document.body.setAttribute('data-screen', screen);
    // Background drone plays only on the gameplay screen. The verdict
    // screens (gameover / win) get silence — the absence is the cue.
    if (window.Sfx) {
      if (screen === 'play') Sfx.startAmbient();
      else                   Sfx.stopAmbient();
    }
  }

  // ---------- Splash ----------
  function wireSplash() {
    document.getElementById('btn-begin').addEventListener('click', () => {
      // First user gesture — unlock AudioContext (required by Chrome/iOS autoplay policy)
      if (window.Sfx) { Sfx.unlock(); Sfx.playClick(); }
      goto('name');
      // Autofocus the input after the screen swap settles
      setTimeout(() => document.getElementById('input-name').focus(), 50);
    });
  }

  // ---------- Mute toggle ----------
  function wireMuteToggle() {
    const btn = document.getElementById('mute-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!window.Sfx) return;
      // User explicitly wants sound: ensure context is unlocked on this gesture
      Sfx.unlock();
      Sfx.toggle();
      // Give quick audible feedback when unmuting
      if (!Sfx.isMuted()) Sfx.playClick();
    });
  }

  // ---------- Name entry ----------
  function wireNameEntry() {
    const input = document.getElementById('input-name');
    const err   = document.getElementById('name-error');
    const back  = document.getElementById('btn-name-back');
    const next  = document.getElementById('btn-name-next');

    function tryNext() {
      const v = (input.value || '').trim();
      if (v.length < 2) {
        err.hidden = false;
        err.textContent = I18n.lang === 'bn'
          ? 'কমপক্ষে ২ অক্ষরের নাম দিন।'
          : 'Name must be at least 2 characters.';
        return;
      }
      err.hidden = true;
      state.player.name = v;
      renderPartyGrid();
      goto('party');
    }

    back.addEventListener('click', () => { if (window.Sfx) Sfx.playClick(); goto('splash'); });
    next.addEventListener('click', () => { if (window.Sfx) Sfx.playClick(); tryNext(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { if (window.Sfx) Sfx.playClick(); tryNext(); }
    });
  }

  // ---------- Party select ----------
  function renderPartyGrid() {
    const grid = document.getElementById('party-grid');
    grid.innerHTML = '';
    state.data.parties.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'party-card';
      b.setAttribute('aria-pressed', 'false');
      b.dataset.partyId = p.id;
      b.style.setProperty('--party-color', p.color);

      const modsHtml = Object.entries(p.modifiers)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => {
          const stat = STATS.find(s => s.key === k);
          const cls = v > 0 ? 'party-card__mod--pos' : 'party-card__mod--neg';
          const label = I18n.lang === 'bn' ? stat.name_bn : stat.name_en;
          return `<span class="party-card__mod ${cls}">${label} ${v > 0 ? '+' : ''}${v}</span>`;
        })
        .join('');

      b.innerHTML = `
        <div class="party-card__bar"></div>
        <p class="party-card__name">${I18n.lang === 'bn' ? p.name_bn : p.name_en}</p>
        <p class="party-card__tag">${I18n.lang === 'bn' ? p.tagline_bn : p.tagline_en}</p>
        <div class="party-card__mods">${modsHtml}</div>
      `;
      b.addEventListener('click', () => selectParty(p.id));
      grid.appendChild(b);
    });
    document.getElementById('btn-party-confirm').disabled = true;
    state.player.party = null;
  }

  function selectParty(id) {
    state.player.party = id;
    document.querySelectorAll('.party-card').forEach(el => {
      el.setAttribute('aria-pressed', el.dataset.partyId === id ? 'true' : 'false');
    });
    document.getElementById('btn-party-confirm').disabled = false;
  }

  function wirePartySelect() {
    document.getElementById('btn-party-back').addEventListener('click', () => {
      if (window.Sfx) Sfx.playClick();
      goto('name');
    });
    document.getElementById('btn-party-confirm').addEventListener('click', () => {
      if (!state.player.party) return;
      if (window.Sfx) Sfx.playClick();
      startRun();
    });
  }

  // ---------- Start a run ----------
  function startRun() {
    const party = state.data.parties.find(p => p.id === state.player.party);
    // Seed stats at 50 + party modifier, clamped
    STATS.forEach(s => {
      const mod = party.modifiers[s.key] ?? 0;
      state.stats[s.key] = clamp(50 + mod, 1, 99); // never start at a lose condition
    });
    state.day = 0;
    state.year = 1;
    state.cardUseCounts = {};
    state.flags = [];
    state.forceNextCardId = null;
    state.introducedPortraits = {};
    state.seenFirstCard = false;
    state.leaderboardSubmitted = false;
    state.lastSubmittedRow = null;

    renderHud();
    renderStats();
    renderNextCard();
    goto('play');
  }

  // ---------- HUD ----------
  function renderHud() {
    const party = state.data.parties.find(p => p.id === state.player.party);
    const rosette = document.getElementById('hud-rosette');
    rosette.style.setProperty('--party-color', party.color);

    document.getElementById('hud-date').textContent = I18n.formatGameDate(state.day);
    document.getElementById('hud-year').textContent = I18n.formatYear(state.year);
    renderArcs();
  }

  // Active-arc stamps in the HUD. Each "arc" is a flag-state combination
  // implying an unresolved or ongoing storyline. The player accumulates
  // visible badges as their record builds — these are reminders, not
  // tooltips. Tap one to see its label.
  const ARC_DEFS = [
    { id: 'pa',     label_bn: 'পিএ',       label_en: 'PA',       glyph: '⚖', color: '#a6291f', when: f => f.includes('pa_protected') },
    { id: 'tower',  label_bn: 'টাওয়ার',   label_en: 'TOWER',    glyph: '▲', color: '#7a2a26', when: f => f.includes('tower_approved') },
    { id: 'audit',  label_bn: 'অডিট',     label_en: 'AUDIT',    glyph: '✦', color: '#2d4a7a', when: f => f.includes('taking_envelopes') },
    { id: 'vote',   label_bn: 'ভোট',      label_en: 'VOTES',    glyph: '✕', color: '#4a3c2a', when: f => f.includes('votebuying') },
    { id: 'switch', label_bn: 'দলবদল',    label_en: 'DEFECTED', glyph: '↺', color: '#6a1b9a', when: f => f.includes('defected') }
  ];
  function renderArcs() {
    const wrap = document.getElementById('hud-arcs');
    if (!wrap) return;
    wrap.innerHTML = '';
    const active = ARC_DEFS.filter(a => a.when(state.flags));
    active.forEach(a => {
      const el = document.createElement('span');
      el.className = 'hud__arc';
      el.style.setProperty('--arc-color', a.color);
      el.title = I18n.lang === 'bn' ? a.label_bn : a.label_en;
      el.textContent = a.glyph;
      wrap.appendChild(el);
    });
  }

  // ---------- Stat bars ----------
  // Stats in the danger zone (≤20 or ≥80) get a `stat--danger` class which
  // CSS turns into a slow ominous pulse on the seal. Subliminal pressure —
  // you can feel the run going off the rails without being told.
  const DANGER_LOW = 20;
  const DANGER_HIGH = 80;
  function renderStats() {
    const wrap = document.getElementById('stats');
    wrap.innerHTML = '';
    STATS.forEach(s => {
      const v = state.stats[s.key];
      const label = I18n.lang === 'bn' ? s.name_bn : s.name_en;
      const el = document.createElement('div');
      el.className = 'stat';
      if (v <= DANGER_LOW || v >= DANGER_HIGH) el.classList.add('stat--danger');
      el.dataset.key = s.key;
      el.style.setProperty('--stat-color', s.color);
      el.innerHTML = `
        <div class="stat__seal" aria-hidden="true">${s.iconSvg}</div>
        <div class="stat__bar" role="progressbar"
             aria-label="${s.name_en}" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100">
          <div class="stat__danger stat__danger--low"></div>
          <div class="stat__danger stat__danger--high"></div>
          <div class="stat__tick" style="left: 25%"></div>
          <div class="stat__tick" style="left: 50%"></div>
          <div class="stat__tick" style="left: 75%"></div>
          <div class="stat__fill" style="width: ${v}%;"></div>
        </div>
        <div class="stat__meta">
          <span class="stat__label">${label}</span>
          <span class="stat__value">${I18n.lang === 'bn' ? I18n.toBanglaDigits(v) : v}</span>
        </div>
      `;
      wrap.appendChild(el);
    });
  }

  // ---------- Delta animation ----------
  // Pops a floating "+15" / "-10" above a stat after a commit.
  function animateStatDelta(statKey, delta) {
    if (!delta) return;
    const statEl = document.querySelector(`.stat[data-key="${statKey}"]`);
    if (!statEl) return;
    const span = document.createElement('span');
    span.className = 'stat__delta ' + (delta > 0 ? 'stat__delta--pos' : 'stat__delta--neg');
    const prefix = delta > 0 ? '+' : '−';
    const nStr = I18n.lang === 'bn' ? I18n.toBanglaDigits(Math.abs(delta)) : Math.abs(delta);
    span.textContent = prefix + nStr;
    statEl.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  }

  // ---------- Card eligibility gate ----------
  // Returns true if `card` may legally be drawn under the current state.
  // All checks are AND-ed; missing fields are treated as "no constraint".
  function isCardEligible(card) {
    if (timesUsed(card.id) >= maxUsesFor(card)) return false;

    // Year window
    if (typeof card.min_year === 'number' && state.year < card.min_year) return false;
    if (typeof card.max_year === 'number' && state.year > card.max_year) return false;

    // Day window (rare; mostly used by milestones via force_on_day)
    if (typeof card.min_day === 'number' && state.day < card.min_day) return false;
    if (typeof card.max_day === 'number' && state.day > card.max_day) return false;

    // Party gating
    if (Array.isArray(card.party_only) && card.party_only.length
        && !card.party_only.includes(state.player.party)) return false;
    if (Array.isArray(card.not_party) && card.not_party.includes(state.player.party)) return false;

    // Flag gating — ALL of requires_flags must be set, NONE of blocked_by_flags
    if (Array.isArray(card.requires_flags)
        && !card.requires_flags.every(f => state.flags.includes(f))) return false;
    if (Array.isArray(card.blocked_by_flags)
        && card.blocked_by_flags.some(f => state.flags.includes(f))) return false;

    // Stat thresholds — { stat: { lt|lte|gt|gte|eq: number } }
    if (card.stat_requires && typeof card.stat_requires === 'object') {
      for (const [stat, cond] of Object.entries(card.stat_requires)) {
        if (!(stat in state.stats)) continue;
        const v = state.stats[stat];
        if (typeof cond.lt  === 'number' && !(v <  cond.lt))  return false;
        if (typeof cond.lte === 'number' && !(v <= cond.lte)) return false;
        if (typeof cond.gt  === 'number' && !(v >  cond.gt))  return false;
        if (typeof cond.gte === 'number' && !(v >= cond.gte)) return false;
        if (typeof cond.eq  === 'number' && !(v === cond.eq)) return false;
      }
    }

    return true;
  }

  // Weighted random pick over an eligible pool.
  function weightedPick(pool) {
    const weights = pool.map(c => Math.max(0, c.weight ?? 1));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  // ---------- Card pool / picker ----------
  // Picking order:
  //   1. forceNextCardId (set by previous choice's `next_card`) — strict arc continuation
  //   2. Any card with force_on_day <= current day (milestone events fire on time)
  //   3. Random weighted pick from eligible pool
  //   4. Last-resort fallback (deck exhausted): replay any non-arc, non-milestone card
  function pickNextCard() {
    // 1. Forced next card (arc continuation)
    if (state.forceNextCardId) {
      const forced = state.data.cards.find(c => c.id === state.forceNextCardId);
      state.forceNextCardId = null;
      if (forced && timesUsed(forced.id) < maxUsesFor(forced)) return forced;
    }

    // 2. Milestone (force_on_day) — fires on or after its scheduled day
    const dueMilestones = state.data.cards.filter(c =>
      typeof c.force_on_day === 'number'
      && state.day >= c.force_on_day
      && timesUsed(c.id) < maxUsesFor(c)
      && isCardEligibleForMilestone(c)
    );
    if (dueMilestones.length) {
      // Earliest-scheduled first; tie-break by id
      dueMilestones.sort((a, b) => a.force_on_day - b.force_on_day || a.id.localeCompare(b.id));
      return dueMilestones[0];
    }

    // 3. Eligible pool, weighted random
    const pool = state.data.cards.filter(c => !c.force_on_day && isCardEligible(c));
    if (pool.length) return weightedPick(pool);

    // 4. Pool exhausted (no eligible cards have remaining uses).
    //    With per-card use limits there is no longer a "recycle" path —
    //    cards naturally retire once they hit their max. Return null and
    //    let the caller decide (likely a graceful end-of-tenure).
    return null;
  }

  // Milestones use a slimmer eligibility check than regular cards — they
  // ignore *stat* thresholds and year windows (so Eid still arrives even if
  // you're broke), but they DO honor requires_flags / blocked_by_flags so
  // arc-consequence milestones like A18 (tower collapse, requires tower_approved)
  // and A40 (2nd tower collapse) only fire when the player has taken the
  // upstream branch that earns them.
  function isCardEligibleForMilestone(card) {
    if (timesUsed(card.id) >= maxUsesFor(card)) return false;
    if (Array.isArray(card.party_only) && card.party_only.length
        && !card.party_only.includes(state.player.party)) return false;
    if (Array.isArray(card.not_party) && card.not_party.includes(state.player.party)) return false;
    if (Array.isArray(card.requires_flags)
        && !card.requires_flags.every(f => state.flags.includes(f))) return false;
    if (Array.isArray(card.blocked_by_flags)
        && card.blocked_by_flags.some(f => state.flags.includes(f))) return false;
    return true;
  }

  // Resolve dialog text for the current card, honoring per-party variants.
  // dialog_variants: { "<party_id>": { dialog_bn, dialog_en } }
  function resolveDialog(card) {
    const variant = card.dialog_variants && card.dialog_variants[state.player.party];
    const bn = (variant && variant.dialog_bn) || card.dialog_bn;
    const en = (variant && variant.dialog_en) || card.dialog_en;
    return I18n.lang === 'bn' ? bn : en;
  }

  // ---------- Card render ----------
  function renderNextCard() {
    const card = pickNextCard();
    // If the deck is genuinely exhausted (shouldn't happen in a normal run,
    // but guards against running off the end if the player blew through every
    // card type quickly), end the run gracefully as a survival-win.
    if (!card) {
      setTimeout(() => showWin(), 350);
      return;
    }
    state.currentCard = card;
    renderCard(card);
  }

  // Re-render the current card without picking a new one. Used by the
  // language toggle so flipping bn↔en mid-play doesn't accidentally swap
  // the card on screen for a different one.
  function redrawCurrentCard() {
    if (state.currentCard) renderCard(state.currentCard);
  }

  // Pure render — paints the given card into the stage. Separated from
  // renderNextCard so we can redraw on language change without re-picking.
  // If this card features a named character the player hasn't met yet,
  // show a character-intro overlay first, then paint the card.
  function renderCard(card) {
    const bio = state.data.characters && state.data.characters[card.portrait_id];
    if (bio && !state.introducedPortraits[card.portrait_id]) {
      state.introducedPortraits[card.portrait_id] = true;
      showCharacterIntro(card, bio, () => renderCardInner(card));
      return;
    }
    renderCardInner(card);
  }

  // ---- Reusable card-content builders ----
  // The inner HTML for an active card (portrait + dialog + choices + stamps).
  // Used by both renderCardInner (first card of a run) and the flip transition
  // (pre-renders the next card's content into the ghost's front face).
  function buildCardInnerHtml(card) {
    const nameBn = card.character_name_bn, nameEn = card.character_name_en;
    const roleBn = card.character_role_bn, roleEn = card.character_role_en;
    const lLabelBn = card.left.label_bn,   lLabelEn = card.left.label_en;
    const rLabelBn = card.right.label_bn,  rLabelEn = card.right.label_en;
    return `
      <div class="goddi-card__portrait">
        ${Portraits.render(card.portrait_id, I18n.lang === 'bn' ? nameBn : nameEn)}
        <p class="goddi-card__character">${I18n.lang === 'bn' ? nameBn : nameEn}</p>
        <p class="goddi-card__role">${I18n.lang === 'bn' ? roleBn : roleEn}</p>
      </div>
      <div class="goddi-card__dialog">${resolveDialog(card)}</div>
      <div class="goddi-card__choices">
        <div class="goddi-card__choice goddi-card__choice--left">${I18n.lang === 'bn' ? lLabelBn : lLabelEn}</div>
        <div class="goddi-card__choice goddi-card__choice--right">${I18n.lang === 'bn' ? rLabelBn : rLabelEn}</div>
      </div>
      <div class="goddi-card__stamp goddi-card__stamp--left">${I18n.lang === 'bn' ? lLabelBn : lLabelEn}</div>
      <div class="goddi-card__stamp goddi-card__stamp--right">${I18n.lang === 'bn' ? rLabelBn : rLabelEn}</div>
    `;
  }

  // The deck-design card back. Used as the front of the back-face of every
  // ghost card so the player sees a consistent deck identity. The .card-back
  // wrapper carries the flex centering rules; the card-face above it just
  // provides the paper surface + border.
  function buildCardBackHtml() {
    return `
      <div class="card-back">
        <span class="card-back__corner card-back__corner--tl">১৪৩৩</span>
        <span class="card-back__corner card-back__corner--br">WARD 37</span>
        <svg class="card-back__seal" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="36" fill="none" stroke="#a6291f" stroke-width="2.5"/>
          <circle cx="50" cy="50" r="28" fill="none" stroke="#a6291f" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.75"/>
          <text x="50" y="64" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="36" fill="#a6291f">গ</text>
        </svg>
        <p class="card-back__brand">GODDI · গদি</p>
      </div>
    `;
  }

  // Ghost card markup: a 3D flipper containing two faces.
  // - .card-face--back: the deck-design, visible initially
  // - .card-face--front: empty placeholder; will be populated with the next
  //   card's content at commit time, just before the flip animation starts.
  function buildGhostInnerHtml() {
    return `
      <div class="card-flipper">
        <div class="card-face card-face--back">${buildCardBackHtml()}</div>
        <div class="card-face card-face--front"><!-- next card injected here at commit --></div>
      </div>
    `;
  }

  function bindActiveSwipe(el, card) {
    Swipe.bind(el, {
      onCommit:   (side) => commitChoice(card, side),
      onDragSide: (side) => previewChoice(card, side)
    });
  }

  function renderCardInner(card) {
    const stage = document.getElementById('card-stage');
    stage.innerHTML = '';

    // Ghost behind active — shows deck-back face initially (flipper at 180°)
    const ghost = document.createElement('div');
    ghost.className = 'goddi-card goddi-card--ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.innerHTML = buildGhostInnerHtml();
    stage.appendChild(ghost);

    // Active card — only the first-render path uses card-enter (fade-in).
    // Post-flip cards (created by finalizeFlipTransition) skip this so they
    // don't go partially transparent and let the ghost behind bleed through.
    const el = document.createElement('div');
    el.className = 'goddi-card goddi-card--entering';
    if (!state.seenFirstCard) el.classList.add('goddi-card--wiggle');
    el.innerHTML = buildCardInnerHtml(card);
    stage.appendChild(el);

    bindActiveSwipe(el, card);

    if (state.seenFirstCard) {
      document.getElementById('swipe-hint').classList.add('hidden');
    }
  }

  // After the flip animation completes, replace the (rotated) ghost with a
  // clean active card and insert a fresh ghost behind. Visually invisible
  // because the flip ended with the front face fully visible at the active
  // position — the swap is structural, not animated.
  function finalizeFlipTransition(card) {
    const stage = document.getElementById('card-stage');
    if (!stage) return;
    const flipped = stage.querySelector('.goddi-card--flipping');
    if (!flipped) {
      // Lost track of the flipper — fall back to a full re-render
      renderCardInner(card);
      return;
    }

    // Remove the old active card that flew off (still in DOM via swipe css)
    stage.querySelectorAll('.goddi-card--commit-left, .goddi-card--commit-right').forEach(n => n.remove());

    // Build the new active card (no flipper — just card content)
    const newActive = document.createElement('div');
    newActive.className = 'goddi-card';
    newActive.innerHTML = buildCardInnerHtml(card);

    // Build the new ghost behind (will animate in via ghost-enter)
    const newGhost = document.createElement('div');
    newGhost.className = 'goddi-card goddi-card--ghost';
    newGhost.setAttribute('aria-hidden', 'true');
    newGhost.innerHTML = buildGhostInnerHtml();

    // Replace the flipped ghost with the new active, and insert new ghost behind
    stage.replaceChild(newActive, flipped);
    stage.insertBefore(newGhost, newActive);

    bindActiveSwipe(newActive, card);
    state.currentCard = card;
    document.getElementById('swipe-hint').classList.add('hidden');
  }

  // While the player is dragging, glow the stats that this side would touch
  // — green for positive, red for negative. No numbers shown. The player
  // sees direction-of-impact, not magnitude, which keeps the satirical
  // feel: you can read the dialogue but you have to trust your instinct.
  function previewChoice(card, side) {
    document.querySelectorAll('.stat').forEach(el => {
      el.classList.remove('stat--preview-pos', 'stat--preview-neg', 'stat--preview-touched');
    });
    if (!side) return;
    const effects = (card[side] && card[side].effects) || {};
    for (const [key, delta] of Object.entries(effects)) {
      const el = document.querySelector(`.stat[data-key="${key}"]`);
      if (!el || !delta) continue;
      el.classList.add('stat--preview-touched');
      el.classList.add(delta > 0 ? 'stat--preview-pos' : 'stat--preview-neg');
    }
  }

  // ---------- Commit a choice ----------
  function commitChoice(card, side) {
    if (state.inFlight) return;
    state.inFlight = true;
    state.seenFirstCard = true;

    // Stamp thud — fires the moment the player commits, in sync with
    // the card flying off and the choice resolving.
    if (window.Sfx) Sfx.playStamp(side);

    const choice = card[side];
    // Apply stat effects
    const effects = choice.effects || {};
    Object.entries(effects).forEach(([stat, delta]) => {
      if (!(stat in state.stats)) return;
      state.stats[stat] = clamp(state.stats[stat] + delta, 0, 100);
    });

    // Apply story flags — set / clear
    if (Array.isArray(choice.triggers)) {
      choice.triggers.forEach(f => {
        if (!state.flags.includes(f)) state.flags.push(f);
      });
    }
    if (Array.isArray(choice.untriggers)) {
      state.flags = state.flags.filter(f => !choice.untriggers.includes(f));
    }

    // Arc continuation — queue a forced next card if specified
    if (typeof choice.next_card === 'string' && choice.next_card.length) {
      state.forceNextCardId = choice.next_card;
    }

    state.cardUseCounts[card.id] = (state.cardUseCounts[card.id] || 0) + 1;

    // Advance time: 21-29 days per card.
    // With ~79 total card-uses (oneshot=1, recurring=2) across the deck,
    // this pacing puts the natural deck-exhaustion point right around the
    // 1825-day win threshold instead of well before it.
    const yearBefore = state.year;
    state.day += 21 + Math.floor(Math.random() * 9);
    state.year = Math.min(5, Math.ceil((state.day || 1) / 365));
    const yearCrossed = state.year > yearBefore;

    renderHud();
    renderStats();

    // Float "+15" / "−10" over each affected stat
    Object.entries(effects).forEach(([stat, delta]) => {
      if (!(stat in state.stats)) return;
      animateStatDelta(stat, delta);
    });

    // Check for game over
    const death = detectDeath();
    if (death) {
      setTimeout(() => showGameOver(death), 350);
      return;
    }

    // Phase 1 win placeholder: survive past ~5 years (~60 cards ≈ 1500 days)
    if (state.day >= 1825) {
      setTimeout(() => showWin(), 350);
      return;
    }

    // Pre-pick the next card NOW so we can inject its content into the
    // ghost's front face and run the 3D flip during the active card's fly-off.
    // The flip's back→front transition naturally hides the content swap.
    const nextCard = pickNextCard();
    if (!nextCard) {
      // Deck exhausted — treat as a graceful survival win
      setTimeout(() => showWin(), 350);
      return;
    }

    const stage = document.getElementById('card-stage');
    const ghost = stage && stage.querySelector('.goddi-card--ghost');
    if (ghost) {
      const front = ghost.querySelector('.card-face--front');
      if (front) front.innerHTML = buildCardInnerHtml(nextCard);
      // Trigger the flip + slide-to-center on the ghost
      ghost.classList.add('goddi-card--flipping');
    }

    setTimeout(() => {
      state.inFlight = false;
      function finish() { finalizeFlipTransition(nextCard); }
      function maybeShowIntroThenFinish() {
        const bio = state.data.characters && state.data.characters[nextCard.portrait_id];
        if (bio && !state.introducedPortraits[nextCard.portrait_id]) {
          state.introducedPortraits[nextCard.portrait_id] = true;
          showCharacterIntro(nextCard, bio, finish);
        } else {
          finish();
        }
      }
      if (yearCrossed) {
        showYearTransition(state.year, maybeShowIntroThenFinish);
      } else {
        maybeShowIntroThenFinish();
      }
    }, 460);
  }

  // ---------- Year transition (chapter card) ----------
  // Year-themed chapter card that interrupts the deck on year roll-over.
  // Echoes the splash's stamp aesthetic; auto-dismisses after ~2.6s but the
  // player can tap to advance early.
  const YEAR_THEMES = {
    2: { bn: 'মৌসুম',   en: 'MONSOON',   sub_bn: 'প্রথম পরীক্ষা',       sub_en: 'The first test' },
    3: { bn: 'উত্তাপ', en: 'HEAT',      sub_bn: 'মধ্যাহ্নের সূর্য',    sub_en: 'The midday sun' },
    4: { bn: 'ঝড়',     en: 'STORM',     sub_bn: 'ভোটের ঢেউ',              sub_en: 'The vote rises' },
    5: { bn: 'সমাপ্তি', en: 'RECKONING', sub_bn: 'শেষ সিদ্ধান্ত',          sub_en: 'The last decision' }
  };
  // Character-intro overlay — shows portrait + name + role + bio when a
  // named character first appears in a run. Tap to dismiss → run the
  // pending `done` callback (the actual card render).
  function showCharacterIntro(card, bio, done) {
    const portraitSvg = Portraits.render(card.portrait_id, card.character_name_en);
    const overlay = document.createElement('div');
    overlay.className = 'char-intro';
    overlay.innerHTML = `
      <div class="char-intro__card">
        <p class="char-intro__eyebrow">
          <span data-lang-bn>চরিত্র পরিচয়</span>
          <span data-lang-en>NEW CHARACTER</span>
        </p>
        <div class="char-intro__portrait">${portraitSvg}</div>
        <h2 class="char-intro__name">
          <span data-lang-bn>${bio.name_bn}</span>
          <span data-lang-en>${bio.name_en}</span>
        </h2>
        <p class="char-intro__role">
          <span data-lang-bn>${bio.role_bn}</span>
          <span data-lang-en>${bio.role_en}</span>
        </p>
        <p class="char-intro__bio">
          <span data-lang-bn>${bio.bio_bn}</span>
          <span data-lang-en>${bio.bio_en}</span>
        </p>
        <p class="char-intro__cta">
          <span data-lang-bn>আগে বাড়ুন →</span>
          <span data-lang-en>Continue →</span>
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('char-intro--shown'));
    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      overlay.classList.add('char-intro--leaving');
      setTimeout(() => { overlay.remove(); done(); }, 280);
    }
    overlay.addEventListener('click', dismiss);
  }

  function showYearTransition(year, done) {
    const theme = YEAR_THEMES[year];
    if (!theme) { done(); return; }
    const yearLabel = I18n.lang === 'bn'
      ? 'বছর ' + I18n.toBanglaDigits(year)
      : 'YEAR ' + year;
    const overlay = document.createElement('div');
    overlay.className = 'year-transition';
    overlay.innerHTML = `
      <div class="year-transition__card">
        <p class="year-transition__year">${yearLabel}</p>
        <h2 class="year-transition__title">
          <span data-lang-bn>${theme.bn}</span>
          <span data-lang-en>${theme.en}</span>
        </h2>
        <p class="year-transition__sub">
          <span data-lang-bn>${theme.sub_bn}</span>
          <span data-lang-en>${theme.sub_en}</span>
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    // animate in
    requestAnimationFrame(() => overlay.classList.add('year-transition--shown'));
    // Allow tap-to-skip; otherwise auto-dismiss after the dwell
    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      overlay.classList.add('year-transition--leaving');
      setTimeout(() => { overlay.remove(); done(); }, 320);
    }
    overlay.addEventListener('click', dismiss);
    setTimeout(dismiss, 2600);
  }

  // ---------- Death detection ----------
  function detectDeath() {
    for (const s of STATS) {
      const v = state.stats[s.key];
      if (v <= 0)  return { stat: s.key, key: DEATH_MAP[s.key].low };
      if (v >= 100) return { stat: s.key, key: DEATH_MAP[s.key].high };
    }
    return null;
  }

  // ---------- Game over screen ----------
  function showGameOver(death) {
    state.lastVerdict = { outcome: 'death', cause: death.key };
    const deathData = state.data.gameOvers.deaths[death.key];
    document.getElementById('verdict-headline').textContent =
      I18n.lang === 'bn' ? deathData.headline_bn : deathData.headline_en;

    // Compose a multi-paragraph epilogue: existing one-liner + death coda +
    // 1-2 flag-driven consequence lines.
    const baseBody = I18n.lang === 'bn' ? deathData.body_bn : deathData.body_en;
    const paragraphs = window.Epilogue
      ? Epilogue.composeDeath(death.key, baseBody, state.flags, I18n.lang)
      : [baseBody];
    document.getElementById('verdict-body').innerHTML = Epilogue
      ? Epilogue.paragraphsToHtml(paragraphs)
      : '<p>' + baseBody + '</p>';
    document.getElementById('verdict-days').textContent = I18n.formatDays(state.day);

    renderFinalStats('verdict-final-stats');
    goto('gameover');
    if (window.Sfx) Sfx.playVerdict('loss');
    submitToLeaderboard();
  }

  // ---------- Win tier ----------
  // Decide which win screen to show based on accumulated story flags.
  // "Dirty" flags are the corrupt-pragmatic choices the player made along
  // the way. 0 = clean; 1–2 = standard; 3+ = compromised.
  const DIRTY_FLAGS = [
    'taking_envelopes',
    'tower_approved',
    'tower_collapsed',
    'tower2_approved',
    'tower2_collapsed',
    'tower_blamed_contractor',
    'acc_stonewalled',
    'votebuying',
    'ec_bribed',
    'defected',
    'corrupt_retirement',
    'pa_protected',
    'pa_betrayed'
  ];
  function computeWinTier() {
    const dirty = state.flags.filter(f => DIRTY_FLAGS.includes(f)).length;
    if (dirty === 0) return 'clean';
    if (dirty <= 2) return 'standard';
    return 'compromised';
  }

  // ---------- Win screen ----------
  function showWin() {
    // Back-compat: support either { wins: { tier: ... } } or legacy { win: ... }
    const tier = computeWinTier();
    state.lastVerdict = { outcome: 'win', tier: tier };
    const win = (state.data.gameOvers.wins && state.data.gameOvers.wins[tier])
             || state.data.gameOvers.win;

    document.getElementById('win-headline').textContent =
      I18n.lang === 'bn' ? win.headline_bn : win.headline_en;

    // Multi-paragraph epilogue: tier-specific opener + 2-3 flag-driven lines
    // + tier-specific closer. The static body in game_overs.json is unused
    // when Epilogue is available; we keep it as a fallback for safety.
    const fallbackBody = I18n.lang === 'bn' ? win.body_bn : win.body_en;
    const paragraphs = window.Epilogue
      ? Epilogue.composeWin(tier, state.flags, I18n.lang)
      : [fallbackBody];
    document.getElementById('win-body').innerHTML = Epilogue
      ? Epilogue.paragraphsToHtml(paragraphs)
      : '<p>' + fallbackBody + '</p>';
    document.getElementById('win-days').textContent = I18n.formatDays(state.day);

    // Apply the tier as a body attribute so CSS can theme the verdict stamp.
    document.body.setAttribute('data-win-tier', tier);

    // Tier-specific stamp word (clean/standard/compromised).
    const stampLabels = {
      clean:       { bn: 'সততা',  en: 'INTEGRITY' },
      standard:    { bn: 'জয়',    en: 'VICTORY'   },
      compromised: { bn: 'মূল্য', en: 'PRICE PAID' }
    };
    const sl = stampLabels[tier] || stampLabels.standard;
    const stampEl = document.getElementById('win-stamp');
    if (stampEl) stampEl.textContent = I18n.lang === 'bn' ? sl.bn : sl.en;

    renderFinalStats('win-final-stats');
    goto('win');
    if (window.Sfx) Sfx.playVerdict('win');
    submitToLeaderboard();
  }

  function renderFinalStats(containerId) {
    const wrap = document.getElementById(containerId);
    wrap.innerHTML = STATS.map(s => `
      <div class="verdict__final-stat">
        <span class="verdict__final-stat-value">${state.stats[s.key]}</span>
        <span>${I18n.lang === 'bn' ? s.name_bn : s.name_en}</span>
      </div>
    `).join('');
  }

  // ---------- Restart ----------
  function wireRestart() {
    ['btn-restart', 'btn-win-restart', 'btn-leaderboard-restart'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', () => {
        if (window.Sfx) Sfx.playClick();
        goto('splash');
      });
    });
  }

  // ---------- Leaderboard ----------
  // Builds the run payload (matches the goddi_runs table schema), submits to
  // Supabase asynchronously (fire-and-forget — non-fatal if it fails), and
  // remembers the inserted row so we can highlight it when the player views
  // the leaderboard.
  function buildRunPayload() {
    return {
      player_name: state.player.name || 'কাউন্সিলর',
      party_id:    state.player.party,
      outcome:     state.lastVerdict ? state.lastVerdict.outcome : 'death',
      tier:        state.lastVerdict ? (state.lastVerdict.tier || null) : null,
      death_cause: state.lastVerdict ? (state.lastVerdict.cause || null) : null,
      days:        state.day,
      janata:      state.stats.janata,
      dol:         state.stats.dol,
      proshashon:  state.stats.proshashon,
      tohobil:     state.stats.tohobil,
      flags:       [...state.flags],
      lang:        I18n.lang
    };
  }

  function submitToLeaderboard() {
    if (!window.Leaderboard || !Leaderboard.isConfigured()) return;
    if (state.leaderboardSubmitted) return; // submit at most once per run
    state.leaderboardSubmitted = true;
    Leaderboard.submit(buildRunPayload()).then(row => {
      state.lastSubmittedRow = row;
    });
  }

  function wireLeaderboardButtons() {
    ['btn-leaderboard-loss', 'btn-leaderboard-win', 'btn-leaderboard-splash'].forEach(id => {
      const b = document.getElementById(id);
      if (!b) return;
      // Hide the button entirely if Supabase isn't configured
      if (window.Leaderboard && !Leaderboard.isConfigured()) {
        b.style.display = 'none';
        return;
      }
      b.addEventListener('click', () => {
        if (window.Sfx) { Sfx.unlock(); Sfx.playClick(); }
        showLeaderboardScreen('all');
      });
    });
    // Tab switching inside the leaderboard screen
    const tabs = document.getElementById('leaderboard-tabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const t = e.target.closest('.leaderboard__tab');
        if (!t) return;
        if (window.Sfx) Sfx.playClick();
        tabs.querySelectorAll('.leaderboard__tab').forEach(x => x.classList.remove('leaderboard__tab--active'));
        t.classList.add('leaderboard__tab--active');
        showLeaderboardScreen(t.dataset.window);
      });
    }
  }

  async function showLeaderboardScreen(window_) {
    goto('leaderboard');
    const list  = document.getElementById('leaderboard-list');
    const rank  = document.getElementById('leaderboard-your-rank');
    rank.hidden = true;
    list.innerHTML = `<li class="leaderboard__loading">${I18n.lang === 'bn' ? 'লোড হচ্ছে…' : 'Loading…'}</li>`;

    const [rows, myRank] = await Promise.all([
      window.Leaderboard.topRuns({ window: window_, limit: 10 }),
      window.Leaderboard.rankFor(state.lastSubmittedRow)
    ]);

    if (!rows.length) {
      list.innerHTML = `<li class="leaderboard__loading">${I18n.lang === 'bn' ? 'এখনো কোনো রান নেই।' : 'No runs yet.'}</li>`;
      return;
    }

    const myId = state.lastSubmittedRow && state.lastSubmittedRow.id;
    list.innerHTML = rows.map((r, i) => {
      const isMe = (r.id === myId);
      const partyColor = (state.data.parties.find(p => p.id === r.party_id) || {}).color || '#1a1310';
      const tierBadge = r.outcome === 'win' && r.tier
        ? `<span class="lb-row__tier lb-row__tier--${r.tier}">${tierLabel(r.tier)}</span>`
        : `<span class="lb-row__tier lb-row__tier--death">${I18n.lang === 'bn' ? 'পতন' : 'FALLEN'}</span>`;
      return `
        <li class="lb-row ${isMe ? 'lb-row--me' : ''}">
          <span class="lb-row__rank">${i + 1}</span>
          <span class="lb-row__rosette" style="--rose: ${partyColor}"></span>
          <span class="lb-row__name">${escapeHtml(r.player_name)}</span>
          ${tierBadge}
          <span class="lb-row__days">${I18n.formatDays(r.days)} <em>${I18n.lang === 'bn' ? 'দিন' : 'd'}</em></span>
        </li>
      `;
    }).join('');

    if (myRank && myRank > 10) {
      rank.hidden = false;
      rank.textContent = (I18n.lang === 'bn'
        ? `আপনার অবস্থান: ${I18n.toBanglaDigits(myRank)}-তম`
        : `Your rank: #${myRank}`);
    }
  }

  function tierLabel(tier) {
    const labels = {
      clean:       { bn: 'সততা',  en: 'INTEGRITY' },
      standard:    { bn: 'জয়',    en: 'VICTORY' },
      compromised: { bn: 'মূল্য', en: 'PRICE' }
    };
    const l = labels[tier] || labels.standard;
    return I18n.lang === 'bn' ? l.bn : l.en;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- Share ----------
  // Build the verdict payload from current state and hand off to ShareCard.
  // Triggers a PNG download — player can then share on WhatsApp/Facebook.
  function wireShare() {
    ['btn-share-loss', 'btn-share-win'].forEach(id => {
      const b = document.getElementById(id);
      if (!b) return;
      b.addEventListener('click', () => {
        if (window.Sfx) Sfx.playClick();
        if (!window.ShareCard || !state.lastVerdict) return;
        ShareCard.export({
          outcome: state.lastVerdict.outcome,
          tier:    state.lastVerdict.tier,
          cause:   state.lastVerdict.cause,
          days:    state.day,
          stats:   { ...state.stats },
          flags:   [...state.flags],
          lang:    I18n.lang
        });
      });
    });
  }

  // ---------- Brand fade-in ----------
  // Quick SBYC stamp fade shown once per browser session before the splash
  // settles. Tap-to-skip. Stamp is in the HTML already; this just times the
  // reveal and removal.
  function handleBrandFade() {
    const el = document.getElementById('brand-fade');
    if (!el) return;
    // Already seen this session — drop it instantly
    try {
      if (sessionStorage.getItem('goddi.brandShown') === '1') {
        el.remove();
        return;
      }
      sessionStorage.setItem('goddi.brandShown', '1');
    } catch (_) { /* sessionStorage disabled — show anyway */ }

    requestAnimationFrame(() => el.classList.add('brand-fade--shown'));
    function dismiss() {
      el.classList.add('brand-fade--leaving');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 440);
    }
    el.addEventListener('click', dismiss);
    setTimeout(dismiss, 1500);
  }

  // ---------- Utility ----------
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  // ---------- Bootstrap ----------
  async function init() {
    I18n.init();

    // Re-render dynamic UI on language change
    const origToggle = I18n.toggle.bind(I18n);
    I18n.toggle = function () {
      origToggle();
      // If we're mid-game, redraw. If we're on party-select, redraw cards.
      const screen = document.body.getAttribute('data-screen');
      if (screen === 'play')  { renderHud(); renderStats(); redrawCurrentCard(); }
      if (screen === 'party') { renderPartyGrid(); }
      if (screen === 'gameover' || screen === 'win') {
        // re-translate verdict screen — easiest to just re-call
        const death = detectDeath();
        if (screen === 'gameover' && death) showGameOver(death);
        else if (screen === 'win') showWin();
      }
    };

    try {
      await loadData();
    } catch (e) {
      document.body.innerHTML = `
        <div style="padding: 40px; font-family: system-ui;">
          <h2>Failed to load game data</h2>
          <p>Check that you are serving from the goddi/ folder (e.g., <code>python3 -m http.server</code>).</p>
          <pre>${String(e)}</pre>
        </div>`;
      return;
    }

    wireSplash();
    wireNameEntry();
    wirePartySelect();
    wireRestart();
    wireShare();
    wireLeaderboardButtons();
    wireMuteToggle();
    handleBrandFade();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
