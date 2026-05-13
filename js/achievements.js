/* ==========================================================
   Achievements — flag-based badges persisted in localStorage.
   Each achievement has a `check(ctx)` function that runs after
   every commit and after each verdict. Once unlocked, an
   achievement stays unlocked across all runs (per browser).

   Public API:
     Achievements.evaluate(state)        — runs after a commit
     Achievements.evaluateVerdict(state) — runs after a verdict
     Achievements.unlocked()             — Set<id> of unlocked
     Achievements.list()                 — array of definitions
     Achievements.onUnlock(callback)     — register a listener
   ========================================================== */
(function () {
  'use strict';

  const STORAGE_KEY = 'goddi.achievements';

  const ACHIEVEMENTS = [
    // ---------- Milestone reach ----------
    {
      id: 'first_swipe',
      name_bn: 'প্রথম রায়', name_en: 'First Verdict',
      desc_bn: 'আপনার প্রথম সিদ্ধান্ত নিয়েছেন।',
      desc_en: 'You made your first call as Councillor.',
      check: (s) => s.seenFirstCard
    },
    {
      id: 'year_2',
      name_bn: 'মৌসুম পার', name_en: 'Survived the Monsoon',
      desc_bn: 'দ্বিতীয় বছর পর্যন্ত টিকে গেছেন।',
      desc_en: 'Made it past Year 1 of your tenure.',
      check: (s) => s.year >= 2
    },
    {
      id: 'year_5',
      name_bn: 'পাঁচ বছর', name_en: 'Full Tenure',
      desc_bn: 'পঞ্চম বছরে পৌঁছেছেন।',
      desc_en: 'Reached Year 5 of your tenure.',
      check: (s) => s.year >= 5
    },
    // ---------- Story flags ----------
    {
      id: 'flood_walker',
      name_bn: 'কোমর-পানিতে হেঁটেছেন', name_en: 'Waist-Deep',
      desc_bn: 'বন্যার সময় গাড়ি থেকে নেমেছিলেন।',
      desc_en: 'You stepped out of the car when the ward was underwater.',
      check: (s) => s.flags.includes('flood_walk')
    },
    {
      id: 'tower_fell',
      name_bn: 'বশিরের ভবন পড়েছিল', name_en: 'The Tower Fell',
      desc_bn: 'বশিরের প্রথম টাওয়ার ধসে পড়েছে।',
      desc_en: 'You watched Bashir\'s first tower come down.',
      check: (s) => s.flags.includes('tower_collapsed')
    },
    {
      id: 'two_towers',
      name_bn: 'দ্বিতীয়টাও পড়ল', name_en: 'And Then Another',
      desc_bn: 'দ্বিতীয় টাওয়ারও ধসেছে। তবুও বেঁচে আছেন।',
      desc_en: 'A second tower fell. You\'re somehow still in the seat.',
      check: (s) => s.flags.includes('tower2_collapsed')
    },
    {
      id: 'envelope_taker',
      name_bn: 'এনভেলপ-বিশারদ', name_en: 'Envelope Expert',
      desc_bn: 'ছোট্ট একটা উপহার গ্রহণ করেছিলেন।',
      desc_en: 'You accepted a "small gift" at the festival.',
      check: (s) => s.flags.includes('taking_envelopes')
    },
    {
      id: 'karim_attended',
      name_bn: 'করিমের জানাজায়', name_en: 'Karim\'s Janaza',
      desc_bn: 'করিম মিয়াকে বিদায় জানাতে এসেছিলেন।',
      desc_en: 'You came to bid Karim Miah farewell.',
      check: (s) => s.flags.includes('karim_helped')
    },
    {
      id: 'sbyc_legacy',
      name_bn: 'এসবিওয়াইসির ভিত্তি', name_en: 'SBYC Cornerstone',
      desc_bn: 'এসবিওয়াইসির স্থায়ী ভবন আপনার অনুদানে।',
      desc_en: 'Your foundation stone is set in the SBYC building.',
      check: (s) => s.flags.includes('sbyc_legacy')
    },
    {
      id: 'defector',
      name_bn: 'দলবদলকারী', name_en: 'The Defector',
      desc_bn: 'অন্য দলে চলে গেলেন চেয়ারম্যানির জন্য।',
      desc_en: 'You switched parties for the chairman\'s seat.',
      check: (s) => s.flags.includes('defected')
    },
    {
      id: 'pa_loyal_friend',
      name_bn: 'সেলিমের বন্ধু', name_en: 'Selim\'s Friend',
      desc_bn: 'সেলিমকে শেষ পর্যন্ত ছেড়ে দেননি।',
      desc_en: 'You never abandoned Selim, all the way to the end.',
      check: (s) => s.flags.includes('pa_loyal') && !s.flags.includes('pa_betrayed')
    },
    // ---------- Verdict-time achievements ----------
    {
      id: 'win_clean',
      name_bn: 'সততার বিজয়', name_en: 'Won With Integrity',
      desc_bn: 'একটিও কালো পতাকা ছাড়াই পাঁচ বছর পেরিয়েছেন।',
      desc_en: 'Five years served, not a single dirty flag.',
      verdictOnly: true,
      check: (s, v) => v && v.outcome === 'win' && v.tier === 'clean'
    },
    {
      id: 'win_compromised',
      name_bn: 'মূল্য দিয়ে কেনা', name_en: 'Paid the Price',
      desc_bn: 'টিকে গেলেন, কিন্তু কত কিছু রেখে এলেন।',
      desc_en: 'You survived. The price is in the books.',
      verdictOnly: true,
      check: (s, v) => v && v.outcome === 'win' && v.tier === 'compromised'
    },
    {
      id: 'death_protest',
      name_bn: 'জনতার হাতে', name_en: 'By the People',
      desc_bn: 'গণবিক্ষোভে অফিস ঘিরেছিল।',
      desc_en: 'The crowd surrounded your office and you slipped out the back.',
      verdictOnly: true,
      check: (s, v) => v && v.outcome === 'death' && v.cause === 'janata_low'
    },
    {
      id: 'death_bankrupt',
      name_bn: 'দেউলিয়া বিদায়', name_en: 'Out of Money',
      desc_bn: 'তহবিল শূন্য। আর কিছু করার ছিল না।',
      desc_en: 'The treasury ran dry. Nothing left to do but resign.',
      verdictOnly: true,
      check: (s, v) => v && v.outcome === 'death' && v.cause === 'tohobil_low'
    }
  ];

  // Load & save
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) { return new Set(); }
  }
  function save(set) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); }
    catch (_) {}
  }

  let _unlocked = load();
  const listeners = [];

  function unlock(id) {
    if (_unlocked.has(id)) return false;
    _unlocked.add(id);
    save(_unlocked);
    const def = ACHIEVEMENTS.find(a => a.id === id);
    listeners.forEach(fn => { try { fn(def); } catch (_) {} });
    return true;
  }

  function evaluate(state) {
    // Run non-verdict checks
    ACHIEVEMENTS.forEach(a => {
      if (a.verdictOnly) return;
      if (_unlocked.has(a.id)) return;
      try { if (a.check(state)) unlock(a.id); } catch (_) {}
    });
  }
  function evaluateVerdict(state, verdict) {
    ACHIEVEMENTS.forEach(a => {
      if (_unlocked.has(a.id)) return;
      try {
        if (a.verdictOnly && a.check(state, verdict)) unlock(a.id);
        else if (!a.verdictOnly && a.check(state)) unlock(a.id);
      } catch (_) {}
    });
  }
  function unlocked() { return new Set(_unlocked); }
  function list() { return ACHIEVEMENTS.slice(); }
  function onUnlock(cb) { listeners.push(cb); }

  window.Achievements = { evaluate, evaluateVerdict, unlocked, list, onUnlock };
})();
