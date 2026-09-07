(() => {
  'use strict';

  let uid = 0;
  const nextId = (prefix) => `${prefix}-${++uid}`;

  function waterSvg(extraClass = '') {
    const fill = nextId('pt-water-fill');
    const shine = nextId('pt-water-shine');
    const glow = nextId('pt-water-glow');
    return `
      <svg class="pt-water-drop-3d ${extraClass}" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <radialGradient id="${fill}" cx="30%" cy="22%" r="78%">
            <stop offset="0%" stop-color="#f9feff"/>
            <stop offset="17%" stop-color="#e3f8ff"/>
            <stop offset="43%" stop-color="#8bd9ff"/>
            <stop offset="73%" stop-color="#318ff2"/>
            <stop offset="100%" stop-color="#1164d7"/>
          </radialGradient>
          <radialGradient id="${shine}" cx="25%" cy="21%" r="46%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".98"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </radialGradient>
          <filter id="${glow}" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.35" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g filter="url(#${glow})">
          <path d="M32 5C27 15 17 25 17 38c0 9.5 6.6 17 15 17s15-7.5 15-17C47 25 37 15 32 5Z" fill="url(#${fill})"/>
          <path d="M24 35c.8-5.6 4-10.7 8.5-17-2.5 10-1.2 18.4 3.9 24.7C30.3 44.2 23.1 41.2 24 35Z" fill="url(#${shine})" opacity=".83"/>
          <path d="M22.6 42.5c5 3.9 12.9 4.5 18.4-.1" fill="none" stroke="#fff" stroke-opacity=".43" stroke-width="2" stroke-linecap="round"/>
          <path d="M20.2 36c.6-7.8 6.8-16.5 11.9-26" fill="none" stroke="#fff" stroke-opacity=".48" stroke-width="1.8" stroke-linecap="round"/>
        </g>
      </svg>`;
  }

  function moonSvg(extraClass = '') {
    const fill = nextId('pt-moon-fill');
    const shine = nextId('pt-moon-shine');
    const glow = nextId('pt-moon-glow');
    const mask = nextId('pt-moon-mask');
    return `
      <svg class="pt-moon-3d ${extraClass}" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <radialGradient id="${fill}" cx="30%" cy="24%" r="78%">
            <stop offset="0%" stop-color="#fcfbff"/>
            <stop offset="18%" stop-color="#efe7ff"/>
            <stop offset="48%" stop-color="#ccb8ff"/>
            <stop offset="78%" stop-color="#9c7cff"/>
            <stop offset="100%" stop-color="#7153ea"/>
          </radialGradient>
          <radialGradient id="${shine}" cx="24%" cy="20%" r="48%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".97"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </radialGradient>
          <filter id="${glow}" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.55" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <mask id="${mask}">
            <rect width="64" height="64" fill="#000"/>
            <circle cx="31" cy="31" r="19" fill="#fff"/>
            <circle cx="41" cy="24" r="18" fill="#000"/>
          </mask>
        </defs>
        <g filter="url(#${glow})">
          <circle cx="31" cy="31" r="19" fill="url(#${fill})" mask="url(#${mask})"/>
          <circle cx="26" cy="24" r="10" fill="url(#${shine})" mask="url(#${mask})" opacity=".93"/>
          <path d="M17 40c4.4 3.2 10.8 5 18.6 3.5" fill="none" stroke="#fff" stroke-opacity=".46" stroke-width="2.2" stroke-linecap="round" mask="url(#${mask})"/>
          <path d="M18 41c4.6 2.6 10.5 3.2 16.8 2.2" fill="none" stroke="#5a3ac6" stroke-opacity=".34" stroke-width="1.3" stroke-linecap="round" mask="url(#${mask})"/>
        </g>
      </svg>`;
  }

  function parseWaterLevel(root) {
    const text = root.querySelector('.gf-value strong')?.textContent || '';
    const match = text.match(/([\d.,]+)/);
    if (!match) return 75;
    const liters = Number(match[1].replace(',', '.'));
    if (!Number.isFinite(liters)) return 75;
    return Math.max(0, Math.min(100, Math.round((liters / 2) * 100)));
  }

  function enhanceWater(root) {
    if (!root || root.dataset.ptEnhanced === '1') return;
    root.dataset.ptEnhanced = '1';

    const heading = root.querySelector('.gf-heading-icon');
    const symbol = root.querySelector('.gf-symbol');
    if (heading) heading.innerHTML = waterSvg('pt-small');
    if (symbol) symbol.innerHTML = waterSvg('pt-orb');

    const orb = root.querySelector('.gf-orb');
    if (orb) {
      const level = parseWaterLevel(root);
      root.style.setProperty('--pt-water-level', `${level}%`);
      const liquid = document.createElement('span');
      liquid.className = 'pt-water-liquid';
      const waveA = document.createElement('span');
      waveA.className = 'pt-water-wave pt-water-wave-a';
      const waveB = document.createElement('span');
      waveB.className = 'pt-water-wave pt-water-wave-b';
      orb.insertBefore(liquid, orb.firstChild);
      orb.append(waveA, waveB);
    }
  }

  function enhanceSleep(root) {
    if (!root || root.dataset.ptEnhanced === '1') return;
    root.dataset.ptEnhanced = '1';

    const heading = root.querySelector('.gf-heading-icon');
    const symbol = root.querySelector('.gf-symbol');
    const ctaIcon = root.querySelector('.gf-sleep-cta .gf-cta-icon');
    if (heading) heading.innerHTML = moonSvg('pt-small');
    if (symbol) symbol.innerHTML = moonSvg('pt-orb');
    if (ctaIcon) ctaIcon.innerHTML = moonSvg('pt-cta');
  }

  function enhance(scope = document) {
    scope.querySelectorAll?.('.gf-water').forEach(enhanceWater);
    scope.querySelectorAll?.('.gf-sleep').forEach(enhanceSleep);
  }

  const scheduleEnhance = (() => {
    let raf = 0;
    return () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => enhance(document));
    };
  })();

  enhance(document);
  const observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.body, { childList: true, subtree: true });
})();
