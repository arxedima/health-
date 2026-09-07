(() => {
  'use strict';

  if (window.NovaIntelligenceV1) return;
  window.NovaIntelligenceV1 = true;

  const shell = document.getElementById('appShell');
  const home = shell?.querySelector('.home-screen');
  const stage = shell?.querySelector('.nova-stage');
  const orb = shell?.querySelector('.nova-orb');
  const metricsRoot = shell?.querySelector('.metrics');
  if (!shell || !home || !stage || !orb || !metricsRoot) return;

  const KEYS = {
    metrics: 'nova.metrics',
    details: 'nova.details',
    history: 'nova.history',
    goals: 'nova.goals'
  };

  const DEFAULT_METRICS = {
    sport: { current: 2, max: 3 },
    food: { current: 3, max: 8 },
    water: { current: 4, max: 8 },
    sleep: { current: 1, max: 8 }
  };

  const DEFAULT_DETAILS = {
    sport: { steps: 7432, calories: 320, minutes: 42 },
    water: { ml: 1500 },
    food: { kcal: 1540, protein: 120, fat: 56, carbs: 180 },
    sleep: { minutes: 448, quality: 91, mode: false }
  };

  const DEFAULT_GOALS = { steps: 10000, water: 2000, kcal: 2000, sleep: 480 };

  let scoreNode = null;
  let weekNode = null;
  let insightNode = null;
  let calendarWrap = null;
  let undoNode = null;
  let undoTimer = 0;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? clone(fallback);
    } catch (_) { return clone(fallback); }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  function state() {
    return {
      metrics: read(KEYS.metrics, DEFAULT_METRICS),
      details: read(KEYS.details, DEFAULT_DETAILS),
      history: read(KEYS.history, []),
      goals: { ...DEFAULT_GOALS, ...read(KEYS.goals, {}) }
    };
  }
  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function ratio(value, target) { return clamp(value / Math.max(Number(target) || 1, 1), 0, 1); }
  function foodRatio(kcal, target) {
    const raw = (Number(kcal) || 0) / Math.max(Number(target) || 1, 1);
    return clamp(1 - Math.abs(1 - raw), 0, 1);
  }
  function currentRatios(s) {
    return {
      sport: ratio(s.details.sport.steps, s.goals.steps),
      water: ratio(s.details.water.ml, s.goals.water),
      food: foodRatio(s.details.food.kcal, s.goals.kcal),
      sleep: ratio(s.details.sleep.minutes, s.goals.sleep)
    };
  }
  function scoreFromRatios(r) {
    return Math.round((r.sport + r.water + r.food + r.sleep) / 4 * 100);
  }
  function currentScore(s = state()) { return scoreFromRatios(currentRatios(s)); }
  function eventsForDay(history, key) {
    return history.filter((event) => dateKey(new Date(event.at)) === key);
  }
  function sum(events, type) {
    return events.filter((event) => event.type === type).reduce((total, event) => total + (Number(event.value) || 0), 0);
  }
  function dayScore(s, key, isToday = false) {
    if (isToday) return currentScore(s);
    const events = eventsForDay(s.history, key);
    if (!events.length) return 0;
    const sport = ratio(sum(events, 'sport'), 45);
    const water = ratio(sum(events, 'water'), s.goals.water);
    const food = foodRatio(sum(events, 'food'), s.goals.kcal);
    const sleep = ratio(sum(events, 'sleep'), s.goals.sleep);
    return scoreFromRatios({ sport, water, food, sleep });
  }

  function ensureScore() {
    if (scoreNode) return scoreNode;
    scoreNode = document.createElement('div');
    scoreNode.className = 'nova-score';
    scoreNode.innerHTML = '<small>NOVA SCORE</small><strong data-nova-score>0</strong><span>/100</span>';
    stage.appendChild(scoreNode);
    return scoreNode;
  }

  function ensureWeek() {
    if (weekNode) return weekNode;
    weekNode = document.createElement('section');
    weekNode.className = 'nova-week-card';
    weekNode.innerHTML = `
      <button class="nova-week-head" type="button" data-nova-calendar-open>
        <span><small>История</small><strong>Последние 7 дней</strong></span>
        <b>Календарь ›</b>
      </button>
      <div class="nova-week-days" data-nova-week-days></div>`;
    metricsRoot.insertAdjacentElement('afterend', weekNode);
    return weekNode;
  }

  function ensureInsight() {
    if (insightNode) return insightNode;
    insightNode = document.createElement('button');
    insightNode.type = 'button';
    insightNode.className = 'nova-home-insight';
    insightNode.setAttribute('data-nova-calendar-open', '');
    const tip = document.getElementById('tipButton');
    (tip || weekNode || metricsRoot).insertAdjacentElement('afterend', insightNode);
    return insightNode;
  }

  function updateHomeMetrics(s) {
    document.querySelectorAll('.metric[data-kind]').forEach((el) => {
      const item = s.metrics[el.dataset.kind];
      if (!item) return;
      const strong = el.querySelector('strong');
      const bar = el.querySelector('.metric-track i');
      if (strong) strong.textContent = `${item.current} / ${item.max}`;
      if (bar) bar.style.width = `${Math.round(clamp(item.current / Math.max(item.max, 1), 0, 1) * 100)}%`;
    });
    window.NovaBalance?.update?.();
  }

  function updateOrb() {
    const s = state();
    const r = currentRatios(s);
    const score = scoreFromRatios(r);
    ensureScore().querySelector('[data-nova-score]').textContent = score;

    orb.style.setProperty('--nova-score-live', score / 100);
    orb.style.setProperty('--nova-water-live', r.water);
    orb.style.setProperty('--nova-sport-live', r.sport);
    orb.style.setProperty('--nova-food-live', r.food);
    orb.style.setProperty('--nova-sleep-live', r.sleep);
    orb.classList.toggle('nova-mood-low', score < 45);
    orb.classList.toggle('nova-mood-steady', score >= 45 && score < 75);
    orb.classList.toggle('nova-mood-high', score >= 75);

    const hue = Math.round(218 - r.food * 10 + r.water * 8);
    const brightness = 0.84 + r.sleep * 0.22;
    const saturation = 0.84 + r.water * 0.34;
    orb.style.setProperty('--nova-live-hue', `${hue}deg`);
    orb.style.setProperty('--nova-live-brightness', brightness.toFixed(2));
    orb.style.setProperty('--nova-live-saturation', saturation.toFixed(2));

    updateWeek(s);
    updateInsight(s, r, score);
  }

  function updateWeek(s) {
    const root = ensureWeek().querySelector('[data-nova-week-days]');
    const today = dateKey();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const score = dayScore(s, key, key === today);
      const day = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(d).replace('.', '');
      const num = d.getDate();
      days.push(`
        <button class="nova-day ${key === today ? 'is-today' : ''}" type="button" data-nova-day="${key}">
          <small>${day}</small>
          <span class="nova-mini-orb" style="--day-score:${score}"><i></i><b>${score || '·'}</b></span>
          <em>${num}</em>
        </button>`);
    }
    root.innerHTML = days.join('');
  }

  function buildInsight(s, r, score) {
    const labels = { sport: 'движение', water: 'вода', food: 'питание', sleep: 'сон' };
    const entries = Object.entries(r).sort((a, b) => a[1] - b[1]);
    const weakest = entries[0];
    const last7 = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const ds = dayScore(s, dateKey(d), false);
      if (ds) last7.push(ds);
    }
    const avg = last7.length ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : 0;
    const streak = calculateStreak(s);

    if (avg && score >= avg + 8) {
      return {
        title: `Сегодня на ${score - avg} пунктов выше твоего среднего`,
        text: `Nova Score ${score}. Лучший вклад сейчас дают ${labels[entries[3][0]]} и ${labels[entries[2][0]]}.`,
        badge: streak > 1 ? `${streak} дня подряд` : 'Выше среднего'
      };
    }
    if (weakest[1] < 0.55) {
      return {
        title: `${labels[weakest[0]][0].toUpperCase() + labels[weakest[0]].slice(1)} сильнее всего тянет баланс вниз`,
        text: `Сейчас выполнено ${Math.round(weakest[1] * 100)}% цели. Небольшое улучшение здесь быстрее всего поднимет Nova Score.`,
        badge: `Nova Score ${score}`
      };
    }
    return {
      title: score >= 80 ? 'Сегодня очень ровный день' : 'Баланс выглядит устойчиво',
      text: 'Все четыре сферы близки друг к другу. Главное — удержать этот ритм до конца дня.',
      badge: streak > 1 ? `${streak} дня подряд` : `Nova Score ${score}`
    };
  }

  function calculateStreak(s) {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const score = dayScore(s, key, i === 0);
      if (score >= 70) streak++;
      else break;
    }
    return streak;
  }

  function updateInsight(s, r, score) {
    const data = buildInsight(s, r, score);
    const node = ensureInsight();
    node.innerHTML = `
      <span class="nova-insight-orb"></span>
      <span class="nova-insight-copy"><small>Nova заметила · ${data.badge}</small><strong>${data.title}</strong><em>${data.text}</em></span>
      <b>›</b>`;
  }

  function ensureCalendar() {
    if (calendarWrap) return calendarWrap;
    calendarWrap = document.createElement('div');
    calendarWrap.className = 'nova-calendar-wrap';
    calendarWrap.hidden = true;
    calendarWrap.innerHTML = '<div class="nova-calendar-backdrop" data-nova-calendar-close></div><section class="nova-calendar"></section>';
    document.body.appendChild(calendarWrap);
    return calendarWrap;
  }

  function openCalendar(focusKey = '') {
    const s = state();
    const wrap = ensureCalendar();
    const panel = wrap.querySelector('.nova-calendar');
    const now = focusKey ? new Date(`${focusKey}T12:00:00`) : new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const offset = (first.getDay() + 6) % 7;
    const cells = [];
    const today = dateKey();
    for (let i = 0; i < offset; i++) cells.push('<span class="nova-cal-empty"></span>');
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(year, month, day, 12);
      const key = dateKey(d);
      const score = dayScore(s, key, key === today);
      cells.push(`
        <button type="button" class="nova-cal-day ${key === today ? 'is-today' : ''}" data-nova-day="${key}">
          <span>${day}</span><i style="--day-score:${score}"></i><b>${score || ''}</b>
        </button>`);
    }
    panel.innerHTML = `
      <header><div><small>История Nova+</small><h2>${new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(now)}</h2></div><button type="button" data-nova-calendar-close>×</button></header>
      <div class="nova-cal-week"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>
      <div class="nova-cal-grid">${cells.join('')}</div>
      <div class="nova-cal-legend"><span><i></i>70–100 хороший баланс</span><span><i></i>40–69 средний</span><span><i></i>0–39 требует внимания</span></div>`;
    wrap.hidden = false;
    document.documentElement.classList.add('nova-calendar-open');
  }

  function closeCalendar() {
    if (!calendarWrap) return;
    calendarWrap.hidden = true;
    document.documentElement.classList.remove('nova-calendar-open');
  }

  function captureSnapshot() {
    return {
      metrics: read(KEYS.metrics, DEFAULT_METRICS),
      details: read(KEYS.details, DEFAULT_DETAILS),
      history: read(KEYS.history, [])
    };
  }

  function record(history, type, value, label, extra = {}) {
    history.unshift({
      id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      type, value, label, at: new Date().toISOString(), ...extra
    });
    return history.slice(0, 500);
  }

  function saveState(next) {
    write(KEYS.metrics, next.metrics);
    write(KEYS.details, next.details);
    write(KEYS.history, next.history);
    sessionStorage.setItem('nova.intelligence.dirty', '1');
    updateHomeMetrics(next);
    window.dispatchEvent(new CustomEvent('nova:data-changed'));
  }

  function closeFeatureModal() {
    const close = document.querySelector('.nf-modal-wrap:not([hidden]) [data-close-modal]');
    if (close) close.click();
  }

  function ensureUndo() {
    if (undoNode) return undoNode;
    undoNode = document.createElement('div');
    undoNode.className = 'nova-undo';
    undoNode.hidden = true;
    document.body.appendChild(undoNode);
    return undoNode;
  }

  function showUndo(message, snapshot) {
    const node = ensureUndo();
    clearTimeout(undoTimer);
    node.innerHTML = `<span>${message}</span><button type="button" data-nova-undo>Отменить</button>`;
    node.hidden = false;
    requestAnimationFrame(() => node.classList.add('show'));
    node.onclick = (event) => {
      if (!event.target.closest('[data-nova-undo]')) return;
      write(KEYS.metrics, snapshot.metrics);
      write(KEYS.details, snapshot.details);
      write(KEYS.history, snapshot.history);
      sessionStorage.setItem('nova.intelligence.dirty', '1');
      updateHomeMetrics(snapshot);
      updateOrb();
      node.classList.remove('show');
      setTimeout(() => { node.hidden = true; }, 180);
    };
    undoTimer = setTimeout(() => {
      node.classList.remove('show');
      setTimeout(() => { node.hidden = true; }, 180);
    }, 5200);
  }

  function addWater(ml) {
    const snapshot = captureSnapshot();
    const s = state();
    ml = clamp(ml, 1, 3000);
    s.details.water.ml = clamp(s.details.water.ml + ml, 0, 99999);
    s.metrics.water.current = clamp(Math.round(s.details.water.ml / 250), 0, s.metrics.water.max);
    s.history = record(s.history, 'water', ml, 'Вода');
    saveState(s);
    closeFeatureModal();
    showUndo(`+${Math.round(ml)} мл воды`, snapshot);
  }

  function addFood(data) {
    const snapshot = captureSnapshot();
    const s = state();
    const kcal = clamp(data.kcal, 0, 10000);
    const protein = Number(data.protein || 0);
    const fat = Number(data.fat || 0);
    const carbs = Number(data.carbs || 0);
    s.details.food.kcal = clamp(s.details.food.kcal + kcal, 0, 99999);
    s.details.food.protein = clamp(s.details.food.protein + protein, 0, 9999);
    s.details.food.fat = clamp(s.details.food.fat + fat, 0, 9999);
    s.details.food.carbs = clamp(s.details.food.carbs + carbs, 0, 9999);
    s.metrics.food.current = clamp(s.metrics.food.current + 1, 0, s.metrics.food.max);
    s.history = record(s.history, 'food', kcal, data.name || 'Приём пищи', { protein, fat, carbs });
    saveState(s);
    closeFeatureModal();
    showUndo(`${data.name || 'Еда'} · +${Math.round(kcal)} ккал`, snapshot);
  }

  function addSport(data) {
    const snapshot = captureSnapshot();
    const s = state();
    const minutes = clamp(data.minutes, 1, 600);
    const steps = Number(data.steps || 0);
    const calories = Number(data.calories || 0);
    s.details.sport.minutes = clamp(s.details.sport.minutes + minutes, 0, 9999);
    s.details.sport.steps = clamp(s.details.sport.steps + steps, 0, 999999);
    s.details.sport.calories = clamp(s.details.sport.calories + calories, 0, 99999);
    s.metrics.sport.current = clamp(s.metrics.sport.current + 1, 0, s.metrics.sport.max);
    s.history = record(s.history, 'sport', minutes, data.name || 'Тренировка', { steps, calories });
    saveState(s);
    closeFeatureModal();
    showUndo(`${data.name || 'Тренировка'} · ${Math.round(minutes)} мин`, snapshot);
  }

  function addSleep(data) {
    const snapshot = captureSnapshot();
    const s = state();
    const minutes = clamp(Number(data.hours || 0) * 60 + Number(data.minutes || 0), 1, 1080);
    const quality = clamp(data.quality || 85, 1, 100);
    s.details.sleep.minutes = minutes;
    s.details.sleep.quality = quality;
    s.details.sleep.mode = false;
    s.metrics.sleep.current = clamp(Math.round(minutes / 60), 0, s.metrics.sleep.max);
    s.history = record(s.history, 'sleep', minutes, 'Сон', { quality });
    saveState(s);
    closeFeatureModal();
    showUndo(`Сон · ${Math.floor(minutes / 60)} ч ${minutes % 60} мин`, snapshot);
  }

  function interceptQuickAdds() {
    window.addEventListener('click', (event) => {
      const water = event.target.closest('[data-water]');
      if (water && event.target.closest('.nf-modal-wrap')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        addWater(Number(water.dataset.water));
        return;
      }

      const metric = event.target.closest('.metric[data-kind]');
      if (metric && sessionStorage.getItem('nova.intelligence.dirty') === '1') {
        event.preventDefault();
        event.stopImmediatePropagation();
        sessionStorage.setItem('nova.intelligence.openKind', metric.dataset.kind);
        sessionStorage.removeItem('nova.intelligence.dirty');
        location.reload();
      }
    }, true);

    window.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.matches('[data-water-form]')) {
        event.preventDefault(); event.stopImmediatePropagation();
        addWater(new FormData(form).get('ml'));
      } else if (form.matches('[data-food-form]')) {
        event.preventDefault(); event.stopImmediatePropagation();
        addFood(Object.fromEntries(new FormData(form).entries()));
      } else if (form.matches('[data-calc-form]')) {
        event.preventDefault(); event.stopImmediatePropagation();
        const d = Object.fromEntries(new FormData(form).entries());
        const factor = clamp(d.grams, 1, 10000) / 100;
        addFood({
          name: d.name || 'Продукт',
          kcal: Number(d.kcal100 || 0) * factor,
          protein: Number(d.p100 || 0) * factor,
          fat: Number(d.f100 || 0) * factor,
          carbs: Number(d.c100 || 0) * factor
        });
      } else if (form.matches('[data-sport-form]')) {
        event.preventDefault(); event.stopImmediatePropagation();
        addSport(Object.fromEntries(new FormData(form).entries()));
      } else if (form.matches('[data-sleep-form]')) {
        event.preventDefault(); event.stopImmediatePropagation();
        addSleep(Object.fromEntries(new FormData(form).entries()));
      }
    }, true);
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-nova-calendar-open]')) openCalendar();
    if (event.target.closest('[data-nova-calendar-close]')) closeCalendar();
    const day = event.target.closest('[data-nova-day]');
    if (day && day.closest('.nova-week-card')) openCalendar(day.dataset.novaDay);
  });

  window.addEventListener('nova:data-changed', updateOrb);
  window.addEventListener('storage', updateOrb);

  interceptQuickAdds();
  ensureScore();
  ensureWeek();
  ensureInsight();
  updateOrb();

  const reopenKind = sessionStorage.getItem('nova.intelligence.openKind');
  if (reopenKind) {
    sessionStorage.removeItem('nova.intelligence.openKind');
    setTimeout(() => document.querySelector(`.metric[data-kind="${reopenKind}"]`)?.click(), 120);
  }

  window.NovaIntelligence = { update: updateOrb, openCalendar, currentScore };
})();