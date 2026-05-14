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

  // Tap-to-learn-more text for each stat — shown when player taps the seal.
  const STAT_INFO = {
    janata: {
      desc_bn: 'ওয়ার্ডের সাধারণ জনগণের সমর্থন।',
      desc_en: 'How the people of Ward 37 feel about you.',
      low_bn: 'কম: গণবিক্ষোভ, পেছনের দরজা দিয়ে পালানো।',
      low_en: 'Too low: protests, slipping out the back door.',
      high_bn: 'বেশি: পপুলিস্ট ফাঁদ, দল মনোনয়ন টানবে।',
      high_en: 'Too high: populist trap, the party pulls your nomination.'
    },
    dol: {
      desc_bn: 'কেন্দ্রীয় দলের সাথে আপনার সম্পর্ক।',
      desc_en: 'Your standing with the central party.',
      low_bn: 'কম: বহিষ্কার, পরের নির্বাচনে দাঁড়াতে পারবেন না।',
      low_en: 'Too low: expelled, no path back to the ballot.',
      high_bn: 'বেশি: পুতুল, জনতা আপনাকে ছেড়ে দেবে।',
      high_en: 'Too high: a puppet, the public turns on you.'
    },
    proshashon: {
      desc_bn: 'ডিএনসিসি, থানা, এমপি অফিস — সরকারি যন্ত্র।',
      desc_en: 'DNCC, the police, the MP\'s office — the machinery.',
      low_bn: 'কম: কোনো ফাইল নড়ে না, নামমাত্র কাউন্সিলর।',
      low_en: 'Too low: nothing moves, you\'re a councillor in name only.',
      high_bn: 'বেশি: সরকারের দালাল হিসেবে ব্র্যান্ড।',
      high_en: 'Too high: branded a government stooge.'
    },
    tohobil: {
      desc_bn: 'ওয়ার্ড তহবিল এবং আপনার ব্যক্তিগত হিসাব।',
      desc_en: 'The ward purse and your personal accounts.',
      low_bn: 'কম: দেউলিয়া, স্টাফদের বেতন নেই, লাইট বন্ধ।',
      low_en: 'Too low: bankrupt, staff unpaid, street lights off.',
      high_bn: 'বেশি: দুদক তদন্ত, কোথা থেকে এত টাকা?',
      high_en: 'Too high: ACC opens a file — where did the money come from?'
    }
  };

  function showStatInfo(statKey) {
    const stat = STATS.find(s => s.key === statKey);
    const info = STAT_INFO[statKey];
    if (!stat || !info) return;
    const overlay = document.createElement('div');
    overlay.className = 'stat-info';
    overlay.innerHTML = `
      <div class="stat-info__card" data-stat-key="${stat.key}">
        <div class="stat-info__seal">${stat.iconSvg}</div>
        <h3 class="stat-info__name">
          <span data-lang-bn>${stat.name_bn}</span>
          <span data-lang-en>${stat.name_en}</span>
        </h3>
        <p class="stat-info__desc">
          <span data-lang-bn>${info.desc_bn}</span>
          <span data-lang-en>${info.desc_en}</span>
        </p>
        <p class="stat-info__danger stat-info__danger--low">
          <span data-lang-bn>${info.low_bn}</span>
          <span data-lang-en>${info.low_en}</span>
        </p>
        <p class="stat-info__danger stat-info__danger--high">
          <span data-lang-bn>${info.high_bn}</span>
          <span data-lang-en>${info.high_en}</span>
        </p>
        <p class="stat-info__dismiss">
          <span data-lang-bn>যেকোনো জায়গায় ট্যাপ করুন</span>
          <span data-lang-en>Tap anywhere to close</span>
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('stat-info--shown'));
    overlay.addEventListener('click', () => {
      overlay.classList.add('stat-info--leaving');
      setTimeout(() => overlay.remove(), 240);
    });
  }

  // Five "what were you before politics?" backgrounds. Modifiers stack on
  // top of party modifiers — kept smaller than party (±5 vs party's ±10) so
  // they shape the run without overriding party identity.
  const BACKGROUNDS = [
    {
      id: 'businessman',
      name_bn: 'ব্যবসায়ী',
      name_en: 'Businessman',
      tagline_bn: 'টাকার গন্ধ চেনেন। কিন্তু জনতাকে চেনেন না।',
      tagline_en: 'Knows the smell of money. Not so much the smell of voters.',
      color: '#9c7a36',
      modifiers: { tohobil: 6, janata: -4, dol: 0, proshashon: 0 }
    },
    {
      id: 'teacher',
      name_bn: 'শিক্ষক',
      name_en: 'School teacher',
      tagline_bn: 'মানুষ চেনেন। চেক বইটা চেনেন না।',
      tagline_en: 'Knows people. Doesn\'t know a chequebook.',
      color: '#1b7849',
      modifiers: { janata: 6, tohobil: -4, dol: 0, proshashon: 2 }
    },
    {
      id: 'army_retired',
      name_bn: 'অবসরপ্রাপ্ত সেনা',
      name_en: 'Ex-Army officer',
      tagline_bn: 'শৃঙ্খলা শিখেছেন। দলীয় রাজনীতি শেখেননি।',
      tagline_en: 'Learned discipline. Never learned party politics.',
      color: '#4a3c2a',
      modifiers: { proshashon: 6, dol: -4, janata: 0, tohobil: 0 }
    },
    {
      id: 'ngo_worker',
      name_bn: 'এনজিও কর্মী',
      name_en: 'NGO worker',
      tagline_bn: 'গরিবের আস্থা আছে। কেন্দ্রের নেই।',
      tagline_en: 'Trusted by the poor. Distrusted by the centre.',
      color: '#a6291f',
      modifiers: { janata: 6, dol: -4, proshashon: 0, tohobil: 0 }
    },
    {
      id: 'party_lifer',
      name_bn: 'দলীয় কর্মী',
      name_en: 'Career party worker',
      tagline_bn: 'দল চেনেন ভেতর থেকে। প্রশাসন বাইরে থেকে দেখেছেন।',
      tagline_en: 'Knows the party from the inside. Seen the bureaucracy only from outside.',
      color: '#2d4a7a',
      modifiers: { dol: 6, proshashon: -4, janata: 0, tohobil: 0 }
    }
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
    player: { name: '', party: null, background: null, mode: null },
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
  // Default: 1 (no repeat). A small set of genuinely-yearly cards
  // (Eid bonuses, monsoon, dengue, annual party fund squeeze, etc.) carry
  // an explicit `max_uses` field for 2-3 reappearances.
  function maxUsesFor(card) {
    if (typeof card.max_uses === 'number' && card.max_uses > 0) return card.max_uses;
    return 1;
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
    // Funnel analytics — one event per screen entry. We capture which
    // background / party / language the player is on so the funnel can
    // be sliced later.
    if (window.Analytics) {
      Analytics.track('screen_enter', {
        meta:       { screen: screen },
        language:   window.I18n ? I18n.lang : null,
        background: state.player && state.player.background,
        party:      state.player && state.player.party
      });
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
      renderBackgroundGrid();
      goto('background');
    }

    back.addEventListener('click', () => { if (window.Sfx) Sfx.playClick(); goto('splash'); });
    next.addEventListener('click', () => { if (window.Sfx) Sfx.playClick(); tryNext(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { if (window.Sfx) Sfx.playClick(); tryNext(); }
    });
  }

  // ---------- Background select ----------
  function renderBackgroundGrid() {
    const grid = document.getElementById('background-grid');
    grid.innerHTML = '';
    BACKGROUNDS.forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'party-card';
      btn.setAttribute('aria-pressed', 'false');
      btn.dataset.backgroundId = b.id;
      btn.style.setProperty('--party-color', b.color);

      const modsHtml = Object.entries(b.modifiers)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => {
          const stat = STATS.find(s => s.key === k);
          const cls = v > 0 ? 'party-card__mod--pos' : 'party-card__mod--neg';
          const label = I18n.lang === 'bn' ? stat.name_bn : stat.name_en;
          return `<span class="party-card__mod ${cls}">${label} ${v > 0 ? '+' : ''}${v}</span>`;
        }).join('');

      btn.innerHTML = `
        <div class="party-card__bar"></div>
        <p class="party-card__name">${I18n.lang === 'bn' ? b.name_bn : b.name_en}</p>
        <p class="party-card__tag">${I18n.lang === 'bn' ? b.tagline_bn : b.tagline_en}</p>
        <div class="party-card__mods">${modsHtml}</div>
      `;
      btn.addEventListener('click', () => selectBackground(b.id));
      grid.appendChild(btn);
    });
    document.getElementById('btn-background-next').disabled = true;
    state.player.background = null;
  }

  function selectBackground(id) {
    state.player.background = id;
    document.querySelectorAll('#background-grid .party-card').forEach(el => {
      el.setAttribute('aria-pressed', el.dataset.backgroundId === id ? 'true' : 'false');
    });
    document.getElementById('btn-background-next').disabled = false;
  }

  function wireBackgroundSelect() {
    document.getElementById('btn-background-back').addEventListener('click', () => {
      if (window.Sfx) Sfx.playClick();
      goto('name');
    });
    document.getElementById('btn-background-next').addEventListener('click', () => {
      if (!state.player.background) return;
      if (window.Sfx) Sfx.playClick();
      renderPartyGrid();
      goto('party');
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
      goto('background');
    });
    document.getElementById('btn-party-confirm').addEventListener('click', () => {
      if (!state.player.party) return;
      if (window.Sfx) Sfx.playClick();
      resetModeSelect();
      goto('mode');
    });
  }

  // Reset the mode-select screen to a pristine "nothing chosen" state. Called
  // whenever the player enters the screen so DOM/state from a previous run
  // don't leak in.
  function resetModeSelect() {
    state.player.mode = null;
    document.querySelectorAll('.mode-card').forEach(c => c.setAttribute('aria-pressed', 'false'));
    const startBtn = document.getElementById('btn-mode-start');
    if (startBtn) startBtn.disabled = true;
  }

  // ---------- Mode select ----------
  // The campaign is the only playable mode right now; the rest are visible
  // as "Coming soon" cards so players can see the roadmap. Selecting the
  // campaign card enables the Start button which kicks off the run.
  function wireModeSelect() {
    const startBtn = document.getElementById('btn-mode-start');
    const backBtn  = document.getElementById('btn-mode-back');
    const grid     = document.querySelector('.mode-grid');
    if (!grid) return;

    grid.querySelectorAll('.mode-card').forEach(card => {
      if (card.classList.contains('mode-card--locked')) return;
      card.addEventListener('click', () => {
        if (window.Sfx) Sfx.playClick();
        grid.querySelectorAll('.mode-card').forEach(c => c.setAttribute('aria-pressed', 'false'));
        card.setAttribute('aria-pressed', 'true');
        state.player.mode = card.dataset.mode;
        startBtn.disabled = false;
      });
    });

    // Clicking a locked card surfaces a small toast-style feedback — distinct
    // "denied" tone so it doesn't sound like a confirm.
    grid.querySelectorAll('.mode-card--locked').forEach(card => {
      card.addEventListener('click', () => {
        if (window.Sfx) Sfx.playDenied();
        card.classList.add('mode-card--shake');
        setTimeout(() => card.classList.remove('mode-card--shake'), 360);
      });
    });

    backBtn.addEventListener('click', () => {
      if (window.Sfx) Sfx.playClick();
      goto('party');
    });

    startBtn.addEventListener('click', () => {
      if (!state.player.mode) return;
      if (window.Sfx) Sfx.playClick();
      startRun();
    });
  }

  // ---------- Start a run ----------
  function startRun() {
    const party      = state.data.parties.find(p => p.id === state.player.party);
    const background = BACKGROUNDS.find(b => b.id === state.player.background);
    // Seed stats at 50 + party modifier + background modifier, clamped. Both
    // modifiers stack; background mods are smaller (±5 vs party's ±10) so
    // they shape the run without overriding party identity.
    STATS.forEach(s => {
      const partyMod      = party.modifiers[s.key] ?? 0;
      const backgroundMod = (background && background.modifiers && background.modifiers[s.key]) || 0;
      state.stats[s.key]  = clamp(50 + partyMod + backgroundMod, 1, 99);
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
    state.lastVerdict = null;
    state.yearStartStats = null; // captured at first commit of a year
    // History for the verdict-screen trajectory chart and "defining moments"
    // list. statHistory: [{day, year, janata, dol, proshashon, tohobil}]
    // biggestHit: { cardId, characterName, stat, delta, day } for the
    // single largest absolute single-stat swing across the run.
    state.statHistory = [{
      day: 0, year: 1,
      janata: state.stats.janata, dol: state.stats.dol,
      proshashon: state.stats.proshashon, tohobil: state.stats.tohobil
    }];
    state.biggestHit = null;

    renderHud();
    renderStats();
    renderNextCard();
    goto('play');

    // First-run tutorial — fires once per browser, before the first card.
    maybeShowTutorial();
  }

  // ---------- First-run tutorial ----------
  // Three-step bilingual overlay shown the very first time a player starts
  // a run. Explains stats, swiping, and the [sponsored] tag. Persisted in
  // localStorage so it never bothers them again.
  const TUTORIAL_KEY = 'goddi.tutorial.seen';
  const TUTORIAL_STEPS = [
    {
      title_bn: 'চার রিং',
      title_en: 'FOUR DIALS',
      body_bn: 'উপরের চারটি স্ট্যাট আপনার পদের ভিত্তি। যেকোনো একটা ০ বা ১০০ ছুঁলে আপনি বিদায়। যেকোনোটাকে ট্যাপ করে বিস্তারিত দেখুন।',
      body_en: 'Four dials at the top hold your office together. If any one hits 0 or 100, your tenure ends. Tap a dial for what each one means.'
    },
    {
      title_bn: 'বামে বা ডানে সোয়াইপ',
      title_en: 'SWIPE LEFT OR RIGHT',
      body_bn: 'প্রতিটি কার্ডের দুটি বিকল্প — বামে এক, ডানে আরেক। কোনোটাই নিরাপদ না। স্ট্যাট কোন দিকে যাবে তা প্রিভিউয়ে দেখা যাবে।',
      body_en: 'Every card has two options — left and right. Neither is safe. Drag a card and watch the stats preview which way they\'ll move.'
    },
    {
      title_bn: 'পাঁচ বছর টিকুন',
      title_en: 'SURVIVE FIVE YEARS',
      body_bn: 'লক্ষ্য — পাঁচ বছরের শাসন শেষ করা। প্রতিটি বছরের শেষে দুনিয়া আপনার উপর একটা ঝাঁকি দেবে। প্রস্তুত থাকুন।',
      body_en: 'The goal — finish your five-year term. Each year ends with the world dealing you a shock. Brace for it.'
    }
  ];

  function maybeShowTutorial() {
    try {
      if (localStorage.getItem(TUTORIAL_KEY) === '1') return;
    } catch (_) { /* localStorage disabled — show every time, no biggie */ }
    showTutorialStep(0);
  }

  function showTutorialStep(idx) {
    const step = TUTORIAL_STEPS[idx];
    if (!step) {
      try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch (_) {}
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'tutorial';
    const total = TUTORIAL_STEPS.length;
    const labelBn = (idx + 1) + ' / ' + total;
    const labelEn = (idx + 1) + ' OF ' + total;
    const nextBn = idx === total - 1 ? 'শুরু করি' : 'পরবর্তী →';
    const nextEn = idx === total - 1 ? 'BEGIN' : 'NEXT →';
    overlay.innerHTML = `
      <div class="tutorial__card" role="dialog" aria-modal="true">
        <p class="tutorial__step">
          <span data-lang-bn>${I18n.toBanglaDigits(idx + 1)} / ${I18n.toBanglaDigits(total)}</span>
          <span data-lang-en>${labelEn}</span>
        </p>
        <h3 class="tutorial__title">
          <span data-lang-bn>${step.title_bn}</span>
          <span data-lang-en>${step.title_en}</span>
        </h3>
        <p class="tutorial__body">
          <span data-lang-bn>${step.body_bn}</span>
          <span data-lang-en>${step.body_en}</span>
        </p>
        <div class="tutorial__actions">
          <button class="tutorial__skip" type="button">
            <span data-lang-bn>এড়িয়ে যান</span>
            <span data-lang-en>Skip</span>
          </button>
          <button class="tutorial__next" type="button">
            <span data-lang-bn>${nextBn}</span>
            <span data-lang-en>${nextEn}</span>
          </button>
        </div>
        <div class="tutorial__dots">
          ${TUTORIAL_STEPS.map((_, i) =>
            `<span class="tutorial__dot ${i === idx ? 'tutorial__dot--active' : ''}"></span>`
          ).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('tutorial--shown'));

    function dismiss(skipRest) {
      overlay.classList.add('tutorial--leaving');
      setTimeout(() => {
        overlay.remove();
        if (skipRest) {
          try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch (_) {}
        } else {
          showTutorialStep(idx + 1);
        }
      }, 220);
    }
    overlay.querySelector('.tutorial__next').addEventListener('click', () => {
      if (window.Sfx) Sfx.playClick();
      dismiss(false);
    });
    overlay.querySelector('.tutorial__skip').addEventListener('click', () => {
      if (window.Sfx) Sfx.playClick();
      dismiss(true);
    });
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
    // Tap anywhere on a stat row opens that stat's info popup. The whole row
    // is the tap target (not just the 26px seal) so it works comfortably
    // on phones — small seal stays as the visual cursor cue.
    wrap.onclick = (e) => {
      const statEl = e.target.closest('.stat');
      if (!statEl || !statEl.dataset.key) return;
      if (window.Sfx) Sfx.playClick();
      showStatInfo(statEl.dataset.key);
    };
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

    // Background gating — callbacks from the player's pre-political life
    if (Array.isArray(card.background_only) && card.background_only.length
        && !card.background_only.includes(state.player.background)) return false;

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
    if (Array.isArray(card.background_only) && card.background_only.length
        && !card.background_only.includes(state.player.background)) return false;
    if (Array.isArray(card.requires_flags)
        && !card.requires_flags.every(f => state.flags.includes(f))) return false;
    if (Array.isArray(card.blocked_by_flags)
        && card.blocked_by_flags.some(f => state.flags.includes(f))) return false;
    return true;
  }

  // Resolve dialog text for the current card. Variant precedence:
  //   1. background_variants[<background_id>]   (most personal — "you, specifically")
  //   2. dialog_variants[<party_id>]            (party-flavored)
  //   3. default dialog_bn / dialog_en
  // background_variants: { "<background_id>": { dialog_bn, dialog_en } }
  // dialog_variants:     { "<party_id>":      { dialog_bn, dialog_en } }
  function resolveDialog(card) {
    const bgVar = card.background_variants && card.background_variants[state.player.background];
    const pyVar = card.dialog_variants     && card.dialog_variants[state.player.party];
    const variant = bgVar || pyVar;
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
      el.classList.remove('stat--preview-pos', 'stat--preview-neg',
                          'stat--preview-touched', 'stat--preview-danger');
    });
    if (!side) return;
    const effects = (card[side] && card[side].effects) || {};
    for (const [key, delta] of Object.entries(effects)) {
      const el = document.querySelector(`.stat[data-key="${key}"]`);
      if (!el || !delta) continue;
      el.classList.add('stat--preview-touched');
      el.classList.add(delta > 0 ? 'stat--preview-pos' : 'stat--preview-neg');
      // If the projected stat would land in the danger zone, escalate the
      // visual — sharper red, harder pulse, ⚠ in the air. Helps players see
      // a fatal swing before committing.
      const cur = state.stats[key];
      const projected = clamp(cur + delta, 0, 100);
      if (projected <= DANGER_LOW || projected >= DANGER_HIGH) {
        el.classList.add('stat--preview-danger');
      }
    }
  }

  // ---------- Commit a choice ----------
  function commitChoice(card, side) {
    if (state.inFlight) return;
    state.inFlight = true;
    const wasFirstCard = !state.seenFirstCard;
    state.seenFirstCard = true;

    // Stamp thud — fires the moment the player commits, in sync with
    // the card flying off and the choice resolving.
    if (window.Sfx) Sfx.playStamp(side);

    // Analytics: card decision (and run_start on first commit of the run).
    if (window.Analytics) {
      if (wasFirstCard) {
        Analytics.track('run_start', {
          background: state.player.background,
          party:      state.player.party,
          language:   window.I18n ? I18n.lang : null
        });
      }
      Analytics.track('card_decision', {
        card_id:    card.id,
        decision:   side,
        background: state.player.background,
        party:      state.player.party,
        language:   window.I18n ? I18n.lang : null
      });
    }

    const choice = card[side];
    // Apply stat effects. From Year 4 onward, all effects are amplified
    // by 1.25 — stakes climb as the tenure drags on. Players who coasted
    // through Year 1-3 now face stiffer consequences for the same call.
    const yearMultiplier = state.year >= 4 ? 1.25 : 1.0;
    const rawEffects = choice.effects || {};
    const effects = {};
    Object.entries(rawEffects).forEach(([stat, delta]) => {
      if (!(stat in state.stats)) return;
      const scaled = Math.round(Math.abs(delta) * yearMultiplier) * Math.sign(delta);
      const finalDelta = (scaled === 0 && delta !== 0) ? Math.sign(delta) : scaled;
      effects[stat] = finalDelta;
      state.stats[stat] = clamp(state.stats[stat] + finalDelta, 0, 100);
      // Edge-touch tracker — fires the "Razor's Edge" achievement when a
      // stat hits the inner danger band (≤5 or ≥95) at any point.
      if ((state.stats[stat] <= 5 || state.stats[stat] >= 95)
          && state.stats[stat] > 0 && state.stats[stat] < 100
          && !state.flags.includes('saw_edge')) {
        state.flags.push('saw_edge');
      }
      // Track the single biggest absolute hit of the run for the verdict
      // screen's "defining moment" callout.
      const mag = Math.abs(finalDelta);
      if (!state.biggestHit || mag > Math.abs(state.biggestHit.delta)) {
        state.biggestHit = {
          cardId:        card.id,
          characterName: card.character_name_en,
          stat:          stat,
          delta:         finalDelta,
          day:           state.day,
          year:          state.year
        };
      }
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
    // Capture stats at first commit of each year so we can compute year deltas
    if (!state.yearStartStats) state.yearStartStats = { ...state.stats };
    state.day += 21 + Math.floor(Math.random() * 9);
    state.year = Math.min(5, Math.ceil((state.day || 1) / 365));
    const yearCrossed = state.year > yearBefore;
    // On rollover, hold onto the deltas so the year transition can display
    // them, then reset the snapshot for the new year (captured next commit).
    let yearDeltas = null;
    let yearImpact = null;
    if (yearCrossed) {
      yearDeltas = {};
      for (const k of Object.keys(state.stats)) {
        yearDeltas[k] = state.stats[k] - (state.yearStartStats[k] ?? 50);
      }
      state.yearStartStats = null;

      // Involuntary environmental hit for the new year (the world acting
      // on the Councillor). MONSOON, HEAT, STORM. Year 5 has no hit.
      const env = YEAR_EFFECTS[state.year];
      if (env && env.effects) {
        yearImpact = {};
        Object.entries(env.effects).forEach(([stat, delta]) => {
          if (!(stat in state.stats)) return;
          state.stats[stat] = clamp(state.stats[stat] + delta, 0, 100);
          yearImpact[stat] = delta;
        });
      }

      // Analytics: year rolled over. Useful for retention funnels —
      // how many players make it past Year 1, Year 2, etc.
      if (window.Analytics) {
        Analytics.track('year_crossed', {
          meta:       { year: state.year, deltas: yearDeltas, impact: yearImpact },
          background: state.player.background,
          party:      state.player.party,
          language:   window.I18n ? I18n.lang : null
        });
      }
    }

    renderHud();
    renderStats();

    // Record a snapshot for the end-of-run trajectory chart. We snapshot
    // AFTER both the player's effects and any year-environment hit have
    // landed, so the chart reflects the actual lived state at each step.
    if (state.statHistory) {
      state.statHistory.push({
        day: state.day, year: state.year,
        janata:     state.stats.janata,
        dol:        state.stats.dol,
        proshashon: state.stats.proshashon,
        tohobil:    state.stats.tohobil
      });
    }

    // Float "+15" / "−10" over each affected stat
    Object.entries(effects).forEach(([stat, delta]) => {
      if (!(stat in state.stats)) return;
      animateStatDelta(stat, delta);
    });

    // Achievement evaluation — runs after every commit. Non-verdict
    // achievements that fire on flag-set or year-reach get caught here.
    if (window.Achievements) Achievements.evaluate(state);

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
        showYearTransition(state.year, maybeShowIntroThenFinish, yearDeltas, yearImpact);
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

  // Involuntary stat shifts at year crossover — the world acting on the
  // Councillor regardless of how cautiously they've played. Each theme has
  // a one-line caption that explains the hit in story terms.
  const YEAR_EFFECTS = {
    2: {
      effects: { janata: 5, tohobil: -6 },
      caption_bn: 'বন্যা ত্রাণে আপনাকে দেখা গেছে — কিন্তু তহবিল কমছে।',
      caption_en: 'You showed up at flood relief — but the treasury took a hit.'
    },
    3: {
      effects: { proshashon: -5, janata: -4 },
      caption_bn: 'গরমে যন্ত্রপাতি ভেঙে পড়ছে; মেজাজও।',
      caption_en: 'Heat strains the machinery — and tempers.'
    },
    4: {
      effects: { dol: 5, janata: -5 },
      caption_bn: 'নির্বাচন এগিয়ে আসছে। দল কাছে টানে, জনতা সন্দেহ করে।',
      caption_en: 'Election approaches. The party pulls you closer; the public grows skeptical.'
    }
    // Year 5: no environmental effect. Let the player's own decisions land.
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

  function showYearTransition(year, done, yearDeltas, yearImpact) {
    const theme = YEAR_THEMES[year];
    if (!theme) { done(); return; }
    const yearLabel = I18n.lang === 'bn'
      ? 'বছর ' + I18n.toBanglaDigits(year)
      : 'YEAR ' + year;

    // Helper to build a chip for a single stat delta.
    function chipFor(statKey, dv, cls) {
      const s = STATS.find(x => x.key === statKey);
      if (!s || !dv) return '';
      const sign  = dv > 0 ? '+' : '−';
      const value = I18n.lang === 'bn'
        ? I18n.toBanglaDigits(Math.abs(dv))
        : Math.abs(dv);
      const label = I18n.lang === 'bn' ? s.name_bn : s.name_en;
      return `<span class="year-recap__chip ${cls}">${label} ${sign}${value}</span>`;
    }

    // Build the per-stat recap chips (only stats that actually moved)
    let recapHtml = '';
    if (yearDeltas) {
      const recapBits = STATS.map(s => {
        const dv = yearDeltas[s.key] | 0;
        if (!dv) return '';
        const cls = dv > 0 ? 'year-recap__chip--pos' : 'year-recap__chip--neg';
        return chipFor(s.key, dv, cls);
      }).filter(Boolean).join('');
      if (recapBits) {
        recapHtml = `
          <p class="year-recap__label">
            <span data-lang-bn>গত বছর</span>
            <span data-lang-en>The year past</span>
          </p>
          <div class="year-recap__chips">${recapBits}</div>
        `;
      }
    }

    // Build the involuntary-impact section — the world acting on the
    // Councillor independent of their choices. Distinct visual treatment
    // (stamp-red dashed border) so the player sees "this happened TO me"
    // vs the recap which is "this is what I did."
    let impactHtml = '';
    const env = YEAR_EFFECTS[year];
    if (yearImpact && env) {
      const impactBits = STATS.map(s => {
        const dv = yearImpact[s.key] | 0;
        if (!dv) return '';
        const cls = dv > 0 ? 'year-recap__chip--pos' : 'year-recap__chip--neg';
        return chipFor(s.key, dv, cls);
      }).filter(Boolean).join('');
      if (impactBits) {
        impactHtml = `
          <div class="year-impact">
            <p class="year-impact__caption">
              <span data-lang-bn>${env.caption_bn}</span>
              <span data-lang-en>${env.caption_en}</span>
            </p>
            <div class="year-recap__chips">${impactBits}</div>
          </div>
        `;
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'year-transition';
    overlay.innerHTML = `
      <div class="year-transition__card">
        ${recapHtml}
        <p class="year-transition__year">${yearLabel}</p>
        <h2 class="year-transition__title">
          <span data-lang-bn>${theme.bn}</span>
          <span data-lang-en>${theme.en}</span>
        </h2>
        <p class="year-transition__sub">
          <span data-lang-bn>${theme.sub_bn}</span>
          <span data-lang-en>${theme.sub_en}</span>
        </p>
        ${impactHtml}
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
    // Add a small "tap anywhere" hint so it's obvious the overlay
    // is dismissable — not everyone realizes they can skip ahead.
    const hint = document.createElement('p');
    hint.className = 'year-transition__hint';
    hint.innerHTML =
      '<span data-lang-bn>ট্যাপ করে এগিয়ে যান</span>' +
      '<span data-lang-en>Tap to continue</span>';
    overlay.querySelector('.year-transition__card').appendChild(hint);

    overlay.addEventListener('click', dismiss);
    // Auto-dismiss is now ~5s so Bangla readers have time to take the
    // chapter card in. Tap still skips immediately.
    setTimeout(dismiss, 5200);
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
    renderTrajectory('verdict-trajectory');
    renderMoments('verdict-moments');
    goto('gameover');
    if (window.Sfx) Sfx.playVerdict('loss');
    submitToLeaderboard();
    if (window.Achievements) Achievements.evaluateVerdict(state, state.lastVerdict);
    if (window.Analytics) {
      Analytics.track('run_end', {
        background: state.player.background,
        party:      state.player.party,
        language:   I18n.lang,
        meta: {
          outcome: 'death',
          cause:   death.key,
          days:    state.day,
          year:    state.year,
          stats:   { ...state.stats }
        }
      });
    }
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
    renderTrajectory('win-trajectory');
    renderMoments('win-moments');
    goto('win');
    if (window.Sfx) Sfx.playVerdict('win');
    submitToLeaderboard();
    if (window.Achievements) Achievements.evaluateVerdict(state, state.lastVerdict);
    if (window.Analytics) {
      Analytics.track('run_end', {
        background: state.player.background,
        party:      state.player.party,
        language:   I18n.lang,
        meta: {
          outcome: 'win',
          tier:    tier,
          days:    state.day,
          year:    state.year,
          stats:   { ...state.stats }
        }
      });
    }
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

  // ---------- Trajectory chart + defining moments ----------
  // Renders a 4-line SVG sparkline showing how each stat moved over the
  // course of the run, plus a short list of stand-out moments. Called
  // from showGameOver() and showWin() after renderFinalStats.

  // Build an SVG polyline tracing the run from start to end for one stat.
  function _trajectoryPath(history, statKey, width, height) {
    if (!history || history.length < 2) return '';
    const points = history.map((row, i) => {
      const x = (i / (history.length - 1)) * width;
      // y is inverted because SVG y grows downward
      const y = height - (row[statKey] / 100) * height;
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    return points.join(' ');
  }

  function renderTrajectory(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap || !state.statHistory || state.statHistory.length < 2) return;

    const W = 320; // viewBox width
    const H = 90;  // viewBox height
    const colors = {
      janata:     'var(--stat-janata)',
      dol:        'var(--stat-dol)',
      proshashon: 'var(--stat-proshashon)',
      tohobil:    'var(--stat-tohobil)'
    };
    const lines = STATS.map(s => `
      <polyline
        points="${_trajectoryPath(state.statHistory, s.key, W, H)}"
        fill="none"
        stroke="${colors[s.key]}"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.85"
      />
    `).join('');

    // Danger band — visualise the ≤20 and ≥80 thresholds as faint zones
    const dangerLow  = H - (DANGER_LOW  / 100) * H;
    const dangerHigh = H - (DANGER_HIGH / 100) * H;
    const danger = `
      <rect x="0" y="0"           width="${W}" height="${dangerHigh}"      fill="rgba(166,41,31,0.05)"/>
      <rect x="0" y="${dangerLow}" width="${W}" height="${H - dangerLow}" fill="rgba(166,41,31,0.05)"/>
      <line x1="0" y1="${dangerLow}"  x2="${W}" y2="${dangerLow}"
            stroke="var(--stamp-red)" stroke-width="0.5" stroke-dasharray="2 3" opacity="0.4"/>
      <line x1="0" y1="${dangerHigh}" x2="${W}" y2="${dangerHigh}"
            stroke="var(--stamp-red)" stroke-width="0.5" stroke-dasharray="2 3" opacity="0.4"/>
    `;

    // Year boundary markers (vertical dashed lines) + Y2/3/4/5 labels.
    // We collect boundary x-positions so we can render labels below them too.
    let yearMarkers = '';
    const yearBoundaries = []; // [{x, year}]
    for (let i = 1; i < state.statHistory.length; i++) {
      if (state.statHistory[i].year !== state.statHistory[i-1].year) {
        const x = (i / (state.statHistory.length - 1)) * W;
        const yr = state.statHistory[i].year;
        yearBoundaries.push({ x, year: yr });
        yearMarkers += `<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${H}"
                         stroke="var(--ink-mute)" stroke-width="0.5" stroke-dasharray="2 4" opacity="0.4"/>`;
        yearMarkers += `<text x="${x.toFixed(1)}" y="10" text-anchor="middle"
                         font-family="var(--font-mono)" font-size="7"
                         fill="var(--ink-mute)" opacity="0.7">Y${yr}</text>`;
      }
    }

    // Worst-moment annotation: a dot marker at the day the biggest single
    // stat-hit happened, using that stat's colour.
    let worstMarker = '';
    if (state.biggestHit && state.biggestHit.day != null && state.statHistory.length > 1) {
      const idx = state.statHistory.findIndex(p => p.day === state.biggestHit.day);
      if (idx >= 0) {
        const x = (idx / (state.statHistory.length - 1)) * W;
        const y = H - (state.statHistory[idx][state.biggestHit.stat] / 100) * H;
        const c = colors[state.biggestHit.stat];
        worstMarker = `
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"
                  fill="${c}" stroke="var(--paper)" stroke-width="1.5"/>
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6"
                  fill="none" stroke="${c}" stroke-width="0.8" opacity="0.4"/>
        `;
      }
    }

    // Legend — one chip per stat with its colour swatch
    const legend = STATS.map(s => `
      <span class="verdict__leg">
        <span class="verdict__leg-dot" style="background:${colors[s.key]};"></span>
        <span>${I18n.lang === 'bn' ? s.name_bn : s.name_en}</span>
      </span>
    `).join('');

    wrap.innerHTML = `
      <p class="verdict__chart-label">
        <span data-lang-bn>আপনার পথ</span>
        <span data-lang-en>YOUR PATH</span>
      </p>
      <svg class="verdict__chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"
           role="img" aria-label="Stat trajectory over the run">
        ${danger}${yearMarkers}${lines}${worstMarker}
      </svg>
      <p class="verdict__chart-caption">
        <span data-lang-bn>৫ বছর · ${state.statHistory.length - 1} সিদ্ধান্ত · লাল চিহ্ন = বিপদসীমা</span>
        <span data-lang-en>5 years · ${state.statHistory.length - 1} decisions · red zones = danger</span>
      </p>
      <div class="verdict__legend">${legend}</div>
    `;
  }

  // Build the "defining moments" list for the verdict screen. Each item
  // is one line: an emoji-free, one-sentence story beat that the player
  // can point at to understand why their run went the way it did.
  // Sources, in order: biggest single hit, year-end summaries, and a
  // handful of flag-derived callouts.
  const MOMENT_FLAG_LINES = {
    flood_walk:              { bn: 'কোমর-পানিতে হেঁটে বন্যা দেখেছেন।',                       en: 'Walked the flooded ward waist-deep.' },
    tower_approved:          { bn: 'বশিরকে অনিয়মে অনুমোদন দিয়েছেন।',                       en: 'Cleared Bashir\'s tower against code.' },
    tower_collapsed:         { bn: 'টাওয়ার ধসে পড়ে — আপনার অনুমোদনে।',                     en: 'A tower came down on your approval.' },
    tower_blamed_contractor: { bn: 'কন্ট্রাক্টরকে দোষারোপ করেছেন।',                         en: 'Pinned the blame on the contractor.' },
    tower2_approved:         { bn: 'বশিরকে দ্বিতীয়বারও অনুমোদন দিয়েছেন।',                  en: 'Approved Bashir\'s second tower anyway.' },
    tower2_collapsed:        { bn: 'দ্বিতীয় টাওয়ারও ধসে গেছে।',                              en: 'A second tower came down.' },
    pa_protected:            { bn: 'সেলিমকে কেলেঙ্কারিতে রক্ষা করেছেন।',                       en: 'Shielded Selim through the scandal.' },
    pa_fired:                { bn: 'সেলিমকে কাজ থেকে বিদায় দিয়েছেন।',                          en: 'Let Selim go.' },
    pa_loyal:                { bn: 'সেলিম শেষ পর্যন্ত আপনার পাশে ছিল।',                          en: 'Selim stayed loyal to the end.' },
    pa_betrayed:             { bn: 'সেলিমকে শেষ মুহূর্তে ছেড়ে দিয়েছেন।',                       en: 'Cut Selim loose at the end.' },
    karim_helped:            { bn: 'করিম মিয়াকে চিকিৎসায় সাহায্য করেছেন।',                   en: 'Paid for Karim Miah\'s treatment.' },
    mosque_funded:           { bn: 'মসজিদে অনুদান দিয়েছেন।',                                    en: 'Wrote a cheque for the masjid.' },
    sbyc_legacy:             { bn: 'এসবিওয়াইসির স্থায়ী ভবন আপনার নামে।',                      en: 'Foundation stone of SBYC bears your name.' },
    taking_envelopes:        { bn: 'উপহারের এনভেলপ গ্রহণ করেছেন।',                              en: 'Started accepting "small gifts."' },
    defected:                { bn: 'দলবদল করেছেন চেয়ারম্যানির জন্য।',                          en: 'Defected for the chairman\'s seat.' },
    ec_bribed:               { bn: 'নির্বাচন কমিশনের নথিতে হাত দিয়েছেন।',                       en: 'Reached into the EC paperwork.' },
    votebuying:              { bn: 'ভোট কিনেছেন।',                                                  en: 'Bought votes.' },
    acc_stonewalled:         { bn: 'দুদক তদন্ত আটকে রেখেছেন।',                                  en: 'Stonewalled the ACC inquiry.' },
    compensation_paid:       { bn: 'নাসিমা বেগমকে ক্ষতিপূরণ দিয়েছেন।',                          en: 'Paid Nasima Begum the compensation.' },
    oc_owes_you:             { bn: 'ওসি হাসান আপনার কাছে ঋণী।',                                 en: 'OC Hassan owes you a favor.' },
    corrupt_retirement:      { bn: 'হিসাব বইয়ের কিছু পাতা পুড়িয়েছেন।',                         en: 'Burned a few ledger pages on the way out.' }
  };

  function renderMoments(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    const items = [];

    // 1) Biggest single-stat hit
    if (state.biggestHit) {
      const h = state.biggestHit;
      const stat = STATS.find(s => s.key === h.stat);
      const statName = I18n.lang === 'bn' ? stat.name_bn : stat.name_en;
      const sign = h.delta > 0 ? '+' : '−';
      const mag  = Math.abs(h.delta);
      const magStr = I18n.lang === 'bn' ? I18n.toBanglaDigits(mag) : mag;
      const yr = I18n.lang === 'bn' ? 'বছর ' + I18n.toBanglaDigits(h.year) : 'Year ' + h.year;
      items.push({
        bn: `সবচেয়ে বড় ধাক্কা: ${h.characterName} — ${statName} ${sign}${magStr} (${yr})`,
        en: `Biggest single moment: ${h.characterName} — ${statName} ${sign}${magStr} (${yr})`
      });
    }

    // 2) A few flag-derived story beats — show up to 4
    const flagItems = state.flags
      .filter(f => MOMENT_FLAG_LINES[f])
      .slice(0, 4)
      .map(f => MOMENT_FLAG_LINES[f]);
    items.push(...flagItems);

    if (!items.length) {
      wrap.innerHTML = '';
      return;
    }

    wrap.innerHTML = `
      <p class="verdict__moments-label">
        <span data-lang-bn>স্মরণীয় মুহূর্ত</span>
        <span data-lang-en>DEFINING MOMENTS</span>
      </p>
      <ul class="verdict__moments-list">
        ${items.map(m => `
          <li>
            <span data-lang-bn>${m.bn}</span>
            <span data-lang-en>${m.en}</span>
          </li>
        `).join('')}
      </ul>
    `;
  }

  // ---------- Restart ----------
  function wireRestart() {
    ['btn-restart', 'btn-win-restart', 'btn-leaderboard-restart'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', () => {
        if (window.Sfx) Sfx.playClick();
        goto('splash');
        // Refresh the badge counter — any new unlocks from the run just
        // finished should show on the splash chip immediately.
        renderSplashAchievementCount();
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
        if (window.Analytics) {
          Analytics.track('share_click', {
            language: I18n.lang,
            meta: { from: id }
          });
        }
        if (!window.ShareCard || !state.lastVerdict) return;
        ShareCard.export({
          outcome:     state.lastVerdict.outcome,
          tier:        state.lastVerdict.tier,
          cause:       state.lastVerdict.cause,
          days:        state.day,
          stats:       { ...state.stats },
          flags:       [...state.flags],
          lang:        I18n.lang,
          statHistory: state.statHistory ? state.statHistory.slice() : null,
          biggestHit:  state.biggestHit
        });
      });
    });
  }

  // ---------- Credits modal ----------
  // Small overlay listing who made the thing. Bilingual; tap anywhere to close.
  // Content lives here (not in HTML) so updating credits is one diff in JS,
  // and the same lookup table populates both languages.
  const CREDITS = [
    {
      label_bn: 'ডিজাইন · প্রোগ্রামিং',
      label_en: 'Design · Code',
      value_bn: 'মো. রাফি হোসেন',
      value_en: 'Md. Rafy Hossain'
    },
    {
      label_bn: 'গল্প',
      label_en: 'Story',
      value_bn: 'One97 Technologies Pvt Ltd',
      value_en: 'One97 Technologies Pvt Ltd'
    },
    {
      label_bn: 'বাগ টেস্টিং',
      label_en: 'Bug testing',
      value_bn: 'রাফায়েত মজুমদার · নুরুল কাদের রিকো',
      value_en: 'Rafayet Mozumder · Nurul Quader Rico'
    },
    {
      label_bn: 'অনুপ্রেরণা',
      label_en: 'Inspired by',
      value_bn: 'Reigns (Nerial)',
      value_en: 'Reigns (Nerial)'
    },
    {
      label_bn: 'সঙ্গীত',
      label_en: 'Audio',
      value_bn: 'ওয়েব অডিও সিন্থেসিস · Pixabay অ্যাম্বিয়েন্ট',
      value_en: 'Web Audio synthesis · Pixabay ambient bed'
    },
    {
      label_bn: 'বিশেষ ধন্যবাদ',
      label_en: 'Special thanks',
      value_bn: 'সাউথ বারিধারা ইয়ুথ ক্লাব · ওয়ার্ড ৩৭-এর বাসিন্দারা',
      value_en: 'South Baridhara Youth Club · the residents of Ward 37'
    }
  ];

  function showCredits() {
    const rowsHtml = CREDITS.map(row => `
      <div class="credits__row">
        <div class="credits__label">
          <span data-lang-bn>${row.label_bn}</span>
          <span data-lang-en>${row.label_en}</span>
        </div>
        <div class="credits__value">
          <span data-lang-bn>${row.value_bn}</span>
          <span data-lang-en>${row.value_en}</span>
        </div>
      </div>
    `).join('');

    const overlay = document.createElement('div');
    overlay.className = 'credits';
    overlay.innerHTML = `
      <div class="credits__card" role="dialog" aria-modal="true">
        <button class="credits__close" type="button" aria-label="Close">&times;</button>
        <p class="credits__eyebrow">
          <span data-lang-bn>গদি · ২০২৬</span>
          <span data-lang-en>GODDI · 2026</span>
        </p>
        <h3 class="credits__title">
          <span data-lang-bn>কৃতজ্ঞতা</span>
          <span data-lang-en>Credits</span>
        </h3>
        <div class="credits__rows">${rowsHtml}</div>
        <p class="credits__footer">
          <span data-lang-bn>ঢাকায় তৈরি · এসবিওয়াইসির পরিবেশনায়</span>
          <span data-lang-en>Made in Dhaka · An SBYC presentation</span>
        </p>
        <p class="credits__dismiss">
          <span data-lang-bn>বাইরে ট্যাপ করে বন্ধ করুন</span>
          <span data-lang-en>Tap outside to close</span>
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('credits--shown'));

    function dismiss() {
      overlay.classList.add('credits--leaving');
      setTimeout(() => overlay.remove(), 240);
    }
    // Close on backdrop tap or X button — not on text tap, so the player
    // can read the rows comfortably on a phone.
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) dismiss();
    });
    overlay.querySelector('.credits__close').addEventListener('click', dismiss);
  }

  function wireCredits() {
    const btn = document.getElementById('btn-credits');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (window.Sfx) Sfx.playClick();
      if (window.Analytics) Analytics.track('credits_click', { language: window.I18n ? I18n.lang : null });
      showCredits();
    });
  }

  // ---------- Cameo / sponsorship modal ----------
  // Three-tier sponsorship menu. Player pays via SBYC channels (link is a
  // mailto so we don't take payment in-game); we hand-write the card into
  // the deck during the next content drop. Cameos are tagged [sponsored]
  // on the card — on-theme for a game about money in politics.
  const CAMEO_TIERS = [
    {
      id: 'stamp',
      name_bn: 'ছাপ', name_en: 'Stamp',
      desc_bn: 'নিউজ বুলেটিন কার্ডে আপনার বা আপনার ব্যবসার এক লাইনের উল্লেখ। প্রতি রানে একবার আসে।',
      desc_en: 'A one-line mention in a news-bulletin card. Appears once during a run.',
      personal: 2000,
      business: 3000
    },
    {
      id: 'cameo',
      name_bn: 'কেমিও', name_en: 'Cameo',
      desc_bn: 'নাম ও সংলাপ সহ একটি পূর্ণ কার্ড। সাধারণ বাসিন্দা বা দোকানের পোর্ট্রেট। আপনি লাইন লেখেন, আমরা টোন ঠিক করি।',
      desc_en: 'A full named card with your line of dialog. Generic resident / shopfront portrait. You write it, we polish for tone.',
      personal: 5000,
      business: 10000
    },
    {
      id: 'featured',
      name_bn: 'ফিচারড', name_en: 'Featured',
      desc_bn: 'কাস্টম পোর্ট্রেট এবং রানে একটি বিশেষ অবস্থান। গল্পের সাথে মানালে পুনঃউল্লেখ। বছরে সীমিত স্লট।',
      desc_en: 'Custom-drawn portrait and a dedicated card placement. Recurring callbacks if your story fits. Limited slots per year.',
      personal: 25000,
      business: 50000
    }
  ];

  // Bangla digit helper for prices — uses I18n if available, falls back to
  // a small inline converter so this works even if I18n hasn't loaded yet.
  function _bnDigits(n) {
    if (window.I18n && I18n.toBanglaDigits) return I18n.toBanglaDigits(n);
    const map = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(n).replace(/\d/g, d => map[d]);
  }
  function _fmtPriceEn(n) { return '৳' + n.toLocaleString('en-IN'); }
  function _fmtPriceBn(n) {
    // 5,000 -> ৫,০০০ (Indian grouping is fine; Bangla just localizes digits)
    return '৳' + _bnDigits(n.toLocaleString('en-IN'));
  }

  function showCameo() {
    const tiersHtml = CAMEO_TIERS.map(t => `
      <div class="cameo-tier" data-tier-id="${t.id}">
        <div class="cameo-tier__header">
          <div class="cameo-tier__name">
            <span data-lang-bn>${t.name_bn}</span>
            <span data-lang-en>${t.name_en}</span>
          </div>
          <div class="cameo-tier__prices">
            <span class="cameo-tier__price cameo-tier__price--personal">
              <span class="cameo-tier__price-label">
                <span data-lang-bn>ব্যক্তিগত</span>
                <span data-lang-en>Personal</span>
              </span>
              <span class="cameo-tier__price-value">
                <span data-lang-bn>${_fmtPriceBn(t.personal)}</span>
                <span data-lang-en>${_fmtPriceEn(t.personal)}</span>
              </span>
            </span>
            <span class="cameo-tier__price cameo-tier__price--business">
              <span class="cameo-tier__price-label">
                <span data-lang-bn>ব্যবসা</span>
                <span data-lang-en>Business</span>
              </span>
              <span class="cameo-tier__price-value">
                <span data-lang-bn>${_fmtPriceBn(t.business)}</span>
                <span data-lang-en>${_fmtPriceEn(t.business)}</span>
              </span>
            </span>
          </div>
        </div>
        <p class="cameo-tier__desc">
          <span data-lang-bn>${t.desc_bn}</span>
          <span data-lang-en>${t.desc_en}</span>
        </p>
      </div>
    `).join('');

    const overlay = document.createElement('div');
    overlay.className = 'cameo';
    overlay.innerHTML = `
      <div class="cameo__card" role="dialog" aria-modal="true">
        <button class="cameo__close" type="button" aria-label="Close">&times;</button>

        <p class="cameo__eyebrow">
          <span data-lang-bn>গদি · কেমিও</span>
          <span data-lang-en>GODDI · CAMEO</span>
        </p>
        <h3 class="cameo__title">
          <span data-lang-bn>কেমিও স্পনসর করুন</span>
          <span data-lang-en>Sponsor a cameo</span>
        </h3>
        <p class="cameo__lede">
          <span data-lang-bn>নিজেকে বা আপনার ব্যবসাকে গদির ওয়ার্ড ৩৭-এ স্থায়ী করে রেখে যান। প্রতিটি কেমিও কার্ডে <em>[পৃষ্ঠপোষিত]</em> ট্যাগ থাকবে — যা এই খেলার বিষয়বস্তুর সাথে মানানসই।</span>
          <span data-lang-en>Put yourself or your business permanently into Ward 37. Every sponsored card carries a small <em>[sponsored]</em> tag — fitting, for a game about envelopes.</span>
        </p>

        <div class="cameo__tiers">${tiersHtml}</div>

        <div class="cameo__rules">
          <p class="cameo__rules-heading">
            <span data-lang-bn>নিয়ম</span>
            <span data-lang-en>The fine print</span>
          </p>
          <ul class="cameo__rules-list">
            <li>
              <span data-lang-bn>লিড টাইম ৪–৬ সপ্তাহ। কার্ড লাইভ হওয়ার আগে আপনি প্রিভিউ দেখতে পারবেন।</span>
              <span data-lang-en>Lead time: 4–6 weeks. You'll see a preview before the card goes live.</span>
            </li>
            <li>
              <span data-lang-bn>শুধু নিজের বা নিজের ব্যবসার কেমিও চলবে। অন্য কারো নাম বললে তাঁর লিখিত অনুমতি লাগবে।</span>
              <span data-lang-en>You can cameo only yourself or your own business. Naming a third party requires their written consent.</span>
            </li>
            <li>
              <span data-lang-bn>আমরা ব্যঙ্গাত্মক টোনের সাথে মেলে না বা কোনো ব্যক্তি/গোষ্ঠীকে অন্যায়ভাবে আক্রমণ করে — এমন কেমিও ফিরিয়ে দিতে পারি।</span>
              <span data-lang-en>We may decline cameos that conflict with the satirical tone or unfairly target real people or groups.</span>
            </li>
            <li>
              <span data-lang-bn>সব কার্ডে <strong>[পৃষ্ঠপোষিত]</strong> ট্যাগ থাকবে।</span>
              <span data-lang-en>Every cameo card is openly labelled <strong>[sponsored]</strong>.</span>
            </li>
            <li>
              <span data-lang-bn>সম্পূর্ণ অর্থ সাউথ বারিধারা ইয়ুথ ক্লাবের ব্যাংক অ্যাকাউন্টে যায় — হোস্টিং খরচ ও ক্লাবের কাজের জন্য।</span>
              <span data-lang-en>All funds go to the South Baridhara Youth Club bank account — covering hosting and SBYC programs.</span>
            </li>
          </ul>
        </div>

        <a class="cameo__cta" href="mailto:info@southbaridharayouthclub.org?subject=Goddi%20cameo%20enquiry"
           target="_blank" rel="noopener">
          <span class="cameo__cta-label">
            <span data-lang-bn>ইমেল পাঠান</span>
            <span data-lang-en>Email us</span>
          </span>
          <span class="cameo__cta-address">info@southbaridharayouthclub.org</span>
        </a>

        <p class="cameo__dismiss">
          <span data-lang-bn>বাইরে ট্যাপ করে বন্ধ করুন</span>
          <span data-lang-en>Tap outside to close</span>
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('cameo--shown'));

    function dismiss() {
      overlay.classList.add('cameo--leaving');
      setTimeout(() => overlay.remove(), 240);
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) dismiss();
    });
    overlay.querySelector('.cameo__close').addEventListener('click', dismiss);
  }

  function wireCameo() {
    const btn = document.getElementById('btn-cameo');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (window.Sfx) Sfx.playClick();
      if (window.Analytics) Analytics.track('cameo_click', { language: window.I18n ? I18n.lang : null });
      showCameo();
    });
  }

  // ---------- Badges grid modal ----------
  // Tapping the splash chip opens a grid of all achievements. Locked ones are
  // shown as dashed silhouettes so the player can see what they're chasing.
  function showBadgesGrid() {
    if (!window.Achievements) return;
    const all      = Achievements.list();
    const unlocked = Achievements.unlocked();
    const got      = unlocked.size;
    const total    = all.length;

    const itemsHtml = all.map(a => {
      const isUnlocked = unlocked.has(a.id);
      const cls = 'badge-item ' + (isUnlocked ? 'badge-item--unlocked' : 'badge-item--locked');
      const nameBn = isUnlocked ? a.name_bn : '???';
      const nameEn = isUnlocked ? a.name_en : '???';
      const descBn = isUnlocked ? a.desc_bn : 'এখনও অর্জিত নয়';
      const descEn = isUnlocked ? a.desc_en : 'Not yet earned';
      return `
        <div class="${cls}">
          <div class="badge-item__seal">${isUnlocked ? '★' : '·'}</div>
          <div class="badge-item__body">
            <div class="badge-item__name">
              <span data-lang-bn>${nameBn}</span>
              <span data-lang-en>${nameEn}</span>
            </div>
            <div class="badge-item__desc">
              <span data-lang-bn>${descBn}</span>
              <span data-lang-en>${descEn}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'badges-modal';
    overlay.innerHTML = `
      <div class="badges-modal__card" role="dialog" aria-modal="true">
        <button class="badges-modal__close" type="button" aria-label="Close">&times;</button>
        <p class="badges-modal__eyebrow">
          <span data-lang-bn>আপনার ব্যাজসমূহ</span>
          <span data-lang-en>YOUR BADGES</span>
        </p>
        <p class="badges-modal__progress">
          <span data-lang-bn>${I18n.toBanglaDigits(got)} / ${I18n.toBanglaDigits(total)} সংগ্রহ করেছেন</span>
          <span data-lang-en>${got} of ${total} collected</span>
        </p>
        <div class="badges-modal__grid">${itemsHtml}</div>
        <p class="badges-modal__dismiss">
          <span data-lang-bn>বাইরে ট্যাপ করে বন্ধ করুন</span>
          <span data-lang-en>Tap outside to close</span>
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('badges-modal--shown'));

    function dismiss() {
      overlay.classList.add('badges-modal--leaving');
      setTimeout(() => overlay.remove(), 240);
    }
    // Close on backdrop click, but not on card click. Close button also dismisses.
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) dismiss();
    });
    overlay.querySelector('.badges-modal__close').addEventListener('click', dismiss);
  }

  function wireBadgesChip() {
    const chip = document.getElementById('splash-achievement-count');
    if (!chip) return;
    chip.addEventListener('click', () => {
      if (window.Sfx) Sfx.playClick();
      showBadgesGrid();
    });
  }

  // ---------- Achievement toast ----------
  // Slides in from the bottom when a new achievement unlocks. Single toast
  // at a time — if multiple unlock together (common at verdict), they queue
  // and play one after another so they don't overlap on a phone screen.
  const _achievementQueue = [];
  let _achievementShowing = false;

  function showAchievementToast(def) {
    if (!def) return;
    _achievementQueue.push(def);
    if (!_achievementShowing) _playNextAchievementToast();
  }

  function _playNextAchievementToast() {
    const def = _achievementQueue.shift();
    if (!def) { _achievementShowing = false; return; }
    _achievementShowing = true;
    const t = document.createElement('div');
    t.className = 'achievement-toast';
    t.innerHTML = `
      <div class="achievement-toast__eyebrow">
        <span data-lang-bn>ব্যাজ অর্জিত</span>
        <span data-lang-en>BADGE UNLOCKED</span>
      </div>
      <div class="achievement-toast__name">
        <span data-lang-bn>${def.name_bn}</span>
        <span data-lang-en>${def.name_en}</span>
      </div>
      <div class="achievement-toast__desc">
        <span data-lang-bn>${def.desc_bn}</span>
        <span data-lang-en>${def.desc_en}</span>
      </div>
    `;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('achievement-toast--shown'));
    // Optional confetti chime (very soft pluck) when supported
    if (window.Sfx && typeof Sfx.playUnlock === 'function') {
      try { Sfx.playUnlock(); } catch (_) {}
    }
    setTimeout(() => {
      t.classList.add('achievement-toast--leaving');
      setTimeout(() => {
        t.remove();
        _playNextAchievementToast();
      }, 400);
    }, 2600);
  }

  // Splash badge-count chip — always visible so the badges grid is
  // discoverable from the first run ("0 / 15 badges — tap to see").
  function renderSplashAchievementCount() {
    if (!window.Achievements) return;
    const el = document.getElementById('splash-achievement-count');
    if (!el) return;
    const total = Achievements.list().length;
    const got   = Achievements.unlocked().size;
    el.querySelector('[data-lang-bn]').textContent =
      I18n.toBanglaDigits(got) + ' / ' + I18n.toBanglaDigits(total) + ' ব্যাজ';
    el.querySelector('[data-lang-en]').textContent =
      got + ' / ' + total + ' badges';
    el.hidden = false;
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

    // Populate the splash badge chip immediately — does NOT depend on
    // cards.json. Means the chip never renders empty if loadData is slow.
    if (window.Achievements) renderSplashAchievementCount();

    // Re-render dynamic UI on language change
    const origToggle = I18n.toggle.bind(I18n);
    I18n.toggle = function () {
      origToggle();
      if (window.Analytics) {
        Analytics.track('language_toggle', {
          language: I18n.lang,
          meta: { screen: document.body.getAttribute('data-screen') }
        });
      }
      // If we're mid-game, redraw. If we're on party-select, redraw cards.
      const screen = document.body.getAttribute('data-screen');

      // Bilingual achievement — fires once per run if the player ever
      // switches languages mid-game (only when actually playing, not
      // splash-screen flipping).
      if (screen === 'play' && state.flags && !state.flags.includes('toggled_lang')) {
        state.flags.push('toggled_lang');
        if (window.Achievements) Achievements.evaluate(state);
      }
      if (screen === 'play')       { renderHud(); renderStats(); redrawCurrentCard(); }
      if (screen === 'background') { renderBackgroundGrid(); }
      if (screen === 'party')      { renderPartyGrid(); }
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
    wireBackgroundSelect();
    wirePartySelect();
    wireModeSelect();
    wireRestart();
    wireShare();
    wireLeaderboardButtons();
    wireCredits();
    wireCameo();
    wireBadgesChip();
    wireMuteToggle();
    handleBrandFade();

    // Achievement toast wiring + splash chip render + analytics
    if (window.Achievements) {
      Achievements.onUnlock(showAchievementToast);
      Achievements.onUnlock(def => {
        if (window.Analytics && def) {
          Analytics.track('achievement_unlock', {
            achievement_id: def.id,
            language:       window.I18n ? I18n.lang : null
          });
        }
      });
      renderSplashAchievementCount();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
