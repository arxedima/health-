(() => {
  'use strict';
  if (window.NovaHomeFixesV2) return;
  window.NovaHomeFixesV2 = true;

  const root = document.documentElement;
  const stage = document.querySelector('.nova-stage');
  const orb = stage?.querySelector('.nova-orb');

  function ensureWaveMask() {
    if (!orb) return;
    const wave = orb.querySelector('.orb-wave');
    if (!wave) return;
    if (wave.parentElement?.classList.contains('orb-wave-mask')) return;
    const mask = document.createElement('span');
    mask.className = 'orb-wave-mask';
    wave.parentNode.insertBefore(mask, wave);
    mask.appendChild(wave);
  }

  function normalizeOrb() {
    if (!orb) return;
    orb.setAttribute('role', 'button');
    orb.setAttribute('tabindex', '0');
    orb.setAttribute('aria-label', 'Nova. Нажми, чтобы получить мотивацию');
    orb.querySelectorAll('.nova-orb-face').forEach(node => node.remove());
  }

  function syncViewport() {
    const vv = window.visualViewport;
    const height = Math.round(vv?.height || window.innerHeight || 800);
    const width = Math.round(vv?.width || window.innerWidth || 390);
    root.style.setProperty('--nova-visual-height', `${height}px`);
    root.style.setProperty('--nova-visual-width', `${width}px`);
    root.classList.toggle('nova-compact-home', height < 700 || width < 365);
  }

  function stabilizeSafariComposite() {
    if (!orb) return;
    /* Force a fresh compositing layer after Safari address-bar resize. */
    orb.style.webkitTransform = '';
    const mask = orb.querySelector('.orb-wave-mask');
    if (mask) mask.style.webkitTransform = 'translateZ(0)';
  }

  ensureWaveMask();
  normalizeOrb();
  syncViewport();
  requestAnimationFrame(stabilizeSafariComposite);

  let resizeFrame = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      syncViewport();
      stabilizeSafariComposite();
    });
  };

  window.addEventListener('resize', onResize, { passive: true });
  window.visualViewport?.addEventListener('resize', onResize, { passive: true });
  window.visualViewport?.addEventListener('scroll', onResize, { passive: true });
})();
