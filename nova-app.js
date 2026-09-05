import {load,save,today,setTheme} from './nova-store.js';
import {dayPlan,metrics,overallProgress,weeklyBars,greeting,dailyTip,fullDate} from './nova-engine.js';

const app=document.getElementById('app');
const header=document.getElementById('header');
const screen=document.getElementById('screen');
const nav=document.getElementById('nav');
const sheet=document.getElementById('sheet');
const cameraInput=document.getElementById('cameraInput');

let state=load();
let view='home';
let timerTick=null;

const SVG={
  home:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v9.4a.8.8 0 0 1-.8.8h-5.1v-6.4H8.9V21H3.8a.8.8 0 0 1-.8-.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  plan:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 3v5M16 3v5M4 9.5h16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="m8.2 14 1.6 1.6 3.3-3.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  analytics:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V12M10 20V6M15 20v-9M20 20V3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  profile:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 21c.7-4.1 3-6.2 6.5-6.2s5.8 2.1 6.5 6.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  sport:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13.3" cy="4.2" r="1.8" fill="currentColor"/><path d="m10 8.1 3.1-1 2.5 2.6 3.3.5M12.2 7.7l-2 4.6 3.1 2.2 1.2 5M10.1 12.3 6.7 15l-2.9.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  food:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.2 7.2c2.5-3 7.1-1.6 7.1 3.3 0 5.1-3.8 9.2-7.3 9.2S4.7 15.6 4.7 10.5c0-4.7 4.6-6.3 7.5-3.3Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7c-.1-2.3 1.2-4 3.6-4.8M11.8 6.2C10 4.7 8.4 4.4 7 5.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  water:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8S5.7 10 5.7 14.9A6.3 6.3 0 0 0 12 21.2a6.3 6.3 0 0 0 6.3-6.3C18.3 10 12 2.8 12 2.8Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.7 15.2c.3 1.6 1.4 2.5 3 2.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  sleep:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.7 15.1A8.3 8.3 0 0 1 9 4.3a8.6 8.6 0 1 0 10.7 10.8Z" fill="currentColor"/></svg>`,
  sun:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v2.3M12 19.7V22M2 12h2.3M19.7 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  moon:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.7 15.1A8.3 8.3 0 0 1 9 4.3a8.6 8.6 0 1 0 10.7 10.8Z" fill="currentColor"/></svg>`,
  chevron:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  focus:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>`,
  camera:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.3h3l1.4-2.2h7.2L17 8.3h3v10.2H4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`
};

const NAV=[
  ['home','Главная',SVG.home],
  ['plan','План',SVG.plan],
  ['quick','',null],
  ['analytics','Аналитика',SVG.analytics],
  ['me','Профиль',SVG.profile]
];

function resolveTheme(){
  const pref=state.settings?.theme||'auto';
  if(pref==='dark'||pref==='light')return pref;
  const h=new Date().getHours();
  return h>=19||h<7?'dark':'light';
}

function applyTheme(){
  const dark=resolveTheme()==='dark';
  app.classList.toggle('dark',dark);
  document.documentElement.style.colorScheme=dark?'dark':'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#061326':'#ffffff');
}

function toggleTheme(){
  state=setTheme(resolveTheme()==='dark'?'light':'dark');
  applyTheme();
  renderHeader();
}

function brand(){
  return `<div class="brand" aria-label="Nova+"><span class="brand-orb" aria-hidden="true"></span><strong>Nova+</strong></div>`;
}

function renderHeader(){
  const icon=resolveTheme()==='dark'?SVG.sun:SVG.moon;
  header.innerHTML=`${brand()}<button class="header-btn" data-theme aria-label="Сменить тему">${icon}</button>`;
  header.querySelector('[data-theme]')?.addEventListener('click',toggleTheme);
}

function renderNav(){
  nav.innerHTML=NAV.map(([id,label,icon])=>{
    if(id==='quick')return `<button class="plus-launch" data-quick-launch aria-label="Быстрые действия"><span class="plus-core">+</span></button>`;
    return `<button data-view="${id}" class="${view===id?'active':''}" aria-label="${label}"><span class="nav-icon">${icon}</span><small>${label}</small></button>`;
  }).join('');
  nav.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
  nav.querySelector('[data-quick-launch]')?.addEventListener('click',quickSheet);
}

