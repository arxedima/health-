(() => {
  'use strict';
  if (window.NovaOrbCoachV2) return;
  window.NovaOrbCoachV2 = true;

  const shell = document.getElementById('appShell');
  const stage = shell?.querySelector('.nova-stage');
  const orb = shell?.querySelector('.nova-orb');
  if (!shell || !stage || !orb) return;

  const DEFAULT_DETAILS = {
    sport: { steps: 7432 },
    water: { ml: 1500 },
    food: { kcal: 1540 },
    sleep: { minutes: 448 }
  };
  const DEFAULT_GOALS = { steps: 10000, water: 2000, kcal: 2000, sleep: 480 };

  let bubble = null;
  let hideTimer = 0;
  let lastMessage = '';

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch (_) { return fallback; }
  }

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function scoreAndRatios() {
    const details = { ...DEFAULT_DETAILS, ...read('nova.details', DEFAULT_DETAILS) };
    details.sport = { ...DEFAULT_DETAILS.sport, ...(details.sport || {}) };
    details.water = { ...DEFAULT_DETAILS.water, ...(details.water || {}) };
    details.food = { ...DEFAULT_DETAILS.food, ...(details.food || {}) };
    details.sleep = { ...DEFAULT_DETAILS.sleep, ...(details.sleep || {}) };
    const goals = { ...DEFAULT_GOALS, ...read('nova.goals', {}) };
    const foodRaw = Number(details.food.kcal || 0) / Math.max(Number(goals.kcal) || 1, 1);
    const ratios = {
      sport: clamp(Number(details.sport.steps || 0) / Math.max(Number(goals.steps) || 1, 1)),
      water: clamp(Number(details.water.ml || 0) / Math.max(Number(goals.water) || 1, 1)),
      food: clamp(1 - Math.abs(1 - foodRaw)),
      sleep: clamp(Number(details.sleep.minutes || 0) / Math.max(Number(goals.sleep) || 1, 1))
    };
    const fallback = Math.round((ratios.sport + ratios.water + ratios.food + ratios.sleep) / 4 * 100);
    const score = typeof window.NovaIntelligence?.currentScore === 'function'
      ? Number(window.NovaIntelligence.currentScore()) || fallback
      : fallback;
    return { score, ratios };
  }

  function firstName() {
    try {
      const profile = JSON.parse(localStorage.getItem('nova.profile') || '{}');
      return String(profile?.name || '').trim().split(/\s+/)[0].slice(0, 20);
    } catch (_) { return ''; }
  }

  function mood(score) {
    if (score < 45) return 'low';
    if (score < 75) return 'steady';
    return 'high';
  }

  function messages(score, ratios) {
    const weakest = Object.entries(ratios).sort((a, b) => a[1] - b[1])[0]?.[0];
    const labels = { sport: 'движению', water: 'воде', food: 'питанию', sleep: 'сну' };
    const weak = labels[weakest] || 'себе';
    const hour = new Date().getHours();
    const timeMessage = hour < 6
      ? 'Ночь тоже часть восстановления.'
      : hour < 12
        ? 'Хорошее утро начинается с одного действия.'
        : hour < 18
          ? 'День ещё можно сделать сильнее.'
          : 'Закрой день спокойно и без гонки.';

    if (score < 45) return [
      `Не гонись за идеалом. Добавь немного внимания ${weak}.`,
      'Один маленький шаг сейчас уже меняет сегодняшний день.',
      'Не начинай заново. Начни по-новому.',
      'Твой ритм не обязан быть идеальным. Он должен быть твоим.',
      timeMessage
    ];
    if (score < 75) return [
      `Баланс уже есть. Следующий небольшой шаг — к ${weak}.`,
      'Ты уже в движении. Главное — удержать ритм.',
      'Маленькие действия каждый день дают большие изменения.',
      'Сегодня достаточно быть немного лучше, чем вчера.',
      timeMessage
    ];
    return [
      `Nova Score ${score}. Сильный день — закрепи его.`,
      'Вот это ритм. Не ускоряйся — просто продолжай.',
      'Ты создаёшь новую версию себя прямо сейчас.',
      'Сохрани этот баланс до конца дня.',
      'Новая реальность начинается сейчас.'
    ];
  }

  function ensure() {
    if (!orb.querySelector('.nova-orb-face')) {
      const face = document.createElement('span');
      face.className = 'nova-orb-face';
      face.setAttribute('aria-hidden', 'true');
      face.innerHTML = `
        <svg class="nova-face-svg" viewBox="0 0 120 64" aria-hidden="true">
          <path class="nova-face-eye nova-face-eye-left" d="M17 24 Q30 34 44 24"/>
          <path class="nova-face-eye nova-face-eye-right" d="M76 24 Q90 34 103 24"/>
          <path class="nova-face-mouth" d="M49 45 Q60 54 71 45"/>
        </svg>`;
      orb.appendChild(face);
    }
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'nova-orb-talk';
      bubble.setAttribute('role', 'status');
      bubble.setAttribute('aria-live', 'polite');
      stage.appendChild(bubble);
    }

    orb.setAttribute('role', 'button');
    orb.setAttribute('tabindex', '0');
    orb.setAttribute('aria-hidden', 'false');
    orb.setAttribute('aria-label', 'Nova. Нажми, чтобы получить мотивацию');
  }

  function hide() {
    clearTimeout(hideTimer);
    orb.classList.remove('nova-coach-awake', 'nova-coach-blink', 'nova-coach-pop');
    stage.classList.remove('nova-coach-speaking');
    bubble?.classList.remove('show');
  }

  function show() {
    ensure();
    const { score, ratios } = scoreAndRatios();
    const currentMood = mood(score);
    let pool = messages(score, ratios);
    if (pool.length > 1 && lastMessage) pool = pool.filter(item => item !== lastMessage);
    const message = pool[Math.floor(Math.random() * pool.length)] || 'Продолжай. Ты движешься в правильную сторону.';
    lastMessage = message;
    const name = firstName();

    orb.dataset.coachMood = currentMood;
    bubble.textContent = name ? `${name}, ${message.charAt(0).toLowerCase()}${message.slice(1)}` : message;

    orb.classList.remove('nova-coach-awake', 'nova-coach-blink', 'nova-coach-pop');
    stage.classList.remove('nova-coach-speaking');
    bubble.classList.remove('show');
    void orb.offsetWidth;
    orb.classList.add('nova-coach-awake', 'nova-coach-blink', 'nova-coach-pop');
    stage.classList.add('nova-coach-speaking');
    bubble.classList.add('show');

    try { navigator.vibrate?.(18); } catch (_) {}
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 4300);
  }

  function syncMood() {
    const { score } = scoreAndRatios();
    orb.dataset.coachMood = mood(score);
  }

  ensure();
  syncMood();
  orb.addEventListener('click', show);
  orb.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      show();
    }
  });
  window.addEventListener('nova:data-changed', syncMood);
  window.addEventListener('storage', syncMood);

  window.NovaOrbCoach = { show, hide, sync: syncMood };
})();