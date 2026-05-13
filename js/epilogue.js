/* ==========================================================
   Epilogue — multi-paragraph reflection composer
   - Takes outcome (win-tier or death-cause) + flag history
   - Returns 3–4 paragraph epilogue body composed from fragments
   - Each significant flag has an associated "consequence line";
     the composer picks the most weighty ones and chains them.
   - Bilingual: { bn: [...paragraphs], en: [...paragraphs] }
   ========================================================== */
(function () {
  'use strict';

  // ------------------------------------------------------------
  // Consequence lines — one per flag. These are the "what came of
  // your choice" sentences that get woven into the epilogue body.
  // ------------------------------------------------------------
  const FLAG_LINES = {
    taking_envelopes: {
      bn: 'এনভেলপগুলো কখনো আদালতে আসেনি, কিন্তু ওয়ার্ডের সবাই আপনার আসল আয়ের অঙ্ক জানে।',
      en: 'The envelopes never reached a courtroom, but everyone in the ward knows your real income.',
      weight: 2
    },
    tower_approved: {
      bn: 'বশিরের বারো তলা উঠেছিল যত দ্রুত — কোডের চেয়েও দ্রুত। স্ট্রাকচারাল রিপোর্ট কখনো খবরের কাগজে আসেনি।',
      en: 'Bashir\'s twelve stories went up faster than the code allowed. The structural reports never made it to the papers.',
      weight: 2
    },
    tower_collapsed: {
      bn: 'বশিরের বারো তলা দাঁড়িয়েছিল। দাঁড়িয়েছিল, যতদিন না পড়ে গেল। সাতটি পরিবার আজও আপনাকে চিঠি লেখে।',
      en: 'Bashir\'s twelve stories stood. Stood — until they didn\'t. Seven families still write you letters.',
      weight: 3
    },
    tower2_approved: {
      bn: 'এরপর আপনি তাকে আরও একটা ভবন তুলতে দিলেন। কেউ আপনাকে থামাতে চেষ্টা করেনি।',
      en: 'And then you let him build another. No one tried to stop you.',
      weight: 3
    },
    tower2_collapsed: {
      bn: 'দ্বিতীয় ভবনও পড়ে গেল। এবারের মৃতের সংখ্যা ছিল চৌদ্দ।',
      en: 'The second tower fell too. The dead, this time, numbered fourteen.',
      weight: 4
    },
    tower_blamed_contractor: {
      bn: 'আপনি দায় ঠিকাদারের কাঁধে দিলেন। ঠিকাদার জেলে গেল। বশির সিঙ্গাপুরে ছুটি কাটাল।',
      en: 'You laid the blame on the contractor. The contractor went to prison. Bashir vacationed in Singapore.',
      weight: 2
    },
    acc_stonewalled: {
      bn: 'দুদকের ফাইলটা রেকর্ড অফিসের একটা "আগুনে" হারিয়ে গেল। সুবিধাজনক।',
      en: 'The ACC file was "lost" in a fire at the records office. Convenient.',
      weight: 2
    },
    votebuying: {
      bn: 'প্রতি বাড়িতে পাঁচশো টাকা। দেড় হাজার ঘর। হিসাবটা কোথাও না কোথাও আছে।',
      en: 'Five hundred taka per household. Fifteen hundred families. The math sits in a notebook somewhere.',
      weight: 2
    },
    ec_bribed: {
      bn: 'নির্বাচন কমিশনের অডিটর উপহার নিয়ে চলে গেলেন। নিদ্রা ভাঙবে না।',
      en: 'The Election Commission auditor accepted the gift and left. Your sleep stays untroubled.',
      weight: 1
    },
    defected: {
      bn: 'দলবদলে চেয়ারম্যানের পদ এসেছিল। সাথে এসেছিল দুই পাশের শত্রু।',
      en: 'Switching parties bought you a chairman\'s seat. It also bought you enemies on both sides.',
      weight: 2
    },
    corrupt_retirement: {
      bn: 'বিদেশের ফ্ল্যাট অপেক্ষা করে। মঞ্চের বিদায়ী ভাষণও অপেক্ষা করে। তারা একই দালানে আছে।',
      en: 'The overseas flat waits. The stage-and-garland farewell waits. They sit in the same building.',
      weight: 3
    },
    pa_protected: {
      bn: 'আপনি সেলিমকে রক্ষা করেছিলেন। সেলিম জেলে গেল। আপনি গদিতে থেকে গেলেন।',
      en: 'You shielded Selim. Selim went to prison. You kept the seat.',
      weight: 2
    },
    pa_loyal: {
      bn: 'সেলিম যখন কেউ তার পাশে নাই, আপনি ছিলেন। সে মনে রাখে।',
      en: 'When no one stood with Selim, you did. He remembers.',
      weight: 1
    },
    pa_betrayed: {
      bn: 'সেলিম জেল থেকে চিঠি লিখেছিল। জবাব আসেনি। সে এখন মুক্ত, এবং আপনার নাম মনে আছে।',
      en: 'Selim wrote you from inside. You never replied. He\'s free now — and your name is on his list.',
      weight: 2
    },
    pa_fired: {
      bn: 'আপনি সেলিমকে কেটে ছেঁটে ফেললেন। দল লিখে রাখল কে আগে চোখ নামাল।',
      en: 'You cut Selim loose immediately. The party noted who blinked first.',
      weight: 1
    },
    mosque_funded: {
      bn: 'নতুন মাইক সিস্টেমের আজান দিনে আটবার আপনার নাম পৌঁছায়।',
      en: 'The new mosque speakers carry your name to the neighborhood eight times a day.',
      weight: 1
    },
    compensation_paid: {
      bn: 'নাসিমা বেগমের ছেলেটা এখন হাঁটে। তার মুখে গল্পটা পত্রিকা যেভাবে ছেপেছিল তার চেয়ে আলাদা।',
      en: 'Nasima Begum\'s son walks now. She tells the story differently from how the papers ran it.',
      weight: 1
    },
    karim_helped: {
      bn: 'করিম মিয়া বেঁচে ছিল আপনার পক্ষে দু-বার ভোট দেওয়ার মতো বেশি দিন। জানাজার খরচ আপনার পকেট থেকে গেছে।',
      en: 'Karim Miah lived long enough to vote for you twice. His janaza was paid from your pocket.',
      weight: 2
    },
    flood_walk: {
      bn: 'কোমর-সমান পানিতে দাঁড়ানো আপনার ছবিটা এখনো কোনো এক চা-দোকানে টানানো আছে।',
      en: 'The photo of you waist-deep in monsoon water still hangs at someone\'s chai stall.',
      weight: 2
    },
    oc_owes_you: {
      bn: 'ওসি একটা ঋণে বাঁধা ছিলেন। আপনি সেটা একবার ব্যবহার করেছেন।',
      en: 'The OC owed you a favor. You spent it. Once.',
      weight: 1
    },
    sbyc_legacy: {
      bn: 'এসবিওয়াইসির স্থায়ী ভবন এখন রোড ১৪-এর মোড়ে দাঁড়িয়ে। ভিত্তিপ্রস্তরে আপনার নাম।',
      en: 'The SBYC building stands at the corner of Road 14 now. Your name is on the foundation stone.',
      weight: 2
    }
  };

  // ------------------------------------------------------------
  // Opening lines per outcome — sets the tone for the epilogue
  // ------------------------------------------------------------
  const WIN_OPENERS = {
    clean: {
      bn: 'পাঁচ বছর পেরিয়ে গেল। রাজনীতিতে যাঁরা ঢোকেন, তাঁদের অনেকেই বদলে যান। আপনি বদলালেন না — সেটাই সবচেয়ে অস্বাভাবিক ব্যাপার।',
      en: 'Five years gone. Most who walk into politics get rewritten by it. You weren\'t — and that is the strangest thing about your run.'
    },
    standard: {
      bn: 'পাঁচ বছর শেষ। বিজয় ঘোষিত। হাত একদম পরিষ্কার নয়, কিন্তু রক্তেও মাখা নয় — মাঝামাঝি কোথাও।',
      en: 'Five years done. Victory called. Hands not quite clean, not quite bloodied — somewhere between.'
    },
    compromised: {
      bn: 'পাঁচ বছর। গদিতে এখনো আপনি। কিন্তু এই পাঁচ বছরের ভেতরে যে লোকটা প্রথম দিন শপথ পড়েছিল — সে আর নেই।',
      en: 'Five years. Still in the seat. But the man who took oath on day one is no longer in the room with you.'
    }
  };
  const WIN_CLOSERS = {
    clean: {
      bn: 'ভোটাররা ভুলে যাবে। ফাইলগুলো হারিয়ে যাবে। কিন্তু আপনি প্রতি রাতে আয়নায় তাকাতে পারবেন, এবং সেটাই হিসাব।',
      en: 'The voters will forget. The files will go missing. But you can look in the mirror each night, and that is the ledger that matters.'
    },
    standard: {
      bn: 'বাংলাদেশের রাজনীতিতে এটাই হয়তো জয় — টিকে থাকা, এবং নিজের সাথে কথা বলার মতো যথেষ্ট পরিষ্কার থাকা।',
      en: 'In Bangladeshi politics, perhaps this is what victory looks like — surviving, with just enough clean left over to still speak to yourself.'
    },
    compromised: {
      bn: 'কাগজগুলো কোথাও না কোথাও আছে। কেউ একদিন খুঁজে বের করবে। আজ না হোক, কাল।',
      en: 'The papers are out there. Somebody, someday, will find them. Maybe not today. But.'
    }
  };

  // Death openers reuse the existing game_overs.json body as paragraph 1;
  // we just need a second-paragraph "what's left behind" line per death.
  const DEATH_CODAS = {
    janata_low: {
      bn: 'ফোনে আসা শেষ চিঠিগুলো এখন কেবল বিল আর সমন। ওয়ার্ড অফিস বন্ধ।',
      en: 'The last letters in your tray are bills and summons now. The ward office has closed its shutters.'
    },
    janata_high: {
      bn: 'জনতা এখনো শ্লোগান দেয়। কিন্তু শ্লোগানে কোনো পদ আসে না।',
      en: 'The crowd still chants your name. But chants do not come with chairs.'
    },
    dol_low: {
      bn: 'কেন্দ্র থেকে ফোন আসে না। দলের মোবাইল গ্রুপ থেকে নাম মুছে দেওয়া হয়েছে।',
      en: 'The center stopped calling. They erased you from the party WhatsApp group.'
    },
    dol_high: {
      bn: 'কেন্দ্র খুশি। কিন্তু ওয়ার্ড আপনার সমাবেশে যাবে না।',
      en: 'The center is pleased. But the ward will not come to your rallies.'
    },
    proshashon_low: {
      bn: 'ফাইলে লাল কালি। থানা চিঠির জবাব দেয় না। এমপি ফোন ধরেন না।',
      en: 'Red ink on every file. The station does not answer your letters. The MP does not take your calls.'
    },
    proshashon_high: {
      bn: 'প্রশাসন আপনাকে বিশ্বস্ত বলে। জনতা আপনাকে দালাল বলে। দুটোই সত্যি।',
      en: 'The administration calls you trustworthy. The people call you a stooge. Both are true.'
    },
    tohobil_low: {
      bn: 'রাস্তার লাইট বন্ধ। স্টাফদের বেতন বাকি। শেষ চিঠিটাও কেউ পোস্ট করল না।',
      en: 'Street lights out. Staff unpaid. Even the resignation letter went out in someone else\'s hand.'
    },
    tohobil_high: {
      bn: 'দুদক ফাইল খুলেছে। কাগজের তদন্ত দ্রুত চলে।',
      en: 'ACC opened a file. Paper inquiries move quickly when the wind is right.'
    }
  };

  // ------------------------------------------------------------
  // Composers
  // ------------------------------------------------------------
  function pickFlagLines(flags, maxLines) {
    // Order by weight desc; break ties stably by alpha so output is deterministic.
    const lines = flags
      .filter(f => FLAG_LINES[f])
      .map(f => ({ flag: f, ...FLAG_LINES[f] }))
      .sort((a, b) => (b.weight - a.weight) || a.flag.localeCompare(b.flag));
    return lines.slice(0, maxLines);
  }

  function composeWin(tier, flags, lang) {
    const opener = WIN_OPENERS[tier] || WIN_OPENERS.standard;
    const closer = WIN_CLOSERS[tier] || WIN_CLOSERS.standard;
    const picked = pickFlagLines(flags, tier === 'clean' ? 2 : 3);
    const middle = picked.map(p => p[lang]);
    // For "clean" tier, prefer the few positive flags that imply legacy/integrity
    if (tier === 'clean' && middle.length === 0) {
      const fallback = {
        bn: 'আপনার নাম কোনো কেলেঙ্কারির সাথে যুক্ত হয়নি। কোনো ভবন ভাঙেনি যেটায় আপনার স্বাক্ষর ছিল। কোনো এনভেলপ আপনার পকেটে যায়নি।',
        en: 'Your name attached to no scandal. No tower fell that you had signed off. No envelope ever reached your pocket.'
      };
      middle.push(fallback[lang]);
    }
    return [opener[lang], ...middle, closer[lang]];
  }

  function composeDeath(deathKey, baseBody, flags, lang) {
    // Paragraph 1: the existing one-liner from game_overs.json
    // Paragraph 2: a death-specific coda
    // Paragraph 3-4: 1–2 flag lines reflecting what the player did along the way
    const coda = DEATH_CODAS[deathKey] || { bn: '', en: '' };
    const picked = pickFlagLines(flags, 2);
    const paragraphs = [baseBody];
    if (coda[lang]) paragraphs.push(coda[lang]);
    picked.forEach(p => paragraphs.push(p[lang]));
    return paragraphs;
  }

  // Render an array of paragraph strings into a single innerHTML blob
  function paragraphsToHtml(paragraphs) {
    return paragraphs
      .filter(p => p && p.trim().length)
      .map(p => '<p>' + escapeHtml(p) + '</p>')
      .join('');
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.Epilogue = {
    composeWin,
    composeDeath,
    paragraphsToHtml
  };
})();
