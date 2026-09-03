import { loadState, saveState } from './vector-store.js';
import { addWater, setFeeling, nextAction, period } from './vector-engine.js';

const nav=document.getElementById('bottomNav');
const screen=document.getElementById('screen');
const cameraInput=document.getElementById('cameraInput');
const toastHost=document.getElementById('toastHost');
if(!nav||!screen) throw new Error('VECTOR LOOP shell missing');

const primary=[
  {id:'camera',label:'Сфотографировать еду',sub:'AI-анализ блюда',icon:'📷'},
  {id:'water',label:'Добавить воду',sub:'+ 200 мл',icon:'💧'},
  {id:'timer',label:'Запустить таймер',sub:'1 · 5 · 10 · 20 минут',icon:'◴'},
  {id:'reminder',label:'Напоминание',sub:'Добавить полезное действие',icon:'♧'},
  {id:'feeling',label:'Самочувствие',sub:'Как ты сейчас?',icon:'♡'},
  {id:'ai',label:'Спросить AI',sub:'Что имеет смысл сделать?',icon:'✦'}
];
const secondary=[
  {id:'movement',label:'Движение',sub:'Minimal Dose',icon:'⌁'},
  {id:'walk',label:'Прогулка',sub:'7 минут спокойно',icon:'🚶'},
  {id:'breathe',label:'Дыхание',sub:'1 минута тишины',icon:'◌'},
  {id:'focus',label:'Фокус',sub:'10 минут одной задачи',icon:'◎'},
  {id:'route',label:'Маршрут дня',sub:'Что дальше',icon:'↝'},
  {id:'analytics',label:'Данные',sub:'Сложность по запросу',icon:'▥'}
];
const shortQuotes={
  morning:['Начни с малого.','Первый правильный шаг.','Сегодня не нужен идеальный старт.','Сейчас важна простота.'],
  day:['Сохраняй ритм.','Сейчас важен следующий шаг.','Сделай одно полезное действие.','Не перегружай себя.'],
  evening:['Пора снизить темп.','Сегодня важнее устойчивость, чем максимум.','Маршрут можно упростить.','Достаточно мягкого движения.'],
  night:['Всё нормально.','Сегодня больше ничего не нужно.','Остальное завтра.','Сейчас важнее восстановление.']
};
const deepQuotes=[
  'Не идеальный день. Правильный следующий шаг.',
  'Если план не сработал — это не провал, это новый маршрут.',
  'Ты не обязан делать всё сразу, чтобы двигаться в правильную сторону.',
  'Иногда лучший прогресс — это уменьшить нагрузку.',
  'Твой день не потерян. Его всегда можно пересчитать.',
  'Не управляй всем сразу. Просто сделай следующий правильный шаг.',
  'Сегодня хватит одного действия, которое действительно имеет смысл.'
];

let quickPage=0, quoteTimer=null, sphereGesture=null, utilityTimer=null, utilityEnd=0;

function toast(text){
  if(!toastHost) return;
  const n=document.createElement('div'); n.className='toast'; n.textContent=text; toastHost.appendChild(n);
  requestAnimationFrame(()=>n.classList.add('show'));
  setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),240)},1900);
}
function go(view){
  closeQuick();
  const direct=nav.querySelector(`[data-view="${view}"]`);
  if(direct){direct.click();return;}
  const b=document.createElement('button');b.dataset.view=view;b.hidden=true;document.body.appendChild(b);b.click();b.remove();
}
function refresh(){
  const active=nav.querySelector('button.active[data-view]');
  if(active) setTimeout(()=>active.click(),30);
  else go('now');
}

/* Bottom navigation becomes: Сейчас · Движение · VECTOR+ · Питание · Я */
function patchNav(){
  const buttons=[...nav.querySelectorAll(':scope > button')];
  if(buttons.length<5) return;
  const current=screen.className.match(/view-([\w-]+)/)?.[1]||'now';
  const [b0,b1,b2,b3,b4]=buttons;
  b0.dataset.view='now'; b0.classList.toggle('active',current==='now'); b0.innerHTML='<span>⌁</span><small>Сейчас</small>';
  b1.dataset.view='move'; b1.classList.toggle('active',current==='move'); b1.innerHTML='<span>⌁</span><small>Движение</small>';
  delete b2.dataset.view; b2.removeAttribute('data-view'); b2.className='vector-quick-launcher'; b2.type='button'; b2.setAttribute('aria-label','Быстрые действия VECTOR'); b2.innerHTML='<span class="vq-mini-core" aria-hidden="true"></span>';
  b3.dataset.view='food'; b3.classList.toggle('active',current==='food'); b3.innerHTML='<span>⋔</span><small>Питание</small>';
  b4.dataset.view='me'; b4.classList.toggle('active',current==='me'); b4.innerHTML='<span>○</span><small>Я</small>';
}

