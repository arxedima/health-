(() => {
  'use strict';
  if (window.NovaOnboardingPolishV1) return;
  window.NovaOnboardingPolishV1 = true;

  let observedRoot = null;

  const sunIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>`;
  const moonIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 15.2A8.4 8.4 0 0 1 8.8 3.6 8.8 8.8 0 1 0 20.4 15.2Z"/></svg>`;

  function isDark() {
    if (window.NovaTheme?.isDark) return window.NovaTheme.isDark();
    return document.getElementById('appShell')?.classList.contains('dark') || false;
  }

  function root() {
    return document.querySelector('.nova-onboarding');
  }

  function setViewport() {
    const r = root();
    if (!r) return;
    const vv = window.visualViewport;
    const height = vv?.height || window.innerHeight;
    r.style.setProperty('--onb-vh', `${Math.round(height)}px`);
    const keyboardOpen = !!vv && (window.innerHeight - vv.height) > 130;
    r.classList.toggle('onb-keyboard', keyboardOpen);
  }

  function syncTheme() {
    const r = root();
    if (!r) return;
    const dark = isDark();
    r.classList.toggle('onb-dark', dark);
    r.setAttribute('data-theme', dark ? 'dark' : 'light');
    r.querySelectorAll('[data-onb-theme]').forEach(button => {
      button.innerHTML = dark ? sunIcon : moonIcon;
      button.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
      button.setAttribute('title', dark ? 'Светлая тема' : 'Тёмная тема');
      button.setAttribute('aria-pressed', String(dark));
    });
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }

  function injectThemeButtons() {
    const r = root();
    if (!r) return;
    r.querySelectorAll('.onb-top').forEach(top => {
      if (top.querySelector('[data-onb-theme]')) return;
      const skip = top.querySelector('.onb-skip');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'onb-theme-toggle';
      button.dataset.onbTheme = '';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (window.NovaTheme?.toggle) window.NovaTheme.toggle();
        else document.getElementById('appShell')?.classList.toggle('dark');
        syncTheme();
      });
      top.insertBefore(button, skip || null);
    });
    syncTheme();
  }

  function polish() {
    const r = root();
    if (!r) return;
    injectThemeButtons();
    setViewport();
    if (observedRoot !== r) {
      observedRoot = r;
      requestAnimationFrame(() => r.classList.add('onb-ready'));
    }
  }

  const observer = new MutationObserver(polish);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('nova:themechange', syncTheme);
  window.addEventListener('resize', setViewport, { passive: true });
  window.visualViewport?.addEventListener('resize', setViewport, { passive: true });
  window.visualViewport?.addEventListener('scroll', setViewport, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(setViewport, 120), { passive: true });

  polish();
})();