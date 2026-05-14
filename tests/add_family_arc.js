#!/usr/bin/env node
/* Adds 4 family-arc cards spread across the 5 years. Each card introduces
   personal cost to choices: kids' exams, parents' health, sibling jobs,
   end-of-tenure reckoning. Effects calibrated to post-tuning scale. */

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'cards.json');
const doc  = JSON.parse(fs.readFileSync(file, 'utf8'));

// Family character bios live in characters.json. Add them too.
const charsFile = path.join(__dirname, '..', 'data', 'characters.json');
const chars = JSON.parse(fs.readFileSync(charsFile, 'utf8'));

if (!chars.characters.wife) {
  chars.characters.wife = {
    name_bn: 'আপনার স্ত্রী',
    name_en: 'Your wife',
    role_bn: 'পরিবার',
    role_en: 'Family',
    bio_bn: 'আপনাকে রাজনীতিতে যেতে বলেনি। প্রচার-প্রচারণায় ফটো তোলার জন্য দাঁড়িয়েছে। গত মাসে দু\'বার একা ডিনার করেছে।',
    bio_en: 'Never asked you to enter politics. Stood for the photos at every rally. Has eaten dinner alone twice this month.'
  };
}
if (!chars.characters.son) {
  chars.characters.son = {
    name_bn: 'আপনার ছেলে',
    name_en: 'Your son',
    role_bn: 'বাড়িতে',
    role_en: 'At home',
    bio_bn: 'এসএসসি পরীক্ষার্থী। বাবার নাম জনসভায় শোনে, ডিনারের টেবিলে নয়। দাঁড়িপাল্লা মনে আছে।',
    bio_en: 'SSC candidate. Hears his father\'s name at rallies, not at the dinner table. Keeps a quiet ledger.'
  };
}
fs.writeFileSync(charsFile, JSON.stringify(chars, null, 2) + '\n');

const family = [
  // ----- F01 — Y2 — Wife asks about Eid plans -----
  {
    id: 'F01',
    character_name_bn: 'আপনার স্ত্রী',
    character_name_en: 'Your wife',
    character_role_bn: 'পরিবার',
    character_role_en: 'Family',
    portrait_id: 'wife',
    min_year: 2,
    max_year: 3,
    oneshot: true,
    dialog_bn: 'ঈদের জন্য আম্মার বাড়ি যাচ্ছি — তিন দিন। তুমিও আসবে? নাকি আবারও "পার্টি কর্মসূচি"?',
    dialog_en: 'Heading to my mother\'s for Eid — three days. Will you come? Or another "party programme" again?',
    left: {
      label_bn: 'যাব',
      label_en: 'I\'ll come',
      effects: { dol: -4, proshashon: 5, janata: 3 }
    },
    right: {
      label_bn: 'পরে বুঝিয়ে বলব',
      label_en: 'I\'ll make it up',
      effects: { dol: 4, janata: -3 }
    }
  },

  // ----- F02 — Y3 — Son's SSC results day -----
  {
    id: 'F02',
    character_name_bn: 'আপনার ছেলে',
    character_name_en: 'Your son',
    character_role_bn: 'বাড়িতে',
    character_role_en: 'At home',
    portrait_id: 'son',
    min_year: 3,
    max_year: 4,
    oneshot: true,
    dialog_bn: 'আব্বু, কালকে এসএসসি রেজাল্ট। সবাই বাবাদের সাথে আসছে — তুমি একটু ফোন করো শুধু, প্লিজ।',
    dialog_en: 'Abbu, SSC results tomorrow. Everyone\'s coming with their dads — just call me, please.',
    left: {
      label_bn: 'বাসায় থাকব',
      label_en: 'Be home for it',
      effects: { dol: -5, proshashon: 6, tohobil: 3 }
    },
    right: {
      label_bn: 'ফোন করব',
      label_en: 'I\'ll call',
      effects: { dol: 3, proshashon: -3, janata: -3 }
    }
  },

  // ----- F03 — Y4 — Father's stroke -----
  {
    id: 'F03',
    character_name_bn: 'বড় ভাই',
    character_name_en: 'Older brother',
    character_role_bn: 'পরিবার · জরুরি',
    character_role_en: 'Family · urgent',
    portrait_id: '_default',
    min_year: 4,
    oneshot: true,
    dialog_bn: 'ছোট, আব্বার স্ট্রোক হয়েছে — হাসপাতালে। আমি ম্যানেজ করছি, তবে তুই ক\'টা দিন আস। নাকি লোকজন বলবে...',
    dialog_en: 'Choto, Abba has had a stroke — in hospital. I\'m managing it. But come for a few days. Or people will say...',
    left: {
      label_bn: 'এখনই যাব',
      label_en: 'Go immediately',
      effects: { dol: -7, proshashon: 6, janata: 5, tohobil: -4 }
    },
    right: {
      label_bn: 'টাকা পাঠাব',
      label_en: 'Send money',
      effects: { dol: 4, proshashon: -5, janata: -5, tohobil: -5 }
    }
  },

  // ----- F04 — Y5 — Dinner-table reckoning -----
  {
    id: 'F04',
    character_name_bn: 'আপনার স্ত্রী',
    character_name_en: 'Your wife',
    character_role_bn: 'ডিনার টেবিল · বছর ৫',
    character_role_en: 'Dinner table · Year 5',
    portrait_id: 'wife',
    min_year: 5,
    oneshot: true,
    dialog_bn: 'পাঁচ বছর হয়ে গেল। লোকজন বলছে — আবার দাঁড়াবে। আমি জিজ্ঞেস করি — তুমি আদৌ ঘরে আছ কি?',
    dialog_en: 'Five years gone. People say you\'ll run again. I have to ask — are you even at home anymore?',
    left: {
      label_bn: 'এবার বিরতি',
      label_en: 'Step away this term',
      effects: { dol: -7, janata: 4, proshashon: 5 }
    },
    right: {
      label_bn: 'এই কাজ ছাড়তে পারব না',
      label_en: 'I can\'t walk away',
      effects: { dol: 6, janata: -4, proshashon: -3 }
    }
  }
];

let added = 0;
for (const card of family) {
  if (doc.cards.some(c => c.id === card.id)) {
    console.log('  skip', card.id, '(exists)');
    continue;
  }
  doc.cards.push(card);
  added++;
  console.log('  add', card.id, '·', card.character_name_en, '· Y' + (card.min_year || 1) + '+');
}

fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
console.log('Added', added, 'family-arc cards. Deck size:', doc.cards.length);
