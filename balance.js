(() => {
  const orb = document.querySelector('.nova-orb');
  const ring = document.querySelector('.ring-active');
  const metrics = [...document.querySelectorAll('.metric')];
  if (!orb || !metrics.length) return;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function readRatio(metric) {
    const text = metric.querySelector('strong')?.textContent || '';
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
    if (!match) return 0;
    const current = Number(match[1].replace(',', '.'));
    const max = Number(match[2].replace(',', '.'));
    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return 0;
    return clamp(current / max, 0, 1);
  }

  function updateBalance() {
    const ratios = metrics.map(readRatio);
    const balance = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
    const percent = Math.round(balance * 1000) / 10;
    const cssPercent = `${percent}%`;

    orb.style.setProperty('--nova-balance', cssPercent);
    ring?.style.setProperty('--nova-ring', cssPercent);
    orb.setAttribute('aria-label', `Баланс дня ${Math.round(percent)} процентов`);

    metrics.forEach((metric, index) => {
      const track = metric.querySelector('.metric-track i');
      if (track) track.style.width = `${Math.round(ratios[index] * 100)}%`;
    });
  }

  updateBalance();

  const observer = new MutationObserver(updateBalance);
  metrics.forEach(metric => observer.observe(metric, {subtree:true, childList:true, characterData:true}));

  window.NovaBalance = { update: updateBalance };
})();
