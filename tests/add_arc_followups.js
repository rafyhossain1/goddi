#!/usr/bin/env node
/* Adds 8 follow-up cards that polish previously-thin arcs.
   Each requires a flag set earlier in the run, then fires once with a
   real choice and real consequences. Numbers are post-tuning scale. */

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'cards.json');
const doc  = JSON.parse(fs.readFileSync(file, 'utf8'));

const followups = [
  // ----- A51 — Imam returns. Triggered by mosque_funded -----
  {
    id: 'A51',
    character_name_bn: 'ইমাম সাহেব',
    character_name_en: 'Imam Saheb',
    character_role_bn: 'মসজিদ ইমাম',
    character_role_en: 'Masjid Imam',
    portrait_id: 'imam_saheb',
    min_year: 3,
    requires_flags: ['mosque_funded'],
    oneshot: true,
    dialog_bn: 'কাউন্সিলর সাহেব, মাইকের পর মসজিদ কমিটির মুরুব্বিরা চাইছেন আপনার নাম কমিটিতে যাক। সম্মান। ভোটও।',
    dialog_en: 'Councillor sahib, after the mic, the masjid committee elders want your name on the committee. Respect. Also votes.',
    left: {
      label_bn: 'নাম দিন',
      label_en: 'Accept the seat',
      effects: { janata: 6, proshashon: -3 },
      triggers: ['ulema_aligned']
    },
    right: {
      label_bn: 'সম্মানজনক না',
      label_en: 'Decline gracefully',
      effects: { janata: -4, dol: 3 }
    }
  },

  // ----- A52 — Nasima's neighbors. Triggered by compensation_paid -----
  {
    id: 'A52',
    character_name_bn: 'নাসিমা বেগম',
    character_name_en: 'Nasima Begum',
    character_role_bn: 'প্রতিবেশী সংগঠক',
    character_role_en: 'Neighborhood organiser',
    portrait_id: 'nasima_begum',
    min_year: 2,
    requires_flags: ['compensation_paid'],
    oneshot: true,
    dialog_bn: 'ভাই, আপনি আমাকে সাহায্য করেছিলেন। এখন আরও দুই পরিবার দরজায় — তাদেরও ট্রাকে আঘাত পেয়েছে। তারা শুনেছে।',
    dialog_en: 'Bhai, you helped me. Now two more families are at the gate — also truck victims. They heard.',
    left: {
      label_bn: 'তাদেরও সাহায্য করুন',
      label_en: 'Help them too',
      effects: { janata: 7, tohobil: -8 }
    },
    right: {
      label_bn: 'কাগজপত্র জমা দিতে বলুন',
      label_en: 'Tell them to file paperwork',
      effects: { janata: -5, proshashon: 3 }
    }
  },

  // ----- A53 — OC cashes in his favor. Triggered by oc_owes_you -----
  {
    id: 'A53',
    character_name_bn: 'ওসি হাসান',
    character_name_en: 'OC Hassan',
    character_role_bn: 'থানার ভারপ্রাপ্ত',
    character_role_en: 'Station police chief',
    portrait_id: 'oc_hassan',
    min_year: 4,
    requires_flags: ['oc_owes_you'],
    oneshot: true,
    dialog_bn: 'কাউন্সিলর সাহেব, আপনার নামে একটা অভিযোগ এসেছে। পারিবারিক — ফাইলটা ভুল জায়গায় চলে গেলে দোষ কারো না। বলুন।',
    dialog_en: 'Councillor sahib, a complaint about you came in. Domestic dispute — easy to misplace, no one\'s fault. Just say the word.',
    left: {
      label_bn: 'হারিয়ে যাক',
      label_en: 'Let it disappear',
      effects: { proshashon: -3, janata: 3, tohobil: -3 },
      triggers: ['complaint_buried']
    },
    right: {
      label_bn: 'প্রক্রিয়ায় যাক',
      label_en: 'Let it run its course',
      effects: { proshashon: 4, janata: -3 }
    }
  },

  // ----- A54 — The ward remembers the flood. Triggered by flood_walk -----
  {
    id: 'A54',
    character_name_bn: 'এলাকার মুরুব্বি',
    character_name_en: 'Para elder',
    character_role_bn: 'বাসিন্দা প্রতিনিধি',
    character_role_en: 'Residents\' representative',
    portrait_id: '_default',
    min_year: 3,
    requires_flags: ['flood_walk'],
    oneshot: true,
    dialog_bn: 'কাউন্সিলর সাহেব, রিকশাওয়ালা, গৃহিণী, চা-দোকানের ছেলেরা — সবাই আপনাকে পানির মধ্যে দেখেছিল। আজ সন্ধ্যায় তাদের সামনে কথা বলবেন?',
    dialog_en: 'Councillor sahib, the rickshaw-pullers, the homemakers, the chai-shop boys — they all remember you in the water. Address them tonight?',
    left: {
      label_bn: 'বক্তব্য দিন',
      label_en: 'Address the crowd',
      effects: { janata: 7, dol: -3 }
    },
    right: {
      label_bn: 'নীরবে পাড়ায় ঘুরুন',
      label_en: 'Just walk the para quietly',
      effects: { janata: 4, proshashon: 3 }
    }
  },

  // ----- A55 — Old party retaliates. Triggered by defected -----
  {
    id: 'A55',
    character_name_bn: 'প্রেস ব্রিফিং',
    character_name_en: 'Press briefing',
    character_role_bn: 'মিডিয়া আপডেট',
    character_role_en: 'Media update',
    portrait_id: '_default',
    min_year: 5,
    requires_flags: ['defected'],
    oneshot: true,
    dialog_bn: 'কাউন্সিলর সাহেব, পুরনো দল আপনার ব্যক্তিগত চ্যাট ফাঁস করেছে — ট্যাবলয়েডে। "বিশ্বাসঘাতক" বলছে। মন্তব্য?',
    dialog_en: 'Councillor sahib, your old party leaked a private chat to a tabloid. They\'re calling you a traitor. Comment?',
    left: {
      label_bn: 'প্রকাশ্যে পাল্টা জবাব',
      label_en: 'Counter publicly',
      effects: { janata: -3, dol: 4, proshashon: -3 }
    },
    right: {
      label_bn: 'চুপ থাকুন',
      label_en: 'Stay silent',
      effects: { janata: -5, dol: -3, tohobil: 3 }
    }
  },

  // ----- A56 — EC reckoning. Triggered by ec_bribed -----
  {
    id: 'A56',
    character_name_bn: 'নির্বাচন কমিশনের ফোন',
    character_name_en: 'Election Commission call',
    character_role_bn: 'গোপন বার্তা',
    character_role_en: 'Confidential message',
    portrait_id: '_default',
    min_year: 5,
    requires_flags: ['ec_bribed'],
    oneshot: true,
    dialog_bn: 'স্যার, ইসি চেয়ারম্যান ফোন করেছেন। ভোটার তালিকার সমন্বয় ধরা পড়েছে। সামাল দিন, না হলে প্রেসে যাবে।',
    dialog_en: 'Sir, EC chairman called. The voter-roll adjustments are flagged. Make this go away, or it goes to the press.',
    left: {
      label_bn: 'সামাল দিন',
      label_en: 'Make it go away',
      effects: { tohobil: -9, proshashon: -5 }
    },
    right: {
      label_bn: 'প্রেসে যাক',
      label_en: 'Let it go to press',
      effects: { janata: -5, dol: -4 }
    }
  },

  // ----- A57 — Contractor's widow. Triggered by tower_blamed_contractor -----
  {
    id: 'A57',
    character_name_bn: 'মুনিরা বেগম',
    character_name_en: 'Munira Begum',
    character_role_bn: 'কন্ট্রাক্টরের স্ত্রী',
    character_role_en: 'Contractor\'s widow',
    portrait_id: '_default',
    min_year: 4,
    requires_flags: ['tower_blamed_contractor'],
    oneshot: true,
    dialog_bn: 'কাউন্সিলর সাহেব, আমার স্বামী আপনার নামে দোষ নিয়ে মরেছেন। আমি আজ যাব না — যতক্ষণ না একটা চিঠি লেখেন।',
    dialog_en: 'Councillor sahib, my husband died with your blame on his name. I\'m not leaving until you write a letter.',
    left: {
      label_bn: 'চিঠি লিখুন',
      label_en: 'Write the letter',
      effects: { janata: 5, dol: -5, proshashon: -3 }
    },
    right: {
      label_bn: 'সরিয়ে দিন',
      label_en: 'Have her removed',
      effects: { janata: -7, proshashon: 3, tohobil: 3 }
    }
  },

  // ----- A58 — Votebuyer caught. Triggered by votebuying -----
  {
    id: 'A58',
    character_name_bn: 'প্রধান সহকারী',
    character_name_en: 'Chief aide',
    character_role_bn: 'অভ্যন্তরীণ সতর্কতা',
    character_role_en: 'Internal alert',
    portrait_id: '_default',
    min_year: 5,
    requires_flags: ['votebuying'],
    oneshot: true,
    dialog_bn: 'স্যার, যে লোক এনভেলপ বিলি করেছিল — সে ধরা পড়েছে। নাম বলবে বলছে। ওর সাথে একটা মীমাংসা দরকার।',
    dialog_en: 'Sir, the man who handed out the envelopes — he\'s been caught. He\'s offering to name names. We need to settle with him.',
    left: {
      label_bn: 'মীমাংসা করুন',
      label_en: 'Pay him off',
      effects: { tohobil: -8, proshashon: -3 }
    },
    right: {
      label_bn: 'যাক যা হয়',
      label_en: 'Let it happen',
      effects: { janata: -6, dol: -4 }
    }
  }
];

let added = 0;
for (const card of followups) {
  if (doc.cards.some(c => c.id === card.id)) {
    console.log('  skip', card.id, '(exists)');
    continue;
  }
  doc.cards.push(card);
  added++;
  console.log('  add', card.id, '·', card.character_name_en, '· requires:', card.requires_flags.join(','));
}

fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
console.log('Added', added, 'follow-up cards. Total deck size:', doc.cards.length);
