/* ═══════════════════════════════════════════════
   TAP REACTION — Game Engine
   Free Reflex Games · ca-pub-6633486007043409
   ═══════════════════════════════════════════════ */

const Game = (() => {

  // ── STATE ───────────────────────────────────────
  const DURATION = 30;
  const TARGET_COLORS = [
    '#00e5ff', '#ff3366', '#00e676', '#ffd600',
    '#7c3aed', '#ff6d00', '#00bcd4', '#e040fb'
  ];
  const STREAK_BONUS = { 3: 1, 5: 2, 10: 5 };

  let state = {
    score:      0,
    time:       DURATION,
    streak:     0,
    bestStreak: 0,
    plays:      0,
    hs:         0,
    running:    false,
    timer:      null,
    colorIdx:   0,
  };

  // Load persisted data
  state.hs        = parseInt(localStorage.getItem('rg_hs')    || '0');
  state.plays     = parseInt(localStorage.getItem('rg_plays') || '0');
  state.bestStreak = parseInt(localStorage.getItem('rg_bs')   || '0');

  // ── ELEMENTS ────────────────────────────────────
  const $ = id => document.getElementById(id);
  const target      = $('target');
  const field       = $('game-field');
  const screenStart = $('screen-start');
  const screenEnd   = $('screen-end');
  const elScore     = $('display-score');
  const elTime      = $('display-time');
  const elStreak    = $('display-streak');
  const elFinal     = $('final-score');
  const elNewRec    = $('new-record');
  const elHsDisplay = $('hs-display');
  const elTimerBar  = $('timer-bar');
  const elSideHs    = $('sidebar-hs');
  const elSidePlays = $('sidebar-plays');
  const elSideStreak= $('sidebar-streak');

  // ── INIT DISPLAY ────────────────────────────────
  function initDisplay() {
    if (state.hs > 0) {
      elHsDisplay.textContent = `BEST: ${state.hs}`;
    }
    elSideHs.textContent     = state.hs > 0 ? state.hs : '—';
    elSidePlays.textContent  = state.plays;
    elSideStreak.textContent = state.bestStreak > 0 ? state.bestStreak : '—';
  }

  // ── START ────────────────────────────────────────
  function start() {
    // Reset state
    state.score   = 0;
    state.time    = DURATION;
    state.streak  = 0;
    state.running = true;
    state.plays++;
    localStorage.setItem('rg_plays', state.plays);

    // Reset UI
    elScore.textContent  = '0';
    elTime.textContent   = DURATION;
    elStreak.textContent = '0';
    elTimerBar.style.width     = '100%';
    elTimerBar.style.background = 'linear-gradient(90deg, var(--cyan), var(--pink))';
    updateStreakPips(0);

    // Hide screens, show target
    screenStart.style.display = 'none';
    screenEnd.style.display   = 'none';
    target.style.display      = 'flex';

    moveTarget();

    // Tick
    clearInterval(state.timer);
    state.timer = setInterval(tick, 1000);
  }

  // ── TICK ─────────────────────────────────────────
  function tick() {
    state.time--;
    elTime.textContent = state.time;

    // Timer bar
    const pct = (state.time / DURATION) * 100;
    elTimerBar.style.width = pct + '%';
    if (pct < 30) {
      elTimerBar.style.background = 'var(--pink)';
    } else if (pct < 60) {
      elTimerBar.style.background = 'linear-gradient(90deg, var(--gold), var(--pink))';
    }

    // Danger flash at 5 sec
    if (state.time === 5) {
      toast('⏱ 5 seconds left!');
    }
    if (state.time <= 0) {
      clearInterval(state.timer);
      end();
    }
  }

  // ── HIT ──────────────────────────────────────────
  function hit(e) {
    if (!state.running) return;
    e.stopPropagation();

    state.score++;
    state.streak++;
    if (state.streak > state.bestStreak) {
      state.bestStreak = state.streak;
      localStorage.setItem('rg_bs', state.bestStreak);
      elSideStreak.textContent = state.bestStreak;
    }

    // Streak bonus
    let bonus = 0;
    let bonusText = '+1';
    Object.keys(STREAK_BONUS).forEach(threshold => {
      if (state.streak >= parseInt(threshold)) {
        bonus = STREAK_BONUS[threshold];
        bonusText = `+${1 + bonus} 🔥`;
      }
    });
    if (bonus > 0) {
      state.score += bonus;
    }

    elScore.textContent  = state.score;
    elStreak.textContent = state.streak;
    updateStreakPips(state.streak);

    // Score pop animation
    spawnScorePop(e.clientX, e.clientY, bonusText, bonus > 0);

    // Hit animation & move
    target.classList.remove('hit');
    void target.offsetWidth;
    target.classList.add('hit');
    setTimeout(() => target.classList.remove('hit'), 120);

    // Change color on streak milestones
    if (state.streak % 5 === 0) {
      state.colorIdx = (state.colorIdx + 1) % TARGET_COLORS.length;
    }
    moveTarget();
  }

  // ── MOVE TARGET ──────────────────────────────────
  function moveTarget() {
    const fw = field.offsetWidth  - 56;
    const fh = field.offsetHeight - 56;
    const x  = Math.max(0, Math.random() * fw);
    const y  = Math.max(0, Math.random() * fh);

    target.style.left  = x + 'px';
    target.style.top   = y + 'px';

    // Rotate through colors
    const color = TARGET_COLORS[state.colorIdx % TARGET_COLORS.length];
    target.style.setProperty('--target-color', color);
    target.style.background = `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, ${color} 60%)`;
    target.style.boxShadow  = `0 0 20px ${color}66, 0 4px 16px rgba(0,0,0,0.4)`;
    const ring = target.querySelector('.ring');
    if (ring) ring.style.borderColor = color + '55';
  }

  // ── SCORE POP ────────────────────────────────────
  function spawnScorePop(cx, cy, text, isMulti) {
    const pop = document.createElement('div');
    pop.className = 'score-pop' + (isMulti ? ' multi' : '');
    pop.textContent = text;

    const rect = field.getBoundingClientRect();
    pop.style.left = (cx - rect.left - 16) + 'px';
    pop.style.top  = (cy - rect.top - 16) + 'px';
    field.appendChild(pop);
    setTimeout(() => pop.remove(), 600);
  }

  // ── STREAK PIPS ──────────────────────────────────
  function updateStreakPips(streak) {
    const pips = document.querySelectorAll('.streak-pip');
    pips.forEach((pip, i) => pip.classList.toggle('lit', i < (streak % 5)));
    const label = $('streak-label');
    if (label) {
      if (streak >= 10) label.textContent = '🔥 ON FIRE';
      else if (streak >= 5) label.textContent = '⚡ Hot Streak';
      else label.textContent = 'Streak';
    }
  }

  // ── END ──────────────────────────────────────────
  function end() {
    state.running = false;
    target.style.display = 'none';
    screenEnd.style.display = 'flex';
    elFinal.textContent = state.score;

    const isNew = state.score > state.hs;
    if (isNew) {
      state.hs = state.score;
      localStorage.setItem('rg_hs', state.hs);
      elNewRec.textContent = '🏆 NEW HIGH SCORE!';
      toast('🏆 New record — ' + state.score + ' points!');
    } else {
      elNewRec.textContent = state.hs > 0 ? `Best: ${state.hs}` : '';
    }

    elSideHs.textContent    = state.hs;
    elSidePlays.textContent = state.plays;
    initDisplay();
  }

  // ── MISS CLICK (resets streak) ───────────────────
  function onFieldClick() {
    if (!state.running) return;
    // Only fires if target wasn't hit (propagation stops on target)
    if (state.streak > 0) {
      state.streak = 0;
      elStreak.textContent = '0';
      updateStreakPips(0);
    }
  }

  // ── BIND EVENTS ──────────────────────────────────
  target.addEventListener('click', hit);
  target.addEventListener('touchstart', e => { hit(e.touches[0]); }, { passive: true });
  field.addEventListener('click', onFieldClick);

  // ── TOAST ────────────────────────────────────────
  window.toast = function(msg, dur = 2400) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), dur);
  };

  // ── INIT ─────────────────────────────────────────
  initDisplay();

  // Public API
  return { start };

})();
