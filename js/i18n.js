/* ==========================================================
   i18n — Language toggle (English default, Bangla secondary)
   ========================================================== */
(function () {
  'use strict';

  const LANG_KEY = 'goddi.lang';

  // Bangla digits (for dates and day counters)
  const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  // Bangla month names (Bengali calendar, 12 months)
  const BANGLA_MONTHS = [
    'বৈশাখ','জ্যৈষ্ঠ','আষাঢ়','শ্রাবণ','ভাদ্র','আশ্বিন',
    'কার্তিক','অগ্রহায়ণ','পৌষ','মাঘ','ফাল্গুন','চৈত্র'
  ];
  const ENGLISH_MONTHS = [
    'Baishakh','Jaishtha','Ashar','Shrabon','Bhadro','Ashwin',
    'Kartik','Agrahayan','Poush','Magh','Falgun','Chaitra'
  ];

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

    // Render a Bangla calendar date for a day count from game start.
    // Start: 1 Baishakh 1433 BS. ~30 days per month (approximation good enough for a game).
    formatGameDate(dayCount) {
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

    // Localized Year N label ("Year 3" / "বর্ষ ৩")
    formatYear(year) {
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
