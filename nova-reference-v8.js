// Nova+ v8
// Только визуальная геометрия главной. Логику приложения не меняет.
(function () {
  const screen = document.getElementById('screen');
  if (!screen) return;

  function calibrateHome() {
    const home = screen.querySelector('.home-page');
    if (!home) return;

    // Исправляем имя без \b: word-boundary ненадёжен с кириллицей.
    const h1 = home.querySelector('h1');
    if (h1 && /Дима(?=\s|$|[,.!?])/.test(h1.textContent || '')) {
      h1.innerHTML = h1.innerHTML.replace(/Дима(?=\s|<|$|[,.!?])/g, 'Дмитрий');
    }

    const track = home.querySelector('.ring-track');
    if (track) {
      track.setAttribute('d', 'M42 194 A108 108 0 1 1 224 71');
      track.setAttribute('pathLength', '100');
    }

    const value = home.querySelector('.ring-value');
    if (value) {
      value.setAttribute('d', 'M132 22 A108 108 0 0 1 237 130');
      value.setAttribute('pathLength', '100');

      const inline = value.getAttribute('style') || '';
      const match = inline.match(/stroke-dasharray:\s*([0-9.]+)/);
      const raw = match ? Number(match[1]) : 0;
      const progress = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;

      value.style.strokeDasharray = `${progress} 100`;
      value.style.strokeDashoffset = '0';
    }
  }

  let raf = 0;
  function schedule() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(calibrateHome);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(screen, { childList: true, subtree: true });
  schedule();
})();
