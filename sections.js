(() => {
  const shell = document.getElementById('appShell');
  if (!shell) return;

  const defaults = {
    sport: { current: 2, max: 3 },
    food: { current: 3, max: 8 },
    water: { current: 4, max: 8 },
    sleep: { current: 1, max: 8 }
  };

  const meta = {
    sport: { title: 'Спорт', subtitle: 'Движение делает жизнь ярче', action: 'Начать тренировку' },
    water: { title: 'Вода', subtitle: 'Маленькие шаги к большему', action: 'Добавить воду' },
    food: { title: 'Питание', subtitle: 'Хорошая еда даёт энергию', action: 'Добавить приём пищи' },
    sleep: { title: 'Сон', subtitle: 'Больше отдыха — больше возможностей', action: 'Начать сон' }
  };

  const icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z" fill="currentColor"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    moonSmall: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.4 17.2A8.2 8.2 0 0 1 8.2 4.7 8 8 0 1 0 18.4 17.2Z" fill="currentColor"/></svg>`,
    play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" fill="currentColor"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    flame: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.7 2c1 3 4.5 4.1 4.5 7.3A4.8 4.8 0 0 1 12.4 14a4.8 4.8 0 0 1-4.7-4.9c0-2.7 2-4.6 5-7.1Z" fill="currentColor"/><path d="M11.2 13c-2 1.8-3.5 3.6-3.5 5.7A4.3 4.3 0 0 0 12 23a4.3 4.3 0 0 0 4.3-4.4c0-2.1-1.4-3.9-3.4-5.7.2 1.9-.4 3-1.7 3.8.3-1.5.1-2.6 0-3.7Z" fill="currentColor" opacity=".68"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    sport: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="43" cy="11" r="5.5" fill="currentColor"/><path d="M34 21 25 30l-8-3-3 6 11 4 6-5 4 6-6 7-9 9 6 5 10-10 6-5 5 4 4 10 7-2-4-12-8-7-5-10 3-4 7 4 3-6-11-6a7 7 0 0 0-8 1Z" fill="currentColor"/></svg>`,
    water: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6c-5 8.7-15 20.1-15 30.7a15 15 0 1 0 30 0C47 26 37 14.7 32 6Z" fill="currentColor"/><path d="M24.6 34.7c.7-4.8 4.1-9.4 7.8-14.3-2.3 9.6-1.6 16.4 3.7 21.4-6 .8-12.3-1.8-11.5-7.1Z" fill="rgba(230,249,255,.72)"/></svg>`,
    food: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M50 11C35 12.8 23.5 20 17 30.5c-5 8-4.1 17.3 4.8 22.3 8 4.5 17.1 1.6 22.5-6.6C51 36 54.6 24.6 50 11Z" fill="currentColor"/><path d="M19 44c10.4-5.4 18-14 24.4-26.2" fill="none" stroke="rgba(226,255,241,.78)" stroke-width="3.3" stroke-linecap="round"/></svg>`,
    sleep: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M48.5 47.7A22 22 0 0 1 21 14.3a21.4 21.4 0 1 0 27.5 33.4Z" fill="currentColor"/></svg>`
  };

  let state = loadState();
  let screen = null;
  let activeKind = null;
  let toastTimer;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem('nova.metrics') || '{}');
      const next = {};
      Object.keys(defaults).forEach(kind => {
        const raw = Number(saved?.[kind]?.current);
        next[kind] = {
          current: Number.isFinite(raw) ? Math.max(0, Math.min(defaults[kind].max, raw)) : defaults[kind].current,
          max: defaults[kind].max
        };
      });
      return next;
    } catch (_) {
      return JSON.parse(JSON.stringify(defaults));
    }
  }

  function saveState() {
    localStorage.setItem('nova.metrics', JSON.stringify(state));
  }

  function pct(kind) {
    return Math.round((state[kind].current / state[kind].max) * 100);
  }

  function syncHome() {
    document.querySelectorAll('.metric').forEach(metric => {
      const kind = metric.dataset.kind;
      if (!state[kind]) return;
      const value = metric.querySelector('strong');
      const bar = metric.querySelector('.metric-track i');
      if (value) value.textContent = `${state[kind].current} / ${state[kind].max}`;
      if (bar) bar.style.width = `${pct(kind)}%`;
    });
    window.NovaBalance?.update?.();
  }

  function showToast(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function ensureScreen() {
    if (screen) return screen;
    screen = document.createElement('section');
    screen.className = 'gf-screen';
    screen.hidden = true;
    shell.appendChild(screen);
    return screen;
  }

  function ring(progress) {
    return `<svg class="gf-ring" viewBox="0 0 260 150" aria-hidden="true">
      <path class="gf-ring-track" pathLength="100" d="M20 130 A110 110 0 0 1 240 130"/>
      <path class="gf-ring-value" pathLength="100" stroke-dasharray="${Math.max(4, progress)} 100" d="M20 130 A110 110 0 0 1 240 130"/>
    </svg>`;
  }

  function orb(kind) {
    return `<div class="gf-orb-wrap">
      ${ring(pct(kind))}
      <div class="gf-orb">
        <span class="gf-orb-caustic"></span>
        <span class="gf-orb-shine"></span>
        <span class="gf-orb-inner"></span>
        <span class="gf-symbol">${icons[kind]}</span>
      </div>
    </div>`;
  }

  function top(kind) {
    return `<div class="gf-toolbar">
      <button type="button" class="gf-tool" data-close-feature aria-label="На главную">${icons.home}</button>
      <button type="button" class="gf-tool" data-toggle-feature-theme aria-label="Сменить тему"><span class="gf-theme-icon"></span></button>
    </div>
    <header class="gf-heading">
      <div class="gf-heading-line"><span class="gf-heading-icon">${icons[kind]}</span><h1>${meta[kind].title}</h1></div>
      <p>${meta[kind].subtitle}</p>
    </header>`;
  }

  function mainValue(kind) {
    if (kind === 'sport') return `<div class="gf-value"><strong>7 432</strong><span>шага из 10 000</span></div>`;
    if (kind === 'water') {
      const liters = (state.water.current * .25).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
      return `<div class="gf-value"><strong>${liters} л</strong><span>из 2,0 л</span></div>`;
    }
    if (kind === 'food') return `<div class="gf-value"><strong>1 540</strong><span>ккал из 2 000</span></div>`;
    return `<div class="gf-value"><strong>7 ч 28 мин</strong><span>из 8 часов</span></div>`;
  }

  function sportBody() {
    return `<div class="gf-mini-grid gf-two">
      <div class="gf-mini"><span>${icons.flame}</span><strong>320</strong><small>ккал</small></div>
      <div class="gf-mini"><span>${icons.clock}</span><strong>42</strong><small>минуты</small></div>
    </div>
    <button class="gf-cta gf-solid" type="button" data-action="sport"> <span class="gf-cta-icon">${icons.play}</span>Начать тренировку</button>`;
  }

  function waterBody() {
    const count = 5;
    const filled = Math.round((pct('water') / 100) * count);
    const glasses = Array.from({ length: count }, (_, i) => `<span class="gf-glass ${i < filled ? 'filled' : ''}"></span>`).join('');
    return `<div class="gf-glasses">${glasses}</div>
      <button class="gf-cta gf-ghost" type="button" data-action="water"><span class="gf-cta-icon">${icons.plus}</span>Добавить воду</button>`;
  }

  function foodBody() {
    return `<button class="gf-food-card" type="button" data-action="food">
      <span class="gf-food-thumb"><i></i><b></b><em></em></span>
      <span class="gf-food-copy"><strong>Овощной боул</strong><small>Лёгкий и полезный</small></span>
      <span class="gf-chevron">›</span>
    </button>`;
  }

  function sleepBody() {
    return `<div class="gf-quality"><span class="gf-quality-moon">${icons.sleep}</span><strong>91%</strong><small>Качество сна</small></div>
      <button class="gf-cta gf-sleep-cta" type="button" data-action="sleep"><span class="gf-cta-icon">${icons.sleep}</span>Начать сон</button>`;
  }

  function tabs(kind) {
    return `<nav class="gf-tabs" aria-label="Разделы здоровья">
      ${['sport','water','food','sleep'].map(k => `<button type="button" class="gf-tab ${k === kind ? 'active' : ''}" data-open-feature="${k}">${icons[k]}<span>${meta[k].title}</span></button>`).join('')}
    </nav>`;
  }

  function template(kind) {
    const body = kind === 'sport' ? sportBody() : kind === 'water' ? waterBody() : kind === 'food' ? foodBody() : sleepBody();
    return `<div class="gf-bubble gf-b1"></div><div class="gf-bubble gf-b2"></div><div class="gf-bubble gf-b3"></div>
      <div class="gf-content gf-${kind}">
        ${top(kind)}
        ${orb(kind)}
        ${mainValue(kind)}
        <div class="gf-actions">${body}</div>
      </div>
      ${tabs(kind)}`;
  }

  function open(kind) {
    if (!meta[kind]) return;
    activeKind = kind;
    const el = ensureScreen();
    el.dataset.kind = kind;
    el.innerHTML = template(kind);
    el.hidden = false;
    shell.classList.add('feature-open');
    document.documentElement.classList.add('nova-modal-open');
    syncFeatureThemeIcon();
  }

  function close() {
    if (!screen) return;
    screen.hidden = true;
    shell.classList.remove('feature-open');
    document.documentElement.classList.remove('nova-modal-open');
    activeKind = null;
  }

  function syncFeatureThemeIcon() {
    if (!screen || screen.hidden) return;
    const host = screen.querySelector('.gf-theme-icon');
    if (!host) return;
    host.innerHTML = shell.classList.contains('dark') ? icons.sun : icons.moonSmall;
  }

  function rerender() {
    if (!activeKind || !screen || screen.hidden) return;
    screen.dataset.kind = activeKind;
    screen.innerHTML = template(activeKind);
    syncFeatureThemeIcon();
  }

  function increment(kind) {
    if (state[kind].current < state[kind].max) state[kind].current += 1;
    saveState();
    syncHome();
    rerender();
  }

  document.addEventListener('click', e => {
    const metric = e.target.closest('.metric');
    if (metric && meta[metric.dataset.kind]) {
      e.preventDefault();
      e.stopImmediatePropagation();
      open(metric.dataset.kind);
      return;
    }

    const openBtn = e.target.closest('[data-open-feature]');
    if (openBtn) {
      e.preventDefault();
      open(openBtn.dataset.openFeature);
      return;
    }

    if (e.target.closest('[data-close-feature]')) {
      e.preventDefault();
      close();
      return;
    }

    if (e.target.closest('[data-toggle-feature-theme]')) {
      e.preventDefault();
      shell.classList.toggle('dark');
      syncFeatureThemeIcon();
      return;
    }

    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'water') {
      increment('water');
      showToast('Добавлено 250 мл воды');
    } else if (action === 'sport') {
      increment('sport');
      showToast('Тренировка добавлена в прогресс');
    } else if (action === 'food') {
      increment('food');
      showToast('Приём пищи добавлен');
    } else if (action === 'sleep') {
      increment('sleep');
      showToast('Вечерний режим запущен');
    }
  }, true);

  window.addEventListener('popstate', close);
  syncHome();
})();