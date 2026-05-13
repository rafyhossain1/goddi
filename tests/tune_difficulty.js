#!/usr/bin/env node
/* Difficulty tuning pass — multiplies all card stat effects by 1.3.
   Year-4+ escalation is handled engine-side in game.js (×1.25 runtime).
   Idempotent: refuses to run twice in a row by checking a marker. */

const fs = require('fs');
const path = require('path');

const MULTIPLIER = 1.3;
const MARKER_FILE = path.join(__dirname, '..', 'data', '.tuned_1_3');
const file = path.join(__dirname, '..', 'data', 'cards.json');

if (fs.existsSync(MARKER_FILE)) {
  console.error('Already tuned — marker file exists at', MARKER_FILE);
  console.error('Refusing to double-multiply. Delete the marker manually if you really want to re-run.');
  process.exit(1);
}

const doc = JSON.parse(fs.readFileSync(file, 'utf8'));

let scaled = 0;
for (const card of doc.cards) {
  for (const side of ['left','right']) {
    const choice = card[side];
    if (!choice || !choice.effects) continue;
    for (const stat of Object.keys(choice.effects)) {
      const orig = choice.effects[stat];
      if (orig === 0) continue;
      // Use Math.round for fair rounding; preserve sign via Math.sign
      const scaledVal = Math.round(Math.abs(orig) * MULTIPLIER) * Math.sign(orig);
      // Never let a non-zero effect collapse to 0 — that would silently
      // remove the consequence from the game.
      const finalVal = (scaledVal === 0) ? Math.sign(orig) : scaledVal;
      choice.effects[stat] = finalVal;
      scaled++;
    }
  }
}

fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
fs.writeFileSync(MARKER_FILE, MULTIPLIER + ' applied ' + new Date().toISOString() + '\n');
console.log('Scaled', scaled, 'effects by ×' + MULTIPLIER + '. Marker written to', MARKER_FILE);
