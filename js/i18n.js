/* ==========================================================
   i18n — Language toggle (English default, Bangla secondary)
   ========================================================== */
(function () {
  'use strict';

  const LANG_KEY = 'goddi.lang';

  // Bangla digits (for dates and day counters)
  const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  // Bengali calendar (Campaign default) — ~30-day months, 12 months/year
  const BANGLA_MONTHS = [
    'বৈশাখ','জ্যৈষ্ঠ','আষাঢ়','শ্রাবণ','ভাদ্র','আশ্বিন',
    'কার্তিক','অগ্রহায়ণ','পৌষ','মাঘ','ফাল্গুন','চৈত্র'
  ];
  const ENGLISH_MONTHS = [
    'Baishakh','Jaishtha','Ashar','Shrabon','Bhadro','Ashwin',
    'Kartik','Agrahayan','Poush','Magh','Falgun','Chaitra'
  ];
  // Gregorian months (Covid + future real-world missions)
  const GREG_BN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  const GREG_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Holder for the active mission's config. Set by game.js at startRun.
  // null = Campaign-style Bengali calendar + "Year N" labels (back-compat).
  let MISSION = null;

  // Public
  window.I18n = {
    get lang() {
      return document.body.getAttribute('data-lang') || 'en';
    },
    set lang(val) {
      const next = (val === 'bn') ? 'bn' : 'en';
      document.body.setAttribute('data-lang', next);
      // Keep <html lang> in sync for screen readers and search engines
      document.documentElement.setAttribute('lang', next);
      try { localStorage.setItem(LANG_KEY, next); } catch (_) {}
      this.applyPlaceholders();
    },
    toggle() {
      this.lang = (this.lang === 'en' ? 'bn' : 'en');
    },
    init() {
      let saved = 'en';
      try { saved = localStorage.getItem(LANG_KEY) || 'en'; } catch (_) {}
      this.lang = saved;
      const btn = document.getElementById('lang-toggle');
      if (btn) btn.addEventListener('click', () => this.toggle());
    },
    // Apply any data-placeholder-bn / data-placeholder-en attributes on inputs
    applyPlaceholders() {
      document.querySelectorAll('input[data-placeholder-bn], input[data-placeholder-en]')
        .forEach((el) => {
          const key = 'placeholder' + (this.lang === 'bn' ? 'Bn' : 'En');
          const val = el.dataset[key];
          if (val) el.placeholder = val;
        });
    },

    // Convert a number to Bangla digits (e.g., 37 → "৩৭")
    toBanglaDigits(n) {
      return String(n).split('').map(c => (c >= '0' && c <= '9') ? BN_DIGITS[+c] : c).join('');
    },

    // Tell i18n which mission is active (game.js calls this in startRun).
    // Pass null to fall back to Campaign-style Bengali calendar + "Year N".
    setMission(m) { MISSION = m; },

    // Render a calendar date for a day count from game start.
    // Mission with calendar.type === 'gregorian' uses Gregorian dates from
    // start_year/start_month/start_day (Covid: 8 March 2020). Default is
    // the Bengali calendar starting at 1 Baishakh 1433 (Campaign).
    formatGameDate(dayCount) {
      const cal = MISSION && MISSION.calendar;
      if (cal && cal.type === 'gregorian') {
        // Use a real Date object for precise Gregorian arithmetic.
        const start = new Date(cal.start_year, cal.start_month, cal.start_day || 1);
        const date  = new Date(start);
        date.setDate(start.getDate() + dayCount);
        const d = date.getDate();
        const m = date.getMonth();        // 0-indexed
        const y = date.getFullYear();
        if (this.lang === 'bn') {
          return `${this.toBanglaDigits(d)} ${GREG_BN[m]} ${this.toBanglaDigits(y)}`;
        }
        return `${d} ${GREG_EN[m]} ${y}`;
      }
      // Default: Bengali calendar, 30-day-month approximation
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const startYear = 1433;
      const totalMonths = Math.floor(dayCount / DAYS_PER_MONTH);
      const dayInMonth = (dayCount % DAYS_PER_MONTH) + 1;
      const yearOffset = Math.floor(totalMonths / MONTHS_PER_YEAR);
      const monthIdx = totalMonths % MONTHS_PER_YEAR;
      const year = startYear + yearOffset;
      if (this.lang === 'bn') {
        return `${this.toBanglaDigits(dayInMonth)} ${BANGLA_MONTHS[monthIdx]} ${this.toBanglaDigits(year)}`;
      }
      return `${dayInMonth} ${ENGLISH_MONTHS[monthIdx]} ${year}`;
    },

    // Localized chapter/phase label. For Campaign it's "Year N" / "বর্ষ N".
    // For Covid it pulls the named phase from mission.chapters (e.g., "First strike").
    formatYear(year) {
      if (MISSION && MISSION.chapters && MISSION.chapters[year - 1]) {
        const ch = MISSION.chapters[year - 1];
        return this.lang === 'bn' ? (ch.name_bn || ch.name_en) : (ch.name_en || ch.name_bn);
      }
      return this.lang === 'bn'
        ? `বর্ষ ${this.toBanglaDigits(year)}`
        : `Year ${year}`;
    },

    // Localized day-count number (used in verdict screen)
    formatDays(n) {
      return this.lang === 'bn' ? this.toBanglaDigits(n) : String(n);
    }
  };
})();
