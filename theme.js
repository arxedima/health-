(() => {
  'use strict';

  function loadOnboardingPolish() {
    if (!document.querySelector('link[data-onboarding-polish]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './onboarding-polish.css?v=1';
      link.setAttribute('data-onboarding-polish', 'true');
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-onboarding-polish]')) {
      const script = document.createElement('script');
      script.src = './onboarding-polish.js?v=1';
      script.async = false;
      script.setAttribute('data-onboarding-polish', 'true');
      document.head.appendChild(script);
    }
  }
  loadOnboardingPolish();

  const button = document.getElementById('themeButton');
  const shell = document.getElementById('appShell');
  if (!shell) return;

  const title = document.getElementById('greetingTitle');
  const greeting = document.getElementById('greetingText');
  const tipEyebrow = document.getElementById('tipEyebrow');
  const tipTitle = document.getElementById('tipTitle');
  const tipText = document.getElementById('tipText');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function readStoredTheme() {
    try { return localStorage.getItem('nova.theme'); } catch (_) { return null; }
  }

  function storeTheme(value) {
    try { localStorage.setItem('nova.theme', value); } catch (_) {}
  }

  function profileName() {
    try {
      const value = JSON.parse(localStorage.getItem('nova.profile') || '{}');
      return String(value?.name || '').trim() || 'Дмитрий';
    } catch (_) { return 'Дмитрий'; }
  }

  function greetingLabel() {
    const hour = new Date().getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  }

  function syncTitle() {
    if (!title) return;
    const name = profileName();
    title.replaceChildren(
      document.createTextNode(`${greetingLabel()},`),
      document.createElement('br'),
      document.createTextNode(name)
    );
  }

  function setTheme(dark, { persist = true } = {}) {
    shell.classList.toggle('dark', dark);
    syncTitle();
    if (greeting) greeting.textContent = dark ? 'Спокойный ритм. Время восстановиться.' : 'Пора сделать первый шаг.';
    if (tipEyebrow) tipEyebrow.textContent = dark ? 'Сейчас важно' : 'Совет дня';
    if (tipTitle) tipTitle.textContent = dark ? 'Подготовка ко сну' : 'Стакан воды';
    if (tipText) tipText.innerHTML = dark ? '10 минут спокойной<br>практики перед сном.' : 'После пробуждения<br>помогает начать день.';
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#071326' : '#f8fbff');
    button?.setAttribute('aria-pressed', String(dark));
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    if (persist) storeTheme(dark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('nova:themechange', { detail: { dark } }));
  }

  const stored = readStoredTheme();
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  setTheme(stored ? stored === 'dark' : Boolean(systemDark), { persist: false });

  button?.addEventListener('click', () => setTheme(!shell.classList.contains('dark')));

  window.addEventListener('storage', event => {
    if (event.key === 'nova.theme') setTheme(event.newValue === 'dark', { persist: false });
    if (event.key === 'nova.profile') syncTitle();
  });

  window.NovaTheme = {
    set: dark => setTheme(Boolean(dark)),
    toggle: () => setTheme(!shell.classList.contains('dark')),
    isDark: () => shell.classList.contains('dark'),
    syncTitle
  };
})();