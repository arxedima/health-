// Nova+ v11 — sphere fill from Sport + Food + Water + Sleep.
(function () {
  const screen = document.getElementById('screen');
  if (!screen) return;

  function metricProgress(metric) {
    const text = metric?.querySelector('small')?.textContent || '';
    const match = text.match(/([0-9]+(?:[.,][0-9]+)?)\s*\/\s*([0-9]+(?:[.,][0-9]+)?)/);
    if (!match) return 0;
    const done = Number(match[1].replace(',', '.')) || 0;
    const target = Number(match[2].replace(',', '.')) || 0;
    return target > 0 ? Math.max(0, Math.min(1, done / target)) : 0;
  }

  function overallFromFour(home) {
    const metrics = Array.from(home.querySelectorAll('.metric-grid .metric')).slice(0, 4);
    if (!metrics.length) return 0;
    const values = metrics.map(metricProgress);
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function calibrateHome() {
    const home = screen.querySelector('.home-page');
    if (!home) return;

    const h1 = home.querySelector('h1');
    if (h1 && /Дима(?=\s|$|[,.!?])/.test(h1.textContent || '')) {
      h1.innerHTML = h1.innerHTML.replace(/Дима(?=\s|<|$|[,.!?])/g, 'Дмитрий');
    }

    const overall = overallFromFour(home);
    const progress = Math.max(0, Math.min(100, overall * 100));

    const sphere = home.querySelector('.hero-orb');
    if (sphere) {
      sphere.style.setProperty('--nova-fill', `${progress.toFixed(2)}%`);
      sphere.dataset.progress = String(Math.round(progress));
      sphere.setAttribute('aria-label', `Общий прогресс ${Math.round(progress)} процентов`);

      if (!sphere.querySelector('.nova-liquid')) {
        const liquid = document.createElement('span');
        liquid.className = 'nova-liquid';
        liquid.setAttribute('aria-hidden', 'true');
        sphere.prepend(liquid);
      }

      if (!sphere.querySelector('.nova-particles')) {
        const particles = document.createElement('span');
        particles.className = 'nova-particles';
        particles.setAttribute('aria-hidden', 'true');
        sphere.append(particles);
      }
    }

    // Keep a single clean outer scale with a gap at the bottom.
    // Fill follows the same four-metric average.
    const route = 'M42 194 A108 108 0 1 1 218 194';
    const track = home.querySelector('.ring-track');
    if (track) {
      track.setAttribute('d', route);
      track.setAttribute('pathLength', '100');
    }

    const value = home.querySelector('.ring-value');
    if (value) {
      value.setAttribute('d', route);
      value.setAttribute('pathLength', '100');
      value.style.strokeDasharray = `${progress.toFixed(2)} 100`;
      value.style.strokeDashoffset = '0';
    }
  }

  let raf = 0;
  function schedule() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(calibrateHome);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(screen, { childList: true, subtree: true, characterData: true });

  schedule();
})();
