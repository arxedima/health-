(() => {
  'use strict';
  if (window.NovaOnboardingV3) return;
  window.NovaOnboardingV3 = true;

  const DONE_KEY = 'nova.onboarding.v1';
  const PROFILE_KEY = 'nova.profile';
  const THEME_KEY = 'nova.theme';
  const params = new URLSearchParams(location.search);
  const force = params.get('onboarding') === '1';
  const forcedTheme = params.get('theme') === 'dark' || params.get('theme') === 'light' ? params.get('theme') : null;
  const shouldOpen = force || !safeGet(DONE_KEY);
  const phrases = [
    ['NOVA', 'Новая реальность начинается с маленького действия.'],
    ['Новая жизнь.', ''], ['Новые привычки.', ''], ['Новое тело.', ''], ['Новая энергия.', ''], ['Новый ритм.', ''], ['Новый ты.', ''],
    ['Не начинай заново.', ''], ['Начни по-новому.', ''],
    ['Следи за собой.', ''], ['Двигайся.', ''], ['Ешь лучше.', ''], ['Пей воду.', ''], ['Восстанавливайся.', ''], ['Спи.', ''],
    ['Маленькие действия.', ''], ['Каждый день.', ''], ['Большие изменения.', ''],
    ['Твоя жизнь — в твоих руках.', ''],
    ['NOVA', 'Новая реальность начинается сейчас.']
  ];

  let root = null;
  let phraseIndex = 0;
  let phraseTimer = 0;
  let theme = initialTheme();

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function initialTheme() {
    if (forcedTheme) return forcedTheme;
    const stored = safeGet(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (_) { return 'light'; }
  }

  function readProfile() {
    try {
      const value = JSON.parse(safeGet(PROFILE_KEY) || '{}');
      return { name:'', height:'', weight:'', goal:'', ...value };
    } catch (_) {
      return { name:'', height:'', weight:'', goal:'' };
    }
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    })[c]);
  }

  function themeSwitch() {
    return `<div class="onb-theme-switch" role="group" aria-label="Тема оформления">
      <button type="button" data-onb-theme="light" aria-label="Светлая тема"><span>☀</span><b>Свет</b></button>
      <button type="button" data-onb-theme="dark" aria-label="Тёмная тема"><span>☾</span><b>Тьма</b></button>
    </div>`;
  }

  function markup() {
    const p = readProfile();
    return `<section class="nova-onboarding" data-theme="${theme}" role="dialog" aria-modal="true" aria-label="Знакомство с Nova+">
      <section class="onb-screen onb-intro active" data-onb-screen="intro">
        <header class="onb-top"><div class="onb-logo">Nova<i>+</i></div>${themeSwitch()}<button class="onb-skip" type="button" data-onb-skip-intro>Пропустить</button></header>
        <div class="onb-intro-copy"><div class="onb-kicker">Большая жизнь<br>начинается здесь</div></div>
        <div class="onb-intro-stage">
          <span class="onb-bubble onb-b1"></span><span class="onb-bubble onb-b2"></span><span class="onb-bubble onb-b3"></span>
          <div class="onb-core-orb" aria-hidden="true"></div>
          <div class="onb-stream s1"><span>Спорт</span></div><div class="onb-stream s2"><span>Вода</span></div><div class="onb-stream s3"><span>Сон · Энергия · Баланс</span></div><div class="onb-stream s4"><span>Питание · Фокус</span></div>
          <div class="onb-fast-word" data-onb-word>NOVA</div>
          <div class="onb-fast-sub" data-onb-sub>Новая реальность начинается с маленького действия.</div>
        </div>
        <div class="onb-intro-bottom"><p class="onb-caption">Больше, чем привычки.<br>Лучшая версия тебя.</p><div class="onb-dots"><i class="active"></i><i></i></div><button class="onb-primary" type="button" data-onb-next>Продолжить <span class="arrow">→</span></button></div>
      </section>

      <section class="onb-screen onb-profile" data-onb-screen="profile">
        <header class="onb-top"><div class="onb-logo">Nova<i>+</i></div>${themeSwitch()}<button class="onb-skip" type="button" data-onb-skip-profile>Пропустить</button></header>
        <div class="onb-stepbar"><i></i><i class="active"></i></div><div class="onb-step-label">Шаг 2 из 2</div>
        <div class="onb-profile-head"><h1>Расскажите о себе</h1><p>Эти данные помогут персонализировать план для спорта, воды, питания и сна.</p></div>
        <form class="onb-form" data-onb-form>
          <label class="onb-field"><span>Имя</span><div class="onb-input"><span class="ico">♙</span><input name="name" autocomplete="name" maxlength="32" placeholder="Например, Дмитрий" value="${esc(p.name)}"></div></label>
          <label class="onb-field"><span>Рост</span><div class="onb-input"><span class="ico">⌇</span><input name="height" inputmode="decimal" type="number" min="100" max="250" step="1" placeholder="Например, 180" value="${esc(p.height)}"><span class="unit">см</span></div></label>
          <label class="onb-field"><span>Вес</span><div class="onb-input"><span class="ico">▣</span><input name="weight" inputmode="decimal" type="number" min="25" max="350" step="0.1" placeholder="Например, 75" value="${esc(p.weight)}"><span class="unit">кг</span></div></label>
          <label class="onb-field"><span>Цель</span><div class="onb-input"><span class="ico">◎</span><select name="goal">
            <option value="">Выберите цель</option>
            <option value="health" ${p.goal==='health'?'selected':''}>Улучшить здоровье</option>
            <option value="shape" ${p.goal==='shape'?'selected':''}>Быть в форме</option>
            <option value="lose" ${p.goal==='lose'?'selected':''}>Снизить вес</option>
            <option value="gain" ${p.goal==='gain'?'selected':''}>Набрать массу</option>
            <option value="energy" ${p.goal==='energy'?'selected':''}>Больше энергии</option>
            <option value="recovery" ${p.goal==='recovery'?'selected':''}>Восстановление</option>
          </select><span class="chev">⌄</span></div></label>
          <div class="onb-profile-action"><button class="onb-primary" type="submit">Начать <span class="arrow">→</span></button><p class="onb-profile-note">Данные хранятся локально на этом устройстве и их можно изменить позже.</p></div>
        </form>
      </section>
    </section>`;
  }

  function applyTheme(next, persist) {
    theme = next === 'dark' ? 'dark' : 'light';
    if (persist !== false) safeSet(THEME_KEY, theme);

    if (root) {
      root.dataset.theme = theme;
      root.querySelectorAll('[data-onb-theme]').forEach(button => {
        const active = button.dataset.onbTheme === theme;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    const dark = theme === 'dark';
    const shell = document.getElementById('appShell');
    if (shell) shell.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#050b18' : '#f8fbff');

    if (window.NovaTheme && typeof window.NovaTheme.set === 'function') {
      const current = typeof window.NovaTheme.isDark === 'function' ? window.NovaTheme.isDark() : dark;
      if (current !== dark) window.NovaTheme.set(dark);
    }
  }

  function setViewport() {
    if (!root) return;
    const vv = window.visualViewport;
    const height = vv && vv.height ? vv.height : window.innerHeight;
    root.style.setProperty('--onb-height', `${Math.round(height)}px`);
    root.classList.toggle('onb-keyboard', Boolean(vv && window.innerHeight - vv.height > 130));
  }

  function create() {
    if (root) return root;
    const holder = document.createElement('div');
    holder.innerHTML = markup();
    root = holder.firstElementChild;
    document.body.appendChild(root);

    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    document.documentElement.classList.remove('nova-onboarding-pending');
    document.documentElement.classList.add('nova-onboarding-open');

    applyTheme(theme, Boolean(forcedTheme));
    setViewport();
    startText();
    return root;
  }

  function showProfile() {
    stopText();
    const intro = root && root.querySelector('[data-onb-screen="intro"]');
    const profile = root && root.querySelector('[data-onb-screen="profile"]');
    if (intro) intro.classList.remove('active');
    if (profile) profile.classList.add('active');
  }

  function finish() {
    stopText();
    safeSet(DONE_KEY, 'done');
    document.documentElement.classList.remove('nova-onboarding-open', 'nova-onboarding-pending');
    if (root) root.remove();
    root = null;
    syncProfile();
  }

  function setPhrase(i) {
    if (!root) return;
    const word = root.querySelector('[data-onb-word]');
    const sub = root.querySelector('[data-onb-sub]');
    if (!word || !sub) return;
    word.textContent = phrases[i][0];
    sub.textContent = phrases[i][1] || '';
  }

  function startText() {
    stopText();
    if (!root) return;
    phraseIndex = 0;
    setPhrase(0);
    try {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setPhrase(phrases.length - 1);
        return;
      }
    } catch (_) {}

    phraseTimer = window.setInterval(() => {
      if (!root) return stopText();
      phraseIndex += 1;
      if (phraseIndex >= phrases.length) {
        stopText();
        setPhrase(phrases.length - 1);
        return;
      }
      const word = root.querySelector('[data-onb-word]');
      const sub = root.querySelector('[data-onb-sub]');
      if (!word || !sub) return;
      word.classList.add('out');
      sub.style.opacity = '0';
      window.setTimeout(() => {
        if (!root) return;
        setPhrase(phraseIndex);
        word.classList.remove('out');
        sub.style.opacity = '1';
      }, 130);
    }, 690);
  }

  function stopText() {
    if (phraseTimer) window.clearInterval(phraseTimer);
    phraseTimer = 0;
  }

  function onClick(event) {
    const themeButton = event.target.closest('[data-onb-theme]');
    if (themeButton) {
      event.preventDefault();
      applyTheme(themeButton.dataset.onbTheme, true);
      return;
    }
    if (event.target.closest('[data-onb-next], [data-onb-skip-intro]')) {
      event.preventDefault();
      showProfile();
      return;
    }
    if (event.target.closest('[data-onb-skip-profile]')) {
      event.preventDefault();
      finish();
    }
  }

  function onSubmit(event) {
    if (!event.target.matches('[data-onb-form]')) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    const profile = {
      name: String(data.name || '').trim().slice(0, 32),
      height: data.height ? Number(data.height) : '',
      weight: data.weight ? Number(data.weight) : '',
      goal: String(data.goal || '')
    };
    safeSet(PROFILE_KEY, JSON.stringify(profile));
    finish();
  }

  function syncProfile() {
    const p = readProfile();
    const name = p.name || 'Дмитрий';
    const greeting = document.getElementById('greetingTitle');
    if (greeting) {
      const hour = new Date().getHours();
      const salutation = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
      const desired = `${salutation},<br>${esc(name)}`;
      if (greeting.innerHTML !== desired) greeting.innerHTML = desired;
    }

    document.querySelectorAll('.nf-profile').forEach(card => {
      const strong = card.querySelector('strong');
      if (strong && strong.textContent !== name) strong.textContent = name;
      const avatar = card.querySelector('div');
      const initial = (name[0] || 'N').toUpperCase();
      if (avatar && avatar.textContent !== initial) avatar.textContent = initial;
    });
  }

  window.addEventListener('resize', setViewport, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', setViewport, { passive: true });

  syncProfile();
  if (shouldOpen) create();
  else document.documentElement.classList.remove('nova-onboarding-pending');

  window.NovaOnboarding = {
    open() { safeSet(DONE_KEY, ''); create(); },
    close: finish,
    profile: readProfile,
    setTheme(value) { applyTheme(value, true); },
    theme() { return theme; }
  };
})();
