const root = document.getElementById('novaApp');
const photoInput = document.getElementById('photoInput');

const ICONS = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3z"/></svg>',
  plan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M8 11h8M8 15h5"/></svg>',
  analytics:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M5 20V11M10 20V5M15 20v-8M20 20V8"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="7" r="4"/><path d="M4.5 21c.8-5 3.3-7 7.5-7s6.7 2 7.5 7"/></svg>',
  run:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="15.5" cy="4.5" r="2"/><path d="m11 8 3-1 2.5 3 3 .5M10 9l-2 4-3 1M13 11l-1 4 4 3M11 15l-4 5"/></svg>',
  apple:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 7c-2-3-6-2.5-7.2 1.6C3.3 13.5 7 20 12 20s8.7-6.5 7.2-11.4C18 4.5 14 4 12 7Z"/><path d="M12 6c.2-2.4 1.6-3.8 4-4"/></svg>',
  water:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M9 16c.5 1.5 1.4 2.2 3 2.5"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 15.5A8.6 8.6 0 0 1 8.5 3.5 9 9 0 1 0 20.5 15.5Z"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  flame:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2c.4 4-3 5.2-3 8 0 1.2.7 2 1.7 2.6-.2-2.6 1.5-3.7 3.2-5.8 2.4 2.5 4.1 5 4.1 8.2A7 7 0 1 1 5 15c0-4.3 2.8-7.4 8-13Z"/></svg>',
  leaf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 4C10 4 5 9 5 15c0 3 2 5 5 5 6 0 10-7 10-16Z"/><path d="M5 20c3-6 7-9 12-12"/></svg>',
  waves:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 7v10M9 4v16M13 8v8M17 5v14M21 9v6"/></svg>',
  circle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="7"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21S3 15.7 3 9.3C3 6.2 5.2 4 8 4c1.8 0 3.2.9 4 2.2C12.8 4.9 14.2 4 16 4c2.8 0 5 2.2 5 5.3C21 15.7 12 21 12 21Z"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8h4l2-3h4l2 3h4v11H4Z"/><circle cx="12" cy="13" r="4"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M22 12h-3"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 17h12l-1.2-2V10a4.8 4.8 0 0 0-9.6 0v5L6 17Z"/><path d="M10 20h4"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.2-1.5l2-1.6-2-3.4-2.5 1A7 7 0 0 0 14 5.2L13.6 2h-3.9L9.2 5.2A7 7 0 0 0 7 6.5l-2.5-1-2 3.4 2 1.6A7 7 0 0 0 4.3 12c0 .5.1 1 .2 1.5l-2 1.6 2 3.4 2.5-1A7 7 0 0 0 9.2 19l.5 3h3.9l.4-3a7 7 0 0 0 2.3-1.4l2.5 1 2-3.4-2-1.6c.1-.5.2-1 .2-1.6Z"/></svg>',
  help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.8 2c-1 .7-1.6 1.1-1.6 2.3M12 17h.01"/></svg>',
  recipe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 3v7M4 3v4c0 2 1 3 3 3s3-1 3-3V3M7 10v11M17 3c-2 3-2 7 0 9v9M17 3v9"/></svg>',
  bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7Z"/></svg>',
  brief:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5a4 4 0 0 1 4-2h3v16H8a4 4 0 0 0-4 2ZM20 5a4 4 0 0 0-4-2h-3v16h3a4 4 0 0 1 4 2Z"/></svg>',
  music:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l10-2v13M9 8l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>'
};

const state = loadState();
let currentView = 'home';
let quickOpen = false;
let focusSeconds = 25 * 60;
let focusTimer = null;

function loadState(){
  try{
    return Object.assign({
      theme:'light',
      name:'Дмитрий',
      sport:{done:2,target:3},
      food:{done:3,target:8},
      water:{done:4,target:8},
      sleep:{done:1,target:8}
    }, JSON.parse(localStorage.getItem('nova-v20') || '{}'));
  }catch{
    return {theme:'light',name:'Дмитрий',sport:{done:2,target:3},food:{done:3,target:8},water:{done:4,target:8},sleep:{done:1,target:8}};
  }
}
function saveState(){ localStorage.setItem('nova-v20', JSON.stringify(state)); }

