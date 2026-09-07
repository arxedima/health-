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
    sport: { title: 'Спорт', subtitle: 'Тело в движении — ум в порядке.', action: 'Начать тренировку' },
    food: { title: 'Питание', subtitle: 'Хорошая еда — больше энергии.', action: 'Добавить приём пищи' },
    water: { title: 'Вода', subtitle: 'Больше воды — больше тебя.', action: 'Добавить стакан' },
    sleep: { title: 'Сон', subtitle: 'Глубокий сон — ясный день.', action: 'Подготовка ко сну' }
  };

  let state = loadState();
  let activeKind = null;
  let screen = null;
  let toastTimer;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem('nova.metrics') || '{}');
      const next = {};
      Object.keys(defaults).forEach((kind) => {
        const raw = Number(saved?.[kind]?.current);
        const current = Number.isFinite(raw) ? raw : defaults[kind].current;
        next[kind] = {
          current: Math.max(0, Math.min(defaults[kind].max, current)),
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

  function showToast(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function syncHome() {
    document.querySelectorAll('.metric').forEach((metric) => {
      const kind = metric.dataset.kind;
      if (!state[kind]) return;
      const strong = metric.querySelector('strong');
      const bar = metric.querySelector('.metric-track i');
      if (strong) strong.textContent = `${state[kind].current} / ${state[kind].max}`;
      if (bar) bar.style.width = `${pct(kind)}%`;
    });
    window.NovaBalance?.update?.();
  }

  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3.5l8.5 7V20h-5.6v-5.7H9.1V20H3.5v-9.5Z" fill="currentColor"/></svg>',
    plan: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7.5 3.5v4M16.5 3.5v4M4 10h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    analytics: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19v-6M10 19V8M15 19v-9M20 19V5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    sport: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="21.3" cy="5.6" r="2.6" fill="currentColor"/><path d="M17.6 10 13 14.4l-4-1.4-1.4 3.1 6 2.2 3-2.6 2.1 3.1-2.9 3.1-4.7 4.8 3 2.5 5-5 3-2.6 2.3 2 1.9 5.1 3.7-1.2-2-5.8-4.5-4.2-2.8-5.4 1.7-2.1 3.2 1.9 1.8-3.1-5.2-3.1a3.6 3.6 0 0 0-4 .5Z" fill="currentColor"/></svg>',
    food: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.8 9c-1.2-3.1.7-5.4 3.8-6.4-.1 3.1-1.4 5.1-3.8 6.4Z" fill="currentColor" opacity=".82"/><path d="M15.2 9.6c-2.9-3.1-6.9-1.6-8.2 1.9-1.9 5.3 2.8 14.9 6.9 15.1 1 .1 1.8-.5 2.6-.5s1.6.7 2.7.5c4.3-.5 8.4-10 6.7-15.2-1.4-4-5.9-4.8-8.2-1.9-.8.9-1.7.9-2.5.1Z" fill="currentColor"/></svg>',
    water: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C13.4 7.5 8.2 13.5 8.2 19a7.8 7.8 0 0 0 15.6 0C23.8 13.5 18.6 7.5 16 3Z" fill="currentColor"/></svg>',
    sleep: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M24 23.8A11 11 0 0 1 10.3 7.1 10.7 10.7 0 1 0 24 23.8Z" fill="currentColor"/><path d="m23.5 6.5.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4Z" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z" fill="currentColor"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7 10 5h4l1.5 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.5Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="13" r="3.1" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h3l4 3V7l-4 3H5Zm10-1.5a5 5 0 0 1 0 7m2.8-9.8a9 9 0 0 1 0 12.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    history: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6v5h5M5.5 10a7.5 7.5 0 1 1 1.4 7.4M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function dateLabel() {
    const s = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function header(kind) {
    return `
      <header class="feature-header">
        <button class="feature-brand" data-close-feature type="button" aria-label="На главную">
          <span class="feature-brand-orb"></span>
          <span><strong>Nova+</strong><small>${dateLabel()}</small></span>
        </button>
        <span class="feature-header-icon feature-${kind}-icon">${icons[kind]}</span>
      </header>
      <div class="feature-heading">
        <h1>${meta[kind].title}</h1>
        <p>${meta[kind].subtitle}</p>
      </div>`;
  }

  function orb(kind) {
    const progress = pct(kind);
    return `
      <section class="feature-nova-stage" aria-label="Прогресс ${meta[kind].title}: ${progress}%">
        <div class="feature-ring feature-ring-bg"></div>
        <div class="feature-ring feature-ring-progress" style="--progress:${progress}%"></div>
        <div class="feature-nova-orb" style="--fill:${progress}%">
          <span class="feature-liquid"></span>
          <span class="feature-wave feature-wave-a"></span>
          <span class="feature-wave feature-wave-b"></span>
          <span class="feature-highlight"></span>
          <span class="feature-rim"></span>
        </div>
        <div class="feature-orb-score"><strong>${state[kind].current}/${state[kind].max}</strong><span>сегодня</span></div>
      </section>`;
  }

  function row(icon, title, text, action = '') {
    return `<button class="feature-row" type="button" ${action ? `data-action="${action}"` : ''}>
      <span class="feature-row-icon">${icons[icon]}</span>
      <span class="feature-row-copy"><strong>${title}</strong><small>${text}</small></span>
      <span class="feature-chevron">›</span>
    </button>`;
  }

  function bottomNav(kind) {
    return `<nav class="feature-bottom-nav" aria-label="Навигация раздела">
      <button type="button" class="feature-nav-item" data-close-feature>${icons.home}<span>Главная</span></button>
      <button type="button" class="feature-nav-item" data-feature-nav="plan">${icons.plan}<span>План</span></button>
      <button type="button" class="feature-nav-plus" data-feature-add aria-label="Добавить">${icons.plus}</button>
      <button type="button" class="feature-nav-item" data-feature-nav="analytics">${icons.analytics}<span>Аналитика</span></button>
      <button type="button" class="feature-nav-item active">${icons[kind]}<span>${meta[kind].title}</span></button>
    </nav>`;
  }

  function sportTemplate() {
    return `${header('sport')}${orb('sport')}
      <div class="feature-stat-strip">
        <div><strong>4 320</strong><span>шагов</span></div>
        <div><strong>28</strong><span>минут</span></div>
        <div><strong>320</strong><span>ккал</span></div>
      </div>
      <button class="feature-primary" type="button" data-action="complete-sport">${icons.play}<span>Начать тренировку</span></button>
      <section class="feature-list-block">
        ${row('heart','ЛФК','15 минут · мягкое восстановление')}
        ${row('sport','FULL BODY','24 минуты · 6 упражнений')}
        ${row('history','Растяжка','10 минут · всё тело')}
      </section>${bottomNav('sport')}`;
  }

  function foodTemplate() {
    return `${header('food')}${orb('food')}
      <div class="feature-macro-grid">
        <div><strong>1540</strong><span>ккал</span></div>
        <div><strong>122 г</strong><span>белки</span></div>
        <div><strong>56 г</strong><span>жиры</span></div>
        <div><strong>180 г</strong><span>углеводы</span></div>
      </div>
      <button class="feature-primary" type="button" data-action="add-food">${icons.plus}<span>Добавить приём пищи</span></button>
      <section class="feature-list-block">
        ${row('camera','Сфотографировать еду','AI-анализ калорий и БЖУ','add-food')}
        ${row('food','Рецепты','Простые и полезные блюда')}
        ${row('heart','Мои продукты','Быстрый доступ')}
        ${row('history','План питания','Баланс на день и неделю')}
      </section>${bottomNav('food')}`;
  }

  function waterTemplate() {
    const glasses = Array.from({ length: 8 }, (_, i) => `<span class="feature-glass ${i < state.water.current ? 'filled' : ''}"></span>`).join('');
    return `${header('water')}${orb('water')}
      <div class="feature-water-status">
        <div class="feature-glasses">${glasses}</div>
        <span>${state.water.current * 250} мл из 2000 мл</span>
      </div>
      <button class="feature-primary" type="button" data-action="add-water">${icons.plus}<span>Добавить стакан · 250 мл</span></button>
      <button class="feature-tip" type="button">
        <span class="feature-tip-icon">${icons.water}</span>
        <span><small>Совет</small><strong>Пей небольшими порциями</strong><em>Так вода усваивается комфортнее.</em></span>
        <b>›</b>
      </button>${bottomNav('water')}`;
  }

  function sleepTemplate() {
    return `${header('sleep')}${orb('sleep')}
      <button class="feature-primary" type="button" data-action="add-sleep">${icons.sleep}<span>Подготовка ко сну</span></button>
      <section class="feature-list-block feature-sleep-list">
        ${row('heart','Дыхательная практика','10 минут · спокойный ритм','add-sleep')}
        ${row('sound','Белый шум','Дождь · океан · лес')}
        ${row('history','История сна','Неделя · месяц · тенденции')}
      </section>${bottomNav('sleep')}`;
  }

  const templates = { sport: sportTemplate, food: foodTemplate, water: waterTemplate, sleep: sleepTemplate };

  function ensureScreen() {
    if (screen) return screen;
    screen = document.createElement('section');
    screen.className = 'feature-screen';
    screen.hidden = true;
    shell.appendChild(screen);
    return screen;
  }

  function render() {
    if (!activeKind) return;
    const el = ensureScreen();
    el.innerHTML = templates[activeKind]();
  }

  function open(kind) {
    if (!templates[kind]) return;
    activeKind = kind;
    render();
    const el = ensureScreen();
    el.hidden = false;
    el.scrollTop = 0;
    shell.classList.add('feature-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!screen) return;
    screen.hidden = true;
    shell.classList.remove('feature-open');
    document.body.style.overflow = '';
    activeKind = null;
  }

  function increment(kind) {
    state[kind].current = Math.min(state[kind].max, state[kind].current + 1);
    saveState();
    syncHome();
    render();
  }

  document.addEventListener('click', (event) => {
    const metric = event.target.closest('.metric');
    if (metric && templates[metric.dataset.kind]) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open(metric.dataset.kind);
      return;
    }

    if (event.target.closest('[data-close-feature]')) {
      event.preventDefault();
      close();
      return;
    }

    if (event.target.closest('[data-feature-add]')) {
      event.preventDefault();
      document.getElementById('addButton')?.click();
      return;
    }

    const nav = event.target.closest('[data-feature-nav]');
    if (nav) {
      showToast(nav.dataset.featureNav === 'plan' ? 'План — следующий экран' : 'Аналитика — следующий экран');
      return;
    }

    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'complete-sport') {
      increment('sport');
      showToast('Тренировка добавлена');
    }
    if (action === 'add-food') {
      increment('food');
      showToast('Приём пищи добавлен');
    }
    if (action === 'add-water') {
      increment('water');
      showToast('Добавлено 250 мл');
    }
    if (action === 'add-sleep') {
      increment('sleep');
      showToast('Вечерний ритуал добавлен');
    }
  }, true);

  syncHome();
})();