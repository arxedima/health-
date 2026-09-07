(() => {
  'use strict';
  if (window.NovaDepthPremium) return;

  const app = document.getElementById('appShell');
  const ORDER = ['sport', 'food', 'water', 'sleep'];
  const META = {
    sport: { title: 'Спорт', subtitle: 'Движение делает жизнь ярче', cta: 'Начать тренировку' },
    food: { title: 'Питание', subtitle: 'Хорошая еда даёт энергию', cta: 'Сфотографировать еду' },
    water: { title: 'Вода', subtitle: 'Маленькие шаги к большему', cta: 'Добавить воду' },
    sleep: { title: 'Сон', subtitle: 'Больше отдыха — больше возможностей', cta: 'Начать сон' }
  };
  const DEFAULT_DETAILS = {
    sport: { steps: 7432, calories: 320, minutes: 42 },
    water: { ml: 1500 },
    food: { kcal: 1540, protein: 120, fat: 56, carbs: 180 },
    sleep: { minutes: 448, quality: 91, mode: false }
  };
  const DEFAULT_GOALS = { steps: 10000, water: 2000, kcal: 2000, sleep: 480 };
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? JSON.parse(JSON.stringify(fallback)); } catch (_) { return JSON.parse(JSON.stringify(fallback)); } };
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, Number(v) || 0));
  const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(Number(n) || 0));
  const sleepText = minutes => { const m = Math.max(0, Math.round(Number(minutes) || 0)); return `${Math.floor(m / 60)} ч ${String(m % 60).padStart(2, '0')} мин`; };

  function stateFor(kind) {
    const d = read('nova.details', DEFAULT_DETAILS);
    const g = { ...DEFAULT_GOALS, ...read('nova.goals', {}) };
    if (kind === 'sport') return { progress: clamp(d.sport.steps / Math.max(g.steps, 1)), value: fmt(d.sport.steps), sub: `шага из ${fmt(g.steps)}` };
    if (kind === 'food') return { progress: clamp(d.food.kcal / Math.max(g.kcal, 1)), value: fmt(d.food.kcal), sub: `ккал из ${fmt(g.kcal)}` };
    if (kind === 'water') return { progress: clamp(d.water.ml / Math.max(g.water, 1)), value: `${(d.water.ml / 1000).toFixed(1).replace('.', ',')} л`, sub: `из ${(g.water / 1000).toFixed(1).replace('.', ',')} л` };
    return { progress: clamp(d.sleep.minutes / Math.max(g.sleep, 1)), value: sleepText(d.sleep.minutes), sub: `из ${Math.round(g.sleep / 60)} часов` };
  }

  function symbol(kind) {
    if (kind === 'sport') return `<svg viewBox="0 0 96 96" class="dvp-symbol-svg" aria-hidden="true"><defs><radialGradient id="dvpSportFill" cx="30%" cy="22%" r="86%"><stop offset="0" stop-color="#ffffff"/><stop offset=".22" stop-color="#9ed8ff"/><stop offset=".58" stop-color="#258bf1"/><stop offset="1" stop-color="#075dd0"/></radialGradient><filter id="dvpSportGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g fill="url(#dvpSportFill)" filter="url(#dvpSportGlow)"><circle cx="65" cy="16" r="8"/><path d="M51 29 37 43l-12-4-5 9 17 7 9-8 6 9-11 11-13 14 9 6 15-15 9-8 7 6 6 15 10-4-8-20-14-12-9-16 5-5 10 5 5-11-14-8c-6-3-10-1-13 3Z"/></g></svg>`;
    if (kind === 'food') return `<svg viewBox="0 0 96 96" class="dvp-symbol-svg" aria-hidden="true"><defs><radialGradient id="dvpFoodFill" cx="28%" cy="18%" r="90%"><stop offset="0" stop-color="#eafff4"/><stop offset=".3" stop-color="#80edbd"/><stop offset=".63" stop-color="#26c779"/><stop offset="1" stop-color="#079152"/></radialGradient><filter id="dvpFoodGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#dvpFoodGlow)"><path d="M78 14C47 16 23 31 17 55c-5 19 10 29 26 26 29-5 43-34 35-67Z" fill="url(#dvpFoodFill)"/><path d="M25 74C43 61 58 44 71 24" fill="none" stroke="rgba(255,255,255,.86)" stroke-width="4" stroke-linecap="round"/><path d="M43 59c9-2 17-7 24-14" fill="none" stroke="rgba(255,255,255,.36)" stroke-width="2.3" stroke-linecap="round"/></g></svg>`;
    if (kind === 'water') return `<svg viewBox="0 0 96 96" class="dvp-symbol-svg" aria-hidden="true"><defs><radialGradient id="dvpWaterFill" cx="28%" cy="18%" r="88%"><stop offset="0" stop-color="#ffffff"/><stop offset=".22" stop-color="#d6f7ff"/><stop offset=".52" stop-color="#58c7ff"/><stop offset=".78" stop-color="#167ee7"/><stop offset="1" stop-color="#0958c6"/></radialGradient><radialGradient id="dvpWaterShine" cx="25%" cy="20%" r="52%"><stop offset="0" stop-color="#fff" stop-opacity=".98"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="dvpWaterGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#dvpWaterGlow)"><path d="M48 8C40 24 25 40 25 58a23 23 0 0 0 46 0C71 40 56 24 48 8Z" fill="url(#dvpWaterFill)"/><path d="M36 55c1-8 6-16 13-25-4 15-2 27 6 37-10 2-21-3-19-12Z" fill="url(#dvpWaterShine)" opacity=".83"/></g></svg>`;
    return `<svg viewBox="0 0 96 96" class="dvp-symbol-svg" aria-hidden="true"><defs><radialGradient id="dvpMoonFill" cx="30%" cy="22%" r="88%"><stop offset="0" stop-color="#ffffff"/><stop offset=".2" stop-color="#efe8ff"/><stop offset=".52" stop-color="#c8b3ff"/><stop offset=".8" stop-color="#8d6af0"/><stop offset="1" stop-color="#6545d4"/></radialGradient><filter id="dvpMoonGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><mask id="dvpMoonMask"><rect width="96" height="96" fill="#000"/><circle cx="46" cy="47" r="31" fill="#fff"/><circle cx="62" cy="35" r="30" fill="#000"/></mask></defs><g filter="url(#dvpMoonGlow)"><circle cx="46" cy="47" r="31" fill="url(#dvpMoonFill)" mask="url(#dvpMoonMask)"/><ellipse cx="34" cy="30" rx="12" ry="9" fill="rgba(255,255,255,.46)" mask="url(#dvpMoonMask)"/></g></svg>`;
  }

  function ctaIcon(kind) {
    if (kind === 'sport') return '<span class="dvp-cta-circle">▶</span>';
    if (kind === 'water') return '<span class="dvp-cta-plus">＋</span>';
    if (kind === 'sleep') return '<span class="dvp-cta-moon">☾</span>';
    return '<span class="dvp-cta-camera">⌾</span>';
  }

  function build(kind) {
    const m = META[kind]; const s = stateFor(kind); const pct = Math.round(s.progress * 100);
    return `<div class="dvp-premium" data-dvp-kind="${kind}" style="--dvp-progress:${pct}"><div class="dvp-bubble dvp-b1"></div><div class="dvp-bubble dvp-b2"></div><div class="dvp-bubble dvp-b3"></div><header class="dvp-heading"><div class="dvp-title-row"><span class="dvp-heading-icon">${symbol(kind)}</span><h1>${m.title}</h1></div><p>${m.subtitle}</p></header><section class="dvp-stage" aria-label="${m.title}: ${pct}% цели"><svg class="dvp-ring" viewBox="0 0 300 170" aria-hidden="true"><path class="dvp-ring-track" pathLength="100" d="M32 146 A118 118 0 0 1 268 146"/><path class="dvp-ring-value" pathLength="100" d="M32 146 A118 118 0 0 1 268 146"/></svg><div class="dvp-orb"><span class="dvp-orb-depth"></span>${kind === 'water' ? '<span class="dvp-liquid"></span><span class="dvp-water-wave dvp-wa"></span><span class="dvp-water-wave dvp-wb"></span>' : '<span class="dvp-caustic dvp-ca"></span><span class="dvp-caustic dvp-cb"></span>'}<span class="dvp-glint"></span><span class="dvp-rim"></span><span class="dvp-symbol">${symbol(kind)}</span></div></section><div class="dvp-value"><strong>${s.value}</strong><span>${s.sub}</span></div><button class="dvp-cta" type="button" data-dvp-cta="${kind}">${ctaIcon(kind)}<span>${m.cta}</span></button></div>`;
  }

  function inferKind(hero) { return ORDER.find(k => hero.classList.contains(`dv2-${k}`)) || null; }
  function enhanceHero(hero) {
    if (!hero || hero.dataset.dvpEnhanced === '1') return;
    const kind = inferKind(hero); if (!kind) return;
    hero.dataset.dvpEnhanced = '1'; hero.innerHTML = build(kind);
    const path = hero.querySelector('.dvp-ring-value'); const progress = Math.round(stateFor(kind).progress * 100);
    path.style.strokeDasharray = '0 100'; requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDasharray = `${progress} 100`; }));
    const depth = hero.closest('.depth-v2'); if (depth) { ORDER.forEach(k => depth.classList.remove(`dvp-screen-${k}`)); depth.classList.add(`dvp-screen-${kind}`); depth.classList.toggle('dvp-dark', !!app?.classList.contains('dark')); }
  }
  function enhanceAll() { document.querySelectorAll('.depth-v2 .dv2-hero').forEach(enhanceHero); }
  function runCta(kind) {
    if (kind === 'sport') return document.querySelector('.depth-v2:not([hidden]) [data-v2-timer]')?.click();
    if (kind === 'water') return document.querySelector('.depth-v2:not([hidden]) [data-v2-water="250"]')?.click();
    if (kind === 'food') return document.querySelector('.depth-v2:not([hidden]) [data-v2-food-camera]')?.click();
    if (kind === 'sleep') return document.querySelector('.depth-v2:not([hidden]) [data-v2-sleep]')?.click();
  }
  document.addEventListener('click', event => { const cta = event.target.closest('[data-dvp-cta]'); if (!cta) return; event.preventDefault(); event.stopImmediatePropagation(); runCta(cta.dataset.dvpCta); }, true);
  new MutationObserver(() => enhanceAll()).observe(document.body, { childList: true, subtree: true });
  if (app) new MutationObserver(() => document.querySelectorAll('.depth-v2').forEach(depth => depth.classList.toggle('dvp-dark', app.classList.contains('dark')))).observe(app, { attributes: true, attributeFilter: ['class'] });
  enhanceAll();
  window.NovaDepthPremium = { refresh: enhanceAll };
})();