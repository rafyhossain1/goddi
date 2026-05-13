// One-off: append 10 news-bulletin cards to cards.json.
// News cards: no stat effects, both swipe sides are equivalent "continue"
// actions, low weight so they appear ~1 in every 8 cards. Spread across
// years for atmospheric texture.
const fs = require('fs');
const path = require('path');
const cardsPath = path.resolve(__dirname, '../data/cards.json');
const data = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const NEWS = [
  // Year 1 — domestic, settling-in mood
  {
    id: 'N01',
    character_name_bn: 'দৈনিক প্রথম আলো', character_name_en: 'Prothom Alo',
    character_role_bn: 'প্রথম পাতা', character_role_en: 'Front page',
    dialog_bn: 'ডিএনসিসি ৩০% পানি-শুল্ক বৃদ্ধির ঘোষণা দিয়েছে। ৩৬-৪০ নম্বর ওয়ার্ডে প্রতিবাদ। শহরে গরম ৩৮°।',
    dialog_en: 'DNCC announces 30% water-tariff hike. Wards 36-40 file protests. Heat index hits 38°C across the city.',
    min_year: 1, max_year: 1, weight: 0.5
  },
  {
    id: 'N02',
    character_name_bn: 'ডেইলি স্টার', character_name_en: 'Daily Star',
    character_role_bn: 'অর্থনীতি পাতা', character_role_en: 'Business desk',
    dialog_bn: 'মূল্যস্ফীতি ৯.৭% ছুঁয়েছে। পেঁয়াজ ১২০ টাকা কেজি। চাল মাছ মাংস সবই দুর্ভাগ্যের নামতা।',
    dialog_en: 'Inflation hits 9.7%. Onions at ৳120/kg. Rice, fish, mutton — every aisle a small tragedy.',
    min_year: 1, weight: 0.5
  },

  // Year 2 — political noise, monsoon mood
  {
    id: 'N03',
    character_name_bn: 'যুগান্তর', character_name_en: 'Jugantor',
    character_role_bn: 'রাজনীতি', character_role_en: 'Politics',
    dialog_bn: 'বিরোধী জোটের ডাকে আগামীকাল সকাল-সন্ধ্যা হরতাল। স্কুল-কলেজ বন্ধ। রাজধানীতে নিরাপত্তা জোরদার।',
    dialog_en: 'Opposition coalition calls a dawn-to-dusk hartal tomorrow. Schools and colleges closed. Capital on heightened alert.',
    min_year: 2, weight: 0.5
  },
  {
    id: 'N04',
    character_name_bn: 'সমকাল', character_name_en: 'Samakal',
    character_role_bn: 'নগর', character_role_en: 'Metro desk',
    dialog_bn: 'মহাখালীতে বাস দুর্ঘটনায় ২ জন নিহত, ১১ জন আহত। চালকের লাইসেন্স ছিল না। যানজট ৬ ঘণ্টা।',
    dialog_en: 'Two killed, eleven injured as a bus crashes in Mohakhali. Driver had no licence. Traffic snarled for six hours.',
    min_year: 2, weight: 0.5
  },

  // Year 3 — public health, infrastructure
  {
    id: 'N05',
    character_name_bn: 'দৈনিক ইনকিলাব', character_name_en: 'Daily Inqilab',
    character_role_bn: 'স্বাস্থ্য', character_role_en: 'Health',
    dialog_bn: 'এক সপ্তাহে ডেঙ্গু রোগী ৪০% বেড়েছে। ডিজিএইচএস হলুদ সতর্কতা জারি করেছে। হাসপাতালে শয্যা সংকট।',
    dialog_en: 'Dengue caseload up 40% week-on-week. DGHS issues yellow alert. Hospital wards report bed shortages.',
    min_year: 3, weight: 0.5
  },
  {
    id: 'N06',
    character_name_bn: 'বাংলাদেশ প্রতিদিন', character_name_en: 'BD Pratidin',
    character_role_bn: 'অবকাঠামো', character_role_en: 'Infrastructure',
    dialog_bn: 'পদ্মা সেতু চালুর তৃতীয় বছরে ৫০ লাখ যানবাহন পার হয়েছে। টোল আদায় বেড়েছে ২২%।',
    dialog_en: 'Padma Bridge crosses 50 lakh vehicles in its third year. Toll revenue up 22% on last year.',
    min_year: 3, weight: 0.5
  },

  // Year 4 — election year
  {
    id: 'N07',
    character_name_bn: 'প্রথম আলো', character_name_en: 'Prothom Alo',
    character_role_bn: 'নির্বাচন', character_role_en: 'Election desk',
    dialog_bn: 'নির্বাচন কমিশন ভোটার সচেতনতা প্রচার ঘোষণা করেছে। টিভিতে বিজ্ঞাপন, রেডিওতে গান, কেউ শোনে কি না জানা নাই।',
    dialog_en: 'Election Commission announces voter-awareness campaign. TV spots, radio jingles. Whether anyone is listening is unclear.',
    min_year: 4, weight: 0.5
  },
  {
    id: 'N08',
    character_name_bn: 'দ্য ডেইলি স্টার', character_name_en: 'The Daily Star',
    character_role_bn: 'অনুসন্ধান', character_role_en: 'Investigation',
    dialog_bn: 'এক এমপি প্রার্থীর ঘোষিত আয়ের চেয়ে ২ কোটি টাকা বেশি সম্পদ পাওয়া গেছে। দুদক মামলা করেছে।',
    dialog_en: 'MP candidate found with ৳2 crore in undeclared assets. ACC files case. Name withheld pending arraignment.',
    min_year: 4, weight: 0.5
  },
  {
    id: 'N09',
    character_name_bn: 'কালের কণ্ঠ', character_name_en: 'Kaler Kantho',
    character_role_bn: 'খেলা', character_role_en: 'Sports',
    dialog_bn: 'টি-টোয়েন্টিতে পাকিস্তানকে ৫ উইকেটে হারাল বাংলাদেশ। গোটা দেশে রাত জাগা, পটকা, মিছিল।',
    dialog_en: 'Bangladesh beats Pakistan by 5 wickets in T20I. Crowds out till dawn — drums, firecrackers, processions.',
    min_year: 4, weight: 0.5
  },

  // Year 5 — reckoning mood
  {
    id: 'N10',
    character_name_bn: 'দ্য ডেইলি স্টার', character_name_en: 'The Daily Star',
    character_role_bn: 'প্রথম পাতা', character_role_en: 'Front page',
    dialog_bn: 'হাইকোর্টের আদেশ: ওয়ার্ড-পর্যায়ের জমি বরাদ্দ পর্যালোচনা হবে। গত পাঁচ বছরের সব ফাইল আদালতে।',
    dialog_en: 'High Court orders review of ward-level land allotments. Five years of files summoned to court.',
    min_year: 5, weight: 0.5
  }
];

let added = 0;
const existingIds = new Set(data.cards.map(c => c.id));
for (const news of NEWS) {
  if (existingIds.has(news.id)) {
    console.log('skip (exists):', news.id);
    continue;
  }
  data.cards.push({
    id: news.id,
    character_name_bn: news.character_name_bn,
    character_name_en: news.character_name_en,
    character_role_bn: news.character_role_bn,
    character_role_en: news.character_role_en,
    portrait_id: 'news_bulletin',
    dialog_bn: news.dialog_bn,
    dialog_en: news.dialog_en,
    news_bulletin: true,
    oneshot: true,
    weight: news.weight,
    min_year: news.min_year,
    ...(news.max_year ? { max_year: news.max_year } : {}),
    left:  { label_bn: 'পড়ুন',     label_en: 'Read on',  effects: {} },
    right: { label_bn: 'ফেলে দিন', label_en: 'Set aside', effects: {} }
  });
  added++;
}

fs.writeFileSync(cardsPath, JSON.stringify(data, null, 2));
console.log('Added ' + added + ' news bulletins. Total cards now: ' + data.cards.length);
