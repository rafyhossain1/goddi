/* ==========================================================
   Share-card — renders a 1200×630 PNG of the run's verdict
   for sharing on Facebook / WhatsApp / Twitter. Drawn entirely
   on a Canvas2D — no external assets, no network calls.

   Public API:
     ShareCard.export({
       outcome: 'win' | 'death',
       tier:    'clean' | 'standard' | 'compromised'  (win only)
       cause:   string  (death only, e.g. 'tohobil_low')
       days:    number,
       stats:   { janata, dol, proshashon, tohobil },
       flags:   string[],
       lang:    'bn' | 'en'
     })
     → triggers a download of "goddi-ward37.png"
   ========================================================== */
(function () {
  'use strict';

  // Match the CSS palette
  const PAPER     = '#f1e9d6';
  const PAPER_2   = '#e6dcc2';
  const INK       = '#1a1310';
  const INK_SOFT  = '#3d322a';
  const INK_MUTE  = '#6a594b';
  const STAMP_RED = '#a6291f';
  const BD_GREEN  = '#006a4e';
  const SBYC_GREEN = '#1b7849';
  const GOLD      = '#b8934a';

  // Per-tier stamp word + accent color
  const TIER_STAMP = {
    clean:       { bn: 'সততা',  en: 'INTEGRITY', color: BD_GREEN },
    standard:    { bn: 'জয়',    en: 'VICTORY',   color: SBYC_GREEN },
    compromised: { bn: 'মূল্য', en: 'THE PRICE', color: GOLD }
  };
  const DEATH_STAMP = { bn: 'পতন', en: 'FALLEN', color: STAMP_RED };

  // Death cause → short headline
  const DEATH_HEADLINES = {
    janata_low:      { bn: 'গণবিক্ষোভ',   en: 'MASS PROTEST' },
    janata_high:     { bn: 'পপুলিস্ট পতন', en: 'POPULIST COLLAPSE' },
    dol_low:         { bn: 'বহিষ্কার',     en: 'EXPELLED' },
    dol_high:        { bn: 'পুতুল',         en: 'THE PUPPET' },
    proshashon_low:  { bn: 'নিষ্ক্রিয়',   en: 'PARALYSIS' },
    proshashon_high: { bn: 'দালাল',         en: 'STOOGE' },
    tohobil_low:     { bn: 'দেউলিয়া',     en: 'BANKRUPT' },
    tohobil_high:    { bn: 'তদন্তাধীন',   en: 'UNDER INVESTIGATION' }
  };

  // Flag→badge labels (matches HUD arc stamps + a few extras)
  const FLAG_BADGES = {
    pa_protected:           { bn: 'পিএ',     en: 'PA' },
    tower_approved:         { bn: 'টাওয়ার', en: 'TOWER' },
    tower_collapsed:        { bn: 'ধস',      en: 'COLLAPSE' },
    tower2_approved:        { bn: 'টাওয়ার ২', en: 'TOWER II' },
    tower2_collapsed:       { bn: 'ধস ২',    en: 'COLLAPSE II' },
    tower_blamed_contractor:{ bn: 'অপবাদ',  en: 'BLAME' },
    taking_envelopes:       { bn: 'অডিট',   en: 'AUDIT' },
    votebuying:             { bn: 'ভোট',    en: 'VOTES' },
    ec_bribed:              { bn: 'ইসি',    en: 'EC' },
    defected:               { bn: 'দলবদল',  en: 'DEFECTED' },
    corrupt_retirement:     { bn: 'অবসর',   en: 'EXIT' },
    acc_stonewalled:        { bn: 'দুদক',  en: 'ACC' },
    pa_betrayed:            { bn: 'বিশ্বাসঘাত', en: 'BETRAYED' },
    pa_loyal:               { bn: 'বিশ্বস্ত',  en: 'LOYAL' },
    karim_helped:           { bn: 'করিম',   en: 'KARIM' },
    flood_walk:             { bn: 'বন্যা',  en: 'FLOOD' },
    sbyc_legacy:            { bn: 'এসবিওয়াইসি', en: 'SBYC' },
    mosque_funded:          { bn: 'মসজিদ', en: 'MOSQUE' },
    compensation_paid:      { bn: 'ক্ষতিপূরণ', en: 'COMPENSATED' }
  };
  // Subset that's "dirty" — these get the red stamp colour
  const DIRTY_FLAGS = new Set([
    'taking_envelopes', 'tower_approved', 'tower_collapsed', 'tower2_approved',
    'tower2_collapsed', 'tower_blamed_contractor', 'acc_stonewalled',
    'votebuying', 'ec_bribed', 'defected', 'corrupt_retirement',
    'pa_protected', 'pa_betrayed'
  ]);

  function toBanglaDigits(n) {
    const map = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(n).split('').map(c => (c >= '0' && c <= '9') ? map[+c] : c).join('');
  }
  function fmtDays(n, lang) {
    return lang === 'bn' ? toBanglaDigits(n) : String(n);
  }

  function fontEn(size, weight) { return `${weight || 400} ${size}px "DM Sans", system-ui, sans-serif`; }
  function fontBn(size, weight) { return `${weight || 400} ${size}px "Hind Siliguri", "Noto Sans Bengali", sans-serif`; }
  function fontDisplay(size, weight) { return `${weight || 900} ${size}px "Fraunces", Georgia, serif`; }
  function fontMono(size)           { return `400 ${size}px "Special Elite", "Courier New", monospace`; }

  function drawStamp(ctx, x, y, w, h, color) {
    // Outer rounded rect outline with slight rotation for "stamped" feel
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    ctx.rotate(-0.04);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(-w/2 + r, -h/2);
    ctx.lineTo(w/2 - r, -h/2);
    ctx.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
    ctx.lineTo(w/2, h/2 - r);
    ctx.quadraticCurveTo(w/2, h/2, w/2 - r, h/2);
    ctx.lineTo(-w/2 + r, h/2);
    ctx.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r);
    ctx.lineTo(-w/2, -h/2 + r);
    ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBadgeRow(ctx, badges, lang, x, y, maxWidth) {
    if (!badges.length) return;
    ctx.font = fontMono(18);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const padX = 16, gap = 10, h = 36;
    let curX = x;
    let curY = y;
    for (const b of badges) {
      const label = lang === 'bn' ? b.label.bn : b.label.en;
      const textWidth = ctx.measureText(label).width;
      const w = textWidth + padX * 2;
      if (curX + w > x + maxWidth) { curX = x; curY += h + gap; }
      // Pill background
      ctx.fillStyle = PAPER;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      const r = h/2;
      ctx.beginPath();
      ctx.moveTo(curX + r, curY);
      ctx.lineTo(curX + w - r, curY);
      ctx.quadraticCurveTo(curX + w, curY, curX + w, curY + r);
      ctx.quadraticCurveTo(curX + w, curY + h, curX + w - r, curY + h);
      ctx.lineTo(curX + r, curY + h);
      ctx.quadraticCurveTo(curX, curY + h, curX, curY + r);
      ctx.quadraticCurveTo(curX, curY, curX + r, curY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Label
      ctx.fillStyle = b.color;
      ctx.fillText(label, curX + padX, curY + h/2);
      curX += w + gap;
    }
  }

  function render(opts) {
    const lang = opts.lang || 'en';
    const W = 1200, H = 630;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Paper background — flat fill + subtle radial warmth
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W*0.2, H*0.2, 0, W*0.2, H*0.2, W*0.7);
    grad.addColorStop(0, 'rgba(184, 147, 74, 0.16)');
    grad.addColorStop(1, 'rgba(184, 147, 74, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    const grad2 = ctx.createRadialGradient(W*0.85, H*0.85, 0, W*0.85, H*0.85, W*0.6);
    grad2.addColorStop(0, 'rgba(166, 41, 31, 0.12)');
    grad2.addColorStop(1, 'rgba(166, 41, 31, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, W, H);

    // Corner stamps
    ctx.fillStyle = INK_MUTE;
    ctx.font = fontMono(18);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('১৪৩৩', 48, 40);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('WARD 37', W - 48, H - 40);

    // ----- LEFT COLUMN: tier/death stamp + seal -----
    // The big "GODDI" wordmark
    ctx.fillStyle = INK;
    ctx.font = fontDisplay(90, 900);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('GODDI', 56, 130);

    ctx.fillStyle = STAMP_RED;
    ctx.font = fontBn(56, 700);
    ctx.fillText('গদি', 60, 220);

    // Sub-tagline
    ctx.fillStyle = INK_SOFT;
    ctx.font = lang === 'bn' ? fontBn(22) : fontEn(22, 500);
    ctx.fillText(lang === 'bn' ? 'ওয়ার্ড ৩৭ · কাউন্সিলরের পাঁচ বছর' : 'Ward 37 · Five years as Councillor', 60, 300);

    // ----- RIGHT COLUMN: outcome stamp + days + stats -----
    const RIGHT_X = 640;
    const RIGHT_W = 510;

    // Outcome stamp (big diagonal)
    let stampLabel = '', stampColor = STAMP_RED;
    if (opts.outcome === 'win') {
      const t = TIER_STAMP[opts.tier] || TIER_STAMP.standard;
      stampLabel = lang === 'bn' ? t.bn : t.en;
      stampColor = t.color;
    } else {
      stampLabel = lang === 'bn' ? DEATH_STAMP.bn : DEATH_STAMP.en;
      stampColor = DEATH_STAMP.color;
    }

    // Big stamp box
    drawStamp(ctx, RIGHT_X, 130, RIGHT_W, 110, stampColor);
    ctx.save();
    ctx.translate(RIGHT_X + RIGHT_W/2, 130 + 55);
    ctx.rotate(-0.04);
    ctx.fillStyle = stampColor;
    ctx.font = lang === 'bn' ? fontBn(54, 700) : fontDisplay(54, 900);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stampLabel, 0, 0);
    ctx.restore();

    // Tenure
    ctx.fillStyle = INK_MUTE;
    ctx.font = fontMono(16);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(lang === 'bn' ? 'শাসনামল' : 'TENURE', RIGHT_X, 270);

    ctx.fillStyle = INK;
    ctx.font = fontDisplay(96, 900);
    ctx.fillText(fmtDays(opts.days, lang), RIGHT_X, 295);

    // "days" word next to the number
    ctx.font = fontMono(20);
    ctx.fillStyle = INK_SOFT;
    const daysTextWidth = ctx.measureText(fmtDays(opts.days, lang)).width;
    // Re-measure with display font
    ctx.font = fontDisplay(96, 900);
    const numW = ctx.measureText(fmtDays(opts.days, lang)).width;
    ctx.font = fontMono(20);
    ctx.fillText(lang === 'bn' ? 'দিন' : 'days', RIGHT_X + numW + 14, 360);

    // Death headline (if death)
    if (opts.outcome === 'death' && opts.cause && DEATH_HEADLINES[opts.cause]) {
      const h = DEATH_HEADLINES[opts.cause];
      ctx.fillStyle = STAMP_RED;
      ctx.font = lang === 'bn' ? fontBn(28, 700) : fontDisplay(28, 900);
      ctx.fillText(lang === 'bn' ? h.bn : h.en, RIGHT_X, 408);
    }

    // ----- BOTTOM: flag badges + footer -----
    const badges = (opts.flags || [])
      .filter(f => FLAG_BADGES[f])
      .map(f => ({
        label: FLAG_BADGES[f],
        color: DIRTY_FLAGS.has(f) ? STAMP_RED : SBYC_GREEN
      }));

    if (badges.length) {
      ctx.fillStyle = INK_MUTE;
      ctx.font = fontMono(13);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(lang === 'bn' ? 'রেকর্ড' : 'ON THE RECORD', 56, 420);
      drawBadgeRow(ctx, badges, lang, 56, 448, W - 112);
    }

    // Footer
    ctx.fillStyle = INK_SOFT;
    ctx.font = fontMono(18);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('godi.sbyc.cloud', 56, H - 38);

    ctx.textAlign = 'right';
    ctx.font = fontMono(13);
    ctx.fillStyle = INK_MUTE;
    ctx.fillText(lang === 'bn' ? 'এসবিওয়াইসি উপস্থাপনা' : 'AN SBYC PRESENTATION', W - 48, H - 38);

    return canvas;
  }

  function exportCard(opts) {
    const canvas = render(opts);
    canvas.toBlob(function (blob) {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'goddi-ward37.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }, 'image/png');
  }

  window.ShareCard = {
    export: exportCard,
    render: render // exposed for previewing if you want to inline in DOM
  };
})();
