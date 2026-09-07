(() => {
  'use strict';

  const shell = document.getElementById('appShell');
  const addButton = document.getElementById('addButton');
  if (!shell || !addButton || window.NovaQuickActionsV1) return;
  window.NovaQuickActionsV1 = true;

  let wrap = null;

  function toast(text) {
    if (window.NovaSections?.toast) return window.NovaSections.toast(text);
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 1700);
  }

  function svg(name) {
    const map = {
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      camera: '<path d="M8 8h2l1.6-2h4.8L18 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"/><circle cx="14" cy="14" r="3.8"/>',
      water: '<path d="M14 3.5C11.8 7.5 7.2 12.5 7.2 17.2a6.8 6.8 0 1 0 13.6 0c0-4.7-4.6-9.7-6.8-13.7Z"/>',
      timer: '<circle cx="14" cy="15" r="6.6"/><path d="M14 11.3v3.9l2.8 1.9M11 4h6"/>',
      bell: '<path d="M14 22a2.6 2.6 0 0 0 2.5-2h-5A2.6 2.6 0 0 0 14 22Z"/><path d="M18.3 18H9.7a1.2 1.2 0 0 1-.9-2c1.1-1.2 1.7-2.8 1.7-4.5V10a3.5 3.5 0 1 1 7 0v1.5c0 1.7.6 3.3 1.7 4.5a1.2 1.2 0 0 1-.9 2Z"/>',
      plus: '<path d="M14 6v16M6 14h16"/>'
    };
    return `<svg viewBox="0 0 28 28" aria-hidden="true">${map[name] || ''}</svg>`;
  }

  function ensure() {
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.className = 'qa-wrap';
    wrap.hidden = true;
    wrap.innerHTML = `
      <div class="qa-backdrop" data-qa-close></div>
      <section class="qa-panel" aria-label="Быстрые действия Nova+" role="dialog" aria-modal="true">
        <button class="qa-close" type="button" data-qa-close aria-label="Закрыть">${svg('close')}</button>
        <header class="qa-header">
          <small>Nova+</small>
          <h2>Быстрые<br>действия</h2>
          <p>Маленькие шаги —<br>больше результата.</p>
        </header>

        <div class="qa-scene" aria-hidden="true">
          <div class="qa-planet"></div>
          <div class="qa-cloud qa-cloud-a"></div>
          <div class="qa-cloud qa-cloud-b"></div>
          <div class="qa-cloud qa-cloud-c"></div>
        </div>

        <svg class="qa-curve" viewBox="0 0 320 720" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="qaLine" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(110,157,255,.15)"/>
              <stop offset="50%" stop-color="rgba(134,171,255,.92)"/>
              <stop offset="100%" stop-color="rgba(255,255,255,.98)"/>
            </linearGradient>
          </defs>
          <path d="M145 642 C 182 560, 226 472, 238 382 C 248 305, 250 232, 244 150" pathLength="100"/>
          <circle cx="244" cy="150" r="4.5"/>
          <circle cx="246" cy="266" r="4.5"/>
          <circle cx="244" cy="381" r="4.5"/>
          <circle cx="232" cy="497" r="4.5"/>
        </svg>

        <div class="qa-actions">
          <button class="qa-action qa-action-food" type="button" data-qa-action="food">
            <span class="qa-pill">Сфотографировать еду</span>
            <span class="qa-icon">${svg('camera')}</span>
          </button>
          <button class="qa-action qa-action-water" type="button" data-qa-action="water">
            <span class="qa-pill">Добавить воду</span>
            <span class="qa-icon">${svg('water')}</span>
          </button>
          <button class="qa-action qa-action-timer" type="button" data-qa-action="timer">
            <span class="qa-pill">Запустить таймер</span>
            <span class="qa-icon">${svg('timer')}</span>
          </button>
          <button class="qa-action qa-action-reminder" type="button" data-qa-action="reminder">
            <span class="qa-pill">Напоминание</span>
            <span class="qa-icon">${svg('bell')}</span>
          </button>
        </div>

        <button class="qa-plus" type="button" aria-label="Быстрые действия">${svg('plus')}</button>
      </section>`;
    document.body.appendChild(wrap);
    return wrap;
  }

  function syncTheme() {
    const el = ensure();
    el.classList.toggle('is-dark', shell.classList.contains('dark'));
  }

  function open() {
    syncTheme();
    ensure().hidden = false;
    document.documentElement.classList.add('qa-open');
    document.body.classList.add('qa-open');
  }

  function close() {
    if (!wrap) return;
    wrap.hidden = true;
    document.documentElement.classList.remove('qa-open');
    document.body.classList.remove('qa-open');
  }

  function run(action) {
    close();
    const depth = window.NovaDepthV2;
    const legacy = window.NovaFeatures;

    if (action === 'food') {
      if (depth?.openFoodCamera) return depth.openFoodCamera();
      return legacy?.quick ? legacy.quick('food') : toast('Модуль еды ещё не готов');
    }
    if (action === 'water') {
      if (depth?.quickWater) return depth.quickWater();
      return legacy?.quick ? legacy.quick('water') : toast('Модуль воды ещё не готов');
    }
    if (action === 'timer') {
      if (depth?.openTimer) return depth.openTimer();
      if (!legacy?.openPage) return toast('Таймер ещё не готов');
      legacy.openPage('plan');
      return setTimeout(() => document.querySelector('[data-open-timer]')?.click(), 80);
    }
    if (action === 'reminder') {
      if (depth?.openReminders) return depth.openReminders();
      if (!legacy?.openPage) return toast('Напоминания ещё не готовы');
      legacy.openPage('plan');
      return setTimeout(() => document.querySelector('[data-add-task]')?.click(), 80);
    }
  }

  document.addEventListener('click', (event) => {
    const openTrigger = event.target.closest('#addButton, .nav-plus');
    if (openTrigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const sheet = document.getElementById('actionSheet');
      const backdrop = document.getElementById('sheetBackdrop');
      sheet?.classList.remove('open');
      sheet?.setAttribute('aria-hidden', 'true');
      if (backdrop) backdrop.hidden = true;
      open();
      return;
    }

    if (!wrap || wrap.hidden) return;

    if (event.target.closest('[data-qa-close]')) {
      event.preventDefault();
      close();
      return;
    }

    const action = event.target.closest('[data-qa-action]');
    if (action) {
      event.preventDefault();
      run(action.dataset.qaAction);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && wrap && !wrap.hidden) close();
  });

  window.addEventListener('storage', syncTheme);
  window.NovaQuickActions = { open, close };
})();
