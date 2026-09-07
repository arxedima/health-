(() => {
  'use strict';
  if (window.NovaDepthPremiumSafariFix) return;
  window.NovaDepthPremiumSafariFix = true;

  function fix(root = document) {
    root.querySelectorAll?.('.dvp-premium[data-dvp-kind="water"]').forEach(premium => {
      const raw = getComputedStyle(premium).getPropertyValue('--dvp-progress').trim();
      const pct = Math.max(0, Math.min(100, Number(raw) || 0));
      const liquid = premium.querySelector('.dvp-liquid');
      const waveA = premium.querySelector('.dvp-wa');
      const waveB = premium.querySelector('.dvp-wb');
      if (liquid) liquid.style.height = `${pct}%`;
      if (waveA) waveA.style.bottom = `calc(${pct}% - 20px)`;
      if (waveB) waveB.style.bottom = `calc(${pct}% - 15px)`;
    });
  }

  new MutationObserver(() => fix(document)).observe(document.body, { childList: true, subtree: true });
  fix(document);
})();