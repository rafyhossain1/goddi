// Lightweight covid-deck Monte Carlo. Mirrors the production engine's filter
// logic + commit pacing, swaps in cards-covid.json + 730-day win, walks
// state.day through min_day/max_day filtering. Doesn't model min_year — Covid
// cards don't use it.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const cards   = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards-covid.json'),'utf8')).cards;
const parties = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/parties.json'),    'utf8')).parties;
const missions= JSON.parse(fs.readFileSync(path.join(ROOT, 'data/missions.json'),   'utf8')).missions;
const COVID   = missions.find(m => m.id === 'covid');
const TOTAL   = COVID.total_days;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function eligible(c, day, useCounts) {
  if (typeof c.min_day === 'number' && day < c.min_day) return false;
  if (typeof c.max_day === 'number' && day > c.max_day) return false;
  const max = c.max_uses || 2;
  if ((useCounts[c.id] || 0) >= max) return false;
  return true;
}

function run(party) {
  const stats = { janata:50+party.modifiers.janata, dol:50+party.modifiers.dol,
                  proshashon:50+party.modifiers.proshashon, tohobil:50+party.modifiers.tohobil };
  let day = 0;
  const useCounts = {};
  let cardsSeen = 0;
  while (day < TOTAL) {
    const pool = cards.filter(c => eligible(c, day, useCounts));
    if (!pool.length) return { outcome: 'no_card', day, stats, cardsSeen };
    const card = pick(pool);
    const choice = Math.random() < 0.5 ? 'left' : 'right';
    Object.entries(card[choice].effects).forEach(([k,v]) => {
      stats[k] = clamp(stats[k] + v, 0, 100);
    });
    useCounts[card.id] = (useCounts[card.id]||0) + 1;
    cardsSeen++;
    day += 11 + Math.floor(Math.random()*8);
    // death checks
    for (const k of Object.keys(stats)) {
      if (stats[k] <= 0 || stats[k] >= 100) return { outcome: 'death', cause: `${k}_${stats[k]<=0?'low':'high'}`, day, stats, cardsSeen };
    }
  }
  return { outcome: 'win', day, stats, cardsSeen };
}

const N = 500;
const results = { win:0, death:0, no_card:0, deathCauses:{}, daySum:0, cardSum:0 };
for (let i = 0; i < N; i++) {
  const r = run(pick(parties));
  results[r.outcome]++;
  results.daySum += r.day;
  results.cardSum += r.cardsSeen;
  if (r.cause) results.deathCauses[r.cause] = (results.deathCauses[r.cause]||0) + 1;
}
console.log(`Total: ${N} runs, target: ${TOTAL} days`);
console.log(`  wins:     ${results.win}  (${(100*results.win/N).toFixed(1)}%)`);
console.log(`  deaths:   ${results.death}  (${(100*results.death/N).toFixed(1)}%)`);
console.log(`  no_card:  ${results.no_card}  (${(100*results.no_card/N).toFixed(1)}%)`);
console.log(`  avg days played: ${(results.daySum/N).toFixed(0)}`);
console.log(`  avg cards seen:  ${(results.cardSum/N).toFixed(1)}`);
console.log('  death causes:');
Object.entries(results.deathCauses).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>{
  console.log(`    ${k.padEnd(20)} ${v}`);
});