function go(next){
  view=next;
  render();
  requestAnimationFrame(()=>{screen.scrollTop=0;window.scrollTo(0,0)});
}

function pct(done,target){return Math.max(0,Math.min(100,Math.round(done/Math.max(1,target)*100)))}

function metricTile(icon,title,m,key){
  return `<button class="metric" data-view="${key}"><span class="metric-icon">${icon}</span><b>${title}</b><small>${m.done} / ${m.target}</small><div class="mini-line"><i style="width:${pct(m.done,m.target)}%"></i></div></button>`;
}

function orb(progress,label=''){
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  return `<div class="hero-orb-wrap">
    <svg class="progress-ring" viewBox="0 0 260 260" aria-hidden="true">
      <path class="ring-track" pathLength="100" d="M42 207 A112 112 0 1 1 220 62"/>
      <path class="ring-value" pathLength="100" d="M42 207 A112 112 0 1 1 220 62" style="stroke-dasharray:${Math.max(6,Math.round(p*100))} 100"/>
    </svg>
    <div class="sphere-stage">
      <div class="hero-orb"><span class="nova-wave"></span></div>
      <span class="mist mist-a"></span><span class="mist mist-b"></span><span class="mist mist-c"></span>
    </div>
    ${label?`<div class="progress-label">${label}</div>`:''}
  </div>`;
}

function tipIcon(tip){
  const t=(tip?.title||'').toLowerCase();
  if(t.includes('вод'))return SVG.water;
  if(t.includes('движ')||t.includes('прогул'))return SVG.sport;
  if(t.includes('пищ')||t.includes('ед'))return SVG.food;
  return SVG.sleep;
}

function home(){
  const d=new Date();
  const m=metrics(state,d);
  const g=greeting(d);
  const tip=dailyTip(state,d);
  const p=overallProgress(state,d);
  return `<section class="page home-page">
    <div class="page-kicker">${fullDate(d)}</div>
    <h1>${g[0]},<br>${state.profile.name||'друг'}</h1>
    <p class="page-sub">${g[1]}</p>
    ${orb(p)}
    <div class="metric-grid">
      ${metricTile(SVG.sport,'Спорт',m.movement,'move')}
      ${metricTile(SVG.food,'Питание',m.food,'food')}
      ${metricTile(SVG.water,'Вода',m.water,'water')}
      ${metricTile(SVG.sleep,'Сон',m.sleep,'sleep')}
    </div>
    <button class="primary home-cta" data-view="plan">＋&nbsp;&nbsp;Составить план дня</button>
    <article class="card tip-card home-tip">
      <div class="tip-icon">${tipIcon(tip)}</div>
      <div><small>Совет дня</small><b>${tip.title}</b><p>${tip.text}</p></div>
      <span class="chev">${SVG.chevron}</span>
    </article>
  </section>`;
}

function plan(){
  const rows=dayPlan(state);
  return `<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Мой план дня</h1><p class="page-sub">Баланс в простых действиях.</p><article class="card timeline">${rows.map(r=>`<button class="timeline-row ${r.done?'done':''}" data-plan="${r.id}"><time>${r.time}</time><span class="timeline-dot">${r.done?'✓':''}</span><div><b>${r.title}</b><small>${r.subtitle}</small></div></button>`).join('')}</article><article class="card quote-card">«Один спокойный день собирается из маленьких шагов.»</article></section>`;
}

function analyticsRow(icon,title,done,target){
  return `<div class="analytics-row"><span class="row-icon">${icon}</span><div><b>${title}</b><div class="analytics-line"><i style="width:${pct(done,target)}%"></i></div></div><em>${done} / ${target}</em></div>`;
}

