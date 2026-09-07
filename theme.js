(() => {
  'use strict';

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

  function setTheme(dark, { persist = true } = {}) {
    shell.classList.toggle('dark', dark);
    if (title) title.innerHTML = dark ? 'Спокойный вечер,<br>Дмитрий' : 'Доброе утро,<br>Дмитрий';
    if (greeting) greeting.textContent = dark ? 'Хороший день. Время восстановиться.' : 'Пора сделать первый шаг.';
    if (tipEyebrow) tipEyebrow.textContent = dark ? 'Сейчас важно' : 'Совет дня';
    if (tipTitle) tipTitle.textContent = dark ? 'Подготовка ко сну' : 'Стакан воды';
    if (tipText) tipText.innerHTML = dark ? '10 минут дыхательной<br>практики улучшат сон.' : 'После пробуждения<br>запускает метаболизм.';
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#07192d' : '#f8fbff');
    button?.setAttribute('aria-pressed', String(dark));
    if (persist) storeTheme(dark ? 'dark' : 'light');
  }

  const stored = readStoredTheme();
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  setTheme(stored ? stored === 'dark' : Boolean(systemDark), { persist: false });

  button?.addEventListener('click', () => setTheme(!shell.classList.contains('dark')));

  window.NovaTheme = {
    set: (dark) => setTheme(Boolean(dark)),
    toggle: () => setTheme(!shell.classList.contains('dark')),
    isDark: () => shell.classList.contains('dark')
  };
})();