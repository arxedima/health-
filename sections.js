(() => {
  'use strict';

  const shell = document.getElementById('appShell');
  if (!shell) return;

  const METRIC_DEFAULTS = {
    sport: { current: 2, max: 3 },
    food: { current: 3, max: 8 },
    water: { current: 4, max: 8 },
    sleep: { current: 1, max: 8 }
  };

  const DETAIL_DEFAULTS = {
    sport: { steps: 7432, calories: 320, minutes: 42 },
    water: { ml: 1500 },
    food: { kcal: 1540, protein: 120, fat: 56, carbs: 180 },
    sleep: { minutes: 448, quality: 91, mode: false }
  };

  const META = {
    sport: { title: 'Спорт', subtitle: 'Движение делает жизнь ярче', primary: 'Начать тренировку' },
    water: { title: 'Вода', subtitle: 'Маленькие шаги к большему', primary: 'Добавить воду' },
    food: { title: 'Питание', subtitle: 'Хорошая еда даёт энергию', primary: 'Овощной боул' },
    sleep: { title: 'Сон', subtitle: 'Больше отдыха — больше возможностей', primary: 'Начать сон' }
  };

  const metricState = loadObject('nova.metrics', METRIC_DEFAULTS, sanitizeMetricState);
  const detailState = loadObject('nova.details', DETAIL_DEFAULTS, sanitizeDetailState);

  let screen = null;
  let activeKind = null;
  let previousFocus = null;
  let toastTimer = null;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function loadObject(key, fallback, sanitizer) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return sanitizer(parsed, fallback);
    } catch (_) {
      return clone(fallback);
    }
  }

  function sanitizeMetricState(source, fallback) {
    const out = clone(fallback);
    if (!source || typeof source !== 'object') return out;
    Object.keys(out).forEach((kind) => {
      const raw = Number(source?.[kind]?.current);
      if (Number.isFinite(raw)) out[kind].current = clamp(raw, 0, out[kind].max);
    });
    return out;
  }

  function sanitizeDetailState(source, fallback) {
    const out = clone(fallback);
    if (!source || typeof source !== 'object') return out;
    const copyNumber = (group, key, min, max) => {
      const raw = Number(source?.[group]?.[key]);
      if (Number.isFinite(raw)) out[group][key] = clamp(raw, min, max);
    };
    copyNumber('sport', 'steps', 0, 10000);
    copyNumber('sport', 'calories', 0, 9999);
    copyNumber('sport', 'minutes', 0, 999);
    copyNumber('water', 'ml', 0, 2000);
    copyNumber('food', 'kcal', 0, 2000);
    copyNumber('food', 'protein', 0, 999);
    copyNumber('food', 'fat', 0, 999);
    copyNumber('food', 'carbs', 0, 999);
    copyNumber('sleep', 'minutes', 0, 720);
    copyNumber('sleep', 'quality', 0, 100);
    out.sleep.mode = Boolean(source?.sleep?.mode ?? out.sleep.mode);
    return out;
  }

  function saveState() {
    try {
      localStorage.setItem('nova.metrics', JSON.stringify(metricState));
      localStorage.setItem('nova.details', JSON.stringify(detailState));
    } catch (_) {}
  }

  function formatNumber(value) { return new Intl.NumberFormat('ru-RU').format(Math.round(value)); }
  function formatLiters(ml) { return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 1 : 2).replace('.', ',').replace(/,00$/, ',0')} л`; }
  function formatSleep(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h} ч ${String(m).padStart(2, '0')} мин`;
  }

  function detailProgress(kind) {
    if (kind === 'sport') return clamp(detailState.sport.steps / 10000, 0, 1);
    if (kind === 'water') return clamp(detailState.water.ml / 2000, 0, 1);
    if (kind === 'food') return clamp(detailState.food.kcal / 2000, 0, 1);
    return clamp(detailState.sleep.minutes / 480, 0, 1);
  }

  function metricProgress(kind) {
    const item = metricState[kind];
    return item.max ? clamp(item.current / item.max, 0, 1) : 0;
  }

  function syncHome() {
    document.querySelectorAll('.metric[data-kind]').forEach((metric) => {
      const kind = metric.dataset.kind;
      const item = metricState[kind];
      if (!item) return;
      const strong = metric.querySelector('strong');
      const bar = metric.querySelector('.metric-track i');
      if (strong) strong.textContent = `${item.current} / ${item.max}`;
      if (bar) bar.style.width = `${Math.round(metricProgress(kind) * 100)}%`;
    });
    window.NovaBalance?.update?.();
  }

  function icon(kind, extraClass = '') {
    const common = `class="gf-svg ${extraClass}" viewBox="0 0 64 64" aria-hidden="true"`;
    if (kind === 'sport') return `<svg ${common}><circle cx="43" cy="10.5" r="5.7" fill="currentColor"/><path d="M34.5 20.3 25 29.7l-8.2-2.9-3 6.4 11.3 4.1 6.1-5.1 4.1 6.1-6.2 6.8-9.5 9.5 6 5 10.1-10 6.1-5.4 4.8 4.2 3.9 10.4 7.5-2.4-4.1-12.1-9.1-8.5-5.8-10.9 3.5-4.2 6.4 3.8 3.8-6.3-10.6-6.3a7.2 7.2 0 0 0-8.1 1Z" fill="currentColor"/><path d="m31.7 25.4-4.5 4.4 4.3 1.5M38 39.2l-5.2 5.7" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="2.2" stroke-linecap="round"/></svg>`;
    if (kind === 'water') return `<svg ${common}><path d="M32 5.6C27 14.7 16.7 26 16.7 36.9a15.3 15.3 0 1 0 30.6 0C47.3 26 37 14.7 32 5.6Z" fill="currentColor"/><path d="M24.1 35.7c.8-5.2 4.1-10.1 8.5-15.8-2.6 10.2-1.7 17.7 4.1 23.1-6.7.8-13.4-1.8-12.6-7.3Z" fill="rgba(255,255,255,.58)"/><path d="M27.4 20.7c-3.9 6-6.4 10.4-6.7 14.7" fill="none" stroke="rgba(255,255,255,.78)" stroke-width="2.4" stroke-linecap="round"/></svg>`;
    if (kind === 'food') return `<svg ${common}><path d="M51 10.2C36 11.9 24.1 18.8 17.4 29.4c-5.4 8.6-4.6 18.2 4.7 23.4 8.3 4.7 17.9 1.6 23.6-7C52.5 35.4 56 23.9 51 10.2Z" fill="currentColor"/><path d="M18.8 45.7c11.2-5.8 19.2-14.5 26.2-27.8" fill="none" stroke="rgba(255,255,255,.76)" stroke-width="3.1" stroke-linecap="round"/><path d="M29 39.6c4.3-1.1 8-3.2 11.4-6.1" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    return `<svg ${common}><path d="M49.8 47.6A22.5 22.5 0 0 1 21.3 13.7a21.9 21.9 0 1 0 28.5 33.9Z" fill="currentColor"/><path d="M25.7 16.2c-5.9 10.2-5.7 20.7 1.5 28.4" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="2.8" stroke-linecap="round"/></svg>`;
  }

  function uiIcon(name) {
    if (name === 'back') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 5.5 9 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (name === 'sun') return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2.5v2.3M12 19.2v2.3M21.5 12h-2.3M4.8 12H2.5M18.7 5.3 17 7M7 17l-1.7 1.7M18.7 18.7 17 17M7 7 5.3 5.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
    if (name === 'moon') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.5 16.8A8 8 0 0 1 8.2 5.1a7.7 7.7 0 1 0 10.3 11.7Z" fill="currentColor"/></svg>';
    if (name === 'play') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z" fill="currentColor"/></svg>';
    if (name === 'plus') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    if (name === 'arrow') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '';
  }

  function toolbar() {
    const dark = shell.classList.contains('dark');
    return `<div class="gf-toolbar"><button class="gf-tool" type="button" data-gf-close aria-label="Вернуться на главную">${uiIcon('back')}</button><div class="gf-mini-brand" aria-label="Nova+"><span class="gf-mini-orb"></span><strong>Nova+</strong></div><button class="gf-tool" type="button" data-gf-theme aria-label="Переключить тему"><span data-gf-theme-icon>${uiIcon(dark ? 'moon' : 'sun')}</span></button></div>`;
  }

  function heading(kind) {
    return `<header class="gf-heading"><div class="gf-heading-line"><span class="gf-heading-icon">${icon(kind)}</span><h1>${META[kind].title}</h1></div><p>${META[kind].subtitle}</p></header>`;
  }

  function orb(kind) {
    const progress = Math.round(detailProgress(kind) * 100);
    return `<section class="gf-stage" aria-label="${META[kind].title}: ${progress}% цели"><svg class="gf-ring" viewBox="0 0 260 150" aria-hidden="true"><path class="gf-ring-track" pathLength="100" d="M31 130 A99 99 0 0 1 229 130"/><path class="gf-ring-value" pathLength="100" style="stroke-dasharray:${progress} 100" d="M31 130 A99 99 0 0 1 229 130"/></svg><div class="gf-orb" aria-hidden="true"><span class="gf-orb-depth"></span><span class="gf-orb-ambient"></span><span class="gf-orb-caustic gf-orb-caustic-a"></span><span class="gf-orb-caustic gf-orb-caustic-b"></span><span class="gf-orb-glint"></span><span class="gf-orb-rim"></span><span class="gf-symbol">${icon(kind)}</span></div></section>`;
  }

  function mainValue(kind) {
    if (kind === 'sport') return `<div class="gf-value"><strong>${formatNumber(detailState.sport.steps)}</strong><span>шага из 10 000</span></div>`;
    if (kind === 'water') return `<div class="gf-value"><strong>${formatLiters(detailState.water.ml)}</strong><span>из 2,0 л</span></div>`;
    if (kind === 'food') return `<div class="gf-value"><strong>${formatNumber(detailState.food.kcal)}</strong><span>ккал из 2 000</span></div>`;
    return `<div class="gf-value"><strong>${formatSleep(detailState.sleep.minutes)}</strong><span>из 8 часов · качество ${detailState.sleep.quality}%</span></div>`;
  }

  function sportFooter() {
    return `<div class="gf-footer"><button class="gf-cta gf-solid" type="button" data-gf-action="sport"><span class="gf-cta-icon">${uiIcon('play')}</span><span>Начать тренировку</span></button></div>`;
  }
  function waterFooter() {
    return `<div class="gf-footer"><button class="gf-cta gf-ghost" type="button" data-gf-action="water" ${detailState.water.ml >= 2000 ? 'disabled' : ''}><span class="gf-cta-icon">${uiIcon('plus')}</span><span>${detailState.water.ml >= 2000 ? 'Цель по воде выполнена' : 'Добавить воду'}</span></button></div>`;
  }
  function foodFooter() {
    return `<div class="gf-footer"><button class="gf-food-card" type="button" data-gf-action="food"><span class="gf-food-thumb" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="gf-food-copy"><strong>Овощной боул</strong><small>Лёгкий и полезный</small></span><span class="gf-food-arrow">${uiIcon('arrow')}</span></button></div>`;
  }
  function sleepFooter() {
    return `<div class="gf-footer"><button class="gf-cta gf-sleep-cta ${detailState.sleep.mode ? 'is-active' : ''}" type="button" data-gf-action="sleep"><span class="gf-cta-icon">${icon('sleep')}</span><span>${detailState.sleep.mode ? 'Режим сна включён' : 'Начать сон'}</span></button></div>`;
  }
  function footer(kind) {
    if (kind === 'sport') return sportFooter();
    if (kind === 'water') return waterFooter();
    if (kind === 'food') return foodFooter();
    return sleepFooter();
  }

  function template(kind) {
    return `<div class="gf-content gf-${kind}"><span class="gf-bubble gf-bubble-1"></span><span class="gf-bubble gf-bubble-2"></span><span class="gf-bubble gf-bubble-3"></span><span class="gf-bubble gf-bubble-4"></span>${toolbar()}${heading(kind)}${orb(kind)}${mainValue(kind)}${footer(kind)}</div>`;
  }

  function ensureScreen() {
    if (screen) return screen;
    screen = document.createElement('section');
    screen.className = 'gf-screen';
    screen.hidden = true;
    screen.setAttribute('role', 'dialog');
    screen.setAttribute('aria-modal', 'true');
    screen.setAttribute('aria-label', 'Раздел Nova+');
    shell.appendChild(screen);
    return screen;
  }

  function render({ preserveFocus = false } = {}) {
    if (!activeKind) return;
    const el = ensureScreen();
    el.innerHTML = template(activeKind);
    el.setAttribute('aria-label', `${META[activeKind].title} — Nova+`);
    el.dataset.kind = activeKind;
    if (preserveFocus) el.querySelector('[data-gf-action]')?.focus({ preventScroll: true });
  }

  function open(kind, source) {
    if (!META[kind]) return;
    previousFocus = source || document.activeElement;
    activeKind = kind;
    const el = ensureScreen();
    render();
    el.hidden = false;
    shell.classList.add('feature-open');
    document.documentElement.classList.add('nova-modal-open');
    document.body.classList.add('nova-modal-open');
    requestAnimationFrame(() => el.classList.add('is-visible'));
    el.querySelector('[data-gf-close]')?.focus({ preventScroll: true });
  }

  function close() {
    if (!screen || screen.hidden) return;
    screen.classList.remove('is-visible');
    shell.classList.remove('feature-open');
    document.documentElement.classList.remove('nova-modal-open');
    document.body.classList.remove('nova-modal-open');
    window.setTimeout(() => {
      if (screen) screen.hidden = true;
      const target = previousFocus;
      activeKind = null;
      if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
    }, 220);
  }

  function showToast(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1600);
  }

  function act(kind) {
    if (kind === 'sport') {
      detailState.sport.steps = clamp(detailState.sport.steps + 420, 0, 10000);
      detailState.sport.calories = clamp(detailState.sport.calories + 28, 0, 9999);
      detailState.sport.minutes = clamp(detailState.sport.minutes + 6, 0, 999);
      metricState.sport.current = clamp(metricState.sport.current + 1, 0, metricState.sport.max);
      showToast('Тренировка добавлена');
    }
    if (kind === 'water') {
      if (detailState.water.ml >= 2000) { showToast('Цель по воде уже выполнена'); return; }
      detailState.water.ml = clamp(detailState.water.ml + 250, 0, 2000);
      metricState.water.current = clamp(Math.round(detailState.water.ml / 250), 0, metricState.water.max);
      showToast('+250 мл воды');
    }
    if (kind === 'food') {
      if (detailState.food.kcal >= 2000) { showToast('Дневная цель уже достигнута'); return; }
      detailState.food.kcal = clamp(detailState.food.kcal + 210, 0, 2000);
      metricState.food.current = clamp(metricState.food.current + 1, 0, metricState.food.max);
      showToast('Приём пищи добавлен');
    }
    if (kind === 'sleep') {
      detailState.sleep.mode = !detailState.sleep.mode;
      if (detailState.sleep.mode) metricState.sleep.current = clamp(metricState.sleep.current + 1, 0, metricState.sleep.max);
      showToast(detailState.sleep.mode ? 'Режим сна включён' : 'Режим сна выключен');
    }
    saveState();
    syncHome();
    render({ preserveFocus: true });
  }

  function toggleTheme() {
    if (window.NovaTheme?.toggle) window.NovaTheme.toggle();
    else shell.classList.toggle('dark');
    render();
  }

  document.addEventListener('click', (event) => {
    const metric = event.target.closest('.metric[data-kind]');
    if (metric && META[metric.dataset.kind]) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open(metric.dataset.kind, metric);
      return;
    }
    if (!screen || screen.hidden) return;
    const closeButton = event.target.closest('[data-gf-close]');
    if (closeButton) { event.preventDefault(); close(); return; }
    const themeButton = event.target.closest('[data-gf-theme]');
    if (themeButton) { event.preventDefault(); toggleTheme(); return; }
    const action = event.target.closest('[data-gf-action]');
    if (action) { event.preventDefault(); act(action.dataset.gfAction); }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && screen && !screen.hidden) close();
  });

  syncHome();
})();