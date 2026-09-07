(() => {
  'use strict';

  function loadCss(href, marker) {
    if (document.querySelector(`link[${marker}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, 'true');
    document.head.appendChild(link);
  }

  function loadScript(src, marker) {
    if (document.querySelector(`script[${marker}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(marker, 'true');
    document.body.appendChild(script);
  }

  loadCss('./premium-tabs.css?v=1', 'data-premium-tabs');
  loadScript('./premium-tabs.js?v=1', 'data-premium-tabs');
  loadCss('./nova-features.css?v=2', 'data-nova-features');
  loadScript('./nova-features.js?v=2', 'data-nova-features');
  loadCss('./quick-actions.css?v=1', 'data-quick-actions');
  loadScript('./quick-actions.js?v=1', 'data-quick-actions');
  loadCss('./nova-intelligence.css?v=2', 'data-nova-intelligence');
  loadScript('./nova-intelligence.js?v=1', 'data-nova-intelligence');

  const toast = document.getElementById('toast');
  const sheet = document.getElementById('actionSheet');
  const backdrop = document.getElementById('sheetBackdrop');
  let toastTimer = null;

  function showToast(text) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1700);
  }

  function currentDateLabel() {
    const value = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  const dateNode = document.querySelector('.brand-copy small');
  if (dateNode) dateNode.textContent = currentDateLabel();

  function openSheet() {
    if (!sheet || !backdrop) return;
    backdrop.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('open'));
    sheet.setAttribute('aria-hidden', 'false');
  }

  function closeSheet() {
    if (!sheet || !backdrop) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => { backdrop.hidden = true; }, 260);
  }

  document.getElementById('addButton')?.addEventListener('click', openSheet);
  backdrop?.addEventListener('click', closeSheet);

  document.querySelectorAll('.sheet-grid button').forEach((button) => {
    button.addEventListener('click', () => {
      if (window.NovaFeatures) return;
      showToast(`${button.textContent.trim()} — скоро`);
      closeSheet();
    });
  });

  document.getElementById('planButton')?.addEventListener('click', () => {
    if (!window.NovaFeatures) showToast('План дня — следующий экран');
  });

  document.getElementById('tipButton')?.addEventListener('click', () => showToast('Стакан воды после пробуждения помогает начать день'));

  window.addEventListener('click', (event) => {
    const analytics = event.target.closest('.nav-item[data-nav="analytics"]');
    if (analytics && sessionStorage.getItem('nova.intelligence.dirty') === '1') {
      event.preventDefault();
      event.stopImmediatePropagation();
      sessionStorage.setItem('nova.returnPage', 'analytics');
      sessionStorage.removeItem('nova.intelligence.dirty');
      location.reload();
    }
  }, true);

  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.nav === 'home' || window.NovaFeatures) return;
      const label = button.querySelector('span')?.textContent?.trim() || 'Раздел';
      showToast(`${label} — следующий экран`);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sheet?.classList.contains('open')) closeSheet();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
  }
})();
