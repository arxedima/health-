import {load,save,today,setTheme} from './nova-store.js';
import {dayPlan,metrics,overallProgress,weeklyBars,monthRhythm,greeting,dailyTip,fullDate,monthName} from './nova-engine.js';

const app=document.getElementById('app');
const header=document.getElementById('header');
const screen=document.getElementById('screen');
const nav=document.getElementById('nav');
const sheet=document.getElementById('sheet');
const cameraInput=document.getElementById('cameraInput');
let state=load();
let view='home';
let activeTimer=null;
let timerTick=null;

const NAV=[['home','Главная','⌂'],['plan','План','▣'],['quick','', '+'],['analytics','Аналитика','▥'],['me','Я','○']];

function resolveTheme(){
  const pref=state.settings?.theme||'auto';
  if(pref==='dark')return'dark';
  if(pref==='light')return'light';
  const h=new Date().getHours();
  return h>=19||h<7?'dark':'light';
}
function applyTheme(){app.classList.toggle('dark',resolveTheme()==='dark');document.querySelector('meta[name="theme-color"]')?.setAttribute('content',resolveTheme()==='dark'?'#08182d':'#f4f8ff')}
function toggleTheme(){const next=resolveTheme()==='dark'?'light':'dark';state=setTheme(next);applyTheme();renderHeader()}
function themeGlyph(){return resolveTheme()==='dark'?'☀️':'🌙'}
function brand(){return`<div class="brand"><span class="brand-orb"></span><div><strong>NoVa+</strong><small>HEALTH OS</small></div></div>`}
function renderHeader(){header.innerHTML=`${brand()}<button class="header-btn" data-theme aria-label="Сменить тему">${themeGlyph()}</button>`}
function renderNav(){nav.innerHTML=NAV.map(([id,label,icon])=>id==='quick'?`<button class="plus-launch" data-quick-launch><span class="plus-core">+</span></button>`:`<button data-view="${id}" class="${view===id?'active':''}"><span>${icon}</span><small>${label}</small></button>`).join('')}
function go(next){view=next;render();requestAnimationFrame(()=>screen.scrollTop=0)}
function pct(done,target){return Math.max(0,Math.min(100,Math.round(done/Math.max(1,target)*100)))}
function metricTile(icon,title,m,key){return`<button class="metric" data-view="${key}"><span>${icon}</span><b>${title}</b><small>${m.done} / ${m.target}</small><div class="mini-line"><i style="width:${pct(m.done,m.target)}%"></i></div></button>`}
function orb(progress,label=''){return`<div class="hero-orb-wrap"><div class="progress-arc" style="transform:rotate(${-35+progress*220}deg)"></div><div class="hero-orb"></div>${label?`<div class="progress-label">${label}</div>`:''}</div>`}

