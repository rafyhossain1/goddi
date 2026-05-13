// One-off helper to rewrite dialog on selected cards.
// Stored as a file (not inline in bash) because the strings contain
// the kind of punctuation that bash heredocs are picky about.

const fs = require('fs');
const path = require('path');
const cardsPath = path.resolve(__dirname, '../data/cards.json');
const data = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const REWRITES = {
  S03: {
    dialog_bn: "স্যার... তিন মাস হয়ে গেল। ছেলেটার ঈদের জামাও নাই এবার। বেতনটা একটু যদি দেন...",
    dialog_en: "Sir... three months now. My boy doesn’t even have new Eid clothes this year. If you could just release the salary..."
  },
  S08: {
    dialog_bn: "ভাই, কী বলব! আপনার মুখ দেখে আজ সকালটাই ভালো লাগতেছে। এক মিনিট—একটা সেলফি! ফেসবুকে দেব!",
    dialog_en: "Bhai, what can I say! Just seeing your face has made my whole morning. One minute — one selfie! For Facebook!"
  },
  S14: {
    dialog_bn: "ভাই, ছয় মাস হয়ে গেছে। ব্যবসা ভালো না। আজই দিতে হবে এমন না — একটু সময় দেন, পরের মাসে নিশ্চয়ই।",
    dialog_en: "Bhai, six months now. Business is slow. I’m not saying it has to be today — just a little time. Next month for sure."
  },
  S27: {
    dialog_bn: "তিন দিন পানি নাই। বাচ্চাদের গোসল করাব কীভাবে? আপনি ছাড়া আর কার কাছে যাব?",
    dialog_en: "Three days, no water. How am I supposed to bathe the children? Where do I go if not to you?"
  },
  A03: {
    dialog_bn: "ভাই, এতা কিছু না — ছোট ভাই-বন্ধুদের মতো। ঈদের সময় তো আপনাদের কষ্ট হয়, আমরা একটু চেষ্টা করি।",
    dialog_en: "Bhai, this is nothing — just family helping family. Eid is hard on you all, so we try to make it easier."
  },
  A07: {
    dialog_bn: "কাউন্সিলর সাহেব, ব্যাপারটা সিম্পল। প্লট ছয় তলার, আমরা বারো করব। সেফটি মার্জিন তো কাগজের কথা, আসল সেফটি আমার ইঞ্জিনিয়ারদের কাছে। আপনার কী হবে — সেটাও কথা হয়ে যাবে।",
    dialog_en: "Councillor sahib, it’s simple. Plot’s zoned for six; we’ll build twelve. Safety margins are paper — the real safety is in my engineers. Your share — that gets sorted, you know me."
  },
  A09: {
    dialog_bn: "ব্রেকিং: কাউন্সিলরের পিএ ৫০ হাজার টাকা ঘুষ নিতে গিয়ে হাতেনাতে। ট্রেড লাইসেন্স ফাস্ট-ট্র্যাক করার নামে। ভিডিও ভাইরাল।",
    dialog_en: "BREAKING: Councillor’s PA caught red-handed taking ৳50,000 to fast-track a trade licence. The video is everywhere."
  },
  A11: {
    dialog_bn: "কাউন্সিলর সাহেব, ডেইলি স্টার থেকে কামরুল আহমেদ। সেলিম মামলায় আপনার পক্ষের একটা বক্তব্য আজ পাব — না পেলে ছাপাব 'মন্তব্য দিতে অস্বীকৃতি'।",
    dialog_en: "Councillor sahib, Kamrul Ahmed from The Daily Star. I’m taking your statement on the Selim case today — if I don’t get one, I’ll print ‘declined to comment.’"
  },
  A14: {
    dialog_bn: "আস-সালামু আলাইকুম, কাউন্সিলর সাহেব। আল্লাহর রহমতে পঞ্চাশজন এতিম ছেলের পড়াশোনার ব্যবস্থা আমরা করতে চাই — আপনার একটু সহযোগিতা পেলে কাজটা পূর্ণ হয়।",
    dialog_en: "Assalamu alaikum, Councillor sahib. By Allah’s grace we wish to fund fifty orphans’ studies — a little support from you would complete the work."
  },
  S24: {
    dialog_bn: "কাউন্সিলর সাহেব, আমি স্কুলে পড়াই। বাড়িওয়ালা তিন মাস ধরে পানি বন্ধ করে রেখেছে। একা থাকি বলে — এই-ই কারণ। আমি কারও কাছে যেতে চাইনি, কিন্তু এবার যেতে হলো।",
    dialog_en: "Councillor sahib, I teach at a school. The landlord has cut my water for three months. Because I live alone — that is the only reason. I never wanted to come to anyone. This time I had to."
  },
  A19: {
    dialog_bn: "স্যার, এই সপ্তাহে ১৪ জন। গত সপ্তাহে ছিল ৬। গ্রাফটা উপরের দিকে। ফগিংয়ের পয়সা শেষ। অনুমোদন দিন — কাল সকাল থেকেই শুরু করতে চাই।",
    dialog_en: "Sir, fourteen cases this week. Six the week before. The curve is climbing. Fogging funds are out. Approve and we begin tomorrow morning."
  },
  A23: {
    dialog_bn: "কাউন্সিলর সাহেব, প্রথমটায় তো আমরা সবাই খুশি ছিলাম। দ্বিতীয়টা শুরু করি? এবার একটু বড় প্রকল্প — এবং আপনার অংশটাও একটু বড়।",
    dialog_en: "Councillor sahib, the first one made everyone happy. Shall we start the second? Bigger project this time — and a bigger share for you."
  },
  A24: {
    dialog_bn: "ভাই, বুঝতেই পারছেন — নির্বাচন আসছে। কেন্দ্রীয় কমিটি পাঁচ লাখ চায় প্রত্যেকের কাছ থেকে। আপনি প্রথম পঁয়ত্রিশের একজন। দেরি করলে নামটা মনে রাখা হবে।",
    dialog_en: "Bhai, you understand — election season. Central committee wants ৳5 lakh from each of us. You’re one of the top thirty-five. Delay, and the name gets remembered."
  },
  A25: {
    dialog_bn: "কাউন্সিলর সাহেব, মণ্ডপের জায়গা ঠিক হয়েছে। কিন্তু কিছু লোক এসে বলে গেছে — 'এ বছর বন্ধ থাকুক।' আমরা ভয় পেয়ে গেছি। আপনি ছাড়া আর কে আমাদের?",
    dialog_en: "Councillor sahib, the pandal site is set. But some men came and said, ‘Let it stay closed this year.’ We are frightened. Who do we have, if not you?"
  },
  A32: {
    dialog_bn: "কাউন্সিলর সাহেব, আমরা সেই বাস্কেটবল কোর্টের ছেলেরা। এখন বড় হয়ে গেছি। আমরা চাই — ওয়ার্ড বাজেট অডিট। প্রকাশ্যে। মানুষ জানুক টাকা কোথায় গেল।",
    dialog_en: "Councillor sahib, we’re the kids from the basketball court. Grown now. We want — the ward budget audit. In public. Let people see where the money went."
  },
  A34: {
    dialog_bn: "শোনো, লাইনে বেশিক্ষণ থাকব না। বস্তিতে ৫০০ করে দাও, প্রতি বাড়িতে। দেড় হাজার ঘর। আগেও করেছি, এবারও হবে। কোনো প্রশ্ন? রাখলাম।",
    dialog_en: "Listen, I won’t stay on the line. ৳500 per household in the slum areas. Fifteen hundred families. We’ve done this before, we’ll do it again. Questions? Hanging up."
  },
  A33: {
    dialog_bn: "কাউন্সিলর সাহেব, ফারহানা — চ্যানেল আই থেকে। প্রাইম টাইম স্পট দিচ্ছি — আধা ঘণ্টা, পুরোটা শুধু আপনার। লাইভ, এডিটিং নেই। কাল রাতেই অন এয়ার।",
    dialog_en: "Councillor sahib, Farhana — Channel I. Prime-time slot — half an hour, entirely yours. Live, no editing. On air tomorrow night if you say yes."
  },
  A37: {
    dialog_bn: "তুমি বাসায় থাকোই না। ছেলেটা পরীক্ষার আগে আমার কাছে কান্নাকাটি করে — বাবার সাথে কখন কথা হবে। তিন দিন — কাছাকাছি কোথাও। বেশি কিছু চাইনি।",
    dialog_en: "You’re never home. Before exams, he cries to me — ‘when will I talk to Abbu?’ Three days. Somewhere close. I never asked for much."
  }
};

let touched = 0;
for (const c of data.cards) {
  if (REWRITES[c.id]) {
    c.dialog_bn = REWRITES[c.id].dialog_bn;
    c.dialog_en = REWRITES[c.id].dialog_en;
    touched++;
  }
}
fs.writeFileSync(cardsPath, JSON.stringify(data, null, 2));
console.log("Rewrote dialog on " + touched + " cards");
