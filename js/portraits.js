/* ==========================================================
   Portraits — Phase 1 role-archetype renderer
   Builds a stamped-woodblock circle containing a symbolic
   icon for the character's archetype (guard, teen, sycophant,
   resident, rosette, pot, etc.) — chosen by portrait_id.
   Session 3 will replace the inner glyphs with real SVG
   illustrations, but the stamp frame and color system stay.
   ========================================================== */
(function () {
  'use strict';

  // Deterministic color per portrait_id so the same character
  // always looks the same across appearances.
  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Warm, paper-friendly palette — kept narrow so characters
  // feel like they belong to one book.
  const PALETTE = [
    '#c46830', // terracotta
    '#7a2a26', // brick
    '#9c7a36', // mustard
    '#2d4a7a', // ink blue
    '#1b7849', // sbyc green
    '#a6291f', // stamp red
    '#4a3c2a', // bark
    '#6a594b', // ink mute
    '#b8934a'  // gold
  ];

  const PAPER = '#e6dcc2'; // matches --paper-2

  // Per-character curated colors override the hash-pick. This is how we
  // make sure the Imam reads as bottle-green-clergy, not whatever happens
  // to come out of FNV-1a, and Bashir reads as corporate-blue not pink.
  const PORTRAIT_COLORS = {
    azad_chacha:     '#4a3c2a', // bark — weathered guard
    karim_miah:      '#9c7a36', // mustard — working-class
    rehana_begum:    '#7a2a26', // brick — saree
    shahidul_haque:  '#b8934a', // gold — flashy
    bashir_sheikh:   '#2d4a7a', // ink blue — corporate
    imam_saheb:      '#1b7849', // sbyc green — sober/clergy
    rafy_hossain:    '#a6291f', // stamp red — SBYC president
    tasnim_akhter:   '#6a594b', // ink mute — composed teacher
    tahmid:          '#c46830', // terracotta — youth activist heat
    selim:           '#4a3c2a', // bark — worn-down loyalist (Yr5, distinct from Azad Yr1)
    maloti_devi:     '#6a594b', // ink mute — somber widow (Yr1 only)
    salahuddin:      '#c46830', // terracotta — warm trader (Yr1 only)
    wife:            '#7a2a26', // brick — domestic (Yr4)
    sukumar_babu:    '#a6291f', // stamp red — Hindu festival warmth
    dr_shahriar:     '#1b7849'  // sbyc green — clinical professional
  };

  function pickColor(id) {
    if (PORTRAIT_COLORS[id]) return PORTRAIT_COLORS[id];
    return PALETTE[hashString(id) % PALETTE.length];
  }

  // ============================================================
  // Glyph library — each returns inner SVG content centered at (0,0).
  // The surrounding stamp frame handles scale & rotation.
  // All glyphs fit inside a roughly 104-unit circle (the dashed ring).
  // ============================================================
  const GLYPHS = {

    // গার্ড — peaked cap: narrow dome, PAPER-colored hatband, wider visor,
    // star badge. The paper-color band is the key detail that stops the
    // whole silhouette from reading as a tombstone.
    guard_tired: function (color) {
      return `
        <!-- crown / dome -->
        <path d="M-26,-4 Q-26,-32 0,-32 Q26,-32 26,-4 Z" fill="${color}"/>
        <!-- hatband (paper stripe with ink outline) -->
        <rect x="-28" y="-4" width="56" height="9" fill="${PAPER}"/>
        <rect x="-28" y="-4" width="56" height="9" fill="none" stroke="${color}" stroke-width="1.5"/>
        <!-- star badge on band -->
        <path d="M0,-3 L1.5,0.1 L5,0.4 L2.3,2.5 L3.2,5.8 L0,4 L-3.2,5.8 L-2.3,2.5 L-5,0.4 L-1.5,0.1 Z" fill="${color}"/>
        <!-- visor (wider than crown, curves outward) -->
        <path d="M-38,5 Q-42,14 -34,18 L34,18 Q42,14 38,5 Z" fill="${color}"/>
        <!-- visor underside shadow -->
        <path d="M-30,18 L30,18 L28,22 L-28,22 Z" fill="${color}" opacity="0.5"/>
      `;
    },

    // কিশোর দল — three youth silhouettes (center forward, two behind)
    teen_delegation: function (color) {
      return `
        <g opacity="0.6">
          <circle cx="-24" cy="-18" r="10" fill="${color}"/>
          <path d="M-38,0 Q-38,-8 -24,-8 Q-10,-8 -10,0 L-10,16 L-38,16 Z" fill="${color}"/>
        </g>
        <g opacity="0.6">
          <circle cx="24" cy="-18" r="10" fill="${color}"/>
          <path d="M38,0 Q38,-8 24,-8 Q10,-8 10,0 L10,16 L38,16 Z" fill="${color}"/>
        </g>
        <circle cx="0" cy="-10" r="14" fill="${color}"/>
        <path d="M-20,28 Q-20,8 0,8 Q20,8 20,28 L20,40 L-20,40 Z" fill="${color}"/>
      `;
    },

    // চাটুকার — thumbs-up (flattery / sycophancy)
    sycophant_smile: function (color) {
      return `
        <path d="M-8,-36 Q-8,-42 -2,-42 L4,-42 Q10,-42 10,-36 L10,-8 L-8,-8 Z" fill="${color}"/>
        <path d="M-22,-8 L22,-8 Q28,-8 28,-2 L28,18 Q28,24 22,24 L-22,24 Q-28,24 -28,18 L-28,-2 Q-28,-8 -22,-8 Z" fill="${color}"/>
        <line x1="-20" y1="6" x2="20" y2="6" stroke="${PAPER}" stroke-width="1.5"/>
        <path d="M-32,24 L32,24 L34,36 L-34,36 Z" fill="${color}"/>
      `;
    },

    // খালি হাত — open palm asking for mercy. Varied finger lengths (middle
    // tallest, pinky shortest), distinct thumb sticking out sideways, and a
    // curved palm — the previous version was 4 equal-height rectangles on a
    // rectangular palm, which read as an electrical socket.
    broke_resident: function (color) {
      return `
        <!-- thumb (sticking out to the left, angled) -->
        <path d="M-24,-4 Q-32,-6 -32,-14 Q-30,-20 -24,-18 L-18,-10 Z" fill="${color}"/>
        <!-- index finger -->
        <path d="M-16,-10 L-16,-32 Q-16,-36 -12,-36 Q-8,-36 -8,-32 L-8,-10 Z" fill="${color}"/>
        <!-- middle finger (tallest) -->
        <path d="M-6,-10 L-6,-38 Q-6,-42 -2,-42 Q2,-42 2,-38 L2,-10 Z" fill="${color}"/>
        <!-- ring finger -->
        <path d="M4,-10 L4,-34 Q4,-38 8,-38 Q12,-38 12,-34 L12,-10 Z" fill="${color}"/>
        <!-- pinky (shortest) -->
        <path d="M14,-10 L14,-26 Q14,-30 18,-30 Q22,-30 22,-26 L22,-10 Z" fill="${color}"/>
        <!-- palm (curved, cupped shape) -->
        <path d="M-24,-4 Q-28,16 -12,24 Q0,28 14,26 Q28,22 26,-4 Q26,-8 22,-10 L-20,-10 Q-24,-10 -24,-4 Z" fill="${color}"/>
        <!-- palm crease detail in paper color, gives it "hand-ness" -->
        <path d="M-14,6 Q-4,12 8,10 Q18,8 22,2" stroke="${PAPER}" stroke-width="1.5" fill="none" opacity="0.55"/>
      `;
    },

    // কলসি — clay water pot (kolshi / hari) with decorative band
    resident_dry: function (color) {
      return `
        <ellipse cx="0" cy="-28" rx="12" ry="4" fill="${color}"/>
        <rect x="-8" y="-28" width="16" height="8" fill="${color}"/>
        <path d="M-14,-20 Q-30,-16 -30,6 Q-30,32 0,32 Q30,32 30,6 Q30,-16 14,-20 Z" fill="${color}"/>
        <ellipse cx="0" cy="8" rx="26" ry="2.5" fill="${PAPER}" opacity="0.7"/>
      `;
    },

    // রোজেট — youth-club president rosette with ribbon tails
    rafy_sbyc: function (color) {
      return `
        <path d="M-14,10 L-20,42 L-10,36 L-4,18 Z" fill="${color}"/>
        <path d="M14,10 L20,42 L10,36 L4,18 Z" fill="${color}"/>
        <g fill="${color}">
          <circle cx="0"   cy="-30" r="6.5"/>
          <circle cx="15"  cy="-26" r="6.5"/>
          <circle cx="26"  cy="-15" r="6.5"/>
          <circle cx="30"  cy="0"   r="6.5"/>
          <circle cx="26"  cy="15"  r="6.5"/>
          <circle cx="15"  cy="26"  r="6.5"/>
          <circle cx="0"   cy="30"  r="6.5"/>
          <circle cx="-15" cy="26"  r="6.5"/>
          <circle cx="-26" cy="15"  r="6.5"/>
          <circle cx="-30" cy="0"   r="6.5"/>
          <circle cx="-26" cy="-15" r="6.5"/>
          <circle cx="-15" cy="-26" r="6.5"/>
        </g>
        <circle cx="0" cy="0" r="15" fill="${PAPER}" stroke="${color}" stroke-width="2.5"/>
        <path d="M0,-10 L2.9,-3 L10,-2.5 L4.5,2.4 L6.6,9.5 L0,5.2 L-6.6,9.5 L-4.5,2.4 L-10,-2.5 L-2.9,-3 Z" fill="${color}"/>
      `;
    },

    // ============================================================
    // Named-character portraits — single-ink woodcut style.
    // Each character has one strong visual hook (cap, beard, pallu,
    // selfie phone, suit tie, taqiyah, rosette) so they read at a
    // glance even at the small stamp scale.
    // ============================================================

    // আজাদ চাচা — older guard, weathered face under peaked cap
    azad_chacha: function (color) {
      return `
        <!-- Peaked cap crown -->
        <path d="M-22,-26 Q-22,-46 0,-46 Q22,-46 22,-26 Z" fill="${color}"/>
        <!-- Hatband (paper stripe) -->
        <rect x="-24" y="-26" width="48" height="7" fill="${PAPER}"/>
        <rect x="-24" y="-26" width="48" height="7" fill="none" stroke="${color}" stroke-width="1.2"/>
        <!-- Badge on band -->
        <circle cx="0" cy="-22.5" r="2.5" fill="${color}"/>
        <circle cx="0" cy="-22.5" r="1" fill="${PAPER}"/>
        <!-- Visor -->
        <path d="M-30,-18 Q-34,-10 -28,-7 L28,-7 Q34,-10 30,-18 Z" fill="${color}"/>
        <path d="M-26,-7 L26,-7 L24,-4 L-24,-4 Z" fill="${color}" opacity="0.5"/>
        <!-- Face -->
        <path d="M-15,-3 Q-17,12 -13,22 Q-9,30 0,30 Q9,30 13,22 Q17,12 15,-3 Z" fill="${color}"/>
        <!-- Tired squinted eyes -->
        <path d="M-9,6 Q-5,4 -2,6" stroke="${PAPER}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M9,6 Q5,4 2,6"   stroke="${PAPER}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Eye bags -->
        <path d="M-7,10 L-3,10" stroke="${PAPER}" stroke-width="0.9" opacity="0.55"/>
        <path d="M3,10 L7,10"   stroke="${PAPER}" stroke-width="0.9" opacity="0.55"/>
        <!-- Mustache -->
        <path d="M-9,16 Q0,20 9,16" stroke="${PAPER}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Uniform shoulders -->
        <path d="M-28,30 Q-26,28 -18,28 L-10,36 L10,36 L18,28 Q26,28 28,30 L28,42 L-28,42 Z" fill="${color}"/>
      `;
    },

    // করিম মিয়া — middle-aged broke resident with worried face
    karim_miah: function (color) {
      return `
        <!-- Thinning hair, slightly receded -->
        <path d="M-16,-30 Q-18,-38 -10,-40 Q0,-41 10,-40 Q18,-38 16,-30 L16,-22 L-16,-22 Z" fill="${color}"/>
        <!-- Face -->
        <path d="M-16,-24 Q-19,-10 -16,8 Q-13,22 0,24 Q13,22 16,8 Q19,-10 16,-24 Z" fill="${color}"/>
        <!-- Worried downturned eyes -->
        <path d="M-8,-6 Q-5,-8 -2,-6" stroke="${PAPER}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
        <path d="M8,-6 Q5,-8 2,-6"   stroke="${PAPER}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
        <!-- Furrowed brow -->
        <path d="M-9,-11 L-4,-12" stroke="${PAPER}" stroke-width="1" opacity="0.55"/>
        <path d="M4,-12 L9,-11"   stroke="${PAPER}" stroke-width="1" opacity="0.55"/>
        <!-- Stubble (dot texture) -->
        <circle cx="-7" cy="14" r="0.6" fill="${PAPER}" opacity="0.55"/>
        <circle cx="-3" cy="16" r="0.6" fill="${PAPER}" opacity="0.55"/>
        <circle cx="1"  cy="14" r="0.6" fill="${PAPER}" opacity="0.55"/>
        <circle cx="5"  cy="16" r="0.6" fill="${PAPER}" opacity="0.55"/>
        <circle cx="9"  cy="14" r="0.6" fill="${PAPER}" opacity="0.55"/>
        <!-- Slight frown -->
        <path d="M-5,12 Q0,10 5,12" stroke="${PAPER}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- Simple shirt -->
        <path d="M-28,32 Q-22,26 -10,28 L-4,34 L4,34 L10,28 Q22,26 28,32 L28,42 L-28,42 Z" fill="${color}"/>
      `;
    },

    // রেহানা বেগম — woman in saree with pallu draped over head
    rehana_begum: function (color) {
      return `
        <!-- Pallu/saree drape over head and shoulders -->
        <path d="M-22,-30 Q-26,-20 -22,-2 Q-18,8 -14,16 L-26,40 L26,40 L14,16 Q18,8 22,-2 Q26,-20 22,-30 Q15,-44 0,-44 Q-15,-44 -22,-30 Z" fill="${color}"/>
        <!-- Saree border zigzag at chest -->
        <path d="M-18,18 L-14,22 L-10,18 L-6,22 L-2,18 L2,18 L6,22 L10,18 L14,22 L18,18"
              stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.75"/>
        <!-- Hair peek under pallu -->
        <path d="M-13,-20 Q0,-25 13,-20" stroke="${PAPER}" stroke-width="1.5" fill="none" opacity="0.7"/>
        <!-- Forehead bindi -->
        <circle cx="0" cy="-15" r="1.5" fill="${PAPER}"/>
        <!-- Eyes -->
        <ellipse cx="-7" cy="-4" rx="2" ry="1.3" fill="${PAPER}"/>
        <ellipse cx="7"  cy="-4" rx="2" ry="1.3" fill="${PAPER}"/>
        <!-- Brows -->
        <path d="M-10,-9 Q-6,-10 -3,-9" stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M3,-9 Q6,-10 10,-9"    stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <!-- Calm mouth -->
        <path d="M-4,8 Q0,10 4,8" stroke="${PAPER}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <!-- Earrings -->
        <circle cx="-15" cy="2" r="1.2" fill="${PAPER}"/>
        <circle cx="15"  cy="2" r="1.2" fill="${PAPER}"/>
      `;
    },

    // শাহিদুল হক — sycophant party worker, selfie pose with phone
    shahidul_haque: function (color) {
      return `
        <!-- Hair: modern slick top -->
        <path d="M-15,-26 Q-18,-38 -8,-40 Q0,-42 8,-40 Q18,-38 15,-26 L18,-18 L-18,-18 Z" fill="${color}"/>
        <path d="M-2,-38 L-6,-26" stroke="${PAPER}" stroke-width="0.8" opacity="0.55"/>
        <!-- Face -->
        <path d="M-15,-20 Q-17,-4 -14,8 Q-10,20 0,22 Q10,20 14,8 Q17,-4 15,-20 Z" fill="${color}"/>
        <!-- Closed-eye happy smile (^_^) -->
        <path d="M-10,-2 Q-7,-6 -4,-2" stroke="${PAPER}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M10,-2 Q7,-6 4,-2"   stroke="${PAPER}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Big grin -->
        <path d="M-7,8 Q0,15 7,8" stroke="${PAPER}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <line x1="-5" y1="11" x2="5" y2="11" stroke="${PAPER}" stroke-width="0.8" opacity="0.7"/>
        <!-- Phone raised for selfie -->
        <rect x="20" y="-22" width="10" height="16" rx="1.5" fill="${color}"/>
        <rect x="22" y="-20" width="6"  height="9"  fill="${PAPER}" opacity="0.45"/>
        <!-- Hand holding phone -->
        <path d="M14,-8 Q20,-4 26,-8 L26,-2 L14,-2 Z" fill="${color}"/>
        <!-- Shoulders -->
        <path d="M-26,30 Q-22,22 -10,24 L10,24 Q22,22 26,30 L26,42 L-26,42 Z" fill="${color}"/>
      `;
    },

    // বশির শেখ — slick developer in suit with smirk
    bashir_sheikh: function (color) {
      return `
        <!-- Slicked-back hair -->
        <path d="M-15,-26 Q-19,-38 -8,-42 Q0,-43 8,-42 Q19,-38 15,-26 L18,-18 Q14,-30 0,-32 Q-14,-30 -18,-18 Z" fill="${color}"/>
        <path d="M-6,-38 L-2,-30" stroke="${PAPER}" stroke-width="1" opacity="0.55"/>
        <!-- Face (slightly angular) -->
        <path d="M-15,-22 Q-18,-4 -15,8 Q-12,18 0,22 Q12,18 15,8 Q18,-4 15,-22 Z" fill="${color}"/>
        <!-- Alert eyes -->
        <ellipse cx="-7" cy="-4" rx="2.2" ry="1.4" fill="${PAPER}"/>
        <ellipse cx="7"  cy="-4" rx="2.2" ry="1.4" fill="${PAPER}"/>
        <!-- Sharp eyebrows -->
        <path d="M-11,-10 L-3,-10" stroke="${PAPER}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M3,-10 L11,-10"   stroke="${PAPER}" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Asymmetric smirk -->
        <path d="M-5,10 Q0,12 6,8" stroke="${PAPER}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Suit lapels -->
        <path d="M-28,30 Q-22,22 -8,26 L0,34 L8,26 Q22,22 28,30 L28,42 L-28,42 Z" fill="${color}"/>
        <!-- Tie -->
        <path d="M-3,26 L3,26 L2,42 L-2,42 Z" fill="${PAPER}"/>
        <path d="M-3,26 L3,26 L2,42 L-2,42 Z" fill="none" stroke="${color}" stroke-width="1"/>
      `;
    },

    // ইমাম সাহেব — bearded man in white taqiyah
    imam_saheb: function (color) {
      return `
        <!-- Taqiyah (white skullcap) -->
        <path d="M-18,-30 Q-18,-44 0,-44 Q18,-44 18,-30 Z" fill="${PAPER}"/>
        <path d="M-18,-30 Q-18,-44 0,-44 Q18,-44 18,-30 Z" fill="none" stroke="${color}" stroke-width="1.5"/>
        <!-- Cap rim band -->
        <rect x="-18" y="-32" width="36" height="3" fill="${color}"/>
        <!-- Decorative dot -->
        <circle cx="0" cy="-38" r="1.5" fill="${color}"/>
        <!-- Face (upper portion) -->
        <path d="M-15,-30 Q-17,-10 -14,0 L14,0 Q17,-10 15,-30 Z" fill="${color}"/>
        <!-- Calm eyes -->
        <ellipse cx="-7" cy="-12" rx="1.8" ry="1.2" fill="${PAPER}"/>
        <ellipse cx="7"  cy="-12" rx="1.8" ry="1.2" fill="${PAPER}"/>
        <!-- Brows -->
        <path d="M-10,-17 Q-6,-18 -3,-17" stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M3,-17 Q6,-18 10,-17"    stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <!-- Mustache line above beard -->
        <path d="M-8,-2 Q0,0 8,-2" stroke="${PAPER}" stroke-width="1.5" fill="none"/>
        <!-- Long flowing beard -->
        <path d="M-14,0 Q-18,16 -10,28 Q-4,32 0,34 Q4,32 10,28 Q18,16 14,0 Z" fill="${color}"/>
        <!-- Kurta collar visible below -->
        <path d="M-30,32 Q-26,30 -16,32 L-8,38 L8,38 L16,32 Q26,30 30,32 L30,42 L-30,42 Z" fill="${color}"/>
      `;
    },

    // রাফি হোসেন — clean-cut young SBYC president with rosette
    rafy_hossain: function (color) {
      return `
        <!-- Neat side-part hair -->
        <path d="M-15,-28 Q-18,-40 -6,-42 Q0,-43 6,-42 Q18,-40 15,-28 L17,-18 Q12,-26 0,-26 Q-12,-26 -17,-18 Z" fill="${color}"/>
        <path d="M-5,-40 L-3,-28" stroke="${PAPER}" stroke-width="0.8" opacity="0.55"/>
        <!-- Face -->
        <path d="M-15,-22 Q-17,-4 -14,8 Q-11,20 0,22 Q11,20 14,8 Q17,-4 15,-22 Z" fill="${color}"/>
        <!-- Bright open eyes -->
        <ellipse cx="-7" cy="-4" rx="2" ry="1.4" fill="${PAPER}"/>
        <circle  cx="-7" cy="-4" r="0.7" fill="${color}"/>
        <ellipse cx="7"  cy="-4" rx="2" ry="1.4" fill="${PAPER}"/>
        <circle  cx="7"  cy="-4" r="0.7" fill="${color}"/>
        <!-- Brows -->
        <path d="M-10,-10 Q-6,-11 -3,-10" stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M3,-10 Q6,-11 10,-10"    stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <!-- Confident small smile -->
        <path d="M-5,10 Q0,13 5,10" stroke="${PAPER}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <!-- Shirt collar -->
        <path d="M-28,30 Q-22,22 -10,24 L-4,34 L4,34 L10,24 Q22,22 28,30 L28,42 L-28,42 Z" fill="${color}"/>
        <!-- SBYC rosette pinned to left chest -->
        <g transform="translate(-16,32)">
          <circle cx="0" cy="0" r="4.5" fill="${color}"/>
          <circle cx="0" cy="0" r="3" fill="${PAPER}" stroke="${color}" stroke-width="0.8"/>
          <path d="M0,-2 L0.6,-0.5 L2,-0.4 L0.9,0.5 L1.3,2 L0,1.2 L-1.3,2 L-0.9,0.5 L-2,-0.4 L-0.6,-0.5 Z" fill="${color}"/>
          <path d="M-3,4 L-4,9 L-1,7 Z" fill="${color}"/>
          <path d="M3,4 L4,9 L1,7 Z" fill="${color}"/>
        </g>
      `;
    },

    // তাসনিম আক্তার — single-woman teacher, dignified, round glasses + saree
    tasnim_akhter: function (color) {
      return `
        <!-- Hair pulled back, smooth top -->
        <path d="M-15,-28 Q-18,-40 -6,-42 Q0,-42 6,-42 Q18,-40 15,-28 L16,-18 L-16,-18 Z" fill="${color}"/>
        <!-- Face -->
        <path d="M-15,-22 Q-17,-4 -14,8 Q-11,20 0,22 Q11,20 14,8 Q17,-4 15,-22 Z" fill="${color}"/>
        <!-- Round eyeglasses -->
        <circle cx="-7" cy="-4" r="3.5" fill="${PAPER}" stroke="${color}" stroke-width="1"/>
        <circle cx="7"  cy="-4" r="3.5" fill="${PAPER}" stroke="${color}" stroke-width="1"/>
        <line x1="-3.5" y1="-4" x2="3.5" y2="-4" stroke="${color}" stroke-width="1"/>
        <circle cx="-7" cy="-4" r="1.2" fill="${color}"/>
        <circle cx="7"  cy="-4" r="1.2" fill="${color}"/>
        <!-- Brows above glasses -->
        <path d="M-11,-10 Q-7,-11 -3,-10" stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M3,-10 Q7,-11 11,-10"    stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <!-- Composed mouth -->
        <path d="M-4,10 Q0,9 4,10" stroke="${PAPER}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <!-- Saree drape -->
        <path d="M-28,32 Q-20,22 -8,26 L-2,34 L2,34 L8,26 Q20,22 28,32 L28,42 L-28,42 Z" fill="${color}"/>
        <!-- Saree border pattern -->
        <path d="M-22,30 L-18,33 L-14,30 L-10,33" stroke="${PAPER}" stroke-width="0.8" opacity="0.65" fill="none"/>
        <path d="M10,33 L14,30 L18,33 L22,30"    stroke="${PAPER}" stroke-width="0.8" opacity="0.65" fill="none"/>
      `;
    },

    // তাহমিদ — youth activist, modern fade haircut, set jaw
    tahmid: function (color) {
      return `
        <!-- Fade haircut -->
        <path d="M-14,-26 Q-16,-38 -6,-40 Q0,-41 6,-40 Q16,-38 14,-26 L16,-18 L-16,-18 Z" fill="${color}"/>
        <!-- Undercut line -->
        <path d="M-14,-22 L14,-22" stroke="${PAPER}" stroke-width="0.8" opacity="0.45"/>
        <!-- Face -->
        <path d="M-14,-22 Q-16,-4 -13,8 Q-10,20 0,22 Q10,20 13,8 Q16,-4 14,-22 Z" fill="${color}"/>
        <!-- Determined eyes -->
        <ellipse cx="-7" cy="-4" rx="2" ry="1.4" fill="${PAPER}"/>
        <ellipse cx="7"  cy="-4" rx="2" ry="1.4" fill="${PAPER}"/>
        <!-- Strong angled brows -->
        <path d="M-11,-10 L-3,-12" stroke="${PAPER}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M3,-12 L11,-10"   stroke="${PAPER}" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Set jaw / straight mouth -->
        <line x1="-5" y1="10" x2="5" y2="10" stroke="${PAPER}" stroke-width="1.6" stroke-linecap="round"/>
        <!-- T-shirt collar (round) -->
        <path d="M-26,30 Q-22,22 -8,24 L-4,32 L4,32 L8,24 Q22,22 26,30 L26,42 L-26,42 Z" fill="${color}"/>
      `;
    },

    // সেলিম — old PA, receding slick hair, hollow cheeks, thin mustache
    selim: function (color) {
      return `
        <!-- Receding slicked hair -->
        <path d="M-14,-26 Q-18,-36 -8,-38 Q0,-39 8,-38 Q18,-36 14,-26 L15,-22 Q12,-28 0,-30 Q-12,-28 -15,-22 Z" fill="${color}"/>
        <path d="M-4,-34 L0,-26" stroke="${PAPER}" stroke-width="0.8" opacity="0.5"/>
        <!-- Face (slight hollow) -->
        <path d="M-14,-22 Q-17,-2 -14,12 Q-10,22 0,24 Q10,22 14,12 Q17,-2 14,-22 Z" fill="${color}"/>
        <!-- Cheek shadow -->
        <path d="M-13,2 Q-10,8 -8,10" stroke="${PAPER}" stroke-width="0.8" opacity="0.4" fill="none"/>
        <path d="M13,2 Q10,8 8,10"    stroke="${PAPER}" stroke-width="0.8" opacity="0.4" fill="none"/>
        <!-- Downturned eyes -->
        <path d="M-9,-4 Q-5,-2 -2,-4" stroke="${PAPER}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M9,-4 Q5,-2 2,-4"   stroke="${PAPER}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- Brows -->
        <path d="M-11,-10 Q-6,-11 -3,-10" stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M3,-10 Q6,-11 11,-10"    stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <!-- Thin pencil mustache -->
        <line x1="-7" y1="2" x2="7" y2="2" stroke="${PAPER}" stroke-width="1.3" stroke-linecap="round"/>
        <!-- Slight frown -->
        <line x1="-4" y1="12" x2="4" y2="12" stroke="${PAPER}" stroke-width="1.4" stroke-linecap="round"/>
        <!-- Open-collar shirt -->
        <path d="M-28,30 Q-22,22 -10,26 L-4,36 L4,36 L10,26 Q22,22 28,30 L28,42 L-28,42 Z" fill="${color}"/>
      `;
    },

    // মালতী দেবী — Hindu widow in white saree (paper-color drape)
    maloti_devi: function (color) {
      return `
        <!-- White saree pallu over head -->
        <path d="M-22,-30 Q-26,-20 -22,-2 Q-18,8 -14,16 L-26,40 L26,40 L14,16 Q18,8 22,-2 Q26,-20 22,-30 Q15,-44 0,-44 Q-15,-44 -22,-30 Z" fill="${PAPER}"/>
        <path d="M-22,-30 Q-26,-20 -22,-2 Q-18,8 -14,16 L-26,40 L26,40 L14,16 Q18,8 22,-2 Q26,-20 22,-30 Q15,-44 0,-44 Q-15,-44 -22,-30 Z" fill="none" stroke="${color}" stroke-width="1.8"/>
        <!-- Face inside saree -->
        <path d="M-13,-22 Q-15,-4 -12,6 Q-9,16 0,18 Q9,16 12,6 Q15,-4 13,-22 Z" fill="${color}"/>
        <!-- White hair peek under saree -->
        <path d="M-12,-20 Q0,-25 12,-20" stroke="${PAPER}" stroke-width="1.5" fill="none" opacity="0.9"/>
        <!-- Deep-set older eyes -->
        <path d="M-7,-2 Q-5,0 -3,-2" stroke="${PAPER}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M7,-2 Q5,0 3,-2"   stroke="${PAPER}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <!-- Crow's-feet -->
        <path d="M-12,-4 L-10,-2" stroke="${PAPER}" stroke-width="0.7" opacity="0.5"/>
        <path d="M10,-2 L12,-4"   stroke="${PAPER}" stroke-width="0.7" opacity="0.5"/>
        <!-- Older mouth (small line) -->
        <line x1="-3" y1="8" x2="3" y2="8" stroke="${PAPER}" stroke-width="1.2" stroke-linecap="round"/>
        <!-- Saree border lines (woven double-stripe) -->
        <path d="M-22,28 L22,28" stroke="${color}" stroke-width="1"   opacity="0.6"/>
        <path d="M-22,32 L22,32" stroke="${color}" stroke-width="0.5" opacity="0.5"/>
      `;
    },

    // সালাহউদ্দিন — local trader, slick parting, oily wide grin, gold chain
    salahuddin: function (color) {
      return `
        <!-- Combed hair with prominent parting -->
        <path d="M-15,-28 Q-19,-38 -8,-40 Q0,-41 8,-40 Q19,-38 15,-28 L17,-18 Q14,-28 0,-28 Q-14,-28 -17,-18 Z" fill="${color}"/>
        <!-- Parting line -->
        <line x1="-7" y1="-38" x2="-5" y2="-28" stroke="${PAPER}" stroke-width="1.2"/>
        <!-- Round face -->
        <path d="M-17,-22 Q-20,-2 -17,12 Q-13,24 0,26 Q13,24 17,12 Q20,-2 17,-22 Z" fill="${color}"/>
        <!-- Friendly squinted eyes -->
        <path d="M-10,-4 Q-6,-7 -2,-4" stroke="${PAPER}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M10,-4 Q6,-7 2,-4"   stroke="${PAPER}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Brows -->
        <path d="M-11,-10 Q-7,-11 -3,-10" stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M3,-10 Q7,-11 11,-10"    stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <!-- Wide oily grin -->
        <path d="M-9,8 Q0,16 9,8" stroke="${PAPER}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <line x1="-6" y1="12" x2="6" y2="12" stroke="${PAPER}" stroke-width="0.7" opacity="0.6"/>
        <!-- Chin double-line (slight chubbiness) -->
        <path d="M-6,22 Q0,24 6,22" stroke="${PAPER}" stroke-width="0.8" opacity="0.4" fill="none"/>
        <!-- Open collar -->
        <path d="M-28,32 Q-22,24 -10,28 L-4,38 L4,38 L10,28 Q22,24 28,32 L28,42 L-28,42 Z" fill="${color}"/>
        <!-- Gold chain at neck -->
        <path d="M-8,34 Q0,38 8,34" stroke="${PAPER}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      `;
    },

    // স্ত্রী — tired wife, simple hair with long side braid, small bindi
    wife: function (color) {
      return `
        <!-- Hair pulled back, simple -->
        <path d="M-15,-26 Q-18,-38 -6,-40 Q0,-40 6,-40 Q18,-38 15,-26 L16,-18 L-16,-18 Z" fill="${color}"/>
        <!-- Long braid hanging on right -->
        <path d="M14,-18 Q18,-10 17,0 Q18,10 16,18 L20,16 L18,8 L20,0 L18,-8 L16,-16 Z" fill="${color}"/>
        <!-- Face -->
        <path d="M-15,-22 Q-17,-4 -14,8 Q-11,20 0,22 Q11,20 14,8 Q17,-4 15,-22 Z" fill="${color}"/>
        <!-- Small bindi (married) -->
        <circle cx="0" cy="-15" r="1.3" fill="${PAPER}"/>
        <!-- Tired eyes -->
        <path d="M-9,-3 Q-5,-5 -2,-3" stroke="${PAPER}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
        <path d="M9,-3 Q5,-5 2,-3"   stroke="${PAPER}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
        <!-- Subtle eye bags -->
        <path d="M-7,1 L-3,1" stroke="${PAPER}" stroke-width="0.9" opacity="0.5"/>
        <path d="M3,1 L7,1"   stroke="${PAPER}" stroke-width="0.9" opacity="0.5"/>
        <!-- Brows -->
        <path d="M-10,-9 Q-6,-10 -3,-9" stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M3,-9 Q6,-10 10,-9"    stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <!-- Weary slight downturn mouth -->
        <path d="M-4,10 Q0,9 4,10" stroke="${PAPER}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <!-- Earrings -->
        <circle cx="-15" cy="2" r="1.2" fill="${PAPER}"/>
        <circle cx="15"  cy="2" r="1.2" fill="${PAPER}"/>
        <!-- Kameez collar -->
        <path d="M-26,32 Q-20,24 -8,28 L-2,36 L2,36 L8,28 Q20,24 26,32 L26,42 L-26,42 Z" fill="${color}"/>
      `;
    },

    // সুকুমার বাবু — older Hindu Puja-committee man, tilak + square glasses + salt-pepper hair
    sukumar_babu: function (color) {
      return `
        <!-- Salt-pepper hair with parting -->
        <path d="M-15,-28 Q-19,-38 -8,-40 Q0,-41 8,-40 Q19,-38 15,-28 L17,-20 Q14,-26 0,-26 Q-14,-26 -17,-20 Z" fill="${color}"/>
        <!-- White streaks -->
        <path d="M-12,-36 L-10,-30" stroke="${PAPER}" stroke-width="1" opacity="0.7"/>
        <path d="M-6,-38 L-4,-32"   stroke="${PAPER}" stroke-width="1" opacity="0.7"/>
        <path d="M4,-38 L6,-32"     stroke="${PAPER}" stroke-width="1" opacity="0.7"/>
        <path d="M10,-36 L12,-30"   stroke="${PAPER}" stroke-width="1" opacity="0.7"/>
        <!-- Face -->
        <path d="M-15,-24 Q-18,-4 -15,10 Q-12,22 0,24 Q12,22 15,10 Q18,-4 15,-24 Z" fill="${color}"/>
        <!-- Tilak mark on forehead -->
        <path d="M-1,-18 L-1,-12 L1,-12 L1,-18 Z" fill="${PAPER}"/>
        <line x1="0" y1="-18" x2="0" y2="-10" stroke="${PAPER}" stroke-width="1.5"/>
        <!-- Square eyeglasses -->
        <rect x="-10"  y="-7" width="6.5" height="5" fill="${PAPER}" stroke="${color}" stroke-width="0.8"/>
        <rect x="3.5"  y="-7" width="6.5" height="5" fill="${PAPER}" stroke="${color}" stroke-width="0.8"/>
        <line x1="-3.5" y1="-4.5" x2="3.5" y2="-4.5" stroke="${color}" stroke-width="0.8"/>
        <circle cx="-6.75" cy="-4.5" r="1" fill="${color}"/>
        <circle cx="6.75"  cy="-4.5" r="1" fill="${color}"/>
        <!-- Salt-pepper mustache -->
        <path d="M-9,6 Q0,9 9,6" stroke="${PAPER}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <!-- Subtle mouth -->
        <line x1="-3" y1="14" x2="3" y2="14" stroke="${PAPER}" stroke-width="1.2" stroke-linecap="round"/>
        <!-- Simple kurta collar -->
        <path d="M-28,32 Q-22,26 -10,28 L-2,36 L2,36 L10,28 Q22,26 28,32 L28,42 L-28,42 Z" fill="${color}"/>
      `;
    },

    // ডা. শাহরিয়ার — clinical doctor, glasses + white coat + stethoscope
    dr_shahriar: function (color) {
      return `
        <!-- Short professional hair -->
        <path d="M-14,-26 Q-17,-38 -6,-40 Q0,-40 6,-40 Q17,-38 14,-26 L15,-18 L-15,-18 Z" fill="${color}"/>
        <!-- Face -->
        <path d="M-14,-22 Q-16,-4 -13,8 Q-10,20 0,22 Q10,20 13,8 Q16,-4 14,-22 Z" fill="${color}"/>
        <!-- Rectangular professional glasses -->
        <rect x="-10"  y="-7" width="6.5" height="5" rx="1" fill="${PAPER}" stroke="${color}" stroke-width="0.8"/>
        <rect x="3.5"  y="-7" width="6.5" height="5" rx="1" fill="${PAPER}" stroke="${color}" stroke-width="0.8"/>
        <line x1="-3.5" y1="-4.5" x2="3.5" y2="-4.5" stroke="${color}" stroke-width="0.8"/>
        <circle cx="-6.75" cy="-4.5" r="0.9" fill="${color}"/>
        <circle cx="6.75"  cy="-4.5" r="0.9" fill="${color}"/>
        <!-- Brows -->
        <path d="M-10,-12 Q-6,-13 -3,-12" stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M3,-12 Q6,-13 10,-12"    stroke="${PAPER}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <!-- Composed mouth -->
        <path d="M-4,8 Q0,9 4,8" stroke="${PAPER}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <!-- White doctor's coat -->
        <path d="M-28,28 Q-22,24 -10,26 L-2,32 L2,32 L10,26 Q22,24 28,28 L28,42 L-28,42 Z" fill="${PAPER}"/>
        <path d="M-28,28 Q-22,24 -10,26 L-2,32 L2,32 L10,26 Q22,24 28,28 L28,42 L-28,42 Z" fill="none" stroke="${color}" stroke-width="1.2"/>
        <!-- Stethoscope around neck -->
        <path d="M-8,30 Q-6,32 -4,30 L-2,38" stroke="${color}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M8,30 Q6,32 4,30 L2,38"     stroke="${color}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <circle cx="0" cy="40" r="2" fill="${color}"/>
      `;
    },

    // সংবাদ — newspaper bulletin (no-character intercards)
    news_bulletin: function (color) {
      return `
        <!-- Folded newspaper outline -->
        <rect x="-38" y="-32" width="76" height="64" fill="${PAPER}" stroke="${color}" stroke-width="2"/>
        <!-- Masthead bar -->
        <rect x="-38" y="-32" width="76" height="12" fill="${color}"/>
        <text x="0" y="-22" text-anchor="middle" fill="${PAPER}" font-size="9" font-weight="900"
              font-family="Special Elite, Courier New, monospace" letter-spacing="2">দৈনিক</text>
        <!-- Date stamp under masthead -->
        <rect x="-20" y="-18" width="40" height="2" fill="${color}" opacity="0.4"/>
        <!-- Headline (thicker bar) -->
        <rect x="-32" y="-10" width="64" height="3.5" fill="${color}"/>
        <rect x="-32" y="-4" width="48" height="3.5" fill="${color}"/>
        <!-- Body columns (thin lines) -->
        <rect x="-32" y="4"  width="28" height="1.6" fill="${color}"/>
        <rect x="-32" y="9"  width="28" height="1.6" fill="${color}"/>
        <rect x="-32" y="14" width="28" height="1.6" fill="${color}"/>
        <rect x="-32" y="19" width="20" height="1.6" fill="${color}"/>
        <rect x="4"   y="4"  width="28" height="1.6" fill="${color}"/>
        <rect x="4"   y="9"  width="28" height="1.6" fill="${color}"/>
        <rect x="4"   y="14" width="28" height="1.6" fill="${color}"/>
        <rect x="4"   y="19" width="22" height="1.6" fill="${color}"/>
        <!-- Column divider -->
        <line x1="0" y1="4" x2="0" y2="22" stroke="${color}" stroke-width="0.5" opacity="0.5"/>
        <!-- Bottom fold -->
        <line x1="-38" y1="26" x2="38" y2="26" stroke="${color}" stroke-width="1" opacity="0.5"/>
      `;
    },

    // default — generic person silhouette (fallback for any unmapped portrait_id)
    _default: function (color) {
      return `
        <circle cx="0" cy="-16" r="16" fill="${color}"/>
        <path d="M-28,34 Q-28,6 0,6 Q28,6 28,34 L28,42 L-28,42 Z" fill="${color}"/>
      `;
    }
  };

  function pickGlyph(portraitId) {
    if (portraitId && Object.prototype.hasOwnProperty.call(GLYPHS, portraitId)) {
      return GLYPHS[portraitId];
    }
    return GLYPHS._default;
  }

  // Build an inline SVG for a character portrait.
  // Uses the "stamp" aesthetic — outer ring, dashed inner ring,
  // archetype glyph, and a subtle grain texture.
  function render(portraitId, characterName) {
    const id = portraitId || characterName || 'x';
    const color = pickColor(id);
    const glyph = pickGlyph(portraitId);
    // Light rotation jitter so a row of stamps doesn't feel grid-locked
    const rot = ((hashString(id + '#rot') % 11) - 5); // -5..+5
    const seed = hashString(id) % 100;

    return `
<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <filter id="grain-${seed}" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}"/>
      <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.07  0 0 0 0 0.05  0 0 0 0.18 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>
  <g transform="translate(80 80) rotate(${rot})">
    <!-- stamp outer ring -->
    <circle cx="0" cy="0" r="62" fill="${PAPER}" stroke="${color}" stroke-width="4"/>
    <!-- dashed inner ring -->
    <circle cx="0" cy="0" r="52" fill="none" stroke="${color}" stroke-width="1.5"
            stroke-dasharray="3 4" opacity="0.7"/>
    <!-- archetype glyph -->
    <g>${glyph(color)}</g>
    <!-- grain -->
    <rect x="-62" y="-62" width="124" height="124" filter="url(#grain-${seed})" opacity="0.5"/>
  </g>
</svg>`.trim();
  }

  window.Portraits = { render, pickColor };
})();
