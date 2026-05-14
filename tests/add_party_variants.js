#!/usr/bin/env node
/* Adds party-specific dialog variants to 8 high-traffic cards.
   Same pattern as background_variants — only the framing changes,
   choices and effects stay the same. Merges with existing variants
   instead of overwriting.

   Parties (from data/parties.json):
     janata_league      — establishment / "progress for all"
     jatiyotabadi_dol   — nationalist opposition / "country first"
     islami_oikko       — Islamic alliance / "faith"
     notun_bangladesh   — reformist / "out with the old"
*/

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'cards.json');
const doc  = JSON.parse(fs.readFileSync(file, 'utf8'));

const PARTY_VARIANTS = {
  // ============== A01 — Imam Saheb mosque mic ==============
  A01: {
    janata_league: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনার দল মসজিদে সবসময় থেকেছে। মাইকের জন্য তহবিল — একটা সইয়ে চলবে।',
      dialog_en: 'Councillor sahib, your party has always stood by the masjid. Mic funding from the ward — one signature does it.'
    },
    jatiyotabadi_dol: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনার দল জাতীয় ঐতিহ্যের কথা বলে — মসজিদই ঐতিহ্য। মাইকটায় সাহায্য করুন।',
      dialog_en: 'Councillor sahib, your party speaks of national heritage — the masjid is heritage. Help with the mic.'
    },
    islami_oikko: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনার দল-ই তো মসজিদের পক্ষে। এই মাইক আপনারই প্রতীক হয়ে দাঁড়ায়।',
      dialog_en: 'Councillor sahib, your party stands for the masjid. The mic becomes your symbol too.'
    },
    notun_bangladesh: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনার সংস্কারের কথা পরিষ্কার মাইকে আরও দূর যায়। একটু সাহায্য করুন।',
      dialog_en: 'Councillor sahib, your reform message travels further through a clear mic. A little help, please.'
    }
  },

  // ============== A14 — Madrasa committee ==============
  // Already has islami_oikko variant — merge, don't overwrite.
  A14: {
    janata_league: {
      dialog_bn: 'আসসালামু আলাইকুম, কাউন্সিলর সাহেব। আপনার দলের কাছেও — এতিম তো এতিম। আল্লাহর রহমতে একটু সাহায্য চাইছি।',
      dialog_en: 'Assalamu alaikum, Councillor sahib. Even from your party — an orphan is an orphan. By Allah\'s grace, a little support.'
    },
    jatiyotabadi_dol: {
      dialog_bn: 'আসসালামু আলাইকুম, কাউন্সিলর সাহেব। আপনার জাতীয়তাবাদ ধর্মের মধ্যেও সেতু গড়ে — পঞ্চাশটি এতিম একটি সেতু চাইছে।',
      dialog_en: 'Assalamu alaikum, Councillor sahib. Your nationalism builds bridges across faiths too — fifty orphans need such a bridge.'
    },
    notun_bangladesh: {
      dialog_bn: 'আসসালামু আলাইকুম, কাউন্সিলর সাহেব। "পুরাতন বাতিল" — তবু এতিম-যত্নের মতো কিছু কখনো পুরোনো হয় না।',
      dialog_en: 'Assalamu alaikum, Councillor sahib. "Out with the old" — but some old things, like orphan care, never grow old.'
    }
  },

  // ============== A22 — Rohingya family shelter ==============
  A22: {
    janata_league: {
      dialog_bn: 'ভাই, কেন্দ্রের লাইন — "মানবিকতা সীমার মধ্যে।" চারটে বাচ্চা — সীমাটা কী?',
      dialog_en: 'Bhai, the central line is "humanitarian within limits." Four children — what\'s the limit?'
    },
    jatiyotabadi_dol: {
      dialog_bn: 'ভাই, আপনার দলের অবস্থান স্পষ্ট — সীমান্ত গুরুত্বপূর্ণ। কিন্তু চারটে বাচ্চা। কী করি?',
      dialog_en: 'Bhai, your party\'s line is clear — borders matter. But four children. What do we do?'
    },
    islami_oikko: {
      dialog_bn: 'ভাই, উম্মাহ এক। কিন্তু কর্তৃপক্ষ উম্মাহ চিন্তা করে না। চারটে বাচ্চা। সিদ্ধান্ত নেন।',
      dialog_en: 'Bhai, the ummah is one. But the authorities don\'t think in ummah. Four children. Decide.'
    },
    notun_bangladesh: {
      dialog_bn: 'ভাই, আপনি "পুরোনো রাজনীতি বাতিল" নিয়ে এসেছিলেন। পুরোনো উত্তর "না।" আপনার নতুন উত্তরটা কী?',
      dialog_en: 'Bhai, you ran on "out with the old politics." The old answer is no. What\'s your new one?'
    }
  },

  // ============== A24 — Party VP demanding ৳5 lakh ==============
  A24: {
    janata_league: {
      dialog_bn: 'ভাই, বুঝেন তো — নির্বাচনের মৌসুম। কেন্দ্রীয় কমিটি প্রত্যেকের কাছ থেকে ৫ লাখ চায়। শীর্ষ ৩৫-এ আপনি — না দিলে নাম মনে রাখা হবে।',
      dialog_en: 'Bhai, you understand — election season. Central wants ৳5 lakh from each. You\'re on the top-35 list. Skip, and the name gets remembered.'
    },
    jatiyotabadi_dol: {
      dialog_bn: 'ভাই, নির্বাচনী যন্ত্র টাকা ছাড়া চলে না। প্রত্যেক কাউন্সিলরের কাছ থেকে ৫ লাখ। ছাড় দিলে কেন্দ্র ভাববে আপনি ঠাণ্ডা হয়েছেন।',
      dialog_en: 'Bhai, election machinery doesn\'t run on air. ৳5 lakh from each councillor. Skip, and central thinks you\'ve cooled.'
    },
    islami_oikko: {
      dialog_bn: 'ভাই, কেন্দ্র ৫ লাখ চায় — উদ্দেশ্যের জন্য। প্রত্যেক কাউন্সিলরের কাছে আশা। আপনি জানেন।',
      dialog_en: 'Bhai, central wants ৳5 lakh — for the cause. Every councillor expected. You know how it goes.'
    },
    notun_bangladesh: {
      dialog_bn: 'ভাই, "পুরোনো রাজনীতি না" — তবু কেন্দ্র ৫ লাখ চায়। সংস্কার সময় নেয়। আগে দিন, পরে সংস্কার।',
      dialog_en: 'Bhai, "no old politics" — yet central wants ৳5 lakh. Reform takes time. Pay first, reform later.'
    }
  },

  // ============== A28 — Youth wing posters ==============
  A28: {
    janata_league: {
      dialog_bn: 'ভাই, বিরোধী দল আমাদের পোস্টার ছিঁড়ছে। পাল্টা ব্লিটজ — বাজেট কত?',
      dialog_en: 'Bhai, the opposition is tearing our posters. Counter-blitz — what\'s the budget?'
    },
    jatiyotabadi_dol: {
      dialog_bn: 'ভাই, ক্ষমতাসীন দল আমাদের পোস্টার ছিঁড়ছে। যুব শাখা বদলা চায়। পাল্টা ব্লিটজ?',
      dialog_en: 'Bhai, the ruling party is tearing our posters. The youth wing wants revenge. Counter-blitz?'
    },
    islami_oikko: {
      dialog_bn: 'ভাই, আমাদের পোস্টার নামছে। যুব শাখা পাল্টা ব্লিটজ চায়। তহবিল?',
      dialog_en: 'Bhai, our posters keep coming down. The youth wing wants a counter-blitz. Funds?'
    },
    notun_bangladesh: {
      dialog_bn: 'ভাই, সবাই আমাদের পেছনে — নতুন দল সবার শত্রু। পাল্টা ব্লিটজ?',
      dialog_en: 'Bhai, every party is after us — the new party is everyone\'s enemy. Counter-blitz?'
    }
  },

  // ============== A29 — Defection offer ==============
  A29: {
    janata_league: {
      dialog_bn: 'কাউন্সিলর সাহেব, আমাদের কাছে আসুন। ওয়ার্ড চেয়ারম্যান পদ — আপনার। এমপির আশীর্বাদ আছে।',
      dialog_en: 'Councillor sahib, come to us. The Ward Chairman seat is yours. The MP has blessed it.'
    },
    jatiyotabadi_dol: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনার দল পিছিয়ে যাচ্ছে। আমাদের কাছে আসুন — ওয়ার্ড চেয়ারম্যান পদ খালি। এমপির আশীর্বাদ আছে।',
      dialog_en: 'Councillor sahib, your party is sliding. Come to us — Ward Chairman seat is open. MP has blessed it.'
    },
    islami_oikko: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনার দলের আপস স্পষ্ট। জোটের ভাইয়েরা চেয়ারম্যান অফার করছেন। পরিচ্ছন্ন কাজ।',
      dialog_en: 'Councillor sahib, your party\'s compromises are showing. The brothers of the alliance offer you Chairman. Cleaner work.'
    },
    notun_bangladesh: {
      dialog_bn: 'কাউন্সিলর সাহেব, পুরোনো দলগুলো আপনাকে টেনে নামায়। নতুন ঢেউয়ে আসুন। চেয়ারম্যান পদ। আশীর্বাদ ইতিমধ্যে।',
      dialog_en: 'Councillor sahib, the old parties drag you down. Join the new wave. Chairman seat. Already blessed.'
    }
  },

  // ============== A33 — Farhana Channel I prime time ==============
  A33: {
    janata_league: {
      dialog_bn: 'কাউন্সিলর সাহেব, ফারহানা — চ্যানেল আই। আধা ঘণ্টা, লাইভ, কোনো এডিট না। আপনার দলের গল্পগুলো প্রাইম-টাইম পাওয়ার যোগ্য। হ্যাঁ?',
      dialog_en: 'Councillor sahib, Farhana — Channel I. Half an hour, live, no editing. Your party\'s stories deserve prime-time. Yes?'
    },
    jatiyotabadi_dol: {
      dialog_bn: 'কাউন্সিলর সাহেব, ফারহানা — চ্যানেল আই। প্রাইম-টাইম। বিরোধীরাও কভার পায়। হ্যাঁ?',
      dialog_en: 'Councillor sahib, Farhana — Channel I. Prime-time. The opposition gets covered too. Yes?'
    },
    islami_oikko: {
      dialog_bn: 'কাউন্সিলর সাহেব, ফারহানা — চ্যানেল আই। জোট মাসের পর মাস প্রাইম-টাইম পায়নি। আধা ঘণ্টা। আপনার।',
      dialog_en: 'Councillor sahib, Farhana — Channel I. The alliance hasn\'t had prime-time in months. Half an hour. Yours.'
    },
    notun_bangladesh: {
      dialog_bn: 'কাউন্সিলর সাহেব, ফারহানা — চ্যানেল আই। নতুন দল সাধারণত প্রাইম-টাইম পায় না। নিয়ে নিন — হ্যাঁ বলবেন?',
      dialog_en: 'Councillor sahib, Farhana — Channel I. New parties don\'t usually get prime-time. Take it — say yes?'
    }
  },

  // ============== A43 — Imam election-year stance ==============
  A43: {
    janata_league: {
      dialog_bn: 'ভাই, এই বছর আমাকে বিরোধীদের পাশে থাকতে হবে। ধর্ম রাজনীতি না — তবে আপনার দলও ধর্ম না।',
      dialog_en: 'Bhai, this year I have to stand with the opposition. Religion isn\'t politics — but your party isn\'t religion either.'
    },
    jatiyotabadi_dol: {
      dialog_bn: 'ভাই, এই বছর আমি বিরোধীদের পাশে। আগে একমত হয়েছিলাম — কিন্তু জাতীয়তাবাদ প্রতি বছর পাতলা হচ্ছে।',
      dialog_en: 'Bhai, this year I\'m with the opposition. We agreed once — but the nationalism thins each year.'
    },
    islami_oikko: {
      dialog_bn: 'ভাই, এই বছর আমাকে বিরোধীদের পাশে দাঁড়াতে হবে। জোটের ভেতরেও — আপনি বুঝবেন। ধর্ম কৌশল না।',
      dialog_en: 'Bhai, this year I have to stand with the opposition. Even within the alliance — you\'ll understand. Religion isn\'t strategy.'
    },
    notun_bangladesh: {
      dialog_bn: 'ভাই, এই বছর বিরোধীদের পাশে। নতুন দল কথা দেয় — মসজিদ অপেক্ষা করছে আপনি দেন কিনা।',
      dialog_en: 'Bhai, this year I\'m with the opposition. New parties make promises — the masjid waits to see if you deliver.'
    }
  }
};

let touched = 0, variantsAdded = 0;
for (const card of doc.cards) {
  const newVars = PARTY_VARIANTS[card.id];
  if (!newVars) continue;
  if (!card.dialog_variants) card.dialog_variants = {};
  let cardAdded = 0;
  for (const [party, variant] of Object.entries(newVars)) {
    if (card.dialog_variants[party]) continue; // preserve existing
    card.dialog_variants[party] = variant;
    cardAdded++;
    variantsAdded++;
  }
  if (cardAdded) {
    touched++;
    console.log('  ' + card.id + ' · added ' + cardAdded + ' party variant(s) [total now ' +
                Object.keys(card.dialog_variants).length + ']');
  }
}

fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
console.log('Touched', touched, 'cards. Added', variantsAdded, 'party variants total.');
