(() => {
  'use strict';

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
    const value = new Intl.DateTimeFormat('ru-RU', { weekday:'long', day:'numeric', month:'long' }).format(new Date());
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  const dateNode = document.querySelector('.brand-copy small');
  if (dateNode) dateNode.textContent = currentDateLabel();

  function openSheet() {
    if (window.NovaQuickActions?.open) return window.NovaQuickActions.open();
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

  document.getElementById('planButton')?.addEventListener('click', () => {
    if (window.NovaFeatures?.openPage) window.NovaFeatures.openPage('plan');
    else showToast('План дня пока недоступен');
  });

  document.getElementById('tipButton')?.addEventListener('click', () => {
    showToast('Небольшое действие сегодня важнее идеального плана на завтра');
  });

  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
      const nav = button.dataset.nav;
      if (nav === 'home') return;
      if (window.NovaFeatures?.openPage && ['plan','analytics','profile'].includes(nav)) {
        window.NovaFeatures.openPage(nav);
        return;
      }
      showToast('Раздел пока недоступен');
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sheet?.classList.contains('open')) closeSheet();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { updateViaCache:'none' }).catch(() => {});
    });
  }
})();
