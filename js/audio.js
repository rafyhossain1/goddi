/* ==========================================================
   Goddi — Sound effects (Web Audio API, synthesized)
   - No external files; everything is generated in-browser.
   - Designed to evoke a stamped paper / thud / shake aesthetic,
     matching the visual language of the game.
   - Exposes window.Sfx (NOT window.Audio — that would clobber
     the built-in HTMLAudioElement constructor).
   ========================================================== */
(function () {
  'use strict';

  const STORAGE_KEY = 'goddi.muted';

  let ctx = null;         // AudioContext, created lazily after first gesture
  let master = null;      // master gain node (volume + mute)
  let muted = false;

  // Restore persisted mute preference
  try {
    muted = localStorage.getItem(STORAGE_KEY) === '1';
  } catch (e) { /* localStorage may be disabled */ }

  // ---------- Context management ----------
  function ensureContext() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  // Must be called from inside a user gesture handler (click/touchend).
  // Creates the AudioContext and, if necessary, resumes it — which is
  // required on iOS Safari and on any page with strict autoplay policy.
  function unlock() {
    ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    syncUI();
  }

  // ---------- Mute ----------
  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0'); } catch (e) {}
    if (master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.02);
    }
    syncUI();
  }
  function toggle() { setMuted(!muted); }
  function isMuted() { return muted; }

  function syncUI() {
    document.body.setAttribute('data-muted', muted ? 'true' : 'false');
  }

  // ---------- Primitives ----------
  // Short noise buffer for percussive bursts (paper slap, card shuffle).
  let _noiseBuf = null;
  function noiseBuffer() {
    if (!ctx) return null;
    if (_noiseBuf) return _noiseBuf;
    const len = Math.floor(ctx.sampleRate * 0.35);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // Slight pink-ish shaping: decaying white noise
      const decay = 1 - i / len;
      data[i] = (Math.random() * 2 - 1) * decay * decay;
    }
    _noiseBuf = buf;
    return _noiseBuf;
  }

  // ---------- Sounds ----------
  /**
   * Stamp-commit sound: the player has just pushed a card off the deck.
   * Layered texture:
   *   1. Short highpassed noise burst = paper slap
   *   2. Low sine thump = stamp/gavel thud
   *   3. Faint click transient for snap
   * Left (red stamp) tuned slightly lower than Right (green stamp).
   */
  function playStamp(side) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;

    const baseFreq = side === 'right' ? 115 : 90;

    // --- 1. Paper slap (noise through highpass) ---
    const nb = noiseBuffer();
    if (nb) {
      const src = c.createBufferSource();
      src.buffer = nb;
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1400;
      hp.Q.value = 0.6;
      const ng = c.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.45, now + 0.004);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      src.connect(hp);
      hp.connect(ng);
      ng.connect(master);
      src.start(now);
      src.stop(now + 0.15);
    }

    // --- 2. Low thump (sine with fast pitch decay) ---
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 2.1, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.08);
    const og = c.createGain();
    og.gain.setValueAtTime(0.0001, now);
    og.gain.exponentialRampToValueAtTime(0.55, now + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(og);
    og.connect(master);
    osc.start(now);
    osc.stop(now + 0.25);

    // --- 3. Click transient (very short square blip) ---
    const click = c.createOscillator();
    click.type = 'square';
    click.frequency.value = side === 'right' ? 1800 : 1500;
    const cg = c.createGain();
    cg.gain.setValueAtTime(0.0001, now);
    cg.gain.exponentialRampToValueAtTime(0.08, now + 0.002);
    cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    click.connect(cg);
    cg.connect(master);
    click.start(now);
    click.stop(now + 0.04);
  }

  /**
   * Soft swipe whoosh — plays while the card is being dragged past the hint
   * threshold. Should be subtle; we only call it once per drag.
   */
  function playSwoosh() {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const nb = noiseBuffer();
    if (!nb) return;
    const src = c.createBufferSource();
    src.buffer = nb;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(600, now);
    bp.frequency.exponentialRampToValueAtTime(2400, now + 0.18);
    bp.Q.value = 2.5;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(now);
    src.stop(now + 0.25);
  }

  /**
   * UI click — a short soft tick for buttons (BEGIN, Next, Confirm, etc.).
   */
  function playClick() {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Verdict sting — plays once on game-over / win screen reveal.
   * `kind`: 'loss' (minor, descending) | 'win' (major, ascending).
   */
  function playVerdict(kind) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;

    const notes = kind === 'win'
      ? [261.63, 329.63, 392.00, 523.25]  // C major arpeggio up
      : [349.23, 293.66, 246.94, 196.00]; // F minor-ish down

    notes.forEach((f, i) => {
      const t0 = now + i * 0.14;
      const o = c.createOscillator();
      o.type = i === notes.length - 1 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      o.connect(g);
      g.connect(master);
      o.start(t0);
      o.stop(t0 + 0.55);
    });
  }

  // ---------- Ambient bed (gameplay drone) ----------
  // Slow A2 + E3 + A3 sine drone with a gentle LFO. Designed to sit very
  // quietly under the SFX — players should barely notice it consciously but
  // feel the room change when it stops at the verdict screen. Oscillators
  // run silently when muted (master gain controls audibility); start/stop
  // only triggers create/destroy.
  let ambient = null;

  // Synthesized ambient pad — detuned sawtooths through a lowpass filter
  // with a slow LFO on the cutoff. This is the standard "warm pad" recipe;
  // the filter rolls off the sawtooth's harsh upper harmonics, leaving
  // something that reads as ambient texture rather than a tuning fork.
  function startAmbient() {
    if (ambient) return; // already on
    const c = ensureContext();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});

    const now = c.currentTime;

    // Master gain for the ambient bed
    const out = c.createGain();
    out.gain.value = 0;
    out.connect(master);
    out.gain.linearRampToValueAtTime(0.55, now + 2.0);

    // Lowpass filter — kills the sawtooth's "buzzy" harmonics, leaves
    // a warm pad-like body
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    filter.Q.value = 0.9;
    filter.connect(out);

    // Slow LFO on filter cutoff for evolving texture (±90 Hz around 380)
    const filterLfo = c.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.055;
    const filterLfoDepth = c.createGain();
    filterLfoDepth.gain.value = 90;
    filterLfo.connect(filterLfoDepth);
    filterLfoDepth.connect(filter.frequency);
    filterLfo.start(now);

    function makeSaw(freq, detuneCents, gainVal) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = detuneCents;
      const g = c.createGain();
      g.gain.value = gainVal;
      o.connect(g);
      g.connect(filter);
      o.start(now);
      return o;
    }

    // Detuned saw pair at A2 root — the slight detune is what creates the
    // "chorus" warmth we want from a pad
    const sawRootDown = makeSaw(110, -7, 0.10);
    const sawRootUp   = makeSaw(110, +7, 0.10);
    // Perfect fifth — E3
    const sawFifth    = makeSaw(164.81, -4, 0.075);
    // Octave — A3 (so the chord registers without sounding subterranean)
    const sawOctave   = makeSaw(220, +3, 0.05);

    ambient = { out, filter, filterLfo, sawRootDown, sawRootUp, sawFifth, sawOctave };
  }

  function stopAmbient() {
    if (!ambient || !ctx) return;
    const a = ambient;
    ambient = null;
    const now = ctx.currentTime;
    a.out.gain.cancelScheduledValues(now);
    a.out.gain.linearRampToValueAtTime(0, now + 0.8);
    setTimeout(() => {
      try {
        a.sawRootDown.stop();
        a.sawRootUp.stop();
        a.sawFifth.stop();
        a.sawOctave.stop();
        a.filterLfo.stop();
        a.out.disconnect();
        a.filter.disconnect();
      } catch (_) {}
    }, 900);
  }

  // ---------- Boot ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncUI);
  } else {
    syncUI();
  }

  // ---------- Export ----------
  window.Sfx = {
    unlock:        unlock,
    toggle:        toggle,
    setMuted:      setMuted,
    isMuted:       isMuted,
    playStamp:     playStamp,
    playSwoosh:    playSwoosh,
    playClick:     playClick,
    playVerdict:   playVerdict,
    startAmbient:  startAmbient,
    stopAmbient:   stopAmbient
  };
})();
