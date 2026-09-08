(() => {
  'use strict';

  const shell = document.getElementById('appShell');
  const addButton = document.getElementById('addButton');
  if (!shell || !addButton || window.NovaQuickActionsV2) return;
  window.NovaQuickActionsV2 = true;

  const HABITS_KEY = 'nova.habits';
  let wrap = null;
  let habitWrap = null;

  function toast(text) {
    if (window.NovaSections?.toast) return window.NovaSections.toast(text);
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 1700);
  }

  function uid() {
    try { return crypto.randomUUID(); } catch (_) { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function readHabits() {
    const defaults = [
      { id: uid(), title: 'Стакан воды после пробуждения', doneDate: '' },
      { id: uid(), title: '10 минут движения', doneDate: '' },
      { id: uid(), title: 'Подготовиться ко сну вовремя', doneDate: '' }
    ];
    try {
      const parsed = JSON.parse(localStorage.getItem(HABITS_KEY) || 'null');
      return Array.isArray(parsed) && parsed.length ? parsed : defaults;
    } catch (_) {
      return defaults;
    }
  }

  function saveHabits(items) {
    try { localStorage.setItem(HABITS_KEY, JSON.stringify(items.slice(0, 30))); } catch (_) {}
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function svg(name) {
    const map = {
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      camera: '<path d="M8 8h2l1.6-2h4.8L18 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"/><circle cx="14" cy="14" r="3.8"/>',
      water: '<path d="M14 3.5C11.8 7.5 7.2 12.5 7.2 17.2a6.8 6.8 0 1 0 13.6 0c0-4.7-4.6-9.7-6.8-13.7Z"/>',
      habit: '<circle cx="14" cy="14" r="8.2"/><path d="M9.8 14.1l2.8 2.8 5.8-6"/>',
      timer: '<circle cx="14" cy="15" r="6.6"/><path d="M14 11.3v3.9l2.8 1.9M11 4h6"/>',
      bell: '<path d="M14 22a2.6 2.6 0 0 0 2.5-2h-5A2.6 2.6 0 0 0 14 22Z"/><path d="M18.3 18H9.7a1.2 1.2 0 0 1-.9-2c1.1-1.2 1.7-2.8 1.7-4.5V10a3.5 3.5 0 1 1 7 0v1.5c0 1.7.6 3.3 1.7 4.5a1.2 1.2 0 0 1-.9 2Z"/>',
      plus: '<path d="M14 6v16M6 14h16"/>',
      trash: '<path d="M9 9v10M14 9v10M19 9v10M7 6h14M11 6V4h6v2M8 6l1 17h10l1-17"/>'
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

        <svg class="qa-curve" viewBox="0 0 320 820" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="qaLine" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(110,157,255,.15)"/>
              <stop offset="50%" stop-color="rgba(134,171,255,.92)"/>
              <stop offset="100%" stop-color="rgba(255,255,255,.98)"/>
            </linearGradient>
          </defs>
          <path d="M145 730 C182 642 224 552 238 450 C248 360 250 268 244 150" pathLength="100"/>
          <circle cx="244" cy="150" r="4.5"/>
          <circle cx="246" cy="255" r="4.5"/>
          <circle cx="247" cy="360" r="4.5"/>
          <circle cx="241" cy="470" r="4.5"/>
          <circle cx="232" cy="585" r="4.5"/>
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
          <button class="qa-action qa-action-habits" type="button" data-qa-action="habits">
            <span class="qa-pill">Привычки</span>
            <span class="qa-icon">${svg('habit')}</span>
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

  function renderHabits() {
    const items = readHabits();
    saveHabits(items);
    const today = todayKey();
    const done = items.filter(item => item.doneDate === today).length;
    const rows = items.map(item => {
      const isDone = item.doneDate === today;
      return `<div class="qa-habit-row ${isDone ? 'done' : ''}" data-habit-id="${esc(item.id)}">
        <button class="qa-habit-check" type="button" data-habit-toggle aria-label="${isDone ? 'Снять отметку' : 'Отметить выполненной'}"><span>${isDone ? '✓' : ''}</span></button>
        <button class="qa-habit-title" type="button" data-habit-toggle>${esc(item.title)}</button>
        <button class="qa-habit-delete" type="button" data-habit-delete aria-label="Удалить привычку">${svg('trash')}</button>
      </div>`;
    }).join('');

    return `<div class="qa-habits-card">
      <header class="qa-habits-head">
        <div><small>Nova+</small><h2>Привычки</h2><p>Маленькие действия каждый день.</p></div>
        <button type="button" class="qa-habits-close" data-habits-close aria-label="Закрыть">${svg('close')}</button>
      </header>
      <section class="qa-habits-progress">
        <div><small>Сегодня</small><strong>${done} из ${items.length}</strong></div>
        <span><i style="width:${items.length ? Math.round(done / items.length * 100) : 0}%"></i></span>
      </section>
      <div class="qa-habits-list">${rows || '<p class="qa-habits-empty">Добавь первую привычку</p>'}</div>
      <form class="qa-habit-form" data-habit-form>
        <input name="title" maxlength="60" autocomplete="off" placeholder="Новая привычка" aria-label="Новая привычка" required>
        <button type="submit" aria-label="Добавить привычку">＋</button>
      </form>
    </div>`;
  }

  function ensureHabits() {
    if (!habitWrap) {
      habitWrap = document.createElement('div');
      habitWrap.className = 'qa-habits-wrap';
      habitWrap.hidden = true;
      document.body.appendChild(habitWrap);

      habitWrap.addEventListener('click', event => {
        if (event.target.closest('[data-habits-close]')) {
          closeHabits();
          return;
        }
        const row = event.target.closest('[data-habit-id]');
        if (!row) return;
        const id = row.dataset.habitId;
        let items = readHabits();
        if (event.target.closest('[data-habit-delete]')) {
          items = items.filter(item => item.id !== id);
          saveHabits(items);
          renderHabitsIntoWrap();
          return;
        }
        if (event.target.closest('[data-habit-toggle]')) {
          const today = todayKey();
          items = items.map(item => item.id === id ? { ...item, doneDate: item.doneDate === today ? '' : today } : item);
          saveHabits(items);
          renderHabitsIntoWrap();
        }
      });

      habitWrap.addEventListener('submit', event => {
        if (!event.target.matches('[data-habit-form]')) return;
        event.preventDefault();
        const input = event.target.elements.title;
        const title = String(input.value || '').trim().slice(0, 60);
        if (!title) return;
        const items = readHabits();
        items.push({ id: uid(), title, doneDate: '' });
        saveHabits(items);
        renderHabitsIntoWrap();
        requestAnimationFrame(() => habitWrap.querySelector('[data-habit-form] input')?.focus());
      });
    }
    return habitWrap;
  }

  function renderHabitsIntoWrap() {
    const el = ensureHabits();
    el.innerHTML = `<div class="qa-habits-backdrop" data-habits-close></div>${renderHabits()}`;
    el.classList.toggle('is-dark', shell.classList.contains('dark'));
  }

  function syncTheme() {
    const el = ensure();
    const dark = shell.classList.contains('dark');
    el.classList.toggle('is-dark', dark);
    if (habitWrap) habitWrap.classList.toggle('is-dark', dark);
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

  function openHabits() {
    close();
    renderHabitsIntoWrap();
    habitWrap.hidden = false;
    document.documentElement.classList.add('qa-open');
    document.body.classList.add('qa-open');
  }

  function closeHabits() {
    if (!habitWrap) return;
    habitWrap.hidden = true;
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
    if (action === 'habits') {
      return openHabits();
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

  document.addEventListener('click', event => {
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

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (habitWrap && !habitWrap.hidden) return closeHabits();
    if (wrap && !wrap.hidden) close();
  });

  window.addEventListener('storage', syncTheme);
  window.addEventListener('nova:themechange', syncTheme);
  window.NovaQuickActions = { open, close, openHabits };
})();