function home(){
  const d=new Date(),m=metrics(state,d),g=greeting(d),tip=dailyTip(state,d),p=overallProgress(state,d);
  return`<section class="page home-page"><div class="page-kicker">${fullDate(d)}</div><h1>${g[0]},<br>${state.profile.name||'друг'}</h1><p class="page-sub">${g[1]}</p>${orb(p)}<div class="metric-grid">${metricTile('🏃','Спорт',m.movement,'move')}${metricTile('🍎','Питание',m.food,'food')}${metricTile('💧','Вода',m.water,'water')}${metricTile('🌙','Сон',m.sleep,'sleep')}</div><button class="primary" data-view="plan">＋ Составить план дня</button><article class="card tip-card"><div class="tip-icon">${tip.icon}</div><div><small>СОВЕТ ДНЯ</small><b>${tip.title}</b><p>${tip.text}</p></div><span class="chev">›</span></article><section class="card"><div class="section-title" style="margin-top:0"><div><small>РИТМ МЕСЯЦА</small><h2>${monthName(d)}</h2></div></div><div class="month-grid">${monthRhythm(state,d).map(x=>`<span class="day-dot ${x.status} ${x.today?'today':''}">${x.day}</span>`).join('')}</div></section></section>`;
}
function plan(){
  const rows=dayPlan(state);
  return`<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Мой план дня</h1><p class="page-sub">Баланс в простых действиях.</p><article class="card timeline">${rows.map(r=>`<button class="timeline-row ${r.done?'done':''}" data-plan="${r.id}"><time>${r.time}</time><span class="timeline-dot">${r.done?'✓':''}</span><div><b>${r.title}</b><small>${r.subtitle}</small></div></button>`).join('')}</article><article class="card quote-card">“Дисциплина сегодня — свобода завтра.”</article></section>`;
}
function analytics(){
  const w=weeklyBars(state),m=metrics(state);
  return`<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Аналитика</h1><p class="page-sub">Твой прогресс — без лишнего шума.</p><div class="segment"><button>День</button><button class="active">Неделя</button><button>Месяц</button></div><article class="card"><div class="bar-chart">${w.map(x=>`<div class="bar ${x.active?'active':''}"><i style="height:${Math.max(12,x.value)}%"></i><small>${x.label}</small></div>`).join('')}</div></article><article class="card analytics-list">${analyticsRow('🏃','Движение',m.movement.done,m.movement.target)}${analyticsRow('🍎','Питание',m.food.done,m.food.target)}${analyticsRow('💧','Вода',m.water.done,m.water.target)}${analyticsRow('🌙','Сон',m.sleep.done,m.sleep.target)}</article><article class="card tip-card"><div class="tip-icon">🔥</div><div><b>Хороший ритм</b><p>Регулярность важнее идеального дня.</p></div><span class="chev">›</span></article></section>`;
}
function analyticsRow(icon,title,done,target){return`<div class="analytics-row"><span>${icon}</span><div><b>${title}</b><div class="analytics-line"><i style="width:${pct(done,target)}%"></i></div></div><em>${done} / ${target}</em></div>`}
function move(){
  const m=metrics(state),done=m.movement.done;
  return`<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Движение</h1><p class="page-sub">Тело в движении — ум в порядке.</p>${orb(done/3,`<strong>${done}/3</strong><small>Сегодня</small>`)}<div class="stat-three"><div><b>${m.steps.toLocaleString('ru-RU')}</b><small>Шагов</small></div><div><b>${m.minutes}</b><small>Минут</small></div><div><b>${m.moveKcal}</b><small>Ккал</small></div></div><button class="primary" data-start-workout>▷ Начать тренировку</button><div class="section-title"><div><small>ПОПУЛЯРНОЕ</small><h2>Выбери комплекс</h2></div></div><article class="card list-card">${listRow('♡','ЛФК · Мягкое восстановление','15 минут','workout')}${listRow('🏃','FULL BODY','24 минуты · 6 упражнений','workout')}${listRow('⌁','Растяжка','10 минут','workout')}</article></section>`;
}
function food(){
  const m=metrics(state);
  return`<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Питание</h1><p class="page-sub">Хорошая еда — больше энергии.</p>${orb(Math.min(1,m.kcal/2000))}<div class="macro-grid">${macro('🔥',m.kcal,'Ккал')}${macro('🌿',m.protein,'Белки')}${macro('〽',m.fat,'Жиры')}${macro('○',m.carbs,'Углеводы')}</div><button class="primary" data-add-meal>＋ Добавить приём пищи</button><article class="card list-card">${listRow('⌘','Рецепты','Простые и полезные')}${listRow('▣','Мои продукты','Быстрый доступ')}${listRow('▤','План питания','Сбалансированные рационы')}</article></section>`;
}
function macro(icon,val,label){return`<div class="macro"><span>${icon}</span><b>${Math.round(val)}</b><small>${label}</small></div>`}
function listRow(icon,title,sub,action=''){return`<button class="list-row" ${action?`data-action="${action}"`:''}><span>${icon}</span><div><b>${title}</b><small>${sub}</small></div><em>›</em></button>`}
function water(){const m=metrics(state);return`<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Вода</h1><p class="page-sub">Больше воды — больше тебя.</p>${orb(m.water.done/8,`<strong>${m.water.done}/8</strong><small>Стаканов сегодня</small>`)}<button class="primary" data-water>＋ Добавить стакан</button><article class="card tip-card"><div class="tip-icon">💧</div><div><small>СОВЕТ</small><b>Вода помогает сохранять ритм</b><p>Добавляй по одному стакану без давления.</p></div><span class="chev">›</span></article></section>`}
function sleep(){const m=metrics(state);return`<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Сон</h1><p class="page-sub">Глубокий сон — ясный день.</p>${orb(m.sleep.done/8,`<strong>${m.sleep.done}/8</strong><small>Часов</small>`)}<article class="card list-card">${listRow('🌙','Подготовка ко сну','10 минут спокойного режима')}${listRow('🔔','Напоминание','Выбрать время')}${listRow('🔊','История сна','Последние 7 дней')}</article><button class="primary" data-sleep>Отметить 8 часов сна</button></section>`}
function focus(){return`<section class="page"><div class="page-kicker">${fullDate()}</div><h1>Фокус</h1><p class="page-sub">Меньше отвлечений — больше результата.</p>${orb(.62,`<strong>25:00</strong><small>Всё важное</small>`)}<button class="primary" data-focus>▷ Начать 25 минут</button><article class="card tip-card"><div class="tip-icon">◉</div><div><b>Один блок. Одна задача.</b><p>Когда таймер закончится, сделай короткую паузу.</p></div><span class="chev">›</span></article></section>`}
function camera(){return`<section class="page"><div class="page-kicker">AI CAMERA</div><h1>Сфотографируй еду</h1><p class="page-sub">Быстрый снимок — простой способ вести питание.</p><div class="camera-preview" id="cameraPreview">📷</div><button class="primary" data-camera>Открыть камеру</button></section>`}
function me(){return`<section class="page"><div class="page-kicker">ПРОФИЛЬ</div><h1>${state.profile.name}</h1><p class="page-sub">Душа, ум, тело.</p><div class="profile-head"><div class="avatar"></div><div><h2>${state.profile.name}</h2><p>${state.profile.height} см · ${state.profile.weight} кг</p></div></div><article class="card profile-menu">${profileRow('◎','Мои цели')}${profileRow('▥','Статистика')}${profileRow('♧','Напоминания')}${profileRow('⚙','Настройки')}${profileRow('?','Поддержка')}</article><article class="card quote-card">“Забота о себе сегодня — счастливое завтра.”</article></section>`}
function profileRow(icon,title){return`<button class="profile-row"><span>${icon}</span><b>${title}</b><em>›</em></button>`}

