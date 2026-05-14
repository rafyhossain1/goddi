#!/usr/bin/env node
/* Adds background_variants to 10 more high-traffic cards.
   Variants change how each speaker pitches the same ask based on the
   Councillor's pre-politics background. Same choices and effects —
   only the framing changes. Player feels recognized. */

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'cards.json');
const doc  = JSON.parse(fs.readFileSync(file, 'utf8'));

const VARIANTS = {
  // S08 — Shahidul Haque — selfie request
  S08: {
    businessman: {
      dialog_bn: 'ভাই, আপনি ব্যবসায়ী মানুষ — ব্র্যান্ড বোঝেন! এক সেলফি, রাতে ফেসবুকে। আমার পেজে অনেক ফলোয়ার!',
      dialog_en: 'Bhai, you\'re a businessman — you understand branding! One selfie now, Facebook tonight. My page has followers!'
    },
    teacher: {
      dialog_bn: 'স্যার, আপনি আমার কাজিনকে পড়িয়েছেন — সে শুনলে মেরে ফেলবে যদি আজ একটা সেলফি না নিই।',
      dialog_en: 'Sir, you taught my cousin — he\'ll kill me if I don\'t get a selfie with you today.'
    },
    army_retired: {
      dialog_bn: 'স্যার, আপনি সার্ভিসে ছিলেন — একটা সেলফি দিন, ফেসবুকে দেব। আমার দুলাভাই বিশ্বাস করবে না।',
      dialog_en: 'Sir, you served — one selfie for Facebook. My brother-in-law won\'t believe me otherwise.'
    },
    ngo_worker: {
      dialog_bn: 'ভাই, কয়েক বছর আগে আপনার এনজিও ফলো করতাম — মাকে দেখাতে চাই আজ কাকে দেখলাম।',
      dialog_en: 'Bhai, I followed your NGO years back — let me show my mother who I met today.'
    },
    party_lifer: {
      dialog_bn: 'ভাই, আপনি দলের লোক — আপনার সাথে সেলফি মানে ১০০ লাইক গ্যারান্টি!',
      dialog_en: 'Bhai, you\'re a party man — a selfie with you means 100 likes guaranteed!'
    }
  },

  // S27 — Rehana Begum — three days, no water
  S27: {
    businessman: {
      dialog_bn: 'ভাই, আপনি ব্যবসায়ী — কন্ট্রাক্টরের লোক কেমন অলস বোঝেন। তিন দিন, কলে পানি নেই।',
      dialog_en: 'Bhai, you\'re a businessman — you know what lazy contractor staff look like. Three days, no water from the tap.'
    },
    teacher: {
      dialog_bn: 'স্যার, আপনার পুরোনো ছাত্র আমার ঘরে আছে — তারা গোসল করতে পারছে না। তিন দিন হয়ে গেছে।',
      dialog_en: 'Sir, your old students are in my house — they can\'t bathe. Three days now.'
    },
    army_retired: {
      dialog_bn: 'স্যার, আপনি শৃঙ্খলা বোঝেন — ওয়াসার লোকজনের সেটা নেই। তিন দিন, কিচ্ছু না।',
      dialog_en: 'Sir, you know discipline — WASA staff have none. Three days, nothing.'
    },
    ngo_worker: {
      dialog_bn: 'ভাই, আপনি আমাদের পাড়ায় পানির বোতল বিলি করতেন — এখন কলেই পানি নেই, তিন দিন।',
      dialog_en: 'Bhai, you used to hand out water bottles in our para — now the tap itself is dry. Three days.'
    },
    party_lifer: {
      dialog_bn: 'ভাই, আমাদের পাড়া প্রতিবার আপনার দলকে ভোট দেয়। তিন দিন পানি নেই — দয়া করুন।',
      dialog_en: 'Bhai, our para votes your party every time. Three days no water — please.'
    }
  },

  // A01 — Imam Saheb — mosque mic
  A01: {
    businessman: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনি রিটার্ন বোঝেন — ভালো মাইক মানে বেশি জামাত, বেশি দোয়া, বেশি ভোট।',
      dialog_en: 'Councillor sahib, you understand return on investment — a clear mic means bigger jamat, bigger goodwill, bigger vote bank.'
    },
    teacher: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনি ছাত্র পড়িয়েছেন — শোনা যাওয়ার গুরুত্ব আপনি জানেন। মাইকটা কাটে।',
      dialog_en: 'Councillor sahib, you\'ve taught children — you know the value of being heard. The mic keeps cutting out.'
    },
    army_retired: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনি কমান্ড বোঝেন — ইমাম সাহেবের গলা পরিষ্কার পৌঁছাতে হবে। পৌঁছায় না।',
      dialog_en: 'Councillor sahib, you understand command — the imam\'s voice must carry. It doesn\'t.'
    },
    ngo_worker: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনি কমিউনিটি কাজ বোঝেন — মসজিদ তার হৃদয়। মাইকটা ভাঙা।',
      dialog_en: 'Councillor sahib, you know community work — the masjid is its heart. The mic is broken.'
    },
    party_lifer: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনি স্টেজে দাঁড়িয়েছেন — মাইক না হলে ভাষণ যায় না। মসজিদেও একই কথা।',
      dialog_en: 'Councillor sahib, you\'ve stood on stages — no mic, no speech. Same disease here at the masjid.'
    }
  },

  // A02 — Nasima Begum — city truck hit son
  A02: {
    businessman: {
      dialog_bn: 'ভাই, ব্যবসায়ী থেকে মায়ের কাছে — আপনি জানেন পরিবার কীভাবে হিসাব মেলায়। ট্রাকটা আমাদের ভেঙেছে। একটা মীমাংসা — ন্যায্যভাবে।',
      dialog_en: 'Bhai, businessman to mother — you know how a family balances books. The truck broke us. Just settle, fairly.'
    },
    teacher: {
      dialog_bn: 'স্যার, আপনি পড়াতেন — জানেন স্কুলে ফিরতে না পারার মানে কী। ছেলেটা বেঁচে আছে, কিন্তু আমরা ভেঙে পড়েছি।',
      dialog_en: 'Sir, you were a teacher — you know what it means when a child can\'t go back to school. My boy survived, but we are broken.'
    },
    army_retired: {
      dialog_bn: 'স্যার, আপনি হতাহত দেখেছেন — কিন্তু আমার ছেলে যুদ্ধের পরিসংখ্যান নয়। সে বেঁচেছে, আমাদের সাহায্য দরকার।',
      dialog_en: 'Sir, you\'ve seen casualties — but my son isn\'t a war statistic. He survived. We need help.'
    },
    ngo_worker: {
      dialog_bn: 'ভাই, আপনি দুর্যোগে কাজ করেছেন — এই ক্ষেত্রে "মীমাংসা" কেমন হওয়া উচিত আপনি জানেন। ছেলে বেঁচেছে, কিন্তু আমরা ভেঙেছি।',
      dialog_en: 'Bhai, you\'ve done relief work — you know what "settlement" should look like in cases like ours. My son survived, but we are broken.'
    },
    party_lifer: {
      dialog_bn: 'ভাই, আপনার দল গরিবের কথা বলে — এবার দেখান। ছেলে বাঁচল ট্রাক থেকে। আমাদের ক্ষতিপূরণ লাগবে।',
      dialog_en: 'Bhai, your party speaks for the poor — show it now. My son survived the truck. We need compensation.'
    }
  },

  // A06 — Maloti Devi — pension delay
  A06: {
    businessman: {
      dialog_bn: 'বাবা, তুমি ব্যবসায়ী — আট মাস আয় ছাড়া কেমন লাগে জানো। পেনশনটা একটু...',
      dialog_en: 'Son, you\'re a businessman — you know what eight months without income feels like. My pension... please.'
    },
    teacher: {
      dialog_bn: 'বাবা, তুমি শিক্ষক ছিলে — চল্লিশ বছর পড়িয়েছি। আট মাস পেনশন নেই। এভাবে আসা উচিত হলো না।',
      dialog_en: 'Son, you were a teacher — I taught for forty years. Eight months without pension. I shouldn\'t have to come like this.'
    },
    army_retired: {
      dialog_bn: 'বাবা, তুমি সার্ভিসে ছিলে — পেনশন আটকে রাখা সার্ভিসের লোককে কেমন আঘাত দেয় জানো। আট মাস।',
      dialog_en: 'Son, you served — you know what a held pension does to a service person. Eight months.'
    },
    ngo_worker: {
      dialog_bn: 'বাবা, তুমি বৃদ্ধদের নিয়ে কাজ করেছ — আট মাস পেনশন নেই। আসতে লজ্জা লাগে, তবু এলাম।',
      dialog_en: 'Son, you\'ve worked with the elderly — eight months without pension. I\'m ashamed to come, but here I am.'
    },
    party_lifer: {
      dialog_bn: 'বাবা, তোমার দল বৃদ্ধদের সম্মানের কথা বলে। আট মাস। কাউকে কিছু বলিনি — তোমার কাছে আগে এলাম।',
      dialog_en: 'Son, your party speaks of dignity for elders. Eight months. I haven\'t told anyone — came to you first.'
    }
  },

  // A08 — DNCC officer — garbage contract (MP nephew premium)
  A08: {
    businessman: {
      dialog_bn: 'স্যার, ব্যবসায়ী থেকে ব্যবসায়ীকে — এমপি সাহেবের ভাতিজার দর বাজারের চেয়ে ৩০% বেশি। কন্ট্রাক্টটা বাঁচানো যায়।',
      dialog_en: 'Sir, businessman to businessman — the MP\'s nephew\'s bid is 30% above market. You can still rescue this contract.'
    },
    teacher: {
      dialog_bn: 'স্যার, আপনি নাগরিকশাস্ত্র পড়িয়েছেন — অতিরিক্ত দরে সরকারি কন্ট্রাক্ট কী করে জানেন। ৩০% বেশি। আপনার সিদ্ধান্ত।',
      dialog_en: 'Sir, you\'ve taught civics — you know what overpriced public contracts do. 30% premium. Your call.'
    },
    army_retired: {
      dialog_bn: 'স্যার, আপনি টেন্ডার শৃঙ্খলা বোঝেন — এমপির ভাতিজার বিড ৩০% বেশি। অনুমোদন না প্রত্যাখ্যান?',
      dialog_en: 'Sir, you understand tender discipline — the MP\'s nephew\'s bid is 30% over. Approve or reject?'
    },
    ngo_worker: {
      dialog_bn: 'স্যার, এনজিও কাজে অতি-দামের প্রকিউরমেন্ট দেখেছেন — এখানেও তাই। ৩০% প্রিমিয়াম। অনুমোদন না প্রত্যাখ্যান?',
      dialog_en: 'Sir, you\'ve seen overpriced procurement in NGO work — same here. 30% premium. Approve or reject?'
    },
    party_lifer: {
      dialog_bn: 'স্যার, দল কীভাবে নিজের লোকদের পুরস্কার দেয় আপনি জানেন — এমপির ভাতিজা চাইছেন। ৩০% বেশি। আপনার সিদ্ধান্ত।',
      dialog_en: 'Sir, you know how the party rewards its own — the MP\'s nephew is asking. 30% premium. Your call.'
    }
  },

  // A17 — Jahangir — eviction notice
  A17: {
    businessman: {
      dialog_bn: 'ভাই, ব্যবসায়ী থেকে ভাড়াটিয়ার কাছে — রিলোকেশন কত খরচ আপনি জানেন। নোটিশ এসে গেছে। আমার সাথে দাঁড়ান।',
      dialog_en: 'Bhai, businessman to renter — you know what relocation costs. The notice came. Stand with me.'
    },
    teacher: {
      dialog_bn: 'স্যার, আপনি শিক্ষক ছিলেন — আমার মেয়েকে পড়িয়েছেন। এখন উচ্ছেদ নোটিশ। সাহায্য করেন।',
      dialog_en: 'Sir, you were a teacher — you taught my daughter. Now the eviction notice has arrived. Please help.'
    },
    army_retired: {
      dialog_bn: 'স্যার, সৈনিক থেকে বেসামরিক ব্যক্তিকে — ন্যায্যতা গুরুত্বপূর্ণ। কোনো কারণ ছাড়া উচ্ছেদ নোটিশ এসেছে। সাথে দাঁড়ান।',
      dialog_en: 'Sir, soldier to civilian — fairness matters. The eviction notice came with no grounds. Stand with me.'
    },
    ngo_worker: {
      dialog_bn: 'ভাই, আপনি পরিবার রিলোকেট করতে সাহায্য করেছেন — এই নোটিশের মানে কী আপনি জানেন। ঠেলে দেন।',
      dialog_en: 'Bhai, you\'ve helped families relocate — you know what this notice means. Push back on it.'
    },
    party_lifer: {
      dialog_bn: 'ভাই, আপনার দল গরিবের পক্ষে — উচ্ছেদ আসছে কর্পোরেশন থেকে। সাহায্য করেন।',
      dialog_en: 'Bhai, your party stands for the poor — the eviction is from the corporation. Help me.'
    }
  },

  // A20 — Ariful bhai — loan / recommendation
  A20: {
    businessman: {
      dialog_bn: 'ভাই, ব্যবসায়ী থেকে ব্যবসায়ীকে — স্লো মৌসুম কী জিনিস আপনি জানেন। লোনটা পাইয়ে দেন। কথা — ফেরত দেব।',
      dialog_en: 'Bhai, businessman to businessman — you know what a slow season is. Help me get the loan. My word — I\'ll pay back.'
    },
    teacher: {
      dialog_bn: 'ভাই, আমি আরিফুল — আপনি চেনেন। আপনার সুপারিশে আমার বাচ্চারা ভর্তি হয়েছে। এবার অবস্থা খারাপ — সাহায্য করেন।',
      dialog_en: 'Bhai, I\'m Ariful — you know me. Your recommendation got my kids admitted. Now things aren\'t good — help me.'
    },
    army_retired: {
      dialog_bn: 'ভাই, আপনি সার্ভিসে ছিলেন — সোজা কথা: ব্যবসা মরছে। আপনার একটা ছোট সুপারিশ দরজা খুলে দেয়।',
      dialog_en: 'Bhai, you served — straight talk: my business is dying. A small recommendation from you reopens doors.'
    },
    ngo_worker: {
      dialog_bn: 'ভাই, আপনি আমাদের পাড়ায় ছোট ব্যবসায়ীদের সাহায্য করতেন — এবার আমি সাহায্য চাইছি। আপনার একটা কথা ক্রেডিট লাইন খুলে দেবে।',
      dialog_en: 'Bhai, you used to help small businesses in our para — now I\'m the one asking. A word from you reopens the credit line.'
    },
    party_lifer: {
      dialog_bn: 'ভাই, দল আমাকে চেনে — বছরের পর বছর চাঁদা দিয়েছি। একটা খারাপ বছর। আপনার একটা কথায় ক্রেডিট ফিরে আসে।',
      dialog_en: 'Bhai, the party knows me — I\'ve contributed for years. One bad year. A word from you and the credit line reopens.'
    }
  },

  // A24 — Party VP — ৳25 lakh demand for campaign
  A24: {
    businessman: {
      dialog_bn: 'ভাই, আপনি ব্যবসায়ী — নির্বাচনী র‍্যালির খরচ বোঝেন। কেন্দ্র চাইছে ২৫ লাখ। দেবেন?',
      dialog_en: 'Bhai, you\'re a businessman — you know election rally costs. Central wants ৳25 lakh. Deliver?'
    },
    teacher: {
      dialog_bn: 'ভাই, শিক্ষক থেকে রাজনীতিবিদ — কেন্দ্রীয় কমিটি প্রচারণার জন্য ২৫ লাখ চাইছে। বড় অঙ্ক। আপনার সিদ্ধান্ত।',
      dialog_en: 'Bhai, teacher turned politician — the central committee wants ৳25 lakh for the campaign. Large sum. Your call.'
    },
    army_retired: {
      dialog_bn: 'ভাই, সার্ভিস থেকে দলে — কেন্দ্র চাইছে প্রচারণার জন্য ২৫ লাখ। হ্যাঁ না?',
      dialog_en: 'Bhai, service to party — central wants ৳25 lakh for the campaign. Yes or no?'
    },
    ngo_worker: {
      dialog_bn: 'ভাই, আপনি এনজিও থেকে এসেছেন — কেন্দ্র ওয়ার্ড থেকে ২৫ লাখ চাইছে। আপনার সিদ্ধান্ত।',
      dialog_en: 'Bhai, you came from NGO work — central wants ৳25 lakh from the ward. Your call.'
    },
    party_lifer: {
      dialog_bn: 'ভাই, আপনি দলটা ভেতর থেকে চেনেন — কেন্দ্র ২৫ লাখ চাইছে। কীভাবে চলে আপনি জানেন। অনুমোদন?',
      dialog_en: 'Bhai, you know the party from inside — central asks for ৳25 lakh. You know how these things work. Approve?'
    }
  },

  // A30 — Riaz Chowdhury — 5 acres for industrial park
  A30: {
    businessman: {
      dialog_bn: 'ভাই, ব্যবসায়ী থেকে ব্যবসায়ীকে — পাঁচ একর, ইন্ডাস্ট্রিয়াল পার্ক। বিরাট চাকরি, বিরাট লাভ। আপনার ভাগ হিসেবে আছে।',
      dialog_en: 'Bhai, businessman to businessman — five acres for the industrial park. Massive jobs. Massive returns. Your share is on the books.'
    },
    teacher: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনি পড়িয়েছেন — বাচ্চাদের কাজ-করা বাবা-মা কতটা লাগে আপনি জানেন। পাঁচ একর, কারখানা, শত শত চাকরি। আপনার অংশ অবশ্যই।',
      dialog_en: 'Councillor sahib, you taught — you know how much kids need their parents to have jobs. Five acres, big factory, hundreds of jobs. Your share, of course.'
    },
    army_retired: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনি সার্ভিসে ছিলেন — শৃঙ্খলাকে সম্মান করেন। ইন্ডাস্ট্রিয়াল পার্ক মানে শৃঙ্খলা ও চাকরি। পাঁচ একর। আপনার ভাগ লেখা আছে।',
      dialog_en: 'Councillor sahib, you served — you respect order. An industrial park brings order and jobs. Five acres. Your share is already counted.'
    },
    ngo_worker: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনি গরিবি নিয়ে কাজ করেছেন — এটাই উত্তর। ইন্ডাস্ট্রিয়াল পার্ক। পাঁচ একর। শত শত কর্মসংস্থান। আপনার অংশ আসল।',
      dialog_en: 'Councillor sahib, you\'ve done poverty work — this is the answer. Industrial park. Five acres. Hundreds employed. Your share is real.'
    },
    party_lifer: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনি আর আমি দুজনেই জানি — দল বিল্ডারদের পুরস্কার দেয়। পাঁচ একর। ইন্ডাস্ট্রিয়াল পার্ক। আপনার ভাগ ভাবা হয়েছে।',
      dialog_en: 'Councillor sahib, you and I both know — the party rewards builders. Five acres. Industrial park. Your share has been thought of.'
    }
  }
};

let touched = 0;
for (const card of doc.cards) {
  const v = VARIANTS[card.id];
  if (!v) continue;
  if (card.background_variants) {
    console.log('  skip', card.id, '(already has variants)');
    continue;
  }
  card.background_variants = v;
  touched++;
  console.log('  add', card.id, '·', card.character_name_en);
}

if (touched !== Object.keys(VARIANTS).length) {
  console.warn('Touched', touched, 'of', Object.keys(VARIANTS).length, 'planned cards');
}

fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
console.log('Wrote background_variants to', touched, 'more cards.');