function dateText(){
  const d = new Date();
  return new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(d).replace(/^./,c=>c.toUpperCase());
}
function dayPart(){
  const h = new Date().getHours();
  if(h < 5) return {title:'Спокойной ночи',sub:'Пора восстановиться и набраться сил.'};
  if(h < 12) return {title:'Доброе утро',sub:'Пора сделать первый шаг.'};
  if(h < 18) return {title:'Добрый день',sub:'Маленькие шаги — больше результатов.'};
  return {title:'Спокойный вечер',sub:'Хороший день. Время восстановиться.'};
}
function ratio(x){ return Math.max(0,Math.min(1,(x.done||0)/(x.target||1))); }
function overall(){ return (ratio(state.sport)+ratio(state.food)+ratio(state.water)+ratio(state.sleep))/4; }

function header(icon=''){
  return `<div class="topbar">
    <div class="brand">
      <span class="brand-orb"></span>
      <div class="brand-copy"><div class="brand-name">Nova+</div><div class="brand-date">${dateText()}</div></div>
    </div>
    <button class="icon-btn" data-action="${icon ? 'noop' : 'theme'}" aria-label="${icon ? 'Раздел' : 'Переключить тему'}">${icon || (state.theme==='dark'?ICONS.moon:ICONS.sun)}</button>
  </div>`;
}
function bottomNav(active='home'){
  const items = [
    ['home','Главная',ICONS.home],
    ['plan','План',ICONS.plan],
    ['quick','',ICONS.plus],
    ['analytics','Аналитика',ICONS.analytics],
    ['profile','Профиль',ICONS.user]
  ];
  return `<nav class="bottom-nav">
    ${items.map(([id,label,ic])=>{
      if(id==='quick') return `<button class="nav-btn nav-plus" data-view="quick" aria-label="Быстрые действия"><span class="plus-circle">+</span></button>`;
      return `<button class="nav-btn ${active===id?'active':''}" data-view="${id}">${ic}<span>${label}</span></button>`;
    }).join('')}
  </nav>`;
}

function heroSphere(){
  return `<div class="home-hero">
    <svg class="progress-arc" viewBox="0 0 120 120" aria-hidden="true">
      <circle class="track" cx="60" cy="60" r="52" pathLength="100" stroke-dasharray="58 42" transform="rotate(-105 60 60)"></circle>
      <circle class="value" cx="60" cy="60" r="52" pathLength="100" stroke-dasharray="${Math.max(8,Math.round(overall()*58))} 100" transform="rotate(-15 60 60)"></circle>
    </svg>
    <div class="orb"></div>
  </div>`;
}
function metricCard(key,label,icon){
  const m = state[key];
  const p = Math.round(ratio(m)*100);
  return `<button class="metric-card card" data-view="${key==='sport'?'movement':key==='food'?'nutrition':key}">
    ${icon}<strong>${label}</strong><b>${m.done} / ${m.target}</b>
    <span class="mini-track"><i style="width:${p}%"></i></span>
  </button>`;
}
function tipCard(){
  const night = state.theme==='dark';
  return `<article class="tip card">
    <div class="tip-icon">${night?ICONS.moon:ICONS.sun}</div>
    <div><small>Совет дня</small><b>${night?'Подготовка ко сну':'Стакан воды'}</b><p>${night?'10 минут дыхательной практики улучшают сон.':'После пробуждения помогает мягко запустить день.'}</p></div>
    <span class="chev">›</span>
  </article>`;
}
function home(){
  const g = dayPart();
  return `<main class="page">
    ${header()}
    <h1 class="hero-title">${g.title},<br>${state.name}</h1>
    <p class="hero-sub">${g.sub}</p>
    ${heroSphere()}
    <div class="metric-grid">
      ${metricCard('sport','Спорт',ICONS.run)}
      ${metricCard('food','Питание',ICONS.apple)}
      ${metricCard('water','Вода',ICONS.water)}
      ${metricCard('sleep','Сон',ICONS.moon)}
    </div>
    <button class="primary home-cta" data-view="plan"><span>＋</span> Составить план дня</button>
    ${tipCard()}
  </main>${bottomNav('home')}`;
}