function render(){state=load();applyTheme();renderHeader();renderNav();const pages={home,plan,analytics,move,food,water,sleep,focus,camera,me};screen.innerHTML=(pages[view]||home)();bindScreen();}
function bindScreen(){
  screen.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));
  screen.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>togglePlan(b.dataset.plan));
  screen.querySelector('[data-water]')?.addEventListener('click',addWater);
  screen.querySelector('[data-sleep]')?.addEventListener('click',markSleep);
  screen.querySelector('[data-focus]')?.addEventListener('click',()=>openTimer(25,'Фокус'));
  screen.querySelector('[data-start-workout]')?.addEventListener('click',()=>openTimer(10,'Тренировка'));
  screen.querySelectorAll('[data-action="workout"]').forEach(b=>b.onclick=()=>openTimer(10,'Тренировка'));
  screen.querySelector('[data-add-meal]')?.addEventListener('click',openMealSheet);
  screen.querySelector('[data-camera]')?.addEventListener('click',()=>cameraInput.click());
}
function togglePlan(id){const {log}=today(state);log.plan=log.plan||{};log.plan[id]=!log.plan[id];save(state);render()}
function addWater(){const {log}=today(state);log.water=Math.min(8,(Number(log.water)||0)+1);save(state);render()}
function markSleep(){const {log}=today(state);log.sleep=8;save(state);render()}
function openSheet(html){sheet.innerHTML=`<button class="sheet-backdrop" data-close-sheet></button><div class="sheet-card">${html}</div>`;sheet.classList.add('open');sheet.querySelectorAll('[data-close-sheet]').forEach(b=>b.onclick=closeSheet)}
function closeSheet(){sheet.classList.remove('open');sheet.innerHTML='';if(timerTick){clearInterval(timerTick);timerTick=null}}
function quickSheet(){openSheet(`<button class="sheet-close" data-close-sheet>×</button><h2>Быстрые действия</h2><p>Самые частые действия Nova+.</p><div class="quick-grid"><button data-q="water"><span>💧</span><b>Добавить воду</b></button><button data-q="meal"><span>🍎</span><b>Добавить еду</b></button><button data-q="move"><span>🏃</span><b>Тренировка</b></button><button data-q="focus"><span>◉</span><b>Фокус</b></button><button data-q="sleep"><span>🌙</span><b>Сон</b></button><button data-q="camera"><span>📷</span><b>Камера еды</b></button></div>`);sheet.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const q=b.dataset.q;closeSheet();if(q==='water'){addWater();return}if(q==='meal'){openMealSheet();return}if(q==='move'){go('move');return}if(q==='focus'){go('focus');return}if(q==='sleep'){go('sleep');return}if(q==='camera'){go('camera');return}})}
function openMealSheet(){openSheet(`<button class="sheet-close" data-close-sheet>×</button><h2>Добавить приём пищи</h2><p>Можно ввести приблизительные значения.</p><div class="form-grid"><input class="input" id="mealName" placeholder="Название"><input class="input" id="mealKcal" inputmode="numeric" placeholder="Ккал"><input class="input" id="mealProtein" inputmode="numeric" placeholder="Белок, г"><input class="input" id="mealFat" inputmode="numeric" placeholder="Жиры, г"><input class="input" id="mealCarbs" inputmode="numeric" placeholder="Углеводы, г"></div><button class="primary" id="saveMeal">Сохранить</button>`);sheet.querySelector('#saveMeal').onclick=()=>{const t=today(state);t.meals.push({id:Date.now(),name:sheet.querySelector('#mealName').value||'Приём пищи',kcal:Number(sheet.querySelector('#mealKcal').value)||0,protein:Number(sheet.querySelector('#mealProtein').value)||0,fat:Number(sheet.querySelector('#mealFat').value)||0,carbs:Number(sheet.querySelector('#mealCarbs').value)||0,at:Date.now()});save(state);closeSheet();go('food')}}
function openTimer(min,title){let seconds=min*60;openSheet(`<button class="sheet-close" data-close-sheet>×</button><h2>${title}</h2><p>Nova+ оставит на экране только таймер.</p><div class="timer-big" id="timerValue">${String(min).padStart(2,'0')}:00</div><button class="primary" id="timerDone">Завершить</button>`);const el=sheet.querySelector('#timerValue');timerTick=setInterval(()=>{seconds=Math.max(0,seconds-1);el.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;if(!seconds)finishTimer(min,title)},1000);sheet.querySelector('#timerDone').onclick=()=>finishTimer(min,title)}
function finishTimer(min,title){if(timerTick){clearInterval(timerTick);timerTick=null}const {log}=today(state);if(title==='Фокус')log.focus=(Number(log.focus)||0)+min;else{log.moveMinutes=(Number(log.moveMinutes)||0)+min;log.moveKcal=(Number(log.moveKcal)||0)+Math.round(min*7)}save(state);closeSheet();render()}

nav.addEventListener('click',e=>{const v=e.target.closest('[data-view]');if(v)go(v.dataset.view);if(e.target.closest('[data-quick-launch]'))quickSheet()});
header.addEventListener('click',e=>{if(e.target.closest('[data-theme]'))toggleTheme()});
cameraInput.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;go('camera');requestAnimationFrame(()=>{const p=document.getElementById('cameraPreview');if(p)p.innerHTML=`<img src="${URL.createObjectURL(f)}" alt="Фото еды">`})});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();