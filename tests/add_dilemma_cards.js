#!/usr/bin/env node
/* Adds two "both options hurt" dilemma cards to the deck.
   These bite even the most cautious player — there is no clean option.
   Effect magnitudes are already at the post-×1.3 scale. */

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'cards.json');
const doc = JSON.parse(fs.readFileSync(file, 'utf8'));

const dilemmas = [
  {
    id: 'D01',
    character_name_bn: 'ওসি হাসান',
    character_name_en: 'OC Hassan',
    character_role_bn: 'থানার ভারপ্রাপ্ত',
    character_role_en: 'Station police chief',
    portrait_id: '_default',
    min_year: 2,
    weight: 2,
    oneshot: true,
    dialog_bn: 'কাউন্সিলর সাহেব, হরতাল চলছে। বিরোধী দল রাস্তা ব্লক করেছে — অফিস, স্কুল, হাসপাতাল সব আটকে। আমরা ফাঁকা করতে যাব, নাকি আপনি বলবেন বসে আলোচনা?',
    dialog_en: 'Councillor sahib, strike is on. Opposition has the road blocked — office, school, hospital, all stuck. Do we clear them out, or are you going to call for talks?',
    left: {
      label_bn: 'ফাঁকা করুন',
      label_en: 'Clear them out',
      effects: { proshashon: 5, dol: 3, janata: -8, tohobil: -4 }
    },
    right: {
      label_bn: 'বসে কথা বলুন',
      label_en: 'Sit and talk',
      effects: { janata: 6, dol: -5, proshashon: -7, tohobil: -3 }
    }
  },
  {
    id: 'D02',
    character_name_bn: 'ওয়ার্ড সচিব',
    character_name_en: 'Ward secretary',
    character_role_bn: 'তহবিল ব্যবস্থাপক',
    character_role_en: 'Funds officer',
    portrait_id: '_default',
    min_year: 3,
    weight: 2,
    oneshot: true,
    dialog_bn: 'স্যার, জেনারেটরের তেল প্রায় শেষ। হাসপাতাল বা স্কুল — যেকোনো একটার জন্য কিনতে পারব। স্কুলে এমপি সাহেবের ছেলে পরীক্ষা দিচ্ছে।',
    dialog_en: 'Sir, generator fuel is nearly out. We can afford enough for one — hospital or school. The MP\'s son is sitting his exams at the school.',
    left: {
      label_bn: 'হাসপাতাল',
      label_en: 'The hospital',
      effects: { janata: 6, dol: -6, tohobil: -7 }
    },
    right: {
      label_bn: 'স্কুল',
      label_en: 'The school',
      effects: { dol: 5, proshashon: 4, janata: -6, tohobil: -5 }
    }
  }
];

let added = 0;
for (const card of dilemmas) {
  if (doc.cards.some(c => c.id === card.id)) {
    console.log('  skip', card.id, '(already exists)');
    continue;
  }
  doc.cards.push(card);
  added++;
  console.log('  add', card.id, '·', card.character_name_en);
}

fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
console.log('Added', added, 'dilemma cards. Total deck size:', doc.cards.length);
