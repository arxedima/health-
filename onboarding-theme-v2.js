(() => {
  'use strict';
  if (window.NovaOnboardingThemeV2) return;
  window.NovaOnboardingThemeV2 = true;

  const PARAM = new URLSearchParams(location.search).get('theme');
  let mode = PARAM === 'dark' || PARAM === 'light' ? PARAM : null;

  function storedMode() {
    try {
      const value = localStorage.getItem('nova.theme');
      if (value === 'dark' || value === 'light') return value;
    } catch (_) {}
    if (document.getElementById('appShell')?.classList.contains('dark')) return 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  if (!mode) mode = storedMode();

  function root() {
    return document.querySelector('.nova-onboarding');
  }

  function paint(value, { persist = true, syncApp = true } = {}) {
    mode = value === 'dark' ? 'dark' : 'light';
    const dark = mode === 'dark';
    const r = root();

    if (r) {
      r.classList.toggle('onb-dark', dark);
      r.dataset.theme = mode;
      r.querySelectorAll('[data-onb-theme-choice]').forEach(button => {
        const active = button.dataset.onbThemeChoice === mode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    document.documentElement.style.colorScheme = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', dark ? '#030817' : '#f8fbff');

    if (persist) {
      try { localStorage.setItem('nova.theme', mode); } catch (_) {}
    }

    if (syncApp) {
      if (window.NovaTheme?.isDark && window.NovaTheme?.set) {
        if (window.NovaTheme.isDark() !== dark) window.NovaTheme.set(dark);
      } else {
        document.getElementById('appShell')?.classList.toggle('dark', dark);
      }
    }
  }

  function makeSwitch() {
    const el = document.createElement('div');
    el.className = 'onb-theme-switch';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'Тема оформления');
    el.innerHTML = `
      <button type="button" data-onb-theme-choice="light" aria-label="Светлая тема"><span>☀</span><b>Свет</b></button>
      <button type="button" data-onb-theme-choice="dark" aria-label="Тёмная тема"><span>☾</span><b>Тьма</b></button>`;
    el.addEventListener('click', event => {
      const button = event.target.closest('[data-onb-theme-choice]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      paint(button.dataset.onbThemeChoice);
    });
    return el;
  }

  function enhance() {
    const r = root();
    if (!r) return;

    r.querySelectorAll('.onb-top').forEach(top => {
      if (!top.querySelector('.onb-theme-switch')) {
        const skip = top.querySelector('.onb-skip');
        top.insertBefore(makeSwitch(), skip || null);
      }
    });

    paint(mode, { persist: PARAM === 'dark' || PARAM === 'light', syncApp: true });
  }

  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('nova:themechange', event => {
    const dark = Boolean(event.detail?.dark);
    mode = dark ? 'dark' : 'light';
    paint(mode, { persist: false, syncApp: false });
  });
  window.addEventListener('storage', event => {
    if (event.key === 'nova.theme' && (event.newValue === 'dark' || event.newValue === 'light')) {
      paint(event.newValue, { persist: false, syncApp: false });
    }
  });

  enhance();
  window.NovaOnboardingTheme = {
    set: value => paint(value),
    toggle: () => paint(mode === 'dark' ? 'light' : 'dark'),
    get: () => mode
  };
})();