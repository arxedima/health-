(() => {
  const shell = document.getElementById('appShell');
  if (!shell) return;

  const defaults = {sport:{current:2,max:3},food:{current:3,max:8},water:{current:4,max:8},sleep:{current:1,max:8}};
  let state = loadState();
  let activeKind = null;
  let screen = null;

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem('nova.metrics') || '{}');
      const next = {};
      Object.keys(defaults).forEach(k => {
        const src = saved[k] || defaults[k];
        next[k] = {current:Math.max(0, Math.min(defaults[k].max, Number(src.current) || defaults[k].current)), max:defaults[k].max};
      });
      return next;
    }catch(_){ return JSON.parse(JSON.stringify(defaults)); }
  }
  function saveState(){ localStorage.setItem('nova.metrics', JSON.stringify(state)); }
  function ratio(kind){ return Math.max(0, Math.min(1, state[kind].current / state[kind].max)); }
  function pct(kind){ return Math.round(ratio(kind)*100); }

  function syncHome(){
    document.querySelectorAll('.metric').forEach(metric => {
      const k = metric.dataset.kind;
      if(!state[k]) return;
      const strong = metric.querySelector('strong');
      const bar = metric.querySelector('.metric-track i');
      if(strong) strong.textContent = `${state[k].current} / ${state[k].max}`;
      if(bar) bar.style.width = `${pct(k)}%`;
    });
    if(window.NovaBalance?.update) window.NovaBalance.update();
  }

  const icons = {
    back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z" fill="currentColor"/></svg>',
    plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    run:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="16.7" cy="4.5" r="2" fill="currentColor"/><path d="M13.6 8.1 10 11.4 6.8 10.3l-1.1 2.5 4.8 1.7 2.4-2 1.7 2.4-2.4 2.6-3.7 3.7 2.3 2 4-4 2.5-2.2 1.8 1.7 1.4 4 2.9-.9-1.6-4.7-3.6-3.4-2.3-4.2 1.4-1.6 2.5 1.5 1.5-2.5-4.1-2.5a2.8 2.8 0 0 0-3.2.4Z" fill="currentColor"/></svg>',
    stretch:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.2" r="2" fill="currentColor"/><path d="M12 7v6m0-3-5-2m5 2 5-2m-5 5-4 7m4-7 4 7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    camera:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7 10 5h4l1.5 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.5Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    food:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.4 8c-1-2.4.5-4.2 3-5-.1 2.4-1 3.9-3 5Z" fill="currentColor"/><path d="M11.4 8.4c-2.3-2.4-5.3-1.3-6.3 1.4-1.4 4.1 2.1 11.5 5.3 11.7.8.1 1.4-.4 2-.4s1.3.5 2.1.4c3.3-.4 6.5-7.7 5.1-11.7-1.1-3.1-4.5-3.7-6.3-1.5-.6.7-1.3.7-1.9.1Z" fill="currentColor"/></svg>',
    book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5c3-.8 5.5-.4 8 1.4v12c-2.5-1.8-5-2.2-8-1.4v-12Zm16 0c-3-.8-5.5-.4-8 1.4v12c2.5-1.8 5-2.2 8-1.4v-12Z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    drop:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5C10 6.1 6.4 10.4 6.4 14.5a5.6 5.6 0 1 0 11.2 0C17.6 10.4 14 6.1 12 2.5Z" fill="currentColor"/></svg>',
    bell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12l-1.3-2V10a4.7 4.7 0 0 0-9.4 0v5L6 17Zm4 2a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    moon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.2 17.1A8.3 8.3 0 0 1 8 4.5a8 8 0 1 0 10.2 12.6Z" fill="currentColor"/></svg>',
    breathe:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 4-2.2M4 15c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 4-2.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h3l4 3V7L8 10H5Zm10-1.5a5 5 0 0 1 0 7m2.8-9.8a9 9 0 0 1 0 12.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    history:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6v5h5M5.5 10a7.5 7.5 0 1 1 1.4 7.4M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function top(title){
    return `<div class="feature-top"><button class="feature-back" data-close-feature aria-label="Назад">${icons.back}</button><div class="feature-mini-brand"><span class="feature-mini-orb"></span>Nova+</div><button class="feature-more" aria-label="Ещё">${icons.more}</button></div><div class="feature-title"><h1>${title}</h1>`;
  }
  function hero(kind, label, water){
    return `<div class="feature-orb-wrap"><div class="feature-ring" style="--p:${pct(kind)}%"></div><div class="feature-orb"><span class="feature-orb-shine"></span><span class="feature-orb-wave" style="--water:${water ?? pct(kind)}%"></span></div><div class="feature-score"><strong>${state[kind].current}/${state[kind].max}</strong><span>${label}</span></div></div>`;
  }
  function card(icon,title,meta,action=''){ return `<button class="feature-card" ${action?`data-action="${action}"`:''}><span class="feature-card-icon">${icons[icon]}</span><span class="feature-card-copy"><strong>${title}</strong><span>${meta}</span></span><span class="feature-card-arrow">›</span></button>`; }

  function sportTemplate(){
    return `${top('Спорт')}<p>Тело в движении — ум в порядке.</p></div><div class="feature-hero">${hero('sport','Сегодня')}<div class="feature-stats"><div class="feature-stat"><strong>4 320</strong><span>шагов</span></div><div class="feature-stat"><strong>28</strong><span>минут</span></div><div class="feature-stat"><strong>320</strong><span>ккал</span></div></div><button class="feature-main-btn" data-action="complete-sport">${icons.play} Начать тренировку</button></div><section class="feature-section"><div class="feature-section-head"><h2>Популярное</h2><span>Для тебя</span></div><div class="feature-chip-row"><span class="feature-chip active">Все</span><span class="feature-chip">ЛФК</span><span class="feature-chip">Сила</span><span class="feature-chip">Мобильность</span></div><div class="feature-list">${card('heart','ЛФК · мягкое восстановление','15 минут · 8 упражнений')}${card('run','FULL BODY','24 минуты · 6 упражнений')}${card('stretch','Растяжка','10 минут · всё тело')}</div></section>`;
  }

  function foodTemplate(){
    return `${top('Питание')}<p>Хорошая еда — больше энергии.</p></div><div class="feature-hero">${hero('food','приёмов пищи')}<div class="macro-grid"><div class="macro"><strong>1540</strong><span>ккал</span></div><div class="macro"><strong>122</strong><span>белки</span></div><div class="macro"><strong>56</strong><span>жиры</span></div><div class="macro"><strong>180</strong><span>углеводы</span></div></div><button class="feature-main-btn" data-action="add-food">${icons.plus} Добавить приём пищи</button></div><section class="feature-section"><div class="feature-section-head"><h2>Питание сегодня</h2><span>${state.food.current} из ${state.food.max}</span></div><div class="feature-list">${card('camera','Сфотографировать еду','AI-анализ калорий и БЖУ','add-food')}${card('book','Рецепты','Простые и полезные блюда')}${card('food','Мои продукты','Быстрый доступ')}${card('history','План питания','Сбалансированные рационы')}</div></section>`;
  }

  function waterTemplate(){
    const glasses = Array.from({length:8},(_,i)=>`<span class="water-glass ${i<state.water.current?'filled':''}"></span>`).join('');
    const ml = state.water.current*250;
    return `${top('Вода')}<p>Больше воды — больше тебя.</p></div><div class="feature-hero">${hero('water','стаканов сегодня',pct('water'))}<div class="water-glasses">${glasses}</div><div class="water-total">${ml} мл из 2000 мл</div><button class="feature-main-btn" data-action="add-water">${icons.plus} Добавить стакан · 250 мл</button></div><section class="feature-section"><div class="feature-section-head"><h2>Гидратация</h2><span>${pct('water')}%</span></div><div class="feature-list">${card('drop','Цель на день','2 литра · 8 стаканов')}${card('bell','Напоминания','Каждые 2 часа')}${card('heart','Совет','Пей воду небольшими порциями')}</div></section>`;
  }

  function sleepTemplate(){
    return `${top('Сон')}<p>Глубокий сон — ясный день.</p></div><div class="feature-hero">${hero('sleep','вечерних ритуалов',pct('sleep'))}<div class="sleep-time"><strong>7 ч 42 мин</strong><span>последний сон</span></div><div class="sleep-line"><span>22:48</span><div class="sleep-track"><i></i></div><span>06:30</span></div><button class="feature-main-btn" data-action="add-sleep">${icons.moon} Подготовка ко сну</button></div><section class="feature-section"><div class="feature-section-head"><h2>Вечерний режим</h2><span>Спокойнее</span></div><div class="feature-list">${card('breathe','Дыхательная практика','10 минут · медленный ритм','add-sleep')}${card('sound','Белый шум','Дождь · океан · лес')}${card('history','История сна','Неделя, месяц, тенденции')}</div></section>`;
  }

  const templates = {sport:sportTemplate,food:foodTemplate,water:waterTemplate,sleep:sleepTemplate};

  function ensureScreen(){
    if(screen) return screen;
    screen = document.createElement('section');
    screen.className = 'feature-screen';
    screen.hidden = true;
    shell.appendChild(screen);
    return screen;
  }
  function open(kind){
    if(!templates[kind]) return;
    activeKind = kind;
    const el = ensureScreen();
    el.innerHTML = templates[kind]();
    el.hidden = false;
    el.scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
  }
  function close(){
    if(!screen) return;
    screen.hidden = true;
    activeKind = null;
    document.documentElement.style.overflow = '';
  }
  function rerender(){ if(activeKind && screen && !screen.hidden) screen.innerHTML = templates[activeKind](); }

  function bump(kind, amount=1){
    state[kind].current = Math.min(state[kind].max, state[kind].current + amount);
    saveState(); syncHome(); rerender();
  }

  document.addEventListener('click', e => {
    const metric = e.target.closest('.metric');
    if(metric && templates[metric.dataset.kind]){
      e.stopImmediatePropagation();
      open(metric.dataset.kind);
      return;
    }
    const closeBtn = e.target.closest('[data-close-feature]');
    if(closeBtn){ e.preventDefault(); close(); return; }
    const action = e.target.closest('[data-action]')?.dataset.action;
    if(!action) return;
    if(action === 'add-water') bump('water');
    if(action === 'add-food') bump('food');
    if(action === 'complete-sport') bump('sport');
    if(action === 'add-sleep') bump('sleep');
  }, true);

  window.addEventListener('keydown', e => { if(e.key === 'Escape' && activeKind) close(); });
  syncHome();
  window.NovaSections = {open,close,state};
})();
