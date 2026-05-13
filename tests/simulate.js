/* ==========================================================
   Goddi — Headless simulation harness
   Replicates the engine's pure logic so we can run Monte Carlo
   playthroughs without a browser. Validates:
     1) Static deck integrity
     2) Arc continuity (specific scripted runs)
     3) Random-strategy stat balance + outcome distribution
     4) Win-tier triggering across "clean" / "dirty" strategies
     5) Edge cases (deck depletion, milestone gating)
   ========================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cards    = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards.json'),       'utf8')).cards;
const parties  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/parties.json'),     'utf8')).parties;
const gameOvers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/game_overs.json'), 'utf8'));

const STAT_KEYS = ['janata', 'dol', 'proshashon', 'tohobil'];

const DIRTY_FLAGS = new Set([
  'taking_envelopes', 'tower_approved', 'tower_collapsed',
  'tower2_approved', 'tower2_collapsed', 'tower_blamed_contractor',
  'acc_stonewalled', 'votebuying', 'ec_bribed', 'defected', 'corrupt_retirement',
  'pa_protected', 'pa_betrayed'
]);

// ---------- Engine (pure, node-side) ----------
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function maxUsesFor(card) {
  if (typeof card.max_uses === 'number' && card.max_uses > 0) return card.max_uses;
  return 1;
}
function timesUsed(cardId, st) { return st.cardUseCounts[cardId] || 0; }

function isCardEligible(card, st) {
  if (timesUsed(card.id, st) >= maxUsesFor(card)) return false;
  if (typeof card.min_year === 'number' && st.year < card.min_year) return false;
  if (typeof card.max_year === 'number' && st.year > card.max_year) return false;
  if (typeof card.min_day === 'number' && st.day < card.min_day) return false;
  if (typeof card.max_day === 'number' && st.day > card.max_day) return false;
  if (Array.isArray(card.party_only) && card.party_only.length
      && !card.party_only.includes(st.player.party)) return false;
  if (Array.isArray(card.not_party) && card.not_party.includes(st.player.party)) return false;
  if (Array.isArray(card.background_only) && card.background_only.length
      && !card.background_only.includes(st.player.background)) return false;
  if (Array.isArray(card.requires_flags) && !card.requires_flags.every(f => st.flags.has(f))) return false;
  if (Array.isArray(card.blocked_by_flags) && card.blocked_by_flags.some(f => st.flags.has(f))) return false;
  if (card.stat_requires && typeof card.stat_requires === 'object') {
    for (const [stat, cond] of Object.entries(card.stat_requires)) {
      if (!(stat in st.stats)) continue;
      const v = st.stats[stat];
      if (typeof cond.lt  === 'number' && !(v <  cond.lt))  return false;
      if (typeof cond.lte === 'number' && !(v <= cond.lte)) return false;
      if (typeof cond.gt  === 'number' && !(v >  cond.gt))  return false;
      if (typeof cond.gte === 'number' && !(v >= cond.gte)) return false;
      if (typeof cond.eq  === 'number' && !(v === cond.eq)) return false;
    }
  }
  return true;
}

// MILESTONE-specific check. The current game.js version SKIPS requires_flags
// here, which would let consequence-milestones (A18 tower collapse, A40
// tower2 collapse) fire even when their gating flag is unset. This harness
// honors requires_flags so we can test what the correct behavior should be.
function isCardEligibleForMilestone(card, st) {
  if (timesUsed(card.id, st) >= maxUsesFor(card)) return false;
  if (Array.isArray(card.party_only) && card.party_only.length
      && !card.party_only.includes(st.player.party)) return false;
  if (Array.isArray(card.not_party) && card.not_party.includes(st.player.party)) return false;
  if (Array.isArray(card.requires_flags) && !card.requires_flags.every(f => st.flags.has(f))) return false;
  if (Array.isArray(card.blocked_by_flags) && card.blocked_by_flags.some(f => st.flags.has(f))) return false;
  return true;
}

function weightedPick(pool, rnd) {
  const weights = pool.map(c => Math.max(0, c.weight ?? 1));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return pool[Math.floor(rnd() * pool.length)];
  let r = rnd() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function pickNextCard(st, rnd) {
  if (st.forceNextCardId) {
    const forced = cards.find(c => c.id === st.forceNextCardId);
    st.forceNextCardId = null;
    if (forced && timesUsed(forced.id, st) < maxUsesFor(forced)) return forced;
  }
  const due = cards.filter(c =>
    typeof c.force_on_day === 'number'
    && st.day >= c.force_on_day
    && timesUsed(c.id, st) < maxUsesFor(c)
    && isCardEligibleForMilestone(c, st)
  );
  if (due.length) {
    due.sort((a, b) => a.force_on_day - b.force_on_day || a.id.localeCompare(b.id));
    return due[0];
  }
  const pool = cards.filter(c => !c.force_on_day && isCardEligible(c, st));
  if (pool.length) return weightedPick(pool, rnd);
  // No recycle path — use-count limits handle repetition naturally.
  return null;
}

function detectDeath(st) {
  for (const k of STAT_KEYS) {
    const v = st.stats[k];
    if (v <= 0)  return { stat: k, key: k + '_low' };
    if (v >= 100) return { stat: k, key: k + '_high' };
  }
  return null;
}

function computeWinTier(st) {
  const dirty = [...st.flags].filter(f => DIRTY_FLAGS.has(f)).length;
  if (dirty === 0) return 'clean';
  if (dirty <= 2) return 'standard';
  return 'compromised';
}

// All background IDs the engine supports — sim picks one round-robin per run
// so background-gated cards get exercised across the test corpus.
const BACKGROUND_IDS = ['businessman', 'teacher', 'army_retired', 'ngo_worker', 'party_lifer'];

function startRun(partyId, rnd, backgroundId) {
  const party = parties.find(p => p.id === partyId);
  const stats = {};
  STAT_KEYS.forEach(k => {
    stats[k] = clamp(50 + (party.modifiers[k] ?? 0), 1, 99);
  });
  return {
    player: { party: partyId, background: backgroundId || null },
    stats,
    day: 0,
    year: 1,
    cardUseCounts: {},
    flags: new Set(),
    forceNextCardId: null,
    history: [] // [{id, side, day, year, flagsAfter}]
  };
}

function commitChoice(st, card, side, rnd) {
  const choice = card[side];
  const effects = choice.effects || {};
  for (const [stat, delta] of Object.entries(effects)) {
    if (stat in st.stats) st.stats[stat] = clamp(st.stats[stat] + delta, 0, 100);
  }
  (choice.triggers || []).forEach(f => st.flags.add(f));
  (choice.untriggers || []).forEach(f => st.flags.delete(f));
  if (typeof choice.next_card === 'string') st.forceNextCardId = choice.next_card;
  st.cardUseCounts[card.id] = (st.cardUseCounts[card.id] || 0) + 1;
  st.day += 21 + Math.floor(rnd() * 9);
  st.year = Math.min(5, Math.ceil((st.day || 1) / 365));
  st.history.push({ id: card.id, side, day: st.day, year: st.year, flags: [...st.flags] });
}

// ---------- Strategies ----------
function randomStrategy(rnd) {
  return () => rnd() < 0.5 ? 'left' : 'right';
}

// Pick the side that avoids any "dirty" flag in its triggers.
function cleanStrategy(rnd) {
  return (card) => {
    const dirtyOnLeft  = (card.left.triggers  || []).some(f => DIRTY_FLAGS.has(f));
    const dirtyOnRight = (card.right.triggers || []).some(f => DIRTY_FLAGS.has(f));
    if (dirtyOnLeft && !dirtyOnRight) return 'right';
    if (dirtyOnRight && !dirtyOnLeft) return 'left';
    return rnd() < 0.5 ? 'left' : 'right';
  };
}

// Pick the side that sets a dirty flag when one is on offer.
function dirtyStrategy(rnd) {
  return (card) => {
    const dirtyOnLeft  = (card.left.triggers  || []).some(f => DIRTY_FLAGS.has(f));
    const dirtyOnRight = (card.right.triggers || []).some(f => DIRTY_FLAGS.has(f));
    if (dirtyOnLeft && !dirtyOnRight) return 'left';
    if (dirtyOnRight && !dirtyOnLeft) return 'right';
    return rnd() < 0.5 ? 'left' : 'right';
  };
}

// Pick the side that pulls all stats toward 50 (homeostatic).
function balancedStrategy(rnd, st) {
  return (card) => {
    const scoreSide = (sideKey) => {
      const eff = card[sideKey].effects || {};
      let bad = 0;
      for (const [k, dv] of Object.entries(eff)) {
        const next = clamp(st.stats[k] + dv, 0, 100);
        bad += Math.abs(next - 50);
      }
      return bad;
    };
    return scoreSide('left') <= scoreSide('right') ? 'left' : 'right';
  };
}

// Smart-clean: hard-avoid dirty flags AND prefer the side that balances stats.
// This is the closest analog to a thoughtful human player aiming for the
// INTEGRITY win-tier.
function smartCleanStrategy(rnd, st) {
  return (card) => {
    const dirtyOnLeft  = (card.left.triggers  || []).some(f => DIRTY_FLAGS.has(f));
    const dirtyOnRight = (card.right.triggers || []).some(f => DIRTY_FLAGS.has(f));
    if (dirtyOnLeft && !dirtyOnRight) return 'right';
    if (dirtyOnRight && !dirtyOnLeft) return 'left';
    const scoreSide = (sideKey) => {
      const eff = card[sideKey].effects || {};
      let bad = 0;
      for (const [k, dv] of Object.entries(eff)) {
        const next = clamp(st.stats[k] + dv, 0, 100);
        bad += Math.abs(next - 50);
      }
      return bad;
    };
    return scoreSide('left') <= scoreSide('right') ? 'left' : 'right';
  };
}

// Human-like: mostly balanced, but with 20% noise (occasional emotional choice).
function humanLikeStrategy(rnd, st) {
  const base = balancedStrategy(rnd, st);
  return (card) => (rnd() < 0.2) ? (rnd() < 0.5 ? 'left' : 'right') : base(card);
}

// ---------- Simulator ----------
function simulate(partyId, strategyFactory, seed, backgroundId) {
  const rnd = mulberry32(seed);
  const st = startRun(partyId, rnd, backgroundId);
  // Some strategies want live state (balancedStrategy); pass it through.
  const decide = strategyFactory(rnd, st);
  let outcome = null;
  let turns = 0;
  while (turns < 500) {
    turns++;
    const card = pickNextCard(st, rnd);
    // Mirrors game.js: a null draw means the deck is genuinely exhausted,
    // which counts as a graceful end-of-tenure / survival win at whatever
    // win-tier the player's flag state implies.
    if (!card) {
      outcome = { kind: 'win', tier: computeWinTier(st), days: st.day, turns, finalStats: { ...st.stats }, flags: [...st.flags], exhausted: true };
      break;
    }
    const side = decide(card, st);
    commitChoice(st, card, side, rnd);
    const death = detectDeath(st);
    if (death) { outcome = { kind: 'death', cause: death.key, days: st.day, turns, finalStats: { ...st.stats } }; break; }
    if (st.day >= 1825) { outcome = { kind: 'win', tier: computeWinTier(st), days: st.day, turns, finalStats: { ...st.stats }, flags: [...st.flags] }; break; }
  }
  if (!outcome) outcome = { kind: 'timeout', days: st.day, turns, finalStats: { ...st.stats } };
  outcome.history = st.history;
  outcome.flags = [...st.flags];
  return outcome;
}

// Seeded PRNG so failures are reproducible
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Test runners ----------
const REPORT = [];
function section(title) { REPORT.push('\n=== ' + title + ' ==='); }
function line(s) { REPORT.push(s); }
function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function asPct(n) { return (100*n).toFixed(1) + '%'; }

// 1) STATIC DECK INTEGRITY
section('1. Static deck integrity');
const cardIds = new Set(cards.map(c => c.id));
const allTriggers = new Set();
const allRequiredFlags = new Set();
const allBlockedFlags = new Set();
for (const c of cards) {
  for (const s of ['left', 'right']) {
    (c[s].triggers || []).forEach(f => allTriggers.add(f));
  }
  (c.requires_flags || []).forEach(f => allRequiredFlags.add(f));
  (c.blocked_by_flags || []).forEach(f => allBlockedFlags.add(f));
}
const orphans1 = [...allRequiredFlags].filter(f => !allTriggers.has(f));
const orphans2 = [...allBlockedFlags].filter(f => !allTriggers.has(f));
line('Total cards: ' + cards.length);
line('Trigger flags: ' + allTriggers.size + ' (' + [...allTriggers].sort().join(', ') + ')');
line('Required flags with no source: ' + (orphans1.length ? orphans1.join(', ') : 'NONE'));
line('Blocked-by flags with no source: ' + (orphans2.length ? orphans2.join(', ') : 'NONE'));
const dupIds = cards.map(c => c.id).filter((id, i, arr) => arr.indexOf(id) !== i);
line('Duplicate IDs: ' + (dupIds.length ? dupIds.join(', ') : 'NONE'));

// 2) SCRIPTED ARC TRACES
section('2. Scripted arc traces');

function scriptedTrace(partyId, decisions, label) {
  const rnd = mulberry32(12345);
  const st = startRun(partyId, rnd);
  const seenIds = [];
  let outcome = null;
  // Use balancedStrategy as the "default" so the player doesn't die before
  // the scripted arc finishes. The `decisions` map overrides specific cards.
  const baseDecide = balancedStrategy(rnd, st);
  while (seenIds.length < 200) {
    const card = pickNextCard(st, rnd);
    if (!card) { outcome = 'no_card'; break; }
    seenIds.push(card.id);
    const side = decisions[card.id] || baseDecide(card);
    commitChoice(st, card, side, rnd);
    const d = detectDeath(st);
    if (d) { outcome = 'death:' + d.key; break; }
    if (st.day >= 1825) { outcome = 'win:' + computeWinTier(st); break; }
  }
  return { seenIds, outcome, flags: [...st.flags], days: st.day, finalStats: st.stats };
}

// Test A: approve tower, defend PA → expect A18 collapse, A10/A11/A12 chain
const towerArc = scriptedTrace('janata_league', {
  'A07': 'left',  // approve tower (sets tower_approved)
  'A09': 'left',  // defend PA (sets pa_protected)
  'A10': 'left',  // stonewall ACC
  'A11': 'left',  // witch hunt statement
  'A12': 'left',  // hire defense lawyer (sets pa_loyal)
  'A23': 'left',  // approve 2nd tower (sets tower2_approved)
  // everything else: 'right' default
}, 'Tower+PA arc');
line('--- Test A: approve tower + defend PA ---');
line('  A18 (tower collapse) seen: ' + towerArc.seenIds.includes('A18'));
line('  A10 chain reached: ' + towerArc.seenIds.includes('A10'));
line('  A11 chain reached: ' + towerArc.seenIds.includes('A11'));
line('  A12 chain reached: ' + towerArc.seenIds.includes('A12'));
line('  A40 (2nd collapse) seen: ' + towerArc.seenIds.includes('A40'));
line('  Outcome: ' + towerArc.outcome);
line('  Final flags: ' + towerArc.flags.join(', '));

// Test B: refuse tower → expect A18 NOT to fire
const cleanTowerArc = scriptedTrace('janata_league', {
  'A07': 'right', // refuse tower
  'A09': 'right', // suspend PA
  // everything else: 'right' default
}, 'Clean tower path');
line('--- Test B: refuse tower ---');
line('  A18 should NOT fire: A18 seen = ' + cleanTowerArc.seenIds.includes('A18') + (cleanTowerArc.seenIds.includes('A18') ? ' [BUG]' : ' [OK]'));
line('  A10/A11/A12 should NOT fire: A10=' + cleanTowerArc.seenIds.includes('A10') + ' A11=' + cleanTowerArc.seenIds.includes('A11') + ' A12=' + cleanTowerArc.seenIds.includes('A12'));
line('  Outcome: ' + cleanTowerArc.outcome);

// Test C: help Karim → A27 → A38 → A50 chain
const karimArc = scriptedTrace('janata_league', {
  'A27': 'left', // make the call (sets karim_helped)
  // everything else: 'right' default
}, 'Karim Miah thread');
line('--- Test C: help Karim Miah ---');
line('  A27 seen: ' + karimArc.seenIds.includes('A27'));
line('  A38 (campaign callback) seen: ' + karimArc.seenIds.includes('A38'));
line('  A50 (janaza) seen: ' + karimArc.seenIds.includes('A50'));
line('  Outcome: ' + karimArc.outcome);

// 3) MONTE CARLO — RANDOM STRATEGY
section('3. Monte Carlo (1000 random-strategy runs, all parties)');
const N = 1000;
const partyMix = parties.map(p => p.id);
const outcomes = { win: 0, death: 0, no_card: 0, timeout: 0 };
const causes = {};
const winTiers = { clean: 0, standard: 0, compromised: 0 };
const turnsHistogram = [];
const finalStatSums = { janata: 0, dol: 0, proshashon: 0, tohobil: 0 };
const cardSeenCount = {};
for (let i = 0; i < N; i++) {
  const p = partyMix[i % partyMix.length];
  const o = simulate(p, randomStrategy, i + 1, BACKGROUND_IDS[i % BACKGROUND_IDS.length]);
  outcomes[o.kind] = (outcomes[o.kind] || 0) + 1;
  if (o.kind === 'death') causes[o.cause] = (causes[o.cause] || 0) + 1;
  if (o.kind === 'win') {
    winTiers[o.tier]++;
    for (const k of STAT_KEYS) finalStatSums[k] += o.finalStats[k];
  }
  turnsHistogram.push(o.turns);
  for (const h of o.history) cardSeenCount[h.id] = (cardSeenCount[h.id] || 0) + 1;
}
line('Outcomes: win=' + outcomes.win + ' death=' + outcomes.death + ' no_card=' + outcomes.no_card + ' timeout=' + outcomes.timeout);
line('Win rate: ' + asPct(outcomes.win / N));
const sortedCauses = Object.entries(causes).sort((a, b) => b[1] - a[1]);
line('Death causes (top 8):');
for (const [k, v] of sortedCauses.slice(0, 8)) line('  ' + pad(k, 22) + asPct(v / outcomes.death) + '  (' + v + ')');
if (outcomes.win) {
  line('Win-tier distribution:');
  for (const [k, v] of Object.entries(winTiers)) {
    line('  ' + pad(k, 14) + asPct(v / outcomes.win) + '  (' + v + ')');
  }
  line('Avg final stats on win:');
  for (const k of STAT_KEYS) {
    line('  ' + pad(k, 12) + (finalStatSums[k] / outcomes.win).toFixed(1));
  }
}
turnsHistogram.sort((a, b) => a - b);
line('Turns (cards-per-run): median=' + turnsHistogram[Math.floor(N/2)] + ' p10=' + turnsHistogram[Math.floor(N*0.1)] + ' p90=' + turnsHistogram[Math.floor(N*0.9)]);

// Cards that never appear in any random run
const neverSeen = cards.map(c => c.id).filter(id => !cardSeenCount[id]);
line('Cards never appearing in any random run: ' + (neverSeen.length ? neverSeen.join(', ') : 'NONE'));

// 4) STRATEGY EXTREMES
section('4. Strategy extremes (200 runs each)');
function runStrategyBatch(name, strat) {
  let win = 0, death = 0;
  const tiers = { clean: 0, standard: 0, compromised: 0 };
  const causes = {};
  for (let i = 0; i < 200; i++) {
    const p = partyMix[i % partyMix.length];
    const o = simulate(p, strat, 10000 + i, BACKGROUND_IDS[i % BACKGROUND_IDS.length]);
    if (o.kind === 'win') { win++; tiers[o.tier]++; }
    else if (o.kind === 'death') { death++; causes[o.cause] = (causes[o.cause] || 0) + 1; }
  }
  line('--- ' + name + ' ---');
  line('  win=' + win + '  death=' + death);
  line('  win tiers: clean=' + tiers.clean + ' standard=' + tiers.standard + ' compromised=' + tiers.compromised);
  if (death) {
    const top = Object.entries(causes).sort((a,b) => b[1]-a[1]).slice(0, 3);
    line('  top death causes: ' + top.map(([k,v]) => k + '(' + v + ')').join(', '));
  }
}
runStrategyBatch('Clean strategy',        cleanStrategy);
runStrategyBatch('Dirty strategy',        dirtyStrategy);
runStrategyBatch('Balanced strategy',     balancedStrategy);
runStrategyBatch('Smart-clean strategy',  smartCleanStrategy);
runStrategyBatch('Human-like strategy',   humanLikeStrategy);

// 5) REPETITION INVARIANT — no oneshot card appears >1, no recurring >2
section('5. Repetition invariant check (200 runs)');
let violationsOneshot = 0, violationsRecurring = 0;
const exampleViolations = [];
for (let i = 0; i < 200; i++) {
  const p = partyMix[i % partyMix.length];
  const o = simulate(p, balancedStrategy, 30000 + i, BACKGROUND_IDS[i % BACKGROUND_IDS.length]);
  // count appearances of each card in this run
  const counts = {};
  for (const h of o.history) counts[h.id] = (counts[h.id] || 0) + 1;
  for (const [id, n] of Object.entries(counts)) {
    const card = cards.find(c => c.id === id);
    const limit = maxUsesFor(card);
    if (n > limit) {
      if (card.oneshot || (card.requires_flags && card.requires_flags.length) || typeof card.force_on_day === 'number') {
        violationsOneshot++;
      } else {
        violationsRecurring++;
      }
      if (exampleViolations.length < 5) {
        exampleViolations.push(id + ' appeared ' + n + 'x (limit ' + limit + ') in run ' + i);
      }
    }
  }
}
line('Oneshot violations (card appeared >1 time): ' + violationsOneshot);
line('Recurring violations (card appeared >2 times): ' + violationsRecurring);
if (exampleViolations.length) {
  line('Examples:');
  exampleViolations.forEach(e => line('  ' + e));
} else {
  line('No repetition violations detected.');
}

// 6) PARTY-VARIANT SPOT CHECK
section('6. Party-variant spot check');
const variantCards = cards.filter(c => c.dialog_variants);
line('Cards with party-specific variants: ' + variantCards.length);
for (const c of variantCards) {
  for (const partyId of Object.keys(c.dialog_variants)) {
    if (!parties.some(p => p.id === partyId)) {
      line('  WARN: ' + c.id + ' has variant for unknown party "' + partyId + '"');
    } else {
      line('  ' + c.id + ' -> variant for ' + partyId);
    }
  }
}

console.log(REPORT.join('\n'));