function analytics(){
  const w=weeklyBars(state),m=metrics(state);
  return `<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Аналитика</h1><p class="page-sub">Твой прогресс — без лишнего шума.</p><div class="segment"><button>День</button><button class="active">Неделя</button><button>Месяц</button></div><article class="card"><div class="bar-chart">${w.map(x=>`<div class="bar ${x.active?'active':''}"><i style="height:${Math.max(12,x.value)}%"></i><small>${x.label}</small></div>`).join('')}</div></article><article class="card analytics-list">${analyticsRow(SVG.sport,'Движение',m.movement.done,m.movement.target)}${analyticsRow(SVG.food,'Питание',m.food.done,m.food.target)}${analyticsRow(SVG.water,'Вода',m.water.done,m.water.target)}${analyticsRow(SVG.sleep,'Сон',m.sleep.done,m.sleep.target)}</article><article class="card tip-card"><div class="tip-icon">${SVG.analytics}</div><div><b>Хороший ритм</b><p>Регулярность важнее идеального дня.</p></div><span class="chev">${SVG.chevron}</span></article></section>`;
}

function listRow(icon,title,sub,action=''){
  return `<button class="list-row" ${action?`data-action="${action}"`:''}><span class="row-icon">${icon}</span><div><b>${title}</b><small>${sub}</small></div><em>${SVG.chevron}</em></button>`;
}

function move(){
  const m=metrics(state),done=m.movement.done;
  return `<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Движение</h1><p class="page-sub">Тело в движении — ум в порядке.</p>${orb(done/3,`<strong>${done}/3</strong><small>Сегодня</small>`)}<div class="stat-three"><div><b>${m.steps.toLocaleString('ru-RU')}</b><small>Шагов</small></div><div><b>${m.minutes}</b><small>Минут</small></div><div><b>${m.moveKcal}</b><small>Ккал</small></div></div><button class="primary" data-start-workout>Начать тренировку</button><div class="section-title"><div><small>ПОПУЛЯРНОЕ</small><h2>Выбери комплекс</h2></div></div><article class="card list-card">${listRow(SVG.sport,'ЛФК · Мягкое восстановление','15 минут','workout')}${listRow(SVG.sport,'FULL BODY','24 минуты · 6 упражнений','workout')}${listRow(SVG.focus,'Растяжка','10 минут','workout')}</article></section>`;
}

function macro(icon,val,label){return `<div class="macro"><span>${icon}</span><b>${Math.round(val)}</b><small>${label}</small></div>`}

function food(){
  const m=metrics(state);
  return `<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Питание</h1><p class="page-sub">Хорошая еда — больше энергии.</p>${orb(Math.min(1,m.kcal/2000))}<div class="macro-grid">${macro(SVG.food,m.kcal,'Ккал')}${macro(SVG.food,m.protein,'Белки')}${macro(SVG.food,m.fat,'Жиры')}${macro(SVG.food,m.carbs,'Углеводы')}</div><button class="primary" data-add-meal>＋ Добавить приём пищи</button><article class="card list-card">${listRow(SVG.food,'Рецепты','Простые и полезные')}${listRow(SVG.plan,'Мои продукты','Быстрый доступ')}${listRow(SVG.analytics,'План питания','Сбалансированные рационы')}</article></section>`;
}

function water(){
  const m=metrics(state);
  return `<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Вода</h1><p class="page-sub">Больше воды — больше тебя.</p>${orb(m.water.done/8,`<strong>${m.water.done}/8</strong><small>Стаканов сегодня</small>`)}<button class="primary" data-water>＋ Добавить стакан</button><article class="card tip-card"><div class="tip-icon">${SVG.water}</div><div><small>СОВЕТ</small><b>Вода помогает сохранять ритм</b><p>Добавляй по одному стакану без давления.</p></div><span class="chev">${SVG.chevron}</span></article></section>`;
}

function sleep(){
  const m=metrics(state);
  return `<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Сон</h1><p class="page-sub">Глубокий сон — ясный день.</p>${orb(m.sleep.done/8,`<strong>${m.sleep.done}/8</strong><small>Часов</small>`)}<article class="card list-card">${listRow(SVG.sleep,'Подготовка ко сну','10 минут спокойного режима')}${listRow(SVG.plan,'Напоминание','Выбрать время')}${listRow(SVG.analytics,'История сна','Последние 7 дней')}</article><button class="primary" data-sleep>Отметить 8 часов сна</button></section>`;
}