function ensureQuick(){
  let layer=document.getElementById('vectorQuickV3');
  if(layer) return layer;
  layer=document.createElement('div'); layer.id='vectorQuickV3'; layer.className='vector-quick-v3'; layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<button class="vq-backdrop" data-vq-close aria-label="Закрыть"></button>
    <section class="vq-panel" role="dialog" aria-modal="true" aria-label="Быстрые действия">
      <header class="vq-head"><div><small>VECTOR QUICK</small><h2>Быстрые действия</h2></div><button class="vq-close" data-vq-close>×</button></header>
      <svg class="vq-curve" viewBox="0 0 180 500" aria-hidden="true"><defs><linearGradient id="vqGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a91ff"/><stop offset="1" stop-color="#66d6ff"/></linearGradient></defs><path d="M145 5 C40 95 35 175 115 245 C165 290 165 365 80 495"/></svg>
      <div class="vq-actions" id="vqActions"></div>
      <button class="vq-page-switch" id="vqPageSwitch"><i class="active"></i><i></i><span>Ещё 6</span></button>
      <button class="vq-bottom-core" data-vq-close aria-label="Закрыть быстрые действия"></button>
    </section>`;
  document.body.appendChild(layer);
  layer.addEventListener('click',e=>{
    if(e.target.closest('[data-vq-close]')){closeQuick();return;}
    const action=e.target.closest('[data-vq-action]'); if(action){runAction(action.dataset.vqAction);return;}
    if(e.target.closest('#vqPageSwitch')) switchQuickPage();
  });
  return layer;
}
function renderQuickActions(){
  const layer=ensureQuick(), host=layer.querySelector('#vqActions'), list=quickPage?secondary:primary;
  host.classList.add('switching');
  setTimeout(()=>{
    host.innerHTML=list.map((x,i)=>`<button class="vq-action" style="--n:${i}" data-vq-action="${x.id}"><div><strong>${x.label}</strong><small>${x.sub}</small></div><span>${x.icon}</span></button>`).join('');
    const sw=layer.querySelector('#vqPageSwitch'), dots=sw.querySelectorAll('i'); dots.forEach((d,i)=>d.classList.toggle('active',i===quickPage)); sw.querySelector('span').textContent=quickPage?'Основные':'Ещё 6';
    host.classList.remove('switching');
  },110);
}
function openQuick(){
  const layer=ensureQuick(); quickPage=0; renderQuickActions(); layer.classList.add('open'); layer.setAttribute('aria-hidden','false'); document.documentElement.style.overflow='hidden'; requestAnimationFrame(()=>layer.classList.add('shown')); navigator.vibrate?.(10);
}
function closeQuick(){
  const layer=document.getElementById('vectorQuickV3'); if(!layer)return; layer.classList.remove('shown'); layer.setAttribute('aria-hidden','true'); document.documentElement.style.overflow=''; setTimeout(()=>layer.classList.remove('open'),280);
}
function switchQuickPage(){quickPage=quickPage?0:1;renderQuickActions();navigator.vibrate?.(6)}

function ensureUtility(){
  let layer=document.getElementById('vectorActionUtility'); if(layer)return layer;
  layer=document.createElement('div'); layer.id='vectorActionUtility'; layer.className='vector-action-utility'; layer.innerHTML='<button class="vau-backdrop" data-vau-close></button><section class="vau-card"><button class="vau-x" data-vau-close>×</button><div id="vauBody"></div></section>';
  document.body.appendChild(layer); layer.addEventListener('click',e=>{if(e.target.closest('[data-vau-close]'))closeUtility()}); return layer;
}
function openUtility(html,kind=''){closeQuick();const layer=ensureUtility();clearInterval(utilityTimer);utilityTimer=null;layer.className=`vector-action-utility open ${kind}`;layer.querySelector('#vauBody').innerHTML=html;requestAnimationFrame(()=>layer.classList.add('shown'));return layer}
function closeUtility(){clearInterval(utilityTimer);utilityTimer=null;const layer=document.getElementById('vectorActionUtility');if(!layer)return;layer.classList.remove('shown');setTimeout(()=>layer.className='vector-action-utility',240)}
function fmt(sec){const m=Math.floor(sec/60),s=sec%60;return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function launchTimer(seconds,title){
  utilityEnd=Date.now()+seconds*1000; const layer=openUtility(`<small class="vau-kicker">VECTOR TIMER</small><h2>${title}</h2><p>Одна короткая сессия. Больше ничего не нужно.</p><div class="vau-clock" id="vauClock">${fmt(seconds)}</div><button class="vau-primary" data-timer-done>Завершить</button>`,'timer-mode');
  layer.querySelector('[data-timer-done]').onclick=()=>{closeUtility();toast(`${title}: готово ✓`)};
  utilityTimer=setInterval(()=>{const left=Math.max(0,Math.ceil((utilityEnd-Date.now())/1000));const el=document.getElementById('vauClock');if(el)el.textContent=fmt(left);if(left<=0){clearInterval(utilityTimer);utilityTimer=null;toast(`${title}: готово ✓`);setTimeout(closeUtility,500)}},500);
}
function chooseTimer(){
  const layer=openUtility('<small class="vau-kicker">БЫСТРЫЙ ТАЙМЕР</small><h2>Сколько времени?</h2><p>Выбери короткий интервал.</p><div class="vau-presets"><button data-sec="60">1 мин</button><button data-sec="300">5 мин</button><button data-sec="600">10 мин</button><button data-sec="1200">20 мин</button><button data-sec="1800">30 мин</button><button data-sec="2700">45 мин</button></div>');
  layer.querySelectorAll('[data-sec]').forEach(b=>b.onclick=()=>launchTimer(Number(b.dataset.sec),`Таймер · ${b.textContent}`));
}
function chooseFeeling(){
  const layer=openUtility('<small class="vau-kicker">САМОЧУВСТВИЕ</small><h2>Как ты сейчас?</h2><p>VECTOR использует это, чтобы уменьшать или увеличивать Minimal Dose.</p><div class="vau-feelings"><button data-energy="1">😵</button><button data-energy="2">😕</button><button data-energy="3">😐</button><button data-energy="4">🙂</button><button data-energy="5">⚡</button></div>');
  layer.querySelectorAll('[data-energy]').forEach(b=>b.onclick=()=>{let s=loadState();s=setFeeling(s,Number(b.dataset.energy));saveState(s);closeUtility();toast('VECTOR перестроил нагрузку');refresh()});
}
function reminder(){
  const layer=openUtility('<small class="vau-kicker">НАПОМИНАНИЕ</small><h2>Что не забыть?</h2><input class="vau-input" id="vauReminderText" placeholder="Например: ЛФК"><input class="vau-input" id="vauReminderTime" type="time"><button class="vau-primary" id="vauReminderSave">Сохранить</button>');
  layer.querySelector('#vauReminderSave').onclick=()=>{const text=layer.querySelector('#vauReminderText').value.trim()||'Полезное действие',time=layer.querySelector('#vauReminderTime').value||'18:00';const s=loadState();s.reminders=Array.isArray(s.reminders)?s.reminders:[];s.reminders.push({id:Date.now(),title:text,time,enabled:true});saveState(s);closeUtility();toast(`Напоминание · ${time}`)};
}
function breathe(){
  const layer=openUtility('<small class="vau-kicker">ТИХАЯ ПОМОЩЬ</small><h2>Одна минута дыхания</h2><p id="vauBreathText">Спокойный вдох</p><div class="vau-breathe"></div><button class="vau-primary" id="vauBreathDone">Готово</button>','breathe-mode');let inhale=true;utilityTimer=setInterval(()=>{inhale=!inhale;layer.classList.toggle('exhale',!inhale);const t=layer.querySelector('#vauBreathText');if(t)t.textContent=inhale?'Спокойный вдох':'Длинный выдох'},5000);layer.querySelector('#vauBreathDone').onclick=()=>{closeUtility();toast('Стало чуть тише ◌')};
}
function askAi(){
  const action=nextAction(loadState());
  const layer=openUtility(`<small class="vau-kicker">HEALTH+ / VECTOR</small><h2>Спросить VECTOR</h2><p>Задай короткий вопрос о своём дне.</p><textarea class="vau-input vau-textarea" id="vauAiQ" placeholder="Что мне сейчас лучше сделать?"></textarea><button class="vau-primary" id="vauAiAsk">Спросить</button><div class="vau-ai-answer" id="vauAiAnswer" hidden></div>`);
  layer.querySelector('#vauAiAsk').onclick=()=>{const answer=layer.querySelector('#vauAiAnswer');answer.hidden=false;answer.textContent=`Сейчас лучший следующий шаг: ${action.title}. ${action.detail}`;navigator.vibrate?.(6)};
}

function runAction(id){
  navigator.vibrate?.(8);
  if(id==='camera'){closeQuick();go('food');setTimeout(()=>cameraInput?.click(),240);return}
  if(id==='water'){let s=loadState();s=addWater(s,.2);saveState(s);closeQuick();toast('💧 +200 мл воды');refresh();return}
  if(id==='timer'){chooseTimer();return}
  if(id==='reminder'){reminder();return}
  if(id==='feeling'){chooseFeeling();return}
  if(id==='ai'){askAi();return}
  if(id==='movement'){go('move');return}
  if(id==='walk'){launchTimer(420,'Прогулка · 7 минут');return}
  if(id==='breathe'){breathe();return}
  if(id==='focus'){launchTimer(600,'Фокус · 10 минут');return}
  if(id==='route'){go('route');return}
  if(id==='analytics'){go('me');return}
}

function quoteFor(long=false){const p=period();const list=long?deepQuotes:(shortQuotes[p]||shortQuotes.day);return list[Math.floor(Math.random()*list.length)]}
function showQuote(wrap,long=false){
  clearTimeout(quoteTimer);let q=wrap.querySelector('.vector-quote');if(!q){q=document.createElement('div');q.className='vector-quote';wrap.appendChild(q)}q.textContent=quoteFor(long);q.classList.toggle('deep',long);wrap.classList.add('quote-active');requestAnimationFrame(()=>q.classList.add('show'));navigator.vibrate?.(long?[8,28,8]:6);quoteTimer=setTimeout(()=>{q.classList.remove('show');wrap.classList.remove('quote-active')},long?3600:2600)
}
function heroSphereFrom(target){const sphere=target.closest?.('.sphere-wrap.hero [data-sphere]');return sphere||null}

/* Capture hero-sphere gestures BEFORE the base UI: tap = quote, hold = deeper quote, swipe up = analytics. */
document.addEventListener('pointerdown',e=>{
  const sphere=heroSphereFrom(e.target); if(!sphere)return;
  e.preventDefault();e.stopImmediatePropagation();const wrap=sphere.closest('.sphere-wrap.hero');sphereGesture={sphere,wrap,id:e.pointerId,x:e.clientX,y:e.clientY,at:Date.now(),moved:false};sphere.classList.add('pressed');
},true);
document.addEventListener('pointermove',e=>{
  if(!sphereGesture||e.pointerId!==sphereGesture.id)return;e.preventDefault();e.stopImmediatePropagation();if(Math.abs(e.clientY-sphereGesture.y)>15||Math.abs(e.clientX-sphereGesture.x)>15)sphereGesture.moved=true;
},true);
document.addEventListener('pointerup',e=>{
  if(!sphereGesture||e.pointerId!==sphereGesture.id)return;e.preventDefault();e.stopImmediatePropagation();const g=sphereGesture;sphereGesture=null;g.sphere.classList.remove('pressed');const dy=e.clientY-g.y,dt=Date.now()-g.at;if(dy<-55){toast('Данные состояния');go('me');return}showQuote(g.wrap,dt>620&&!g.moved);
},true);
document.addEventListener('pointercancel',()=>{if(sphereGesture){sphereGesture.sphere.classList.remove('pressed');sphereGesture=null}},true);
document.addEventListener('click',e=>{if(heroSphereFrom(e.target)){e.preventDefault();e.stopImmediatePropagation()}},true);

/* Center VECTOR button owns quick actions. */
document.addEventListener('click',e=>{const b=e.target.closest('.vector-quick-launcher');if(!b)return;e.preventDefault();e.stopImmediatePropagation();openQuick()},true);

let patchQueued=false;function schedulePatch(){if(patchQueued)return;patchQueued=true;requestAnimationFrame(()=>{patchQueued=false;patchNav()})}
new MutationObserver(schedulePatch).observe(nav,{childList:true,subtree:true});
new MutationObserver(schedulePatch).observe(screen,{attributes:true,attributeFilter:['class']});
schedulePatch();
