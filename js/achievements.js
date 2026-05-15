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
    },

    // ---------- New arc-callback flags (from A51-A58) ----------
    {
      id: 'masjid_committee',
      name_bn: 'মসজিদ কমিটিতে', name_en: 'On the Masjid Committee',
      desc_bn: 'মুরুব্বিরা আপনার নাম কমিটিতে রেখেছেন।',
      desc_en: 'The elders put your name on the masjid committee.',
      check: (s) => s.flags.includes('ulema_aligned')
    },
    {
      id: 'oc_favor_used',
      name_bn: 'ফাইল হারিয়ে গেল', name_en: 'The File Disappeared',
      desc_bn: 'ওসি হাসান আপনার নামের অভিযোগ চাপা দিয়েছেন।',
      desc_en: 'OC Hassan made a complaint about you disappear.',
      check: (s) => s.flags.includes('complaint_buried')
    },
    {
      id: 'vote_bought',
      name_bn: 'ভোট কিনলেন', name_en: 'Bought the Vote',
      desc_bn: 'এমপির ফোনের পর ৫০০ টাকা প্রতি ঘরে গেছে।',
      desc_en: 'After the MP\'s call, ৳500 reached every household.',
      check: (s) => s.flags.includes('votebuying')
    },
    {
      id: 'two_truck_families',
      name_bn: 'এক হলে আরও আসে', name_en: 'And Two More Came',
      desc_bn: 'নাসিমা বেগম আরও দু\'টি পরিবার নিয়ে এসেছিলেন। আপনি ফেরত পাঠাননি।',
      desc_en: 'Nasima brought two more families. You didn\'t turn them away.',
      check: (s) => s.flags.includes('two_families_helped')
    },
    {
      id: 'dilemma_strike',
      name_bn: 'হরতাল ক্লিয়ার করেছেন', name_en: 'Cleared the Strike',
      desc_bn: 'বিরোধী দলের অবরোধ পুলিশ দিয়ে ভেঙেছেন।',
      desc_en: 'Cleared the opposition\'s blockade with the police.',
      check: (s) => s.flags.includes('hartal_cleared')
    },
    {
      id: 'dilemma_school',
      name_bn: 'এমপির ছেলের পরীক্ষা', name_en: 'The MP\'s Son\'s Exam',
      desc_bn: 'হাসপাতাল না, স্কুলের জেনারেটর জ্বালালেন।',
      desc_en: 'You fueled the school generator, not the hospital.',
      check: (s) => s.flags.includes('chose_school_over_hospital')
    },

    // ---------- Stat-extremes (close calls) ----------
    {
      id: 'razors_edge',
      name_bn: 'একদম ধারে', name_en: 'Razor\'s Edge',
      desc_bn: 'কোনো স্ট্যাট ৫ বা ৯৫-এ পৌঁছে আবার ফিরে এসেছে।',
      desc_en: 'A stat hit 5 or 95 and somehow came back.',
      check: (s) => s.flags.includes('saw_edge')
    },

    // ---------- Year/lang/badge meta ----------
    {
      id: 'monsoon_survivor',
      name_bn: 'বন্যা পেরিয়েছেন', name_en: 'Past the Monsoon',
      desc_bn: 'তোহোবিল ৩০-এর নিচে নামালে নয়, কিন্তু মৌসুমের ধাক্কাটা পেরিয়েছেন।',
      desc_en: 'Made it past the Monsoon hit without your treasury collapsing.',
      check: (s) => s.year >= 3 && s.stats && s.stats.tohobil >= 30
    },
    {
      id: 'bilingual',
      name_bn: 'দুই ভাষায়', name_en: 'In Both Languages',
      desc_bn: 'এক রানের মধ্যে বাংলা ও ইংরেজি — দুটোই দেখেছেন।',
      desc_en: 'Toggled between Bangla and English mid-run.',
      check: (s) => s.flags.includes('toggled_lang')
    },
    {
      id: 'completionist',
      name_bn: 'সংগ্রাহক', name_en: 'Collector',
      desc_bn: 'মোট ১০টি ব্যাজ অর্জন করেছেন।',
      desc_en: 'Unlocked 10 total badges across all your runs.',
      check: (s) => false,  // computed separately — see evaluateMeta below
      meta: true
    },

    // ============================================================
    // Covid mission achievements — only fire on covid runs
    // ============================================================
    {
      id: 'covid_first_wave',
      name_bn: 'প্রথম ঢেউয়ের সাক্ষী', name_en: 'Survived the First Wave',
      desc_bn: 'কোভিড মিশনে প্রথম ঢেউ পার করেছেন।',
      desc_en: 'In Survive Covid, you made it past the first wave.',
      check: (s) => s.player && s.player.mode === 'covid' && s.day >= 215
    },
    {
      id: 'covid_second_wave',
      name_bn: 'দ্বিতীয় ঢেউয়ের সাক্ষী', name_en: 'Survived the Second Wave',
      desc_bn: 'কোভিড মিশনে দ্বিতীয় ঢেউ পার করেছেন।',
      desc_en: 'In Survive Covid, you made it past the deadly second wave.',
      check: (s) => s.player && s.player.mode === 'covid' && s.day >= 545
    },
    {
      id: 'covid_clean_relief',
      name_bn: 'নিরপেক্ষ ত্রাণ', name_en: 'Clean Relief',
      desc_bn: 'ত্রাণ-তহবিল আত্মসাৎ না করে কোভিড মিশন শেষ করেছেন।',
      desc_en: 'Finished Survive Covid without touching relief funds.',
      check: (s) => s.player && s.player.mode === 'covid'
                 && !s.flags.includes('relief_pocketed')
                 && !s.flags.includes('relief_partisan')
                 && s.day >= 730
    },
    {
      id: 'covid_vaccine_helper',
      name_bn: 'টিকার সারথি', name_en: 'Vaccine Helper',
      desc_bn: 'বয়স্ক ও সাধারণ মানুষকে টিকা পেতে সাহায্য করেছেন।',
      desc_en: 'Set up the ward help-desk AND brought doorstep vaccines.',
      check: (s) => s.player && s.player.mode === 'covid'
                 && s.flags.includes('vax_helpdesk')
                 && s.flags.includes('doorstep_vax')
    },
    {
      id: 'covid_frontliner_friend',
      name_bn: 'ফ্রন্টলাইনারদের পাশে', name_en: 'Friend of the Frontline',
      desc_bn: 'মৃত স্বাস্থ্যকর্মীদের পরিবারের জন্য লড়েছেন।',
      desc_en: 'Pushed compensation for fallen health workers, twice.',
      check: (s) => s.player && s.player.mode === 'covid'
                 && s.flags.includes('frontline_paid')
                 && s.flags.includes('frontline_compensated')
    },
    {
      id: 'covid_burial_organizer',
      name_bn: 'দাফন আয়োজক', name_en: 'When the System Wouldn\'t Bury',
      desc_bn: 'কোভিড দাফনে নিজে এগিয়ে এসেছেন।',
      desc_en: 'Stepped up to organise Covid burials when no one else would.',
      check: (s) => s.player && s.player.mode === 'covid'
                 && (s.flags.includes('volunteer_burials') || s.flags.includes('sbyc_burial'))
    },
    {
      id: 'covid_honest_count',
      name_bn: 'সংখ্যা গোপন করেননি', name_en: 'Honest Toll',
      desc_bn: 'মৃতের প্রকৃত সংখ্যা প্রকাশ করেছেন — দল রাগ করলেও।',
      desc_en: 'Gave the real ward death toll, even when the party didn\'t want it.',
      check: (s) => s.player && s.player.mode === 'covid' && s.flags.includes('death_count_honest')
    },
    {
      id: 'covid_full_term',
      name_bn: 'দুই বছরের কাউন্সিলর', name_en: 'Survive Covid — Full Term',
      desc_bn: 'মার্চ ২০২০ থেকে মার্চ ২০২২ — পুরো কোভিড পর্ব শেষ করেছেন।',
      desc_en: 'March 2020 to March 2022 — completed the full Covid term.',
      check: (s, verdict) => s.player && s.player.mode === 'covid'
                          && verdict && verdict.outcome === 'win',
      verdictOnly: true
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

  // Meta-achievements depend on cross-run state (e.g., "you have N badges").
  // They re-evaluate themselves every time anything else unlocks.
  function evaluateMeta() {
    ACHIEVEMENTS.forEach(a => {
      if (!a.meta) return;
      if (_unlocked.has(a.id)) return;
      // Built-in meta rules
      if (a.id === 'completionist' && _unlocked.size >= 10) unlock(a.id);
    });
  }

  function evaluate(state) {
    // Run non-verdict checks
    ACHIEVEMENTS.forEach(a => {
      if (a.verdictOnly || a.meta) return;
      if (_unlocked.has(a.id)) return;
      try { if (a.check(state)) unlock(a.id); } catch (_) {}
    });
    evaluateMeta();
  }
  function evaluateVerdict(state, verdict) {
    ACHIEVEMENTS.forEach(a => {
      if (a.meta) return;
      if (_unlocked.has(a.id)) return;
      try {
        if (a.verdictOnly && a.check(state, verdict)) unlock(a.id);
        else if (!a.verdictOnly && a.check(state)) unlock(a.id);
      } catch (_) {}
    });
    evaluateMeta();
  }
  function unlocked() { return new Set(_unlocked); }
  function list() { return ACHIEVEMENTS.slice(); }
  function onUnlock(cb) { listeners.push(cb); }

  window.Achievements = { evaluate, evaluateVerdict, unlocked, list, onUnlock };
})();
