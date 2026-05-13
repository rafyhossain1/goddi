// 15 background-specific cards — 3 per background. Each one is a callback
// from the player's pre-political life. Gated by `background_only`.
// IDs: BG01-BG15 (BG = background).
const fs = require('fs');
const path = require('path');
const cardsPath = path.resolve(__dirname, '../data/cards.json');
const data = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const NEW = [
  // ===================== BUSINESSMAN =====================
  {
    id: 'BG01',
    character_name_bn: 'হাফিজ ভাই', character_name_en: 'Hafiz Bhai',
    character_role_bn: 'পুরোনো ব্যবসায়িক অংশীদার', character_role_en: 'Former business partner',
    portrait_id: 'sycophant_smile',
    background_only: ['businessman'],
    min_year: 1,
    dialog_bn: 'ভাই, পুরোনো দোস্ত। আপনি যখন রাজনীতিতে গেলেন, আমাদের চুক্তি অসম্পূর্ণ। ছোট্ট একটা পারমিট দিন, আমি বাকিটা ভুলে যাব।',
    dialog_en: 'Bhai, old friend. When you went into politics, our contract was left hanging. Sign one small permit and I forget the rest.',
    left:  { label_bn: 'পারমিট দিন', label_en: 'Sign the permit', effects: { proshashon: -4, tohobil: 4 }, triggers: ['taking_envelopes'] },
    right: { label_bn: 'অসম্ভব',     label_en: 'Not possible',    effects: { tohobil: -3, proshashon: 3 } }
  },
  {
    id: 'BG02',
    character_name_bn: 'ব্যাংক ম্যানেজার', character_name_en: 'Bank manager',
    character_role_bn: 'আপনার পুরোনো ঋণদাতা', character_role_en: 'Your old lender',
    portrait_id: '_default',
    background_only: ['businessman'],
    min_year: 2,
    dialog_bn: 'স্যার, ব্যবসা ছেড়ে রাজনীতিতে গেছেন ভালো কথা। কিন্তু আপনার নামে ঋণটা এখনো খোলা। আজ মেটান, না দেরি?',
    dialog_en: 'Sir, leaving business for politics is fine. But the loan in your name is still open. Settle today or later?',
    left:  { label_bn: 'আজই মেটান',  label_en: 'Settle today',  effects: { tohobil: -6, proshashon: 4 } },
    right: { label_bn: 'দেরি করুন',  label_en: 'Delay it',      effects: { proshashon: -5, tohobil: 2 } }
  },
  {
    id: 'BG03',
    character_name_bn: 'রহিমা খালা', character_name_en: 'Rahima Khala',
    character_role_bn: 'আপনার পুরোনো কারখানার শ্রমিক', character_role_en: 'Former factory worker',
    portrait_id: 'broke_resident',
    background_only: ['businessman'],
    min_year: 3,
    dialog_bn: 'বাবা, আপনার কারখানা যখন বন্ধ করলেন, আমরা চাকরি হারালাম। বকেয়া বেতন আজও পাইনি। আপনি তো এখন কাউন্সিলর — দেখবেন না?',
    dialog_en: 'Son, when you closed the factory, we lost our jobs. The back wages never came. You\'re a councillor now — won\'t you look into it?',
    left:  { label_bn: 'দিয়ে দিন',     label_en: 'Pay her',          effects: { tohobil: -5, janata: 6 } },
    right: { label_bn: 'অস্বীকার করুন', label_en: 'Deny it ever happened', effects: { janata: -6, proshashon: -2 } }
  },

  // ===================== TEACHER =====================
  {
    id: 'BG04',
    character_name_bn: 'আদনান', character_name_en: 'Adnan',
    character_role_bn: 'প্রাক্তন ছাত্র, এখন সাংবাদিক', character_role_en: 'Former student, now a journalist',
    portrait_id: '_default',
    background_only: ['teacher'],
    min_year: 2,
    dialog_bn: 'স্যার, মনে আছে ক্লাস নাইনে আমাকে রচনা শিখিয়েছিলেন? এখন আমি ডেইলি স্টারে। আপনার ওয়ার্ড নিয়ে একটা পজিটিভ ফিচার করব?',
    dialog_en: 'Sir, remember teaching me composition in Class Nine? I\'m at Daily Star now. Want me to do a positive feature on your ward?',
    left:  { label_bn: 'রাজি',        label_en: 'Yes please',      effects: { janata: 5, dol: 3 } },
    right: { label_bn: 'এড়িয়ে যাব',  label_en: 'Politely decline', effects: { janata: -3, proshashon: 3 } }
  },
  {
    id: 'BG05',
    character_name_bn: 'মিসেস ফিরোজা', character_name_en: 'Mrs. Firoza',
    character_role_bn: 'প্রাক্তন সহকর্মী', character_role_en: 'Former colleague',
    portrait_id: '_default',
    background_only: ['teacher'],
    min_year: 2,
    dialog_bn: 'ভাই, আপনার স্কুলে আমার বদলির ব্যবস্থা করেন। ত্রিশ বছর ধরে অসহ্য প্রধান শিক্ষকের সাথে আছি। আপনি ছাড়া আশা নাই।',
    dialog_en: 'Bhai, get me transferred to your old school. Thirty years under an unbearable headmaster. You\'re my only hope.',
    left:  { label_bn: 'বদলি ব্যবস্থা', label_en: 'Arrange the transfer', effects: { proshashon: -4, janata: 3 } },
    right: { label_bn: 'নিয়ম মেনে',     label_en: 'By the book',          effects: { proshashon: 3, janata: -3 } }
  },
  {
    id: 'BG06',
    character_name_bn: 'স্কুল কমিটি', character_name_en: 'School committee',
    character_role_bn: 'আপনার পুরোনো স্কুল', character_role_en: 'Your old school',
    portrait_id: '_default',
    background_only: ['teacher'],
    min_year: 3,
    dialog_bn: 'স্যার, আপনার পুরোনো স্কুলে দেয়ালের পলেস্তরা ঝরছে। বাচ্চাদের ক্লাসে বসা ঝুঁকিপূর্ণ। ওয়ার্ড থেকে মেরামত?',
    dialog_en: 'Sir, plaster falling from the walls at your old school. Kids in class is risky. Can the ward fund repairs?',
    left:  { label_bn: 'অবশ্যই',     label_en: 'Of course',  effects: { tohobil: -5, janata: 7 } },
    right: { label_bn: 'অন্য ফান্ডে', label_en: 'Wait for other funds', effects: { janata: -5, tohobil: 2 } }
  },

  // ===================== EX-ARMY =====================
  {
    id: 'BG07',
    character_name_bn: 'মেজর (অব.) তারিক', character_name_en: 'Major (retd.) Tariq',
    character_role_bn: 'পুরোনো সহকর্মী', character_role_en: 'Old comrade-in-arms',
    portrait_id: '_default',
    background_only: ['army_retired'],
    min_year: 1,
    dialog_bn: 'ভাই, আপনি গদিতে। আমি বেতনের চেয়ে পেনশনে কম পাই। সিকিউরিটি ফার্ম খুলেছি। ওয়ার্ড অফিসের কন্ট্রাক্ট দিন।',
    dialog_en: 'Bhai, you\'re in office. My pension is half my old salary. Started a security firm. Give me the ward office contract.',
    left:  { label_bn: 'কন্ট্রাক্ট দিন', label_en: 'Give him the contract', effects: { proshashon: -4, tohobil: 0 } },
    right: { label_bn: 'টেন্ডারে যান',    label_en: 'Open tender it',        effects: { proshashon: 4, dol: -2 } }
  },
  {
    id: 'BG08',
    character_name_bn: 'ব্রিগেডিয়ার (অব.) সিদ্দিক', character_name_en: 'Brig. (retd.) Siddique',
    character_role_bn: 'প্রাক্তন কমান্ডিং অফিসার', character_role_en: 'Your former CO',
    portrait_id: 'sycophant_smile',
    background_only: ['army_retired'],
    min_year: 2,
    dialog_bn: 'সৈনিক, ছাউনি এলাকায় বাড়ি বানাচ্ছি। কিছু ফাইল আটকে আছে — তুমি একটু দেখলে কাজটা হয়ে যাবে।',
    dialog_en: 'Soldier, I\'m building a home in the cantonment area. Some files are stuck — if you look at it, it gets done.',
    left:  { label_bn: 'অবশ্যই, স্যার', label_en: 'Of course, sir', effects: { proshashon: -5, dol: 2 } },
    right: { label_bn: 'নিয়মমাফিক',     label_en: 'Through proper channels', effects: { proshashon: 4, dol: -3 } }
  },
  {
    id: 'BG09',
    character_name_bn: 'ভেটেরান্স অ্যাসোসিয়েশন', character_name_en: 'Veterans\' association',
    character_role_bn: 'অবসরপ্রাপ্ত সৈনিকেরা', character_role_en: 'Retired soldiers',
    portrait_id: '_default',
    background_only: ['army_retired'],
    min_year: 3,
    dialog_bn: 'ভাই, আমাদের পেনশনে কোনো বৃদ্ধি নাই দশ বছর। আপনি কাউন্সিলর। কিছু লিখিত বার্তা ওপরে পাঠাতে পারেন?',
    dialog_en: 'Bhai, no pension hike in ten years. You\'re a councillor. Can you send a written appeal upward?',
    left:  { label_bn: 'অবশ্যই পাঠাব', label_en: 'I\'ll send it up',  effects: { proshashon: 3, janata: 4 } },
    right: { label_bn: 'কঠিন বিষয়',    label_en: 'It\'s complicated', effects: { proshashon: -3, janata: -2 } }
  },

  // ===================== NGO WORKER =====================
  {
    id: 'BG10',
    character_name_bn: 'ফাহমিদা আপা', character_name_en: 'Fahmida Apa',
    character_role_bn: 'প্রাক্তন এনজিও পরিচালক', character_role_en: 'Former NGO director',
    portrait_id: '_default',
    background_only: ['ngo_worker'],
    min_year: 1,
    dialog_bn: 'ভাই, মনে রেখো, আমরা যাকে সাহায্য করতাম তারা ভোটার। ওয়ার্ডে আমাদের নতুন প্রকল্প — অনুদান চাই, পারমিট চাই।',
    dialog_en: 'Bhai, remember — the people we used to help are voters. We have a new project for the ward — funding and a permit.',
    left:  { label_bn: 'দুটোই দিন',   label_en: 'Give both',    effects: { tohobil: -5, janata: 6, proshashon: -2 } },
    right: { label_bn: 'পারমিট মাত্র', label_en: 'Permit only',  effects: { janata: 2, tohobil: -1 } }
  },
  {
    id: 'BG11',
    character_name_bn: 'বাছিরন বিবি', character_name_en: 'Bachiron Bibi',
    character_role_bn: 'পুরোনো উপকারভোগী', character_role_en: 'Old beneficiary',
    portrait_id: 'broke_resident',
    background_only: ['ngo_worker'],
    min_year: 2,
    dialog_bn: 'বাবা, এনজিওতে যখন ছিলেন, আপনি আমার মেয়ের বিয়ের খরচ দিয়েছিলেন। এবার ছেলেটার চাকরি নাই। একটু দেখবেন?',
    dialog_en: 'Son, at the NGO you paid for my daughter\'s wedding. Now my boy has no job. Will you look at it?',
    left:  { label_bn: 'চাকরি দিন',    label_en: 'Find him work',  effects: { dol: 3, proshashon: -4, janata: 4 } },
    right: { label_bn: 'ব্যবস্থা পরে', label_en: 'Later, maybe',   effects: { janata: -4 } }
  },
  {
    id: 'BG12',
    character_name_bn: 'বিদেশি দাতা', character_name_en: 'Foreign donor',
    character_role_bn: 'এনজিও বোর্ড', character_role_en: 'NGO board',
    portrait_id: '_default',
    background_only: ['ngo_worker'],
    min_year: 3,
    dialog_bn: 'আপনি আমাদের ছিলেন। সরকারের কাছে ১৫% ম্যাচিং ফান্ডের জন্য তদবির করুন। নাহলে দাতা টাকা ফিরিয়ে নেবেন।',
    dialog_en: 'You were one of us. Lobby the government for the 15% matching fund. Otherwise the donor pulls out.',
    left:  { label_bn: 'তদবির করব',   label_en: 'I\'ll lobby',     effects: { proshashon: -3, janata: 4, dol: -2 } },
    right: { label_bn: 'এ আমার বাইরে', label_en: 'Out of my hands', effects: { janata: -3 } }
  },

  // ===================== CAREER PARTY WORKER =====================
  {
    id: 'BG13',
    character_name_bn: 'বাবলু', character_name_en: 'Bablu',
    character_role_bn: 'পুরোনো দলীয় কর্মী', character_role_en: 'Old party worker',
    portrait_id: 'sycophant_smile',
    background_only: ['party_lifer'],
    min_year: 1,
    dialog_bn: 'ভাইজান, ২০০৮-এর সমাবেশে আমি লাঠি খেয়েছিলাম তোমার জন্য। এবার একটু আমার বাচ্চার অ্যাডমিশনে...',
    dialog_en: 'Bhaijaan, I took a baton-hit for you at the 2008 rally. Now my kid\'s school admission — just a small word…',
    left:  { label_bn: 'ব্যবস্থা করব', label_en: 'I\'ll arrange it', effects: { proshashon: -4, dol: 4 } },
    right: { label_bn: 'এই বার না',    label_en: 'Not this time',     effects: { dol: -5 } }
  },
  {
    id: 'BG14',
    character_name_bn: 'নজরুল দাদা', character_name_en: 'Nazrul Dada',
    character_role_bn: 'প্রবীণ দলীয় নেতা', character_role_en: 'Senior party elder',
    portrait_id: '_default',
    background_only: ['party_lifer'],
    min_year: 2,
    dialog_bn: 'বাবু, তোমাকে নমিনেশন দিয়েছিলাম আমি। মনে আছে? এখন আমার এক ভাগ্নেকে ওয়ার্ড অফিসে চাকরি দাও।',
    dialog_en: 'Babu, I got you the nomination. Remember? Now give my nephew a job at the ward office.',
    left:  { label_bn: 'অবশ্যই, দাদা', label_en: 'Of course, dada', effects: { proshashon: -4, dol: 5 } },
    right: { label_bn: 'নিয়োগ যোগ্যতায়', label_en: 'Hire on merit',   effects: { dol: -5, proshashon: 4 } }
  },
  {
    id: 'BG15',
    character_name_bn: 'অজানা ফোন', character_name_en: 'Anonymous call',
    character_role_bn: 'দলের ভেতরের কণ্ঠস্বর', character_role_en: 'Inside the party',
    portrait_id: '_default',
    background_only: ['party_lifer'],
    min_year: 3,
    dialog_bn: 'ভাই, পার্টি ভেতরে আপনার বিরুদ্ধে কথা হচ্ছে। ২০১৩-র সেই মিটিংয়ের রেকর্ডিং আছে আমার কাছে। কী করব?',
    dialog_en: 'Bhai, the party is whispering against you. I have the recording from that 2013 meeting. What do I do?',
    left:  { label_bn: 'আমার কাছে দিন', label_en: 'Send it to me',    effects: { dol: 3, proshashon: -3 } },
    right: { label_bn: 'নষ্ট করে দিন',  label_en: 'Destroy it',       effects: { dol: -2, proshashon: 2 } }
  }
];

let added = 0;
const existing = new Set(data.cards.map(c => c.id));
for (const n of NEW) {
  if (existing.has(n.id)) continue;
  data.cards.push(n);
  added++;
}
fs.writeFileSync(cardsPath, JSON.stringify(data, null, 2));
console.log('Added ' + added + ' background-specific cards. Total cards now: ' + data.cards.length);