function focus(){
  return `<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Фокус</h1><p class="page-sub">Меньше отвлечений — больше результата.</p>${orb(.62,`<strong>25:00</strong><small>Всё важное</small>`)}<button class="primary" data-focus>Начать 25 минут</button><article class="card tip-card"><div class="tip-icon">${SVG.focus}</div><div><b>Один блок. Одна задача.</b><p>Когда таймер закончится, сделай короткую паузу.</p></div><span class="chev">${SVG.chevron}</span></article></section>`;
}

function camera(){
  return `<section class="page"><div class="page-kicker">AI CAMERA</div><h1>Сфотографируй еду</h1><p class="page-sub">Быстрый снимок — простой способ вести питание.</p><div class="camera-preview" id="cameraPreview">${SVG.camera}</div><button class="primary" data-camera>Открыть камеру</button></section>`;
}

function profileRow(icon,title){return `<button class="profile-row"><span>${icon}</span><b>${title}</b><em>${SVG.chevron}</em></button>`}

function me(){
  return `<section class="page"><div class="page-kicker">ПРОФИЛЬ</div><h1>${state.profile.name}</h1><p class="page-sub">Лучше, чем вчера.</p><div class="profile-head"><div class="avatar"></div><div><h2>${state.profile.name}</h2><p>${state.profile.height} см · ${state.profile.weight} кг</p></div></div><article class="card profile-menu">${profileRow(SVG.focus,'Мои цели')}${profileRow(SVG.analytics,'Статистика')}${profileRow(SVG.plan,'Напоминания')}${profileRow(SVG.profile,'Настройки')}${profileRow(SVG.chevron,'Поддержка')}</article><article class="card quote-card">«Забота о себе сегодня — счастливое завтра.»</article></section>`;
}

function render(){
  state=load();
  applyTheme();
  renderHeader();
  renderNav();
  const pages={home,plan,analytics,move,food,water,sleep,focus,camera,me};
  screen.innerHTML=(pages[view]||home)();
  bindScreen();
}

function bindScreen(){
  screen.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
  screen.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>togglePlan(b.dataset.plan)));
  screen.querySelector('[data-water]')?.addEventListener('click',addWater);
  screen.querySelector('[data-sleep]')?.addEventListener('click',markSleep);
  screen.querySelector('[data-focus]')?.addEventListener('click',()=>openTimer(25,'Фокус','focus'));
  screen.querySelector('[data-start-workout]')?.addEventListener('click',()=>openTimer(10,'Тренировка','move'));
  screen.querySelectorAll('[data-action="workout"]').forEach(b=>b.addEventListener('click',()=>openTimer(10,'Тренировка','move')));
  screen.querySelector('[data-add-meal]')?.addEventListener('click',openMealSheet);
  screen.querySelector('[data-camera]')?.addEventListener('click',()=>cameraInput.click());
}

function togglePlan(id){
  const {log}=today(state);
  log.plan=log.plan||{};
  log.plan[id]=!log.plan[id];
  save(state);
  render();
}

function addWater(){
  const {log}=today(state);
  log.water=Math.min(8,(Number(log.water)||0)+1);
  save(state);
  render();
}

function markSleep(){
  const {log}=today(state);
  log.sleep=8;
  save(state);
  render();
}

function openSheet(html){
  sheet.innerHTML=`<button class="sheet-backdrop" data-close-sheet aria-label="Закрыть"></button><div class="sheet-card">${html}</div>`;
  sheet.classList.add('open');
  sheet.querySelectorAll('[data-close-sheet]').forEach(b=>b.addEventListener('click',closeSheet));
}

function closeSheet(){
  sheet.classList.remove('open');
  sheet.innerHTML='';
  if(timerTick){clearInterval(timerTick);timerTick=null}
}

