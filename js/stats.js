  /* ==========================================================
     Stats dashboard logic.
     - Reads password from sessionStorage (cleared on logout / browser close).
     - Calls goddi_admin_stats RPC on Supabase.
     - Renders everything inline; no chart library.
     ========================================================== */
  (function () {
    'use strict';

    const SUPABASE_URL = 'https://kafvftjcvnvtklqwanrm.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_dOxFoPfs_kKu8H3zoZkVng_w7JlM5Es';
    const PW_KEY = 'goddi.statspw';

    const $ = id => document.getElementById(id);

    // ---- Auth flow ----
    function start() {
      const saved = sessionStorage.getItem(PW_KEY);
      if (saved) {
        attempt(saved);
      }
    }
    $('login-go').addEventListener('click', () => {
      const pw = $('login-pw').value;
      attempt(pw);
    });
    $('login-pw').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); $('login-go').click(); }
    });
    $('btn-refresh').addEventListener('click', () => {
      const pw = sessionStorage.getItem(PW_KEY);
      if (pw) attempt(pw);
    });
    $('btn-logout').addEventListener('click', () => {
      sessionStorage.removeItem(PW_KEY);
      document.body.setAttribute('data-state', 'login');
      $('login-pw').value = '';
      $('login-error').textContent = '';
    });

    async function attempt(pw) {
      $('login-error').textContent = '';
      document.body.setAttribute('data-state', 'loading');
      try {
        const data = await fetchStats(pw);
        sessionStorage.setItem(PW_KEY, pw);
        document.body.setAttribute('data-state', 'ready');
        render(data);
      } catch (err) {
        sessionStorage.removeItem(PW_KEY);
        document.body.setAttribute('data-state', 'login');
        $('login-error').textContent =
          (err && err.message) === 'unauthorized'
            ? 'Wrong password.'
            : 'Network error. Try again.';
      }
    }

    async function fetchStats(pw) {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/goddi_admin_stats', {
        method: 'POST',
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({ p: pw })
      });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json()).message || ''; } catch (_) {}
        if (res.status === 400 && detail.toLowerCase().includes('unauthorized')) {
          throw new Error('unauthorized');
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error('unauthorized');
        }
        throw new Error('network');
      }
      return await res.json();
    }

    // ---- Render ----
    function render(d) {
      $('generated-at').textContent = 'Generated ' + new Date(d.generated_at).toLocaleString();

      // KPIs
      const winRate = (d.runs_completed_total > 0)
        ? Math.round(100 * d.wins / d.runs_completed_total) + '%'
        : '—';
      const completionRate = (d.runs_started > 0)
        ? Math.round(100 * d.runs_ended / d.runs_started) + '%'
        : '—';
      const kpis = [
        { label: 'Sessions today',  value: fmt(d.sessions_today),  sub: fmt(d.sessions_7d) + ' last 7d' },
        { label: 'Sessions total',  value: fmt(d.sessions_total) },
        { label: 'Runs completed',  value: fmt(d.runs_completed_total), sub: fmt(d.runs_completed_today) + ' today' },
        { label: 'Win rate',        value: winRate, accent: true },
        { label: 'Completion rate', value: completionRate, sub: fmt(d.runs_started) + ' starts' },
        { label: 'Share clicks',    value: fmt(d.share_clicks) },
        { label: 'Cameo clicks',    value: fmt(d.cameo_clicks),    sub: 'sponsorship interest' }
      ];
      $('kpi-row').innerHTML = kpis.map(k => `
        <div class="kpi ${k.accent ? 'kpi--accent' : ''}">
          <div class="kpi__label">${esc(k.label)}</div>
          <div class="kpi__value">${esc(k.value)}</div>
          ${k.sub ? `<div class="kpi__sub">${esc(k.sub)}</div>` : ''}
        </div>
      `).join('');

      renderPrize(d);
      renderSparkline(d.daily_sessions_30d || []);
      renderFunnel(d.funnel || {});
      renderBars('bars-backgrounds', d.backgrounds || {});
      renderBars('bars-parties',     d.parties     || {});
      renderBars('bars-languages',   d.languages   || {});
      renderOutcomes(d);
      renderCards(d.cards || []);
      renderBars('bars-achievements', d.achievements || {});
      renderBars('bars-yearreach', d.year_reach || {}, k => 'Year ' + k);
      renderBars('bars-clicks', {
        share:    d.share_clicks    || 0,
        cameo:    d.cameo_clicks    || 0,
        credits:  d.credits_clicks  || 0,
        language: d.language_toggles || 0
      });
    }

    // ---- Prize panel ----
    function renderPrize(d) {
      // KPIs
      const total = d.prize_total_entries || 0;
      const phones = d.prize_unique_phones || 0;
      const today = d.prize_entries_today || 0;
      const week  = d.prize_entries_7d || 0;
      const avgPer = phones > 0 ? (total / phones).toFixed(1) : '—';
      const kpis = [
        { label: 'Total entries',  value: fmt(total), accent: true, sub: 'across all draws' },
        { label: 'Unique phones',  value: fmt(phones), sub: avgPer + ' avg entries/phone' },
        { label: 'Entries today',  value: fmt(today),  sub: fmt(week) + ' last 7d' },
      ];
      $('prize-kpis').innerHTML = kpis.map(k => `
        <div class="kpi ${k.accent ? 'kpi--accent' : ''}">
          <div class="kpi__label">${esc(k.label)}</div>
          <div class="kpi__value">${esc(k.value)}</div>
          ${k.sub ? `<div class="kpi__sub">${esc(k.sub)}</div>` : ''}
        </div>
      `).join('');

      // Daily entries sparkline
      renderPrizeSparkline(d.prize_daily_30d || []);

      // Tier bars (label each as cleaner string)
      const byTier = d.prize_by_tier || {};
      const tierLabels = {
        clean:       'Clean wins (2 entries each)',
        standard:    'Standard wins (1 entry each)',
        compromised: 'Compromised wins (1 entry each)'
      };
      const tierObj = {};
      ['clean','standard','compromised'].forEach(t => {
        if (byTier[t] !== undefined) tierObj[tierLabels[t]] = byTier[t];
      });
      renderBars('prize-by-tier', tierObj);
      // Colour the bars: clean = green, standard = gold-ish (default), compromised = red
      Array.from(document.querySelectorAll('#prize-by-tier .bar')).forEach(barEl => {
        const lbl = barEl.querySelector('.bar__label').textContent;
        const fill = barEl.querySelector('.bar__fill');
        if (lbl.startsWith('Clean')) {
          /* bd-green is the default fill colour, no class needed */
        } else if (lbl.startsWith('Compromised')) {
          fill.classList.add('bar__fill--red');
        } else {
          fill.classList.add('bar__fill--gold');
        }
      });

      // Recent entries table
      const recent = d.prize_recent || [];
      const tbody = $('prize-table').querySelector('tbody');
      if (!recent.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--ink-mute); padding:14px;">No prize entries yet.</td></tr>`;
      } else {
        tbody.innerHTML = recent.map(r => {
          const when = formatWhen(r.created_at);
          const tierClass = 'tier-pill--' + (r.tier || 'standard');
          return `
            <tr>
              <td>${esc(when)}</td>
              <td>${esc(r.name || '—')}</td>
              <td>${esc(r.phone_masked || ('****' + (r.phone_last4 || '????')))}</td>
              <td><span class="tier-pill ${tierClass}">${esc(r.tier || 'standard')}</span></td>
              <td class="num">${fmt(r.entries)}</td>
              <td>${esc((r.language || '').toUpperCase())}</td>
            </tr>`;
        }).join('');
      }
    }

    function renderPrizeSparkline(arr) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const lookup = {};
      arr.forEach(r => { lookup[r.d] = r.e; });
      const cells = [];
      for (let i = 29; i >= 0; i--) {
        const dt = new Date(today);
        dt.setDate(today.getDate() - i);
        const key = dt.toISOString().slice(0,10);
        cells.push({ date: key, c: lookup[key] || 0 });
      }
      const max = Math.max(1, ...cells.map(c => c.c));
      $('prize-spark').innerHTML = cells.map(c => {
        const pct = Math.round(100 * c.c / max);
        return `<div class="spark__bar ${c.c === 0 ? 'spark__bar--empty' : ''}"
                  style="height:${Math.max(2, pct)}%; background: var(--gold);"
                  title="${c.date}: ${c.c} entries"></div>`;
      }).join('');
      $('prize-spark-axis').innerHTML = `<span>${cells[0].date}</span><span>${cells[cells.length-1].date}</span>`;
    }

    function formatWhen(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1)   return 'just now';
      if (diffMin < 60)  return diffMin + ' min ago';
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24)   return diffHr + 'h ago';
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 7)   return diffDay + 'd ago';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    }

    // ---- Draw winner ----
    async function drawWinner() {
      const pw = sessionStorage.getItem(PW_KEY);
      if (!pw) return;
      const win = $('draw-window').value;
      // Window bounds (Bangladesh Standard Time, UTC+6 — Supabase stores UTC,
      // so we compute UTC equivalents of the BD dates).
      // Launch: May 20 2026 00:00 BDT = May 19 18:00 UTC
      let since = null, until = null;
      if (win === 'week2') {
        since = '2026-05-19T18:00:00Z';
        until = '2026-06-02T18:00:00Z';   // Jun 3 00:00 BDT
      } else if (win === 'week4') {
        since = '2026-05-19T18:00:00Z';
        until = '2026-06-18T18:00:00Z';   // Jun 19 00:00 BDT
      }

      const ok = window.confirm(
        'Draw a winner from ' +
        (win === 'all' ? 'all entries to date' :
         win === 'week2' ? 'the Week 2 window (May 20 → Jun 3)' :
                           'the Week 4 window (May 20 → Jun 19)') + '?\n\n' +
        'This is just a random pick. It does NOT mark anyone as won. ' +
        'You can re-draw if needed. Record the winner manually.'
      );
      if (!ok) return;

      const btn = $('btn-draw-winner');
      btn.disabled = true;
      btn.textContent = 'Drawing…';
      try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/goddi_draw_winner', {
          method: 'POST',
          headers: {
            'apikey':        SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type':  'application/json'
          },
          body: JSON.stringify({
            p_password: pw,
            p_since:    since,
            p_until:    until
          })
        });
        if (!res.ok) throw new Error('http ' + res.status);
        const data = await res.json();
        renderDrawResult(data);
      } catch (err) {
        renderDrawResult({ ok: false, error: 'network' });
      } finally {
        btn.disabled = false;
        btn.textContent = 'Draw winner';
      }
    }

    function renderDrawResult(d) {
      const wrap = $('draw-result');
      if (!d || d.ok === false) {
        const msg = d && d.error === 'no_entries'
          ? 'No entries in that window yet.'
          : 'Draw failed. Try again.';
        wrap.innerHTML = `
          <div class="draw-result draw-result--err">
            <div class="draw-result__heading">Couldn't draw</div>
            <div>${esc(msg)}</div>
          </div>`;
        return;
      }
      wrap.innerHTML = `
        <div class="draw-result">
          <div class="draw-result__heading">Winner drawn</div>
          <div class="draw-result__row">
            <div class="draw-result__label">Name</div>
            <div class="draw-result__val">${esc(d.winner_name || '—')}</div>
          </div>
          <div class="draw-result__row">
            <div class="draw-result__label">Phone</div>
            <div class="draw-result__val">****${esc(d.winner_phone_last4 || '????')}</div>
          </div>
          ${d.winner_email ? `
          <div class="draw-result__row">
            <div class="draw-result__label">Email</div>
            <div class="draw-result__val">${esc(d.winner_email)}</div>
          </div>` : ''}
          <div class="draw-result__row">
            <div class="draw-result__label">Tier</div>
            <div class="draw-result__val">${esc(d.winner_tier || '—')}</div>
          </div>
          <div class="draw-result__row">
            <div class="draw-result__label">Entry id</div>
            <div class="draw-result__val">${esc(d.winner_entry_id || '—')}</div>
          </div>
          <div class="draw-result__pool">
            Pool: ${fmt(d.pool_total_entries)} entries from ${fmt(d.pool_total_phones)} phones · drawn ${new Date(d.drawn_at).toLocaleString()}
          </div>
          <div class="draw-result__pool">
            Full phone number is in your Supabase <code>goddi_prize_entries</code> table (entry id ${esc(d.winner_entry_id)}). Look it up there to contact the winner.
          </div>
        </div>`;
    }

    // Wire the draw button (the rest of the wiring lives in start())
    $('btn-draw-winner').addEventListener('click', drawWinner);

    function renderSparkline(arr) {
      // build a 30-day window padded with 0s
      const today = new Date();
      today.setHours(0,0,0,0);
      const lookup = {};
      arr.forEach(r => { lookup[r.d] = r.c; });
      const cells = [];
      for (let i = 29; i >= 0; i--) {
        const dt = new Date(today);
        dt.setDate(today.getDate() - i);
        const key = dt.toISOString().slice(0,10);
        cells.push({ date: key, c: lookup[key] || 0 });
      }
      const max = Math.max(1, ...cells.map(c => c.c));
      $('spark').innerHTML = cells.map(c => {
        const pct = Math.round(100 * c.c / max);
        return `<div class="spark__bar ${c.c === 0 ? 'spark__bar--empty' : ''}"
                  style="height:${Math.max(2, pct)}%"
                  title="${c.date}: ${c.c}"></div>`;
      }).join('');
      $('spark-axis').innerHTML = `<span>${cells[0].date}</span><span>${cells[cells.length-1].date}</span>`;
    }

    function renderFunnel(funnel) {
      const order = ['splash','name','background','party','mode','play','win','gameover'];
      const max = Math.max(1, ...order.map(s => funnel[s] || 0));
      const top = funnel['splash'] || max;
      $('funnel').innerHTML = order.map((s, i) => {
        const v = funnel[s] || 0;
        const pct = Math.round(100 * v / max);
        const prev = i > 0 ? (funnel[order[i-1]] || 0) : 0;
        const dropPct = (i > 0 && prev > 0)
          ? Math.round(100 * (prev - v) / prev) + '% drop'
          : '';
        return `
          <div class="funnel__step">
            <div class="funnel__step-name">${esc(s)}</div>
            <div class="bar__track"><div class="bar__fill" style="width:${pct}%"></div></div>
            <div class="bar__value">${fmt(v)}</div>
            <div class="funnel__step-drop">${esc(dropPct)}</div>
          </div>`;
      }).join('');
    }

    function renderBars(containerId, obj, labelFn) {
      const entries = Object.entries(obj).sort((a,b) => b[1]-a[1]);
      if (!entries.length) {
        $(containerId).innerHTML = `<div style="font-family:var(--font-mono); font-size:12px; color:var(--ink-mute);">No data yet.</div>`;
        return;
      }
      const max = Math.max(1, ...entries.map(e => e[1]));
      $(containerId).innerHTML = entries.map(([k, v]) => {
        const pct = Math.round(100 * v / max);
        return `
          <div class="bar">
            <div class="bar__label">${esc(labelFn ? labelFn(k) : k)}</div>
            <div class="bar__track"><div class="bar__fill" style="width:${pct}%"></div></div>
            <div class="bar__value">${fmt(v)}</div>
          </div>`;
      }).join('');
    }

    function renderOutcomes(d) {
      const winTiers = d.win_tiers || {};
      const deaths = d.death_causes || {};
      const obj = {};
      ['clean','standard','compromised'].forEach(t => {
        if (winTiers[t] !== undefined) obj['win:' + t] = winTiers[t];
      });
      Object.entries(deaths).forEach(([k,v]) => { obj['death:' + k] = v; });
      renderBars('bars-outcomes', obj);
      // Tint the win bars gold and the death bars red after render
      Array.from(document.querySelectorAll('#bars-outcomes .bar')).forEach(barEl => {
        const lbl = barEl.querySelector('.bar__label').textContent;
        const fill = barEl.querySelector('.bar__fill');
        if (lbl.startsWith('win:'))   fill.classList.add('bar__fill--gold');
        if (lbl.startsWith('death:')) fill.classList.add('bar__fill--red');
      });
    }

    function renderCards(cards) {
      const tbody = $('card-table').querySelector('tbody');
      if (!cards.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--ink-mute); padding:14px;">No card decisions yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = cards.map(c => {
        const leftPct  = c.left_pct  || 0;
        const rightPct = c.right_pct || 0;
        return `
          <tr>
            <td>${esc(c.card_id)}</td>
            <td class="num">${fmt(c.total)}</td>
            <td class="bar-cell">
              <div style="display:flex; height:8px; border:1px solid var(--ink-mute); border-radius:2px; overflow:hidden;">
                <div style="background:var(--stamp-red); width:${leftPct}%"></div>
                <div style="background:var(--bd-green); width:${rightPct}%"></div>
              </div>
            </td>
            <td class="pct">${leftPct}%</td>
          </tr>`;
      }).join('');
    }

    function fmt(n) {
      if (n === null || n === undefined) return '0';
      return Number(n).toLocaleString('en-IN');
    }
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
    }

    start();
  })();