function plan(){
  const rows = [
    ['08:00','Утренняя зарядка',true],['09:00','Завтрак',true],['12:00','Работа',false],
    ['13:00','Обед',false],['16:00','Прогулка',false],['19:00','Тренировка',false],
    ['21:00','Чтение',false],['22:30','Сон',false]
  ];
  return `<main class="page">
    ${header(ICONS.plan)}
    <h1 class="section-title">Мой план дня</h1>
    <p class="section-sub">Баланс в простых действиях.</p>
    <section class="timeline">${rows.map(r=>`<div class="timeline-row"><span class="timeline-dot ${r[2]?'done':''}"></span><span class="timeline-time">${r[0]}</span><span class="timeline-label">${r[1]}</span></div>`).join('')}</section>
    <div class="quote card">“Дисциплина сегодня — свобода завтра.”</div>
  </main>${bottomNav('plan')}`;
}

function analytics(){
  const vals=[48,38,62,40,58,90,54], days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const rows=[['sport','Движение',ICONS.run],['food','Питание',ICONS.apple],['water','Вода',ICONS.water],['sleep','Сон',ICONS.moon]];
  return `<main class="page">
    ${header(ICONS.analytics)}
    <h1 class="section-title">Аналитика</h1>
    <p class="section-sub">Твой прогресс вдохновляет.</p>
    <div class="segmented"><button class="mini-pill active">День</button><button class="mini-pill">Неделя</button><button class="mini-pill">Месяц</button></div>
    <div class="bar-chart">${vals.map((v,i)=>`<div class="bar-col"><div class="bar ${i===5?'active':''}" style="height:${v}%"></div><span>${days[i]}</span></div>`).join('')}</div>
    <section class="analytics-list card">${rows.map(([k,l,ic])=>{const m=state[k],p=Math.round(ratio(m)*100);return `<div class="analytics-row">${ic}<div><strong>${l}</strong><div class="row-track"><i style="width:${p}%"></i></div></div><b>${m.done} / ${m.target}</b></div>`}).join('')}</section>
    <div class="encourage card">${ICONS.flame}<div><strong>Ты делаешь это!</strong><p>Регулярность — ключ к устойчивому результату.</p></div></div>
  </main>${bottomNav('analytics')}`;
}

function movement(){
  return `<main class="page">
    ${header(ICONS.run)}
    <h1 class="section-title">Движение</h1>
    <p class="section-sub">Тело в движении —<br>ум в порядке.</p>
    <section class="feature-hero">
      <svg class="progress-arc" viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="52" pathLength="100" stroke-dasharray="58 42" transform="rotate(-105 60 60)"></circle><circle class="value" cx="60" cy="60" r="52" pathLength="100" stroke-dasharray="${Math.round(ratio(state.sport)*58)} 100" transform="rotate(-15 60 60)"></circle></svg>
      <div class="orb"></div>
      <div class="feature-number"><b>${state.sport.done}/${state.sport.target}</b><span>Сегодня</span></div>
    </section>
    <div class="stats3"><div><b>4 320</b><span>Шагов</span></div><div><b>28</b><span>Минут</span></div><div><b>320</b><span>Ккал</span></div></div>
    <button class="primary">${ICONS.play} Начать тренировку</button>
    <section class="list-section"><h3 class="list-title">Популярное</h3>
      <div class="list-item">${ICONS.heart}<div><strong>ЛФК · Мягкое восстановление</strong><small>15 минут</small></div></div>
      <div class="list-item">${ICONS.run}<div><strong>FULL BODY</strong><small>24 минуты · 6 упражнений</small></div></div>
      <div class="list-item">${ICONS.run}<div><strong>Растяжка</strong><small>10 минут</small></div></div>
    </section>
  </main>${bottomNav('home')}`;
}

function nutrition(){
  return `<main class="page">
    ${header(ICONS.apple)}
    <h1 class="section-title">Питание</h1>
    <p class="section-sub">Хорошая еда —<br>больше энергии.</p>
    ${heroSphere()}
    <div class="macro-grid">
      ${macro(ICONS.flame,'1 540','Ккал')}${macro(ICONS.leaf,'122','Белки')}${macro(ICONS.waves,'56','Жиры')}${macro(ICONS.circle,'180','Углеводы')}
    </div>
    <button class="primary" style="margin-top:10px">＋ Добавить приём пищи</button>
    <section class="menu-list card">
      ${menuRow(ICONS.recipe,'Рецепты','Простые и полезные')}
      ${menuRow(ICONS.bag,'Мои продукты','Быстрый доступ')}
      ${menuRow(ICONS.doc,'План питания','Сбалансированные рационы')}
    </section>
  </main>${bottomNav('home')}`;
}
function macro(ic,v,l){return `<div class="macro card">${ic}<b>${v}</b><span>${l}</span></div>`}
function menuRow(ic,t,s){return `<div class="menu-row">${ic}<div><b>${t}</b><small>${s}</small></div><span class="chev">›</span></div>`}

function water(){
  return `<main class="page">
    ${header(ICONS.water)}
    <h1 class="section-title">Вода</h1>
    <p class="section-sub">Больше воды —<br>больше тебя.</p>
    <div class="drop-wrap"><div class="drop"><div class="drop-shape"></div><div class="drop-wave"></div></div><div class="water-count"><b>${state.water.done}/${state.water.target}</b><span>Стаканов сегодня</span></div></div>
    <div class="cups">${Array.from({length:8},(_,i)=>`<span class="cup ${i<state.water.done?'filled':''}"></span>`).join('')}</div>
    <button class="primary" data-action="add-water">＋ Добавить стакан</button>
    <div class="sleep-note card">💧 Вода помогает концентрации и улучшает самочувствие.</div>
  </main>${bottomNav('home')}`;
}

function sleep(){
  return `<main class="page">
    ${header(ICONS.moon)}
    <h1 class="section-title">Сон</h1>
    <p class="section-sub">Глубокий сон —<br>ясный день.</p>
    <section class="feature-hero"><div class="orb"></div><div class="feature-number"><b>${state.sleep.done}/${state.sleep.target}</b><span>Сегодня</span></div></section>
    <section class="sleep-actions card">
      ${menuRow(ICONS.moon,'Подготовка ко сну','10 минут')}
      ${menuRow(ICONS.waves,'Дыхательная практика','Мягкое расслабление')}
      ${menuRow(ICONS.music,'Белый шум','Фоновый звук')}
      ${menuRow(ICONS.circle,'История сна','Отслеживание')}
    </section>
  </main>${bottomNav('home')}`;
}

function focus(){
  return `<main class="page">
    ${header(ICONS.target)}
    <h1 class="section-title">Фокус</h1>
    <p class="section-sub">Меньше отвлечений —<br>больше результата.</p>
    <div class="focus-wrap"><div class="focus-rings"><div class="focus-orb"></div></div><div class="focus-time"><b id="focusTime">${fmtFocus()}</b><span>Фокус на важном</span></div></div>
    <button class="primary" data-action="focus-toggle">${ICONS.play}<span id="focusBtnText">${focusTimer?'Пауза':'Начать'}</span></button>
    <div class="focus-modes">
      ${focusMode(ICONS.circle,'Фокус',true)}${focusMode(ICONS.brief,'Работа')}${focusMode(ICONS.book,'Учёба')}${focusMode(ICONS.music,'Музыка')}
    </div>
  </main>${bottomNav('home')}`;
}
function focusMode(ic,l,a=false){return `<div class="focus-mode ${a?'active':''}">${ic}<span>${l}</span></div>`}
function fmtFocus(){const m=Math.floor(focusSeconds/60),s=focusSeconds%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}

