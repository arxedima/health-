(() => {
  'use strict';
  if (window.NovaHomeFixesV1) return;
  window.NovaHomeFixesV1 = true;

  const root = document.documentElement;
  const orb = document.querySelector('.nova-orb');
  const wave = orb?.querySelector('.orb-wave');

  function ensureWaveMask() {
    if (!orb || !wave || wave.parentElement?.classList.contains('orb-wave-mask')) return;
    const mask = document.createElement('span');
    mask.className = 'orb-wave-mask';
    wave.parentNode.insertBefore(mask, wave);
    mask.appendChild(wave);
  }

  function syncViewport() {
    const vv = window.visualViewport;
    const height = Math.round(vv?.height || window.innerHeight || 800);
    const width = Math.round(vv?.width || window.innerWidth || 390);
    root.style.setProperty('--nova-visual-height', `${height}px`);
    root.classList.toggle('nova-compact-home', height < 690 || width < 360);
  }

  function normalizeOrbTransform() {
    if (!orb) return;
    orb.setAttribute('role', 'button');
    orb.setAttribute('tabindex', '0');
    orb.setAttribute('aria-label', 'Nova. Нажми, чтобы получить мотивацию');
  }

  ensureWaveMask();
  normalizeOrbTransform();
  syncViewport();

  window.addEventListener('resize', syncViewport, { passive: true });
  window.visualViewport?.addEventListener('resize', syncViewport, { passive: true });
})();
