(() => {
  'use strict';
  if (window.NovaOnboardingV2) return;
  window.NovaOnboardingV2 = true;

  const DONE_KEY = 'nova.onboarding.v1';
  const PROFILE_KEY = 'nova.profile';
  const THEME_KEY = 'nova.theme';
  const params = new URLSearchParams(location.search);
  const force = params.get('onboarding') === '1';
  const forcedTheme = ['dark','light'].includes(params.get('theme')) ? params.get('theme') : null;
  const shouldOpen = force || !localStorage.getItem(DONE_KEY);
  const DEFAULT_PROFILE = { name: '', height: '', weight: '', goal: '' };
  const GOAL_LABEL = { health:'Здоровье', shape:'Форма', lose:'Снизить вес', gain:'Набрать массу', energy:'Больше энергии', recovery:'Восстановление' };
  const phrases = [
    ['NOVA', 'Новая реальность начинается с маленького действия.'],
    ['Новая жизнь.', ''], ['Новые привычки.', ''], ['Новое тело.', ''], ['Новая энергия.', ''], ['Новый ритм.', ''], ['Новый ты.', ''],
    ['Не начинай заново.', ''], ['Начни по-новому.', ''],
    ['Следи за собой.', ''], ['Двигайся.', ''], ['Ешь лучше.', ''], ['Пей воду.', ''], ['Восстанавливайся.', ''], ['Спи.', ''],
    ['Маленькие действия.', ''], ['Каждый день.', ''], ['Большие изменения.', ''],
    ['Твоя жизнь — в твоих руках.', ''],
    ['NOVA', 'Новая реальность начинается сейчас.']
  ];

  let root = null, idx = 0, timer = 0, running = false, theme = initialTheme();

  function safeGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function initialTheme() {
    if (forcedTheme) return forcedTheme;
    const stored = safeGet(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const readProfile = () => { try { return { ...DEFAULT_PROFILE, ...(JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')) }; } catch (_) { return { ...DEFAULT_PROFILE }; } };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  function themeSwitch() {
    return `<div class="onb-theme-switch" role="group" aria-label="Тема оформления">
      <button type="button" data-onb-theme="light" aria-label="Светлая тема"><span>☀</span><b>Свет</b></button>
      <button type="button" data-onb-theme="dark" aria-label="Тёмная тема"><span>☾</span><b>Тьма</b></button>
    </div>`;
  }

  function markup() {
    const p = readProfile();
    return `<section class="nova-onboarding" data-theme="${theme}" role="dialog" aria-modal="true" aria-label="Знакомство с Nova+">
      <section class="onb-screen onb-intro active" data-onb-screen="intro">
        <header class="onb-top"><div class="onb-logo">Nova<i>+</i></div>${themeSwitch()}<button class="onb-skip" type="button" data-onb-skip-intro>Пропустить</button></header>
        <div class="onb-intro-copy"><div class="onb-kicker">Большая жизнь<br>начинается здесь</div></div>
        <div class="onb-intro-stage">
          <span class="onb-bubble onb-b1"></span><span class="onb-bubble onb-b2"></span><span class="onb-bubble onb-b3"></span>
          <div class="onb-core-orb" aria-hidden="true"></div>
          <div class="onb-stream s1"><span>Спорт</span></div><div class="onb-stream s2"><span>Вода</span></div><div class="onb-stream s3"><span>Сон · Энергия · Баланс</span></div><div class="onb-stream s4"><span>Питание · Фокус</span></div>
          <div class="onb-fast-word" data-onb-word>NOVA</div><div class="onb-fast-sub" data-onb-sub>Новая реальность начинается с маленького действия.</div>
        </div>
        <div class="onb-intro-bottom"><p class="onb-caption">Больше, чем привычки.<br>Лучшая версия тебя.</p><div class="onb-dots"><i class="active"></i><i></i></div><button class="onb-primary" type="button" data-onb-next>Продолжить <span class="arrow">→</span></button></div>
      </section>
      <section class="onb-screen onb-profile" data-onb-screen="profile">
        <header class="onb-top"><div class="onb-logo">Nova<i>+</i></div>${themeSwitch()}<button class="onb-skip" type="button" data-onb-skip-profile>Пропустить</button></header>
        <div class="onb-stepbar"><i></i><i class="active"></i></div><div class="onb-step-label">Шаг 2 из 2</div>
        <div class="onb-profile-head"><h1>Расскажите о себе</h1><p>Эти данные помогут персонализировать план для спорта, воды, питания и сна.</p></div>
        <form class="onb-form" data-onb-form>
          <label class="onb-field"><span>Имя</span><div class="onb-input"><span class="ico">♙</span><input name="name" autocomplete="name" maxlength="32" placeholder="Например, Дмитрий" value="${esc(p.name)}"></div></label>
          <label class="onb-field"><span>Рост</span><div class="onb-input"><span class="ico">⌇</span><input name="height" inputmode="decimal" type="number" min="100" max="250" step="1" placeholder="Например, 180" value="${esc(p.height)}"><span class="unit">см</span></div></label>
          <label class="onb-field"><span>Вес</span><div class="onb-input"><span class="ico">▣</span><input name="weight" inputmode="decimal" type="number" min="25" max="350" step="0.1" placeholder="Например, 75" value="${esc(p.weight)}"><span class="unit">кг</span></div></label>
          <label class="onb-field"><span>Цель</span><div class="onb-input"><span class="ico">◎</span><select name="goal"><option value="">Выберите цель</option><option value="health" ${p.goal==='health'?'selected':''}>Улучшить здоровье</option><option value="shape" ${p.goal==='shape'?'selected':''}>Быть в форме</option><option value="lose" ${p.goal==='lose'?'selected':''}>Снизить вес</option><option value="gain" ${p.goal==='gain'?'selected':''}>Набрать массу</option><option value="energy" ${p.goal==='energy'?'selected':''}>Больше энергии</option><option value="recovery" ${p.goal==='recovery'?'selected':''}>Восстановление</option></select><span class="chev">⌄</span></div></label>
          <div class="onb-profile-action"><button class="onb-primary" type="submit">Начать <span class="arrow">→</span></button><p class="onb-profile-note">Данные хранятся локально на этом устройстве и их можно изменить позже.</p></div>
        </form>
      </section>
    </section>`;
  }

  function applyTheme(next, persist = true) {
    theme = next === 'dark' ? 'dark' : 'light';
    if (persist) safeSet(THEME_KEY, theme);
    if (root) {
      root.dataset.theme = theme;
      root.classList.toggle('onb-dark', theme === 'dark');
      root.querySelectorAll('[data-onb-theme]').forEach(btn => {
        const active = btn.dataset.onbTheme === theme;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
    }
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#050b18' : '#f8fbff');
    const shell = document.getElementById('appShell');
    shell?.classList.toggle('dark', theme === 'dark');
    if (window.NovaTheme?.set && window.NovaTheme?.isDark?.() !== (theme === 'dark')) {
      window.NovaTheme.set(theme === 'dark');
    }
  }

  function setViewport() {
    if (!root) return;
    const vv = window.visualViewport;
    root.style.setProperty('--onb-height', `${Math.round(vv?.height || window.innerHeight)}px`);
    root.classList.toggle('onb-keyboard', !!vv && window.innerHeight - vv.height > 130);
  }

  function create() {
    if (root) return root;
    const wrap = document.createElement('div');
    wrap.innerHTML = markup();
    root = wrap.firstElementChild;
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    document.documentElement.classList.remove('nova-onboarding-pending');
    document.documentElement.classList.add('nova-onboarding-open');
    applyTheme(theme, Boolean(forcedTheme));
    setViewport();
    startText();
    return root;
  }

  function showProfile() {
    stopText();
    root.querySelector('[data-onb-screen="intro"]')?.classList.remove('active');
    root.querySelector('[data-onb-screen="profile"]')?.classList.add('active');
  }
  function finish() {
    stopText(); safeSet(DONE_KEY, 'done');
    document.documentElement.classList.remove('nova-onboarding-open','nova-onboarding-pending');
    root?.remove(); root = null;
    if (force && history.replaceState) {
      const u = new URL(location.href); u.searchParams.delete('onboarding'); history.replaceState({},'',u.pathname+(u.search||'')+u.hash);
    }
    syncProfile();
  }
  function startText() {
    if (running || !root) return;
    running = true; idx = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhrase(phrases.length - 1); return; }
    setPhrase(0);
    timer = setInterval(() => {
      if (!running) return;
      idx++;
      if (idx >= phrases.length) { stopText(); setPhrase(phrases.length - 1); return; }
      animatePhrase(idx);
    }, 690);
  }
  function stopText() { running = false; clearInterval(timer); timer = 0; }
  function setPhrase(i) {
    const w = root?.querySelector('[data-onb-word]'), s = root?.querySelector('[data-onb-sub]');
    if (!w || !s) return; w.textContent = phrases[i][0]; s.textContent = phrases[i][1] || '';
  }
  function animatePhrase(i) {
    const w = root?.querySelector('[data-onb-word]'), s = root?.querySelector('[data-onb-sub]');
    if (!w || !s) return; w.classList.add('out'); s.style.opacity='0';
    setTimeout(() => { setPhrase(i); w.classList.remove('out'); s.style.opacity='1'; }, 130);
  }
  function onClick(e) {
    const themeBtn = e.target.closest('[data-onb-theme]');
    if (themeBtn) { e.preventDefault(); e.stopPropagation(); applyTheme(themeBtn.dataset.onbTheme); return; }
    if (e.target.closest('[data-onb-next],[data-onb-skip-intro]')) return showProfile();
    if (e.target.closest('[data-onb-skip-profile]')) return finish();
  }
  function onSubmit(e) {
    if (!e.target.matches('[data-onb-form]')) return;
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const profile = { name:String(data.name||'').trim().slice(0,32), height:data.height?Number(data.height):'', weight:data.weight?Number(data.weight):'', goal:String(data.goal||'') };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    if (profile.weight) {
      try {
        const h = JSON.parse(localStorage.getItem('nova.history') || '[]');
        h.unshift({ id:crypto.randomUUID?.()||String(Date.now()), type:'weight', value:profile.weight, label:'Стартовый вес', at:new Date().toISOString() });
        localStorage.setItem('nova.history', JSON.stringify(h.slice(0,500)));
      } catch (_) {}
    }
    finish();
  }
  function syncProfile() {
    const p = readProfile(); const name = p.name || 'Дмитрий';
    const greeting = document.getElementById('greetingTitle');
    if (greeting) {
      const hour=new Date().getHours(); const sal=hour<6?'Доброй ночи':hour<12?'Доброе утро':hour<18?'Добрый день':'Добрый вечер';
      greeting.innerHTML=`${sal},<br>${esc(name)}`;
    }
    document.querySelectorAll('.nf-profile').forEach(card => {
      const strong=card.querySelector('strong'); if (strong) strong.textContent=name;
      const avatar=card.querySelector('div'); if (avatar) avatar.textContent=(name[0]||'N').toUpperCase();
      const sub=card.querySelector('small'); const meta=[p.height?`${p.height} см`:'',p.weight?`${p.weight} кг`:'',p.goal?(GOAL_LABEL[p.goal]||''):''].filter(Boolean).join(' · ')||'Nova+ профиль'; if(sub)sub.textContent=meta;
    });
    injectProfileEditor();
  }
  function injectProfileEditor() {
    const page = document.querySelector('.nf-screen[data-page="profile"]'); if (!page || page.querySelector('[data-reopen-onboarding]')) return;
    const cards = page.querySelectorAll('.nf-card'); const target = cards[cards.length-1] || page;
    const b=document.createElement('button'); b.type='button'; b.className='nf-row nf-onboarding-row'; b.dataset.reopenOnboarding='';
    b.innerHTML='<b>↻</b><span><strong>Изменить данные о себе</strong><small>Имя, рост, вес и цель</small></span><em>›</em>';
    b.addEventListener('click',()=>open(true)); target.appendChild(b);
  }
  function open(reset=false) { if (reset) localStorage.removeItem(DONE_KEY); if (!root) create(); }

  window.addEventListener('resize', setViewport, { passive:true });
  window.visualViewport?.addEventListener('resize', setViewport, { passive:true });
  window.visualViewport?.addEventListener('scroll', setViewport, { passive:true });
  window.addEventListener('storage', e => { if (e.key === THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) applyTheme(e.newValue, false); });
  new MutationObserver(syncProfile).observe(document.body,{childList:true,subtree:true});
  syncProfile();
  if (shouldOpen) create(); else document.documentElement.classList.remove('nova-onboarding-pending');
  window.NovaOnboarding = { open:()=>open(true), profile:readProfile, sync:syncProfile, theme:()=>theme, setTheme:applyTheme };
})();