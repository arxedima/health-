(() => {
  'use strict';

  const canvas = document.getElementById('irisCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const app = document.getElementById('app');
  const stage = document.getElementById('stage');
  const metricLabel = document.getElementById('metricLabel');
  const metricValue = document.getElementById('metricValue');
  const metricCaption = document.getElementById('metricCaption');
  const radialMenu = document.getElementById('radialMenu');
  const radialItems = [...document.querySelectorAll('.radial-item')];
  const touchRing = document.getElementById('touchRing');
  const motionHint = document.getElementById('motionHint');
  const modeDots = document.getElementById('modeDots');
  const settingsPanel = document.getElementById('settingsPanel');
  const settingsTrigger = document.getElementById('settingsTrigger');
  const insightPanel = document.getElementById('insightPanel');
  const modeWhisper = document.getElementById('modeWhisper');

  const MODES = {
    home: {
      label: 'ГЛАВНАЯ',
      value: '',
      caption: 'КОСНИСЬ ГЛАЗА',
      whisper: 'IRIS НАБЛЮДАЕТ',
      accent: [198, 220, 237],
      inner: [115, 146, 165],
      warm: [215, 197, 178]
    },
    sport: {
      label: 'СПОРТ',
      value: '24:17',
      caption: 'ТРЕНИРОВКА',
      whisper: 'ПУЛЬС · ДВИЖЕНИЕ',
      accent: [242, 102, 76],
      inner: [130, 55, 44],
      warm: [255, 183, 132]
    },
    water: {
      label: 'ВОДА',
      value: '1.2 Л',
      caption: 'СЕГОДНЯ',
      whisper: 'БАЛАНС ЖИДКОСТИ',
      accent: [112, 188, 238],
      inner: [46, 102, 153],
      warm: [192, 229, 255]
    },
    food: {
      label: 'ПИТАНИЕ',
      value: '1 420',
      caption: 'ККАЛ',
      whisper: 'ЭНЕРГИЯ ИЗ ЕДЫ',
      accent: [164, 189, 131],
      inner: [80, 105, 66],
      warm: [221, 183, 118]
    },
    sleep: {
      label: 'СОН',
      value: '7 Ч 24 М',
      caption: 'ПРОШЛОЙ НОЧЬЮ',
      whisper: 'ВОССТАНОВЛЕНИЕ',
      accent: [102, 132, 185],
      inner: [42, 58, 92],
      warm: [146, 165, 205]
    },
    insights: {
      label: 'ИТОГИ',
      value: '84',
      caption: 'ИНДЕКС ДНЯ',
      whisper: 'СВОДКА СОСТОЯНИЯ',
      accent: [208, 220, 229],
      inner: [82, 100, 114],
      warm: [198, 189, 181]
    }
  };

  const ORDER = ['home', 'sport', 'water', 'food', 'sleep', 'insights'];

  let mode = 'home';
  let currentAccent = MODES.home.accent.slice();
  let currentInner = MODES.home.inner.slice();
  let currentWarm = MODES.home.warm.slice();

  let W = 0;
  let H = 0;
  let DPR = 1;
  let center = { x: 0, y: 0 };
  let irisRadius = 132;
  let eyeOffset = { x: 0, y: 0 };
  let targetEyeOffset = { x: 0, y: 0 };
  let visualScale = 1;
  let targetVisualScale = 1;
  let eyeYOffset = 0;
  let targetEyeYOffset = 0;

  let fibers = [];
  let sparkles = [];
  let dust = [];
  let ripples = [];

  let pointer = {
    x: 0,
    y: 0,
    down: false,
    startX: 0,
    startY: 0,
    startT: 0,
    lastX: 0,
    lastY: 0,
    touchAngle: 0,
    touchDistance: 0
  };

  let holdTimer = null;
  let menuOpen = false;
  let menuSelection = null;
  let focusPulse = 0;
  let focusPulseX = 0;
  let focusPulseY = 0;
  let firstInteraction = false;
  let lastTapTime = 0;
  let pupilBoost = 0;

  function rand(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerpColor(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function rgb(arr, alpha = 1) { return `rgba(${arr[0] | 0},${arr[1] | 0},${arr[2] | 0},${alpha})`; }
  function angleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }
  function point(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function buildTexture() {
    fibers = [];
    const fiberCount = clamp(Math.floor(irisRadius * 4.2), 460, 760);
    for (let i = 0; i < fiberCount; i++) {
      fibers.push({
        angle: (i / fiberCount) * Math.PI * 2 + (rand(i) - 0.5) * 0.045,
        inner: 0.21 + rand(i * 3.7) * 0.16,
        outer: 0.70 + rand(i * 8.1) * 0.28,
        width: 0.22 + rand(i * 5.4) * 1.05,
        alpha: 0.06 + rand(i * 7.2) * 0.26,
        bend: (rand(i * 9.4) - 0.5) * 0.26,
        warm: rand(i * 11.1) > 0.82,
        seed: rand(i * 13.5)
      });
    }

    sparkles = [];
    for (let i = 0; i < 110; i++) {
      sparkles.push({
        angle: rand(i * 2.1) * Math.PI * 2,
        radius: irisRadius * (0.32 + rand(i * 5.4) * 0.55),
        size: 0.4 + rand(i * 8.2) * 1.25,
        alpha: 0.03 + rand(i * 9.3) * 0.18
      });
    }

    dust = [];
    for (let i = 0; i < 100; i++) {
      dust.push({
        angle: rand(i * 1.9) * Math.PI * 2,
        radius: irisRadius * (0.94 + rand(i * 3.1) * 0.35),
        size: 0.5 + rand(i * 4.9) * 1.5,
        alpha: 0.04 + rand(i * 7.7) * 0.16
      });
    }
  }

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    center.x = W / 2;
    center.y = H * 0.455;
    irisRadius = Math.min(W * 0.40, H * 0.24, 210);
    buildTexture();
  }

  function updatePalette() {
    const cfg = MODES[mode];
    currentAccent = lerpColor(currentAccent, cfg.accent, 0.028);
    currentInner = lerpColor(currentInner, cfg.inner, 0.028);
    currentWarm = lerpColor(currentWarm, cfg.warm, 0.028);
    document.documentElement.style.setProperty('--accent', `${currentAccent[0] | 0} ${currentAccent[1] | 0} ${currentAccent[2] | 0}`);
  }

  function syncUI() {
    const cfg = MODES[mode];
    metricLabel.textContent = cfg.label;
    metricValue.textContent = cfg.value;
    metricCaption.textContent = cfg.caption;
    modeWhisper.textContent = cfg.whisper;
    app.className = 'app';
    app.classList.add(`mode-${mode}`);
    if (menuOpen) app.classList.add('menu-open');
    if (settingsPanel.classList.contains('open')) app.classList.add('settings-open');
    insightPanel.classList.toggle('visible', mode === 'insights');
    insightPanel.setAttribute('aria-hidden', mode === 'insights' ? 'false' : 'true');
    targetVisualScale = mode === 'insights' ? 0.68 : 1;
    targetEyeYOffset = mode === 'insights' ? -H * 0.11 : 0;
  }

  function renderDots() {
    modeDots.innerHTML = '';
    ORDER.forEach((m) => {
      const span = document.createElement('span');
      if (m === mode) span.className = 'active';
      modeDots.appendChild(span);
    });
    modeDots.classList.toggle('visible', mode !== 'home');
  }

  function hideHint() {
    if (firstInteraction) return;
    firstInteraction = true;
    motionHint.classList.add('hidden');
  }

  function pulseAt(x, y) {
    focusPulse = 0.05;
    focusPulseX = x;
    focusPulseY = y;
    touchRing.style.left = `${x}px`;
    touchRing.style.top = `${y}px`;
    touchRing.classList.remove('pulse');
    void touchRing.offsetWidth;
    touchRing.classList.add('pulse');
    ripples.push({ x, y, life: 1 });
    pupilBoost = 1;
  }

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menuSelection = null;
    radialMenu.classList.add('open');
    radialMenu.setAttribute('aria-hidden', 'false');
    app.classList.add('menu-open');
    pupilBoost = 1.15;
    try { navigator.vibrate && navigator.vibrate(12); } catch (e) {}
    hideHint();
  }

  function closeMenu(commit = true) {
    if (!menuOpen) return;
    if (commit && menuSelection) setMode(menuSelection);
    menuOpen = false;
    menuSelection = null;
    radialItems.forEach((i) => i.classList.remove('active'));
    radialMenu.classList.remove('open');
    radialMenu.setAttribute('aria-hidden', 'true');
    app.classList.remove('menu-open');
  }

  function updateMenuSelection(x, y) {
    if (!menuOpen) return;
    const dx = x - center.x;
    const dy = y - (center.y + eyeYOffset);
    const dist = Math.hypot(dx, dy);
    if (dist < irisRadius * 0.36) {
      menuSelection = null;
    } else {
      const angle = Math.atan2(dy, dx);
      if (angle > -Math.PI * 0.25 && angle <= Math.PI * 0.25) menuSelection = 'food';
      else if (angle > Math.PI * 0.25 && angle <= Math.PI * 0.75) menuSelection = 'sleep';
      else if (angle <= -Math.PI * 0.25 && angle > -Math.PI * 0.75) menuSelection = 'sport';
      else menuSelection = 'water';
    }
    radialItems.forEach((i) => i.classList.toggle('active', i.dataset.mode === menuSelection));
  }

  function setMode(next, reason = 'gesture') {
    if (!MODES[next]) return;
    mode = next;
    pupilBoost = 1;
    syncUI();
    renderDots();
    if (reason !== 'init') hideHint();
    try { navigator.vibrate && navigator.vibrate(8); } catch (e) {}
  }

  function openSettings() {
    settingsPanel.classList.add('open');
    settingsPanel.setAttribute('aria-hidden', 'false');
    app.classList.add('settings-open');
    hideHint();
  }

  function closeSettings() {
    settingsPanel.classList.remove('open');
    settingsPanel.setAttribute('aria-hidden', 'true');
    app.classList.remove('settings-open');
  }

  function handlePointerDown(e) {
    const p = point(e);
    pointer.down = true;
    pointer.startX = p.x;
    pointer.startY = p.y;
    pointer.lastX = p.x;
    pointer.lastY = p.y;
    pointer.startT = performance.now();
    pointer.x = p.x;
    pointer.y = p.y;
    const dx = p.x - center.x;
    const dy = p.y - (center.y + eyeYOffset);
    pointer.touchAngle = Math.atan2(dy, dx);
    pointer.touchDistance = Math.hypot(dx, dy);

    targetEyeOffset.x = clamp((dx / Math.max(W, 1)) * 28, -16, 16);
    targetEyeOffset.y = clamp((dy / Math.max(H, 1)) * 28, -14, 14);

    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      if (pointer.down) openMenu();
    }, 600);
  }

  function handlePointerMove(e) {
    const p = point(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.lastX = p.x;
    pointer.lastY = p.y;
    const dx = p.x - center.x;
    const dy = p.y - (center.y + eyeYOffset);
    pointer.touchAngle = Math.atan2(dy, dx);
    pointer.touchDistance = Math.hypot(dx, dy);

    targetEyeOffset.x = clamp((dx / Math.max(W, 1)) * 30, -18, 18);
    targetEyeOffset.y = clamp((dy / Math.max(H, 1)) * 30, -16, 16);

    if (pointer.down && Math.hypot(p.x - pointer.startX, p.y - pointer.startY) > 16 && !menuOpen) {
      clearTimeout(holdTimer);
    }

    if (menuOpen) updateMenuSelection(p.x, p.y);
  }

  function handlePointerUp(e) {
    const p = point(e);
    clearTimeout(holdTimer);

    const dt = performance.now() - pointer.startT;
    const dx = p.x - pointer.startX;
    const dy = p.y - pointer.startY;
    const dist = Math.hypot(dx, dy);

    pointer.down = false;
    targetEyeOffset.x = 0;
    targetEyeOffset.y = 0;

    if (menuOpen) {
      closeMenu(true);
      return;
    }

    if (dt < 420 && dist < 24) {
      const now = performance.now();
      pulseAt(p.x, p.y);
      hideHint();
      if (now - lastTapTime < 320) {
        openSettings();
        lastTapTime = 0;
        return;
      }
      lastTapTime = now;
      if (mode === 'home') {
        metricCaption.textContent = 'УДЕРЖИВАЙ ДЛЯ МЕНЮ';
        setTimeout(() => {
          if (mode === 'home') metricCaption.textContent = MODES.home.caption;
        }, 1400);
      }
      return;
    }

    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      const i = ORDER.indexOf(mode);
      const next = dx < 0 ? ORDER[(i + 1) % ORDER.length] : ORDER[(i - 1 + ORDER.length) % ORDER.length];
      setMode(next);
      return;
    }

    if (dy < -90 && Math.abs(dy) > Math.abs(dx) * 1.1) {
      setMode('insights');
      return;
    }

    if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.1) {
      openSettings();
    }
  }

  function drawBackground(t, cx, cy, R) {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(cx, cy, R * 0.18, cx, cy, R * 2.9);
    bg.addColorStop(0, rgb(currentAccent, 0.06));
    bg.addColorStop(0.32, rgb(currentAccent, 0.022));
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const veil = ctx.createLinearGradient(0, cy - R * 2.2, 0, cy + R * 2.2);
    veil.addColorStop(0, 'rgba(255,255,255,0)');
    veil.addColorStop(0.48, rgb(currentAccent, 0.015));
    veil.addColorStop(0.52, rgb(currentAccent, 0.015));
    veil.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = veil;
    ctx.fillRect(cx - R * 1.8, cy - R * 2.4, R * 3.6, R * 4.8);
    ctx.restore();

    ripples = ripples.filter((r) => r.life > 0.01);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ripples.forEach((r) => {
      const rr = (1 - r.life) * 220;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
      ctx.strokeStyle = rgb(currentAccent, r.life * 0.07);
      ctx.lineWidth = 1;
      ctx.stroke();
      r.life *= 0.958;
    });
    ctx.restore();
  }

  function drawModeOverlay(t, cx, cy, R) {
    if (mode === 'sport') {
      const progress = 0.74;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.09, -Math.PI * 0.7, Math.PI * 1.3);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1.35;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.09, -Math.PI * 0.7, -Math.PI * 0.7 + Math.PI * 2 * progress);
      ctx.strokeStyle = rgb(currentAccent, 0.95);
      ctx.lineWidth = 1.9;
      ctx.shadowBlur = 12;
      ctx.shadowColor = rgb(currentAccent, 0.45);
      ctx.stroke();
      const a = -Math.PI * 0.7 + Math.PI * 2 * progress;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * R * 1.09, cy + Math.sin(a) * R * 1.09, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }

    if (mode === 'water') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = rgb(currentWarm, 0.14);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const x = cx - R * 1.06 + (R * 2.12 * i) / 40;
        const y = cy + R * 0.84 + Math.sin((i / 40) * Math.PI * 2 + t * 0.0024) * (R * 0.04);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.00045;
        const r = R * (1.05 + (i % 3) * 0.05);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.6 + (i % 2), 0, Math.PI * 2);
        ctx.fillStyle = rgb(currentWarm, 0.13);
        ctx.fill();
      }
      ctx.restore();
    }

    if (mode === 'food') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 18; i++) {
        const a = rand(i * 2.4) * Math.PI * 2 + t * 0.00025 * (i % 2 ? 1 : -1);
        const r = R * (0.95 + rand(i * 3.7) * 0.22);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.2 + rand(i * 8.1) * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? rgb(currentWarm, 0.14) : rgb(currentAccent, 0.11);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawEye(t) {
    const breathe = 1 + Math.sin(t * 0.00085) * 0.012;
    const R = irisRadius * breathe * visualScale;
    const cx = center.x + eyeOffset.x;
    const cy = center.y + eyeYOffset + eyeOffset.y;

    drawBackground(t, cx, cy, R);

    drawModeOverlay(t, cx, cy, R);

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < 7; i++) {
      const rr = R * (1.02 + i * 0.047);
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, Math.PI * 2);
      ctx.strokeStyle = rgb(currentAccent, 0.055 - i * 0.0065);
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    const irisGrad = ctx.createRadialGradient(0, 0, R * 0.10, 0, 0, R * 1.02);
    irisGrad.addColorStop(0, 'rgba(0,0,0,0.995)');
    irisGrad.addColorStop(0.18, rgb(currentInner, 0.82));
    irisGrad.addColorStop(0.38, rgb(currentAccent, 0.42));
    irisGrad.addColorStop(0.72, rgb(currentInner, 0.34));
    irisGrad.addColorStop(1, 'rgba(2,4,6,0.08)');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.995, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';

    for (let k = 0; k < 11; k++) {
      const rr = R * (0.26 + k * 0.067);
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, Math.PI * 2);
      ctx.strokeStyle = rgb(currentAccent, 0.022 + (k % 3) * 0.010);
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }

    for (let i = 0; i < fibers.length; i++) {
      const f = fibers[i];
      const jitter = Math.sin(t * 0.00125 + f.seed * 20) * 0.009;
      const a = f.angle + jitter;
      const influence = pointer.down || focusPulse > 0
        ? Math.exp(-Math.pow(angleDiff(a, pointer.touchAngle), 2) / 0.16) * clamp(1.15 - pointer.touchDistance / (R * 1.2), 0, 1)
        : 0;
      const pull = influence * 0.18;
      const r1 = R * (f.inner - pull * 0.02);
      const r2 = R * (f.outer + pull * 0.03);
      const x1 = Math.cos(a) * r1;
      const y1 = Math.sin(a) * r1;
      const x2 = Math.cos(a + f.bend + influence * 0.02) * r2;
      const y2 = Math.sin(a + f.bend + influence * 0.02) * r2;
      const midR = (r1 + r2) * 0.52;
      const ma = a + f.bend * 0.38 + Math.sin(f.seed * 18 + t * 0.0005) * 0.014;
      const mx = Math.cos(ma) * midR;
      const my = Math.sin(ma) * midR;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      const alphaBoost = 1 + influence * 0.95;
      ctx.strokeStyle = f.warm ? rgb(currentWarm, f.alpha * 0.74 * alphaBoost) : rgb(currentAccent, f.alpha * alphaBoost);
      ctx.lineWidth = f.width + influence * 0.55;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 50; i++) {
      const a = (i / 50) * Math.PI * 2 + rand(i * 14.4) * 0.1;
      const r1 = R * (0.36 + rand(i * 4.5) * 0.16);
      const r2 = R * (0.66 + rand(i * 9.8) * 0.22);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a + 0.03 * (rand(i) - 0.5)) * r2, Math.sin(a + 0.03 * (rand(i) - 0.5)) * r2);
      ctx.strokeStyle = `rgba(0,0,0,${0.13 + rand(i * 7.1) * 0.2})`;
      ctx.lineWidth = 0.7 + rand(i * 3.2) * 1.5;
      ctx.stroke();
    }

    sparkles.forEach((s, i) => {
      const a = s.angle + t * 0.00022 * (i % 2 ? 1 : -1);
      const x = Math.cos(a) * s.radius;
      const y = Math.sin(a) * s.radius;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = i % 4 === 0 ? rgb(currentWarm, s.alpha) : rgb(currentAccent, s.alpha * 0.9);
      ctx.fill();
    });

    const caustic = ctx.createLinearGradient(-R * 0.7, -R * 0.55, R * 0.8, R * 0.7);
    caustic.addColorStop(0, 'rgba(255,255,255,0.12)');
    caustic.addColorStop(0.25, 'rgba(255,255,255,0.02)');
    caustic.addColorStop(0.65, rgb(currentAccent, 0.08));
    caustic.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = caustic;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.98, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const rim = ctx.createRadialGradient(0, 0, R * 0.82, 0, 0, R * 1.06);
    rim.addColorStop(0, 'rgba(0,0,0,0)');
    rim.addColorStop(0.78, rgb(currentAccent, 0.06));
    rim.addColorStop(0.91, 'rgba(2,5,7,0.72)');
    rim.addColorStop(1, 'rgba(0,0,0,0.98)');
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.06, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, R * 0.995, 0, Math.PI * 2);
    ctx.strokeStyle = rgb(currentAccent, 0.17);
    ctx.lineWidth = 0.85;
    ctx.stroke();

    const pupilR = R * (menuOpen ? 0.29 : 0.22 + Math.sin(t * 0.00055) * 0.008 + pupilBoost * 0.03);
    const pupilGrad = ctx.createRadialGradient(-pupilR * 0.16, -pupilR * 0.18, pupilR * 0.04, 0, 0, pupilR * 1.18);
    pupilGrad.addColorStop(0, 'rgba(6,8,10,1)');
    pupilGrad.addColorStop(0.72, 'rgba(0,0,0,1)');
    pupilGrad.addColorStop(1, rgb(currentAccent, 0.04));
    ctx.beginPath();
    ctx.arc(0, 0, pupilR, 0, Math.PI * 2);
    ctx.fillStyle = pupilGrad;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, pupilR * 1.02, 0, Math.PI * 2);
    ctx.strokeStyle = rgb(currentAccent, 0.18);
    ctx.lineWidth = 0.7;
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const hx = -R * 0.24;
    const hy = -R * 0.30;
    const highlight = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.16);
    highlight.addColorStop(0, 'rgba(255,255,255,0.37)');
    highlight.addColorStop(0.18, 'rgba(255,255,255,0.14)');
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(hx, hy, R * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(R * 0.28, -R * 0.18, R * 0.018, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
    ctx.restore();

    if (focusPulse > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 3; i++) {
        const pr = focusPulse * R * (0.48 + i * 0.16);
        ctx.beginPath();
        ctx.arc(focusPulseX - cx, focusPulseY - cy, pr, 0, Math.PI * 2);
        ctx.strokeStyle = rgb(currentAccent, 0.22 * (1 - focusPulse));
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
      ctx.restore();
    }

    if (pointer.down || menuOpen) {
      const localA = pointer.touchAngle;
      const localR = Math.min(R * 0.82, Math.max(pointer.touchDistance * 0.86, R * 0.28));
      const tx = Math.cos(localA) * localR;
      const ty = Math.sin(localA) * localR;
      const touchGlow = ctx.createRadialGradient(tx, ty, 0, tx, ty, R * 0.28);
      touchGlow.addColorStop(0, rgb(currentWarm, 0.20));
      touchGlow.addColorStop(0.25, rgb(currentAccent, 0.09));
      touchGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = touchGlow;
      ctx.beginPath();
      ctx.arc(tx, ty, R * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (mode === 'sleep') {
      const close = 0.39 + Math.sin(t * 0.00055) * 0.015;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.985)';
      ctx.beginPath();
      ctx.ellipse(0, -R * (1.05 - close), R * 1.36, R * 0.84, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, R * (1.05 - close), R * 1.36, R * 0.84, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, R * 0.02, R * 0.93, Math.PI * 0.08, Math.PI * 0.92);
      ctx.strokeStyle = rgb(currentAccent, 0.22);
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    dust.forEach((d, i) => {
      const a = d.angle + t * 0.000015 * (i % 2 ? 1 : -1);
      const rr = d.radius * (1 + Math.sin(t * 0.0007 + i) * 0.012);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      ctx.beginPath();
      ctx.arc(x, y, d.size, 0, Math.PI * 2);
      ctx.fillStyle = rgb(currentAccent, d.alpha);
      ctx.fill();
    });
    ctx.restore();
  }

  function render(t) {
    updatePalette();
    eyeOffset.x += (targetEyeOffset.x - eyeOffset.x) * 0.08;
    eyeOffset.y += (targetEyeOffset.y - eyeOffset.y) * 0.08;
    eyeYOffset += (targetEyeYOffset - eyeYOffset) * 0.06;
    visualScale += (targetVisualScale - visualScale) * 0.06;
    pupilBoost += (0 - pupilBoost) * 0.04;
    focusPulse = Math.max(0, focusPulse - 0.018);
    drawEye(t);
    requestAnimationFrame(render);
  }

  radialItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      menuSelection = item.dataset.mode;
      closeMenu(true);
    });
  });

  settingsTrigger.addEventListener('click', openSettings);
  document.querySelectorAll('[data-close-settings]').forEach((el) => el.addEventListener('click', closeSettings));

  stage.addEventListener('pointerdown', handlePointerDown, { passive: true });
  stage.addEventListener('pointermove', handlePointerMove, { passive: true });
  stage.addEventListener('pointerup', handlePointerUp, { passive: true });
  stage.addEventListener('pointercancel', () => {
    pointer.down = false;
    clearTimeout(holdTimer);
    closeMenu(false);
    targetEyeOffset.x = 0;
    targetEyeOffset.y = 0;
  }, { passive: true });

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pointer.down = false;
      clearTimeout(holdTimer);
      closeMenu(false);
    }
  });

  resize();
  syncUI();
  renderDots();
  setMode('home', 'init');
  requestAnimationFrame(render);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
