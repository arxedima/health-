(() => {
  const shell = document.getElementById('appShell');
  if (!shell) return;

  const defaults = {
    sport: { current: 2, max: 3 },
    food: { current: 3, max: 8 },
    water: { current: 4, max: 8 },
    sleep: { current: 1, max: 8 }
  };

  const labels = { sport: 'Спорт', food: 'Питание', water: 'Вода', sleep: 'Сон' };
  const subtitles = {
    sport: 'Тело в движении — ум в порядке.',
    food: 'Хорошая еда — больше энергии.',
    water: 'Больше воды — больше тебя.',
    sleep: 'Глубокий сон — ясный день.'
  };

  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z" fill="currentColor"/></svg>',
    sport: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="21.4" cy="5.6" r="2.7" fill="currentColor"/><path d="M17.6 10.1 13 14.5l-4.1-1.4-1.4 3.2 6.1 2.2 3.1-2.7 2.1 3.2-3 3.2-4.7 4.8 3 2.5 5-5 3.1-2.7 2.3 2.1 1.9 5.2 3.8-1.2-2.1-6-4.6-4.3-2.9-5.5 1.8-2.1 3.2 1.9 1.9-3.2-5.3-3.2a3.6 3.6 0 0 0-4.1.5Z" fill="currentColor"/></svg>',
    food: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.6 9.2c-1.2-3.2.7-5.5 3.9-6.5-.1 3.2-1.4 5.2-3.9 6.5Z" fill="currentColor" opacity=".82"/><path d="M15.1 9.7c-3-3.2-7-1.7-8.3 1.9-1.9 5.4 2.8 15.2 7 15.4 1 .1 1.8-.5 2.7-.5s1.6.7 2.7.5c4.4-.5 8.6-10.2 6.8-15.5-1.4-4.1-6-4.9-8.3-1.9-.8.9-1.8.9-2.6.1Z" fill="currentColor"/></svg>',
    water: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.1C13.5 7.5 8.2 13.5 8.2 19a7.8 7.8 0 0 0 15.6 0c0-5.5-5.2-11.5-7.8-15.9Z" fill="currentColor"/></svg>',
    sleep: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M23.9 23.7A11 11 0 0 1 10.3 7.1 10.6 10.6 0 1 0 23.9 23.7Z" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="m9 6 9 6-9 6V6Z" fill="currentColor"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M8.5 7 10 5h4l1.5 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.5Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5.5c3-.8 5.5-.4 8 1.4v12c-2.5-1.8-5-2.2-8-1.4v-12Zm16 0c-3-.8-5.5-.4-8 1.4v12c2.5-1.8 5-2.2 8-1.4v-12Z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M5 7h14v12H5zM8 4h8v3M9 11h6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="4" y="5.8" width="16" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 3v5M17 3v5M4 10h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 17h12l-1.3-2V10a4.7 4.7 0 0 0-9.4 0v5L6 17Zm4 2a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    breathe: '<svg viewBox="0 0 24 24"><path d="M4 10c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 4-2.2M4 15c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 4-2.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M5 10v4h3l4 3V7L8 10H5Zm10-1.5a5 5 0 0 1 0 7m2.8-9.8a9 9 0 0 1 0 12.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    history: '<svg viewBox="0 0 24 24"><path d="M4 6v5h5M5.5 10a7.5 7.5 0 1 1 1.4 7.4M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  let state = loadState();
  let screen = null;
  let activeKind = null;
  const profileButton = document.querySelector('.nav-item[data-nav="profile"]');
  const homeButton = document.querySelector('.nav-item[data-nav="home"]');
  const profileOriginal = profileButton ? profileButton.innerHTML : '';

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem('nova.metrics') || '{}');
      const result = {};
      Object.keys(defaults).forEach(kind => {
        const src = saved[kind] || defaults[kind];
        const current = Number(src.current);
        result[kind] = {
          current: Math.max(0, Math.min(defaults[kind].max, Number.isFinite(current) ? current : defaults[kind].current)),
          max: defaults[kind].max
        };
      });
      return result;
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
      const strong = metric.querySelector('strong');
      const bar = metric.querySelector('.metric-track i');
      if (strong) strong.textContent = `${state[kind].current} / ${state[kind].max}`;
      if (bar) bar.style.width = `${pct(kind)}%`;
    });
    window.NovaBalance?.update?.();
  }

  function header(kind) {
    return `
      <header class="ref-head">
        <div class="ref-brand">
          <span class="ref-brand-orb"></span>
          <span><strong>Nova+</strong><small>Суббота, 5 сентября</small></span>
        </div>
        <span class="ref-head-icon ref-head-icon-${kind}">${icons[kind]}</span>
      </header>
      <section class="ref-title">
        <h1>${labels[kind]}</h1>
        <p>${subtitles[kind]}</p>
      </section>`;
  }

  function orb(kind, label = 'Сегодня', showRing = true) {
    const percent = pct(kind);
    return `
      <div class="ref-orb-zone ${showRing ? '' : 'no-ring'}" style="--p:${percent}%;--water:${percent}%">
        ${showRing ? '<div class="ref-progress-ring"></div>' : ''}
        <div class="ref-orb ref-orb-${kind}">
          <span class="ref-orb-fill"></span>
          <span class="ref-orb-wave"></span>
          <span class="ref-orb-shine"></span>
          <span class="ref-orb-rim"></span>
        </div>
        <div class="ref-score"><strong>${state[kind].current}/${state[kind].max}</strong><span>${label}</span></div>
      </div>`;
  }

  function row(icon, title, meta = '', action = '') {
    return `<button class="ref-row" type="button" ${action ? `data-action="${action}"` : ''}>
      <span class="ref-row-icon">${icons[icon]}</span>
      <span class="ref-row-copy"><strong>${title}</strong>${meta ? `<small>${meta}</small>` : ''}</span>
      <span class="ref-row-arrow">›</span>
    </button>`;
  }

  function sportTemplate() {
    return `${header('sport')}
      ${orb('sport', 'Сегодня', true)}
      <div class="ref-stats ref-stats-3">
        <div><strong>4 320</strong><span>Шагов</span></div>
        <div><strong>28</strong><span>Минут</span></div>
        <div><strong>320</strong><span>Ккал</span></div>
      </div>
      <button class="ref-main-btn" type="button" data-action="sport">${icons.play}<span>Начать тренировку</span></button>
      <section class="ref-block">
        <h2>Популярное</h2>
        ${row('heart', 'ЛФК · мягкое восстановление', '15 минут')}
        ${row('sport', 'FULL BODY', '24 минуты · 6 упражнений')}
        ${row('breathe', 'Растяжка', '10 минут')}
      </section>`;
  }

  function foodTemplate() {
    return `${header('food')}
      ${orb('food', '', false)}
      <div class="ref-macros">
        <div><strong>1540</strong><span>Ккал</span></div>
        <div><strong>122</strong><span>Белки</span></div>
        <div><strong>56</strong><span>Жиры</span></div>
        <div><strong>180</strong><span>Углеводы</span></div>
      </div>
      <button class="ref-main-btn" type="button" data-action="food">${icons.plus}<span>Добавить приём пищи</span></button>
      <section class="ref-block ref-list-only">
        ${row('book', 'Рецепты', 'Простые и полезные')}
        ${row('box', 'Мои продукты', 'Быстрый доступ')}
        ${row('calendar', 'План питания', 'Сбалансированные рационы')}
      </section>`;
  }

  function waterTemplate() {
    const glasses = Array.from({ length: 8 }, (_, i) => `<span class="ref-glass ${i < state.water.current ? 'filled' : ''}"></span>`).join('');
    return `${header('water')}
      ${orb('water', 'Стаканов сегодня', false)}
      <div class="ref-glasses">${glasses}</div>
      <button class="ref-main-btn" type="button" data-action="water">${icons.plus}<span>Добавить стакан</span></button>
      <section class="ref-tip">
        <span class="ref-tip-icon">${icons.water}</span>
        <span><small>Совет</small><strong>Пей воду небольшими порциями</strong><p>Так организму легче поддерживать водный баланс.</p></span>
      </section>`;
  }

  function sleepTemplate() {
    return `${header('sleep')}
      ${orb('sleep', 'Сегодня', false)}
      <section class="ref-block ref-list-only ref-sleep-list">
        ${row('sleep', 'Подготовка ко сну', '10 минут')}
        ${row('breathe', 'Дыхательная практика', 'Медленный ритм')}
        ${row('sound', 'Белый шум', 'Дождь · океан · лес')}
        ${row('history', 'История сна', 'Неделя · месяц · тенденции')}
      </section>`;
  }

  const templates = { sport: sportTemplate, food: foodTemplate, water: waterTemplate, sleep: sleepTemplate };

  function ensureScreen() {
    if (screen) return screen;
    screen = document.createElement('section');
    screen.className = 'feature-screen ref-screen';
    screen.hidden = true;
    shell.appendChild(screen);
    return screen;
  }

  function setFeatureNav(kind) {
    if (!profileButton || !homeButton) return;
    homeButton.classList.remove('active');
    profileButton.classList.add('active');
    profileButton.dataset.featureActive = kind;
    profileButton.innerHTML = `${icons[kind]}<span>${labels[kind]}</span>`;
  }

  function restoreNav() {
    if (!profileButton || !homeButton) return;
    profileButton.classList.remove('active');
    delete profileButton.dataset.featureActive;
    profileButton.innerHTML = profileOriginal;
    homeButton.classList.add('active');
  }

  function open(kind) {
    if (!templates[kind]) return;
    activeKind = kind;
    const el = ensureScreen();
    el.dataset.kind = kind;
    el.innerHTML = templates[kind]();
    el.hidden = false;
    el.scrollTop = 0;
    document.body.classList.add('feature-open');
    setFeatureNav(kind);
  }

  function close() {
    if (!screen) return;
    screen.hidden = true;
    activeKind = null;
    document.body.classList.remove('feature-open');
    restoreNav();
  }

  function increment(kind) {
    state[kind].current = Math.min(state[kind].max, state[kind].current + 1);
    saveState();
    syncHome();
    if (activeKind === kind) open(kind);
  }

  document.addEventListener('click', event => {
    const metric = event.target.closest('.metric[data-kind]');
    if (metric && templates[metric.dataset.kind]) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open(metric.dataset.kind);
      return;
    }

    const home = event.target.closest('.nav-item[data-nav="home"]');
    if (home && activeKind) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
      return;
    }

    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action || !activeKind) return;
    event.preventDefault();
    if (['sport', 'food', 'water', 'sleep'].includes(action)) increment(action);
  }, true);

  syncHome();
  window.NovaSections = { open, close, refresh: syncHome };
})();