function scan(){
  return `<main class="page">
    ${header(ICONS.camera)}
    <h1 class="section-title">Сфотографируй еду</h1>
    <p class="section-sub">Быстрый анализ. Калории и БЖУ.<br>Просто и удобно.</p>
    <div class="scan-box"><div class="scan-orb">${ICONS.camera}</div></div>
    <button class="secondary" style="margin-top:10px" data-action="camera">${ICONS.camera} Открыть камеру</button>
    <section class="recent"><h3 class="list-title">Недавнее</h3><div class="recent-card card"><div class="food-thumb"></div><div><b>Овсянка с ягодами</b><small>372 ккал · Б 12 · Ж 8 · У 56</small></div><span class="chev">›</span></div></section>
  </main>${bottomNav('home')}`;
}

function profile(){
  return `<main class="page">
    ${header(ICONS.gear)}
    <h1 class="section-title">${state.name}</h1>
    <p class="section-sub">Лучше, чем вчера.</p>
    <section class="profile-card card">
      ${profileRow(ICONS.target,'Мои цели')}${profileRow(ICONS.analytics,'Статистика')}${profileRow(ICONS.bell,'Напоминания')}${profileRow(ICONS.gear,'Настройки')}${profileRow(ICONS.help,'Поддержка')}
    </section>
    <div class="profile-quote card">“Забота о себе сегодня — счастливое завтра.”</div>
  </main>${bottomNav('profile')}`;
}
function profileRow(ic,t){return `<div class="profile-row">${ic}<b>${t}</b><span class="chev">›</span></div>`}

function quickSheet(){
  return `<div class="quick-sheet" id="quickSheet">
    <div class="quick-panel">
      <div class="quick-head"><b>Быстрые действия</b><button class="icon-btn" data-action="close-quick">${ICONS.close}</button></div>
      <div class="quick-grid">
        <button class="quick-action" data-view="scan">${ICONS.camera}<span>Фото еды</span></button>
        <button class="quick-action" data-view="water">${ICONS.water}<span>Добавить воду</span></button>
        <button class="quick-action" data-view="focus">${ICONS.target}<span>Фокус</span></button>
        <button class="quick-action" data-view="movement">${ICONS.run}<span>Тренировка</span></button>
        <button class="quick-action" data-view="sleep">${ICONS.moon}<span>Сон</span></button>
        <button class="quick-action" data-view="nutrition">${ICONS.apple}<span>Питание</span></button>
      </div>
    </div>
  </div>`;
}

const views={home,plan,analytics,movement,nutrition,water,sleep,focus,scan,profile};

function render(){
  root.className = `nova-shell ${state.theme==='dark'?'dark':''}`;
  root.innerHTML = (views[currentView]||home)() + (quickOpen?quickSheet():'');
  bind();
}
function bind(){
  root.querySelectorAll('[data-view]').forEach(el=>{
    el.addEventListener('click',()=>{
      const v=el.dataset.view;
      if(v==='quick'){quickOpen=true;render();return;}
      currentView=v;quickOpen=false;window.scrollTo({top:0,behavior:'instant'});render();
    });
  });
  root.querySelectorAll('[data-action]').forEach(el=>{
    el.addEventListener('click',()=>{
      const a=el.dataset.action;
      if(a==='theme'){state.theme=state.theme==='dark'?'light':'dark';saveState();render();}
      if(a==='close-quick'){quickOpen=false;render();}
      if(a==='add-water'){state.water.done=Math.min(state.water.target,state.water.done+1);saveState();render();}
      if(a==='camera'){photoInput.click();}
      if(a==='focus-toggle'){toggleFocus();}
    });
  });
  const sheet=root.querySelector('#quickSheet');
  if(sheet) sheet.addEventListener('click',e=>{if(e.target===sheet){quickOpen=false;render();}});
}
function toggleFocus(){
  if(focusTimer){
    clearInterval(focusTimer);focusTimer=null;render();return;
  }
  focusTimer=setInterval(()=>{
    focusSeconds=Math.max(0,focusSeconds-1);
    const node=document.getElementById('focusTime');
    if(node) node.textContent=fmtFocus();
    if(focusSeconds===0){clearInterval(focusTimer);focusTimer=null;render();}
  },1000);
  render();
}
photoInput?.addEventListener('change',()=>{
  if(photoInput.files?.[0]) alert('Фото выбрано. Анализ еды подключим следующим этапом.');
});

render();
