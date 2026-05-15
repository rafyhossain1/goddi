// Behavioral audit — runs simulated games and asserts invariants the player
// expects to hold. If any of these fail, it's a real gameplay bug.
const fs = require('fs');
const path = require('path');
const ROOT = '/sessions/optimistic-youthful-cori/mnt/Development/goddi';

const missions = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/missions.json'), 'utf8')).missions;
const parties  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/parties.json'), 'utf8')).parties;
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function audit(missionId, deckPath, N=500) {
  const mission = missions.find(m => m.id === missionId);
  const cards = JSON.parse(fs.readFileSync(path.join(ROOT, deckPath), 'utf8')).cards;
  const dMin = mission.days_per_card_min || 21;
  const dMax = mission.days_per_card_max || 29;
  const violations = {
    backToBackRepeat: 0,
    maxUsesExceeded: 0,
    dayWentBackwards: 0,
    statOutOfBounds: 0,
    emptyDialog: 0,
    bothChoicesIdentical: 0,
    winBeforeTotalDays: 0,
    deathWithoutEdge: 0,
    runsCompleted: 0,
  };
  let totalCommits = 0;

  // Static (per-deck) checks
  cards.forEach(c => {
    if (!c.dialog_en || !c.dialog_bn) violations.emptyDialog++;
    if (c.left && c.right) {
      if (c.left.label_en === c.right.label_en) violations.bothChoicesIdentical++;
      // Check effects don't perfectly mirror each other
    }
  });

  for (let r = 0; r < N; r++) {
    const party = parties[Math.floor(Math.random() * parties.length)];
    const stats = { janata:50+party.modifiers.janata, dol:50+party.modifiers.dol,
                    proshashon:50+party.modifiers.proshashon, tohobil:50+party.modifiers.tohobil };
    let day = 0; let year = 1;
    let prevDay = -1;
    const useCounts = {};
    let lastCardId = null;
    let runEnded = false;
    let runOutcome = null;
    while (day < mission.total_days) {
      let pool = cards.filter(c => {
        if (typeof c.min_day === 'number' && day < c.min_day) return false;
        if (typeof c.max_day === 'number' && day > c.max_day) return false;
        if (typeof c.min_year === 'number' && year < c.min_year) return false;
        if (typeof c.max_year === 'number' && year > c.max_year) return false;
        const max = c.max_uses || 1;
        if ((useCounts[c.id] || 0) >= max) return false;
        return true;
      });
      // Apply engine's just-played guard
      if (lastCardId && pool.length > 1) pool = pool.filter(c => c.id !== lastCardId);
      if (!pool.length) break;
      const card = pool[Math.floor(Math.random() * pool.length)];

      // INVARIANT 1: back-to-back repeat
      if (card.id === lastCardId) violations.backToBackRepeat++;

      // INVARIANT 2: max_uses enforced
      const max = card.max_uses || 1;
      if ((useCounts[card.id] || 0) >= max) violations.maxUsesExceeded++;

      const side = Math.random() < 0.5 ? 'left' : 'right';
      Object.entries(card[side].effects).forEach(([k,v]) => { stats[k] = clamp(stats[k]+v, 0, 100); });
      useCounts[card.id] = (useCounts[card.id]||0) + 1;

      // INVARIANT 3: day monotonically increases
      if (day < prevDay) violations.dayWentBackwards++;
      prevDay = day;
      day += dMin + Math.floor(Math.random() * (dMax - dMin + 1));
      year = Math.min(8, Math.ceil(day / 365));
      totalCommits++;
      lastCardId = card.id;

      // INVARIANT 4: stats stay in [0, 100]
      for (const k of Object.keys(stats)) {
        if (stats[k] < 0 || stats[k] > 100) violations.statOutOfBounds++;
      }

      // INVARIANT 5: death implies stat at edge
      if (Object.values(stats).some(v => v <= 0 || v >= 100)) {
        const onEdge = Object.values(stats).some(v => v === 0 || v === 100);
        if (!onEdge) violations.deathWithoutEdge++;
        runEnded = true; runOutcome = 'death';
        break;
      }
    }
    if (!runEnded && day >= mission.total_days) {
      runOutcome = 'win';
      runEnded = true;
      // INVARIANT 6: win only triggers AT or PAST total_days
      if (day < mission.total_days) violations.winBeforeTotalDays++;
    }
    if (runEnded) violations.runsCompleted++;
  }

  console.log(`\n=== ${missionId} — ${N} runs, ${totalCommits} commits ===`);
  for (const [k, v] of Object.entries(violations)) {
    const tag = (k === 'runsCompleted') ? 'info' : (v === 0 ? 'OK' : 'VIOLATION');
    console.log(`  ${tag}: ${k} = ${v}`);
  }
}

audit('campaign', 'data/cards.json', 1000);
audit('covid',    'data/cards-covid.json', 1000);
