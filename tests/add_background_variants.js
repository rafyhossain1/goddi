#!/usr/bin/env node
/* Adds background_variants to 5 high-traffic cards.
   Variants change how the speaker pitches the same ask based on the
   Councillor's pre-politics background. Same choices and effects —
   only the framing changes. Player feels recognized. */

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'data', 'cards.json');
const doc  = JSON.parse(fs.readFileSync(file, 'utf8'));

const VARIANTS = {
  // ---------- S03 — Azad Chacha (security guard), back-pay ask ----------
  S03: {
    businessman: {
      dialog_bn: 'স্যার... আপনি ব্যবসায়ী মানুষ। তিন মাস ক্যাশবাক্স খালি থাকলে কেমন লাগে — সেটা ছেলেটার ঈদের জামার মধ্যে দেখতে পাচ্ছি।',
      dialog_en: 'Sir... you are a businessman. You know what three empty months at the till feels like — I see it in my boy not having Eid clothes.'
    },
    teacher: {
      dialog_bn: 'স্যার, আপনি তো শিক্ষক ছিলেন। মাস শেষে বেতনের জন্য বসে থাকার অনুভূতি আপনার চেনা। তিন মাস হয়ে গেল...',
      dialog_en: 'Sir, you were a teacher. The wait for month-end pay — you know that feeling. It\'s been three months now...'
    },
    army_retired: {
      dialog_bn: 'স্যার, আপনি সার্ভিসের লোক ছিলেন। সৈনিকের বেতন কেউ চেয়ে নেয় না — অথচ আমি দাঁড়িয়ে আছি। তিন মাস।',
      dialog_en: 'Sir, you were in service. A soldier should not have to ask for his pay — yet here I am. Three months.'
    },
    ngo_worker: {
      dialog_bn: 'স্যার, আপনি গরিবের কাছে গিয়েছেন — তিন মাস বেতন না পেলে পরিবার কোথায় দাঁড়ায়, আপনার সেটা চেনা।',
      dialog_en: 'Sir, you\'ve been to the poor. You know where a family stands when three months pass without pay.'
    },
    party_lifer: {
      dialog_bn: 'স্যার, আপনি দলের পুরোনো মানুষ। আপনার এক ফোনে ফাইলটা সরে। ছেলেটার ঈদের জামা — মাত্র তিন মাস হয়ে গেল।',
      dialog_en: 'Sir, you\'re an old party hand. One phone call from you and the file moves. My boy\'s Eid clothes — only three months gone.'
    }
  },

  // ---------- S05 — Teen delegation, basketball court ----------
  S05: {
    businessman: {
      dialog_bn: 'আঙ্কেল, আপনি তো ব্যবসায়ী মানুষ — একটা ইনভেস্টমেন্ট ধরে নেন। পাঁচ বছর পর আমরাই তো ভোটার।',
      dialog_en: 'Uncle, you\'re a businessman — think of it as an investment. In five years we\'re the voters.'
    },
    teacher: {
      dialog_bn: 'স্যার, আপনাকে আমাদের হেডস্যার পাঠিয়েছেন। বললেন, "ও তোমাদের কথা শুনবে।" একটা কোর্ট, পার্কে।',
      dialog_en: 'Sir, our headmaster sent us. He said, "He\'ll hear you out." Just a court, in the park.'
    },
    army_retired: {
      dialog_bn: 'স্যার, আমাদের কোচও আর্মি রিটায়ার্ড। উনি বললেন, "খেলাধুলায় শৃঙ্খলা আসে — সেটা ও বোঝে।"',
      dialog_en: 'Sir, our coach is also ex-Army. He said, "Discipline comes through sport — that man understands."'
    },
    ngo_worker: {
      dialog_bn: 'আঙ্কেল, আপনি আমাদের পাড়ায় আসতেন এনজিওর ব্যাগ নিয়ে। এখন সেই মাঠেই একটা কোর্ট দেন।',
      dialog_en: 'Uncle, you used to come to our para with the NGO bags. Now put a court on that same field.'
    },
    party_lifer: {
      dialog_bn: 'আঙ্কেল, আমাদের সিনিয়ররা বলে আপনি দলে আমাদের জন্মের আগে থেকে। একটা কোর্ট — উপরে আপনার নাম লিখব।',
      dialog_en: 'Uncle, our seniors say you\'ve been in the party since before we were born. Just a court — we\'ll paint your name on it.'
    }
  },

  // ---------- S14 — Karim Miah, time-to-pay ask ----------
  S14: {
    businessman: {
      dialog_bn: 'ভাই, আপনি ব্যবসায়ী। ছয় মাসের স্লো ইয়ার কী জিনিস, আপনি জানেন। শুধু একটু সময়...',
      dialog_en: 'Bhai, you\'re a businessman. You know what a six-month slow run looks like. Just a little time...'
    },
    teacher: {
      dialog_bn: 'স্যার, এই ওয়ার্ডের অর্ধেক আপনার ছাত্র ছিল। আমি ঋণ থেকে পালানোর লোক না — আপনি জানেন। একটু সময় দেন।',
      dialog_en: 'Sir, half this ward was your student. I\'m not a man who runs from a debt — you know that. Just time.'
    },
    army_retired: {
      dialog_bn: 'স্যার, সোজা কথা বলি — সৈনিকের মতো। এই মাসে পারব না। পরের মাসে দেব। কথা দিলাম।',
      dialog_en: 'Sir, I\'ll speak straight — soldier to soldier. Not this month. Next month for sure. My word.'
    },
    ngo_worker: {
      dialog_bn: 'ভাই, আপনি আমাদের পাড়ায় সঞ্চয় কমিটি চালাতেন — "ব্যবসা ভালো না" কথাটার আসল মানে আপনার চেনা।',
      dialog_en: 'Bhai, you ran the savings committees in our para — you know the real meaning of "business is slow."'
    },
    party_lifer: {
      dialog_bn: 'ভাই, ৯১ সাল থেকে আপনার দলকে ভোট দিচ্ছি। ছয় মাস — ঈদের পর ফিরিয়ে দেব। নিশ্চয়ই।',
      dialog_en: 'Bhai, I\'ve voted your party since \'91. Six months — I\'ll have it by after Eid. For sure.'
    }
  },

  // ---------- C01 — Rafy from SBYC, ribbon-cutting invite ----------
  C01: {
    businessman: {
      dialog_bn: 'ভাই, পুরো ক্যাম্প স্পনসর-ফান্ডেড — আপনার পকেট থেকে কিচ্ছু না। ব্যানারে নাম যাবে, বিশ মিনিট লাগবে।',
      dialog_en: 'Bhai, the camp is fully sponsor-funded — nothing from your pocket. Your name on the banner, twenty minutes tops.'
    },
    teacher: {
      dialog_bn: 'স্যার, আমাদের ভলান্টিয়ার টিমে আপনার অনেক পুরোনো ছাত্র। ছবি তোলার জন্য লাইন ধরবে। আসুন প্লিজ।',
      dialog_en: 'Sir, our volunteer team is full of your old students. They\'ll line up for photos. Please come.'
    },
    army_retired: {
      dialog_bn: 'স্যার, শুক্রবার এক্স-আর্মি ডাক্তাররা আসছেন। আপনি থাকবেন কিনা — নাম ধরে জিজ্ঞেস করলেন।',
      dialog_en: 'Sir, ex-Army doctors are coming Friday. They asked, by name, if you\'d be there.'
    },
    ngo_worker: {
      dialog_bn: 'ভাই, আপনি এই ফিতা আগেও কেটেছেন — আপনি ফর্মুলাটা জানেন। তাড়াতাড়ি আসেন, তাড়াতাড়ি যান, ভাষণ না।',
      dialog_en: 'Bhai, you\'ve cut these ribbons before — you know the formula. Come early, leave early, no speech.'
    },
    party_lifer: {
      dialog_bn: 'ভাই, কোনো দলীয় ব্যানার নেই — পরিষ্কার ইভেন্ট। কিন্তু ছবিগুলো সব জায়গায় যাবে। চলে আসুন।',
      dialog_en: 'Bhai, no party banner — clean event. But the photos will land everywhere. Just come.'
    }
  },

  // ---------- A07 — Bashir Sheikh, tower bribe pitch ----------
  A07: {
    businessman: {
      dialog_bn: 'কাউন্সিলর সাহেব — ব্যবসায়ী থেকে ব্যবসায়ীকে বলি, ছয় তলায় হিসেব মেলে না, বারো তলায় গান গায়। আপনার ভাগ — সেটা তো হিসেবে আছেই।',
      dialog_en: 'Councillor sahib — businessman to businessman, six floors the numbers don\'t add up, twelve floors they sing. Your cut — that\'s already on the books.'
    },
    teacher: {
      dialog_bn: 'কাউন্সিলর সাহেব, জানি — আপনি চক-ব্ল্যাকবোর্ড থেকে এসেছেন, ইট থেকে না। তাই আমার উপর ছেড়ে দেন। প্লট ছয়ের, আমরা বারো করব। আপনার অংশ ঠিকঠাক।',
      dialog_en: 'Councillor sahib, I know — you came from chalk and blackboard, not bricks. So leave it to me. Plot\'s for six; we\'ll build twelve. Your share, sorted.'
    },
    army_retired: {
      dialog_bn: 'কাউন্সিলর সাহেব, আপনার ইউনিফর্মকে সম্মান করি। তাই পরিষ্কার বলি — প্লট ছয়, আমরা বারো। ইঞ্জিনিয়াররা বাকিটা সামলাবে। আপনার ভাগ গোনা হয়ে গেছে।',
      dialog_en: 'Councillor sahib, I respect the uniform you wore. So I\'ll say this clean: plot\'s six, we go twelve. Engineers handle the rest. Your share\'s already counted.'
    },
    ngo_worker: {
      dialog_bn: 'কাউন্সিলর সাহেব, এনজিও এক জিনিস, কিন্তু মানুষের আসলে দরকার ঘর। বারো তলা মানে একশো পরিবার। আপনার অংশ? সেটাও ভাবা হয়েছে, অবশ্যই।',
      dialog_en: 'Councillor sahib, NGO work is one thing — but what people actually need is housing. Twelve floors means a hundred families. Your share? Thought of, of course.'
    },
    party_lifer: {
      dialog_bn: 'কাউন্সিলর সাহেব, আশির দশক থেকে আপনি আর আমি দলটা ভেতর থেকে চিনি। নাচার দরকার নেই। প্লট ছয়, বিল্ডিং বারো। আপনার অংশ আগে থেকেই নোট করা।',
      dialog_en: 'Councillor sahib, you and I have known the party from the inside since the \'80s. No need to dance around. Plot\'s six, building\'s twelve. Your share\'s already noted.'
    }
  }
};

let touched = 0;
for (const card of doc.cards) {
  const v = VARIANTS[card.id];
  if (!v) continue;
  card.background_variants = v;
  touched++;
}

if (touched !== Object.keys(VARIANTS).length) {
  console.error('Touched', touched, 'cards but expected', Object.keys(VARIANTS).length);
  process.exit(1);
}

fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
console.log('Wrote background_variants to', touched, 'cards.');
