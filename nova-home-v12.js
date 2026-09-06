// Nova+ v12 — Reference Lock progress logic.
// One shared progress source: Sport + Food + Water + Sleep, equal 25% weight each.
(function () {
  const screen = document.getElementById('screen');
  if (!screen) return;

  function metricRatio(metric) {
    const text = metric?.querySelector('small')?.textContent || '';
    const match = text.match(/([0-9]+(?:[.,][0-9]+)?)\s*\/\s*([0-9]+(?:[.,][0-9]+)?)/);
    if (!match) return 0;

    const done = Number(match[1].replace(',', '.')) || 0;
    const target = Number(match[2].replace(',', '.')) || 0;
    if (target <= 0) return 0;

    return Math.max(0, Math.min(1, done / target));
  }

  function overallProgress(home) {
    const metrics = Array.from(home.querySelectorAll('.metric-grid .metric')).slice(0, 4);
    if (metrics.length !== 4) return 0;

    const total = metrics.reduce((sum, metric) => sum + metricRatio(metric), 0);
    return Math.max(0, Math.min(1, total / 4));
  }

  function ensureSphereLayers(sphere) {
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

  function calibrateHome() {
    const home = screen.querySelector('.home-page');
    if (!home) return;

    // Keep the approved full name on the main screen.
    const h1 = home.querySelector('h1');
    if (h1 && /Дима(?=\s|$|[,.!?])/.test(h1.textContent || '')) {
      h1.innerHTML = h1.innerHTML.replace(/Дима(?=\s|<|$|[,.!?])/g, 'Дмитрий');
    }

    const overall = overallProgress(home);
    const progress = overall * 100;

    // The reference still has a small transparent air cap at 100%,
    // so the visual liquid stops at 94% while the true progress arc reaches 100%.
    const visualFill = progress <= 0 ? 0 : Math.min(94, progress);

    const sphere = home.querySelector('.hero-orb');
    if (sphere) {
      ensureSphereLayers(sphere);
      sphere.style.setProperty('--nova-fill', `${visualFill.toFixed(2)}%`);
      sphere.dataset.progress = String(Math.round(progress));
      sphere.setAttribute('role', 'img');
      sphere.setAttribute('aria-label', `Общий прогресс ${Math.round(progress)} процентов`);
    }

    // Single clean arc with a bottom gap. It starts at the left and fills
    // clockwise through the upper part toward the right.
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
