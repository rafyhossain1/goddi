// Append 12 new cards spread across the years to extend deck capacity past
// the 1825-day win threshold and bridge gaps in the existing year content.
// IDs: E01-E12 (E for "extension")
const fs = require('fs');
const path = require('path');
const cardsPath = path.resolve(__dirname, '../data/cards.json');
const data = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const NEW = [
  // ---------- YEAR 1 (no min_year, runs early) ----------
  {
    id: 'E01',
    character_name_bn: 'বাবুল', character_name_en: 'Babul',
    character_role_bn: 'ট্রাফিক কনস্টেবল', character_role_en: 'Traffic constable',
    portrait_id: 'sycophant_smile', max_year: 2,
    dialog_bn: 'স্যার, ঈদ আসতেছে। আমরা চৌরাস্তায় সারাদিন। একটু কিছু...',
    dialog_en: 'Sir, Eid is coming. We stand at the crossroads all day. Just a little something…',
    left:  { label_bn: 'কিছু দিন',       label_en: 'Give him a little', effects: { tohobil: -3, proshashon: 4 } },
    right: { label_bn: 'নিয়ম মেনে',    label_en: 'By the book',       effects: { proshashon: -3, janata: 3 } }
  },
  {
    id: 'E02',
    character_name_bn: 'সাফাইকর্মী প্রতিনিধি', character_name_en: 'Sweepers\' rep',
    character_role_bn: 'সাফাই ইউনিয়ন', character_role_en: 'Sanitation union',
    portrait_id: 'broke_resident', max_year: 2,
    dialog_bn: 'কাউন্সিলর সাহেব, চার মাস বেতন বাকি। কাল থেকে কাজ বন্ধ। বর্জ্য জমবে।',
    dialog_en: 'Councillor sahib, four months unpaid. Strike from tomorrow. The garbage will pile up.',
    left:  { label_bn: 'বেতন ছাড়ুন',   label_en: 'Release pay now',  effects: { tohobil: -6, janata: 6, proshashon: 3 } },
    right: { label_bn: 'মীমাংসা করেন', label_en: 'Negotiate later',  effects: { janata: -5, dol: 3 } }
  },
  {
    id: 'E03',
    character_name_bn: 'অভিভাবক ফোরাম', character_name_en: 'Parent forum',
    character_role_bn: 'এইচএসসি অভিভাবক', character_role_en: 'HSC parents',
    portrait_id: '_default', max_year: 2,
    dialog_bn: 'স্যার, পরীক্ষার আগের রাতে এক ঘণ্টা পরপর লোডশেডিং। ছেলেমেয়েরা পড়তে পারছে না।',
    dialog_en: 'Sir, hourly load-shedding the night before exams. Our kids can\'t study.',
    left:  { label_bn: 'বিদ্যুৎ অফিসে চাপ', label_en: 'Pressure BPDB',  effects: { proshashon: -3, janata: 5 } },
    right: { label_bn: 'মোমবাতি বিতরণ',     label_en: 'Hand out candles', effects: { janata: -3, tohobil: -2 } }
  },

  // ---------- YEAR 2 ----------
  {
    id: 'E04',
    character_name_bn: 'রেশনিং অফিস', character_name_en: 'Rationing office',
    character_role_bn: 'খাদ্য বিভাগ', character_role_en: 'Food department',
    portrait_id: '_default', min_year: 2,
    dialog_bn: 'স্যার, নতুন কার্ড বিতরণ। কে পাবে কে পাবে না — তালিকা আপনার কাছ থেকেই।',
    dialog_en: 'Sir, the new ration cards are out. Who gets them, who doesn\'t — the list comes from you.',
    left:  { label_bn: 'নিরপেক্ষ তালিকা', label_en: 'Impartial list',  effects: { janata: 5, dol: -3 } },
    right: { label_bn: 'দলীয় অগ্রাধিকার',  label_en: 'Party priority',  effects: { dol: 5, janata: -4 } }
  },
  {
    id: 'E05',
    character_name_bn: 'মিসেস তাহেরা', character_name_en: 'Mrs. Tahera',
    character_role_bn: 'প্রধান শিক্ষক', character_role_en: 'Headmistress',
    portrait_id: '_default', min_year: 2,
    dialog_bn: 'স্যার, স্কুলের আশপাশে কুকুরের পাল। কামড়াচ্ছে। জলাতঙ্কের ভয়।',
    dialog_en: 'Sir, packs of stray dogs near the school. Biting children. Rabies fears.',
    left:  { label_bn: 'পশুপালন বিভাগ', label_en: 'Animal control raid', effects: { proshashon: 3, tohobil: -3, janata: 3 } },
    right: { label_bn: 'এনজিও-কে দিন',  label_en: 'Refer to an NGO',     effects: { tohobil: 0, janata: -2 } }
  },
  {
    id: 'E06',
    character_name_bn: 'সিটি কর্পোরেশন কর্মকর্তা', character_name_en: 'City Corp officer',
    character_role_bn: 'কর শাখা', character_role_en: 'Tax desk',
    portrait_id: '_default', min_year: 2,
    dialog_bn: 'স্যার, ব্যবসায়ীদের ৬০ লাখ টাকার কর বাকি। নোটিশ পাঠাব, নাকি ছাড়?',
    dialog_en: 'Sir, traders owe ৳60 lakh in unpaid taxes. Send the notice, or let it slide?',
    left:  { label_bn: 'নোটিশ পাঠান',  label_en: 'Send the notice',  effects: { tohobil: 5, dol: -4 } },
    right: { label_bn: 'এ বছর ছাড়',   label_en: 'Let it slide',     effects: { dol: 4, proshashon: -4 } }
  },

  // ---------- YEAR 3 ----------
  {
    id: 'E07',
    character_name_bn: 'বাসিন্দা প্রতিনিধি', character_name_en: 'Residents\' rep',
    character_role_bn: 'বহুতল কমিটি', character_role_en: 'Apartment committee',
    portrait_id: '_default', min_year: 3,
    dialog_bn: 'স্যার, ডেসকো মিটার ভুল রিডিং দিচ্ছে। হাজার বাড়ি অতিরিক্ত বিল। তদন্ত চাই।',
    dialog_en: 'Sir, DESCO meters reading wrong. A thousand homes overbilled. We want an inquiry.',
    left:  { label_bn: 'তদন্ত দাবি', label_en: 'Demand inquiry',  effects: { proshashon: -3, janata: 6 } },
    right: { label_bn: 'অপেক্ষা করুন', label_en: 'Tell them to wait', effects: { janata: -5, proshashon: 2 } }
  },
  {
    id: 'E08',
    character_name_bn: 'এলাকার দাদা', character_name_en: 'Local strongman',
    character_role_bn: 'অজ্ঞাত', character_role_en: 'Unnamed',
    portrait_id: 'sycophant_smile', min_year: 3,
    dialog_bn: 'ভাইজান, ছাদে একটা মোবাইল টাওয়ার বসাব। ভাড়া পাবেন প্রতি মাসে। সিগনেচার?',
    dialog_en: 'Bhaijaan, I\'ll put a mobile tower on the rooftop. You get rent each month. Sign?',
    left:  { label_bn: 'সিগনেচার',   label_en: 'Sign',           effects: { tohobil: 6, proshashon: -3, janata: -3 } },
    right: { label_bn: 'নিয়মমাফিক', label_en: 'Refuse',         effects: { tohobil: -2, proshashon: 4 } }
  },
  {
    id: 'E09',
    character_name_bn: 'বশির শেখ',  character_name_en: 'Bashir Sheikh',
    character_role_bn: 'মল ব্যবস্থাপক', character_role_en: 'Mall manager',
    portrait_id: 'bashir_sheikh', min_year: 3,
    dialog_bn: 'কাউন্সিলর সাহেব, নতুন মলের সামনে ভিক্ষুক বসে। বড় কাস্টমার চলে যাচ্ছে। উঠিয়ে দেন।',
    dialog_en: 'Councillor sahib, beggars sitting in front of my new mall. Big customers walk away. Move them out.',
    left:  { label_bn: 'উচ্ছেদ',     label_en: 'Evict them',    effects: { janata: -5, tohobil: 3, dol: 2 } },
    right: { label_bn: 'কিছু করব না', label_en: 'Do nothing',    effects: { janata: 3, tohobil: -2 } }
  },

  // ---------- YEAR 4 (election season) ----------
  {
    id: 'E10',
    character_name_bn: 'ওসি হাসান', character_name_en: 'OC Hassan',
    character_role_bn: 'থানার ভারপ্রাপ্ত', character_role_en: 'Officer-in-charge',
    portrait_id: '_default', min_year: 4,
    dialog_bn: 'স্যার, বিরোধীরা কাল সমাবেশ চাইছে। অনুমতি দেব, না আটকাব?',
    dialog_en: 'Sir, opposition wants a rally tomorrow. Permit it, or block it?',
    left:  { label_bn: 'অনুমতি দিন',   label_en: 'Grant permit',  effects: { janata: 5, dol: -4, proshashon: 2 } },
    right: { label_bn: 'নিরাপত্তার অজুহাত', label_en: 'Block on security grounds', effects: { dol: 4, janata: -5, proshashon: -2 } }
  },
  {
    id: 'E11',
    character_name_bn: 'ইসি কর্মকর্তা', character_name_en: 'EC officer',
    character_role_bn: 'নির্বাচন কমিশন', character_role_en: 'Election Commission',
    portrait_id: '_default', min_year: 4,
    dialog_bn: 'স্যার, ভোটার তালিকায় চার হাজার নাম দ্বিগুণ। সংশোধন করব, না রাখব?',
    dialog_en: 'Sir, four thousand duplicate names on the voter rolls. Clean them up, or leave?',
    left:  { label_bn: 'সংশোধন',  label_en: 'Clean them',    effects: { proshashon: 4, dol: -3 } },
    right: { label_bn: 'রাখুন',   label_en: 'Leave them',    effects: { dol: 4, proshashon: -4 } }
  },

  // ---------- YEAR 5 (endgame closure) ----------
  {
    id: 'E12',
    character_name_bn: 'প্রধান সহকারী', character_name_en: 'Chief aide',
    character_role_bn: 'অফিস হস্তান্তর', character_role_en: 'Office handover',
    portrait_id: '_default', min_year: 5,
    dialog_bn: 'স্যার, ফাইল রুম পরিষ্কার করতে হবে। কোনটা রাখব, কোনটা পোড়াব?',
    dialog_en: 'Sir, we need to clear the file room. What stays, what burns?',
    left:  { label_bn: 'সব রেখে দিন',  label_en: 'Leave everything', effects: { proshashon: 4, dol: -3 } },
    right: { label_bn: 'সংবেদনশীল পুড়িয়ে দিন', label_en: 'Burn the sensitive ones', effects: { proshashon: -5, dol: 4 } }
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
console.log('Added ' + added + ' extension cards. Total cards now: ' + data.cards.length);