function quickSheet(){
  openSheet(`<button class="sheet-close" data-close-sheet>×</button><h2>Быстрые действия</h2><p>Самые частые действия Nova+.</p><div class="quick-grid">
    <button data-q="water"><span>${SVG.water}</span><b>Добавить воду</b></button>
    <button data-q="meal"><span>${SVG.food}</span><b>Добавить еду</b></button>
    <button data-q="move"><span>${SVG.sport}</span><b>Тренировка</b></button>
    <button data-q="focus"><span>${SVG.focus}</span><b>Фокус</b></button>
    <button data-q="sleep"><span>${SVG.sleep}</span><b>Сон</b></button>
    <button data-q="camera"><span>${SVG.camera}</span><b>Камера еды</b></button>
  </div>`);
  sheet.querySelector('[data-q="water"]')?.addEventListener('click',()=>{closeSheet();addWater()});
  sheet.querySelector('[data-q="meal"]')?.addEventListener('click',()=>{closeSheet();openMealSheet()});
  sheet.querySelector('[data-q="move"]')?.addEventListener('click',()=>{closeSheet();go('move')});
  sheet.querySelector('[data-q="focus"]')?.addEventListener('click',()=>{closeSheet();openTimer(25,'Фокус','focus')});
  sheet.querySelector('[data-q="sleep"]')?.addEventListener('click',()=>{closeSheet();go('sleep')});
  sheet.querySelector('[data-q="camera"]')?.addEventListener('click',()=>{closeSheet();go('camera')});
}

function openMealSheet(){
  openSheet(`<button class="sheet-close" data-close-sheet>×</button><h2>Добавить приём пищи</h2><p>Можно указать только то, что знаешь.</p><form id="mealForm" class="meal-form"><label>Название<input name="title" placeholder="Например, завтрак"></label><div class="form-grid"><label>Ккал<input name="kcal" type="number" min="0" inputmode="numeric"></label><label>Белки<input name="protein" type="number" min="0" inputmode="decimal"></label><label>Жиры<input name="fat" type="number" min="0" inputmode="decimal"></label><label>Углеводы<input name="carbs" type="number" min="0" inputmode="decimal"></label></div><button class="primary" type="submit">Добавить</button></form>`);
  sheet.querySelector('#mealForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const {meals}=today(state);
    meals.push({title:fd.get('title')||'Приём пищи',kcal:Number(fd.get('kcal'))||0,protein:Number(fd.get('protein'))||0,fat:Number(fd.get('fat'))||0,carbs:Number(fd.get('carbs'))||0,time:Date.now()});
    save(state);closeSheet();render();
  });
}

function openTimer(minutes,title,type){
  let left=Math.max(1,minutes)*60;
  const format=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  openSheet(`<button class="sheet-close" data-close-sheet>×</button><div class="timer-sheet"><span class="timer-icon">${type==='move'?SVG.sport:SVG.focus}</span><small>${title}</small><strong id="timerValue">${format(left)}</strong><button class="primary" data-complete-timer>Завершить</button></div>`);
  const done=()=>{
    const {log}=today(state);
    if(type==='focus')log.focus=(Number(log.focus)||0)+minutes;
    if(type==='move'){
      log.moveMinutes=(Number(log.moveMinutes)||0)+minutes;
      log.moveKcal=(Number(log.moveKcal)||0)+Math.round(minutes*6);
    }
    save(state);closeSheet();render();
  };
  sheet.querySelector('[data-complete-timer]')?.addEventListener('click',done);
  timerTick=setInterval(()=>{
    left=Math.max(0,left-1);
    const el=sheet.querySelector('#timerValue');if(el)el.textContent=format(left);
    if(left<=0){clearInterval(timerTick);timerTick=null;done()}
  },1000);
}

cameraInput?.addEventListener('change',()=>{
  const file=cameraInput.files?.[0];
  if(!file)return;
  const url=URL.createObjectURL(file);
  go('camera');
  requestAnimationFrame(()=>{
    const preview=document.getElementById('cameraPreview');
    if(preview){preview.innerHTML=`<img src="${url}" alt="Фото еды">`;preview.classList.add('has-image')}
  });
});

render();
