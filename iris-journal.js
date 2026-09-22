(()=>{
'use strict';
const $=s=>document.querySelector(s),app=$('#app'),D=window.IRISData;
if(!app||!D)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',stats:'M5 20V12 M12 20V4 M19 20V8',water:'M12 3C10 7 5 11 5 15a7 7 0 0 0 14 0c0-4-5-8-7-12Z',sleep:'M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z',food:'M6 3v7m-3-7v4a3 3 0 0 0 6 0V3 M6 10v11 M17 3v18 M17 3c-4 3-4 8 0 8',sport:'m13 7-4 5 5 3-2 6 M9 12l-4 1 M13 7l3 4 4 1 M14 3h.01',arrow:'M5 12h14m-6-6 6 6-6 6',back:'m15 5-7 7 7 7',close:'m6 6 12 12M6 18 18 6',plus:'M12 5v14M5 12h14',calendar:'M5 4h14v17H5Z M8 2v4m8-4v4M5 9h14'};
const icon=k=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[k]||paths.eye}"/></svg>`;
const kinds={water:{label:'Вода',unit:'л',color:'#6db8ec'},sport:{label:'Спорт',unit:'мин',color:'#e8887c'},food:{label:'Питание',unit:'ккал',color:'#a8bb7b'},sleep:{label:'Сон',unit:'ч',color:'#b39be7'}};
const numberFormat=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}),timeFormat=new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}),dateFormats=new Map();
const number=n=>numberFormat.format(n);
const dateLabel=(date,options={day:'numeric',month:'long'})=>{const key=JSON.stringify(options);if(!dateFormats.has(key))dateFormats.set(key,new Intl.DateTimeFormat('ru-RU',options));return dateFormats.get(key).format(new Date(date+'T12:00:00'))};
const time=ms=>timeFormat.format(new Date(ms));
const localInput=ms=>`${D.day(ms)}T${time(ms)}`;
const duration=hours=>{const total=Math.round(hours*60);return `${Math.floor(total/60)} ч ${String(total%60).padStart(2,'0')} м`};
let selected=D.day(),period='day',kind='water',historyDate=D.day(),editId=null,editKind=null,statsTimer=0,lastToday=D.day();
const returnFocus=new WeakMap();
const metric=$('#metric');
metric.insertAdjacentHTML('beforeend',`<div class="journal-actions food-actions"><button id="latestFood" class="last-meal" type="button"></button><button id="addFood" class="primary-action" type="button">${icon('plus')}Добавить еду</button><button id="foodHistory" class="quiet-action" type="button">История питания</button><button id="foodGoal" class="goal-action" type="button"></button></div><div class="journal-actions sleep-actions"><button id="addSleep" class="primary-action" type="button">${icon('plus')}Записать сон</button><button id="sleepHistory" class="quiet-action" type="button">История сна</button></div>`);
app.insertAdjacentHTML('beforeend',`
 <section id="welcome" class="welcome-screen" aria-label="Добро пожаловать в IRIS" hidden>
  <div class="welcome-title"><h1>I R I S</h1><p>Спокойнее внутри</p></div>
  <button id="enterIris" class="enter-iris" type="button" aria-label="Войти в IRIS">${icon('arrow')}</button>
 </section>
 <section id="statistics" class="statistics-view" aria-labelledby="statsTitle" hidden>
  <header class="stats-header"><button id="statsBack" class="round-button" aria-label="К глазу" type="button">${icon('back')}</button><span>СТАТИСТИКА</span><label class="calendar-button">${icon('calendar')}<input id="statsDate" type="date" aria-label="Дата статистики"></label></header>
  <div class="stats-heading"><p id="statsDateLabel"></p><h1 id="statsTitle">Твой день</h1><p id="statsSubtitle">Всё, что складывается в тебя.</p></div>
  <div id="statsSummary" class="stats-summary" aria-label="Выбрать показатель"></div>
  <figure class="day-graph"><figcaption id="graphCaption"></figcaption><div id="statsGraph"></div><p id="graphEmpty" class="graph-empty" hidden>Здесь появится ритм твоего дня.<br>Добавь первую запись в одном из разделов.</p></figure>
  <div class="period-tabs" role="group" aria-label="Период статистики"><button data-period="day" type="button">День</button><button data-period="week" type="button">Неделя</button><button data-period="month" type="button">Месяц</button></div>
  <div class="list-heading"><h2 id="eventsHeading">События дня</h2><span id="eventsCount"></span></div><div id="statsEvents" class="event-list"></div>
 </section>
 <nav class="bottom-nav" aria-label="Основная навигация"><button id="eyeTab" type="button" aria-current="page">${icon('eye')}<span>Глаз</span></button><button id="statsTab" type="button">${icon('stats')}<span>Статистика</span></button></nav>
 <dialog aria-labelledby="entryTitle" id="entryDialog" class="iris-dialog"><div class="sheet-handle"></div><header class="sheet-header"><h2 id="entryTitle"></h2><button type="button" class="round-button" data-close="entryDialog" aria-label="Закрыть">${icon('close')}</button></header><form id="entryForm"><div id="entryFields"></div><p id="entryError" class="form-error" role="alert"></p><button class="primary-action" type="submit">Сохранить</button><button id="deleteEntry" class="delete-action" type="button" hidden>Удалить запись</button></form></dialog>
 <dialog aria-labelledby="historyTitle" id="historyDialog" class="iris-dialog history-dialog"><div class="sheet-handle"></div><header class="sheet-header"><h2 id="historyTitle">История питания</h2><button class="round-button" type="button" data-close="historyDialog" aria-label="Закрыть">${icon('close')}</button></header><div class="history-date"><button id="historyPrev" class="round-button" type="button" aria-label="Предыдущий день">${icon('back')}</button><input id="historyDate" type="date" aria-label="Дата истории"><button id="historyNext" class="round-button forward" type="button" aria-label="Следующий день">${icon('back')}</button></div><p id="historyTotal" class="history-total"></p><div id="historyEntries" class="event-list"></div><button id="historyAdd" class="primary-action" type="button"></button></dialog>
 <dialog aria-labelledby="detailTitle" id="detailDialog" class="iris-dialog"><header class="sheet-header"><h2 id="detailTitle"></h2><button class="round-button" type="button" data-close="detailDialog" aria-label="Закрыть">${icon('close')}</button></header><div id="detailBody"></div></dialog>
 <dialog aria-labelledby="appearanceTitle" id="appearanceDialog" class="iris-dialog appearance-dialog"><div class="sheet-handle"></div><header class="sheet-header"><h2 id="appearanceTitle">Движение глаза</h2><button class="round-button" type="button" data-close="appearanceDialog" aria-label="Закрыть">${icon('close')}</button></header><p class="field-note">Выбери темп, который тебе комфортен.</p><fieldset class="motion-options"><legend class="sr-only">Интенсивность анимации</legend><label><input type="radio" name="motion" value="full"><span><strong>Живая</strong><small>Переливы света и отзывчивые волокна</small></span></label><label><input type="radio" name="motion" value="soft"><span><strong>Спокойная</strong><small>Те же эффекты, мягче и сдержаннее</small></span></label><label><input type="radio" name="motion" value="still"><span><strong>Без движения</strong><small>Неподвижный глаз и цвет каждого раздела</small></span></label></fieldset><p id="systemMotionNote" class="field-note" hidden>Движение уменьшено в настройках устройства.</p><button class="primary-action" type="button" data-close="appearanceDialog">Готово</button></dialog>
 <div id="journalToast" class="journal-toast" role="status" hidden></div>
`);
// Shared drawn symbols keep navigation tied to the eye.
metric.insertAdjacentHTML('beforeend',`<div class="home-actions"><button id="openSections" class="primary-action" type="button">${icon('eye')}Разделы</button></div>`);
$('#openSections').addEventListener('click',()=>dispatchEvent(new CustomEvent('iris:menu')));
document.querySelectorAll('.radial-item').forEach(b=>{b.style.setProperty('--item-color',kinds[b.dataset.mode].color);b.insertAdjacentHTML('afterbegin',icon(b.dataset.mode))});
$('.radial-core').outerHTML=`<button class="radial-core" id="closeSections" type="button" aria-label="Закрыть разделы">${icon('close')}</button>`;
$('#closeSections').addEventListener('click',()=>{dispatchEvent(new CustomEvent('iris:close-menu'));$('#openSections').focus({preventScroll:true})});
$('#motionHint').textContent='Удерживай глаз для меню · листай разделы';
const showHint=()=>{app.dataset.gestureHint=localStorage.getItem('irisGestureLearnedV40')!=='1'?'true':'false'};
showHint();
addEventListener('iris:gesture',()=>{try{localStorage.setItem('irisGestureLearnedV40','1')}catch{}showHint()});
$('#historyTotal').after($('#foodGoal'));
let historyKind='food',toastTimer;
function toast(text,action){
 const el=$('#journalToast');el.replaceChildren(document.createTextNode(text));
 if(action){const b=document.createElement('button');b.type='button';b.textContent=action.label;b.addEventListener('click',()=>{try{action.run();toast('Отменено')}catch(error){toast(error.message)}});el.append(b)}
 el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,action?8000:3200);
}
function dismissToast(){clearTimeout(toastTimer);$('#journalToast').hidden=true}
function openDialog(id){dismissToast();const el=$('#'+id);if(!el.open){returnFocus.set(el,document.activeElement);el.showModal()}dispatchEvent(new CustomEvent('iris:visibility'))}
document.addEventListener('click',e=>{const b=e.target.closest('[data-close]');if(b)$('#'+b.dataset.close)?.close()});
function registerDialog(el){
 el.addEventListener('click',e=>{if(e.target===el){const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)el.close()}});
 el.addEventListener('close',()=>{const origin=returnFocus.get(el),parent=[...document.querySelectorAll('dialog[open]')].at(-1);const target=origin?.isConnected?origin:parent?.querySelector('button')||$('#stage');target?.focus({preventScroll:true});returnFocus.delete(el);dispatchEvent(new CustomEvent('iris:visibility'))});
}
document.querySelectorAll('.iris-dialog').forEach(registerDialog);
function syncAppearance(){
 document.querySelectorAll('[name="motion"]').forEach(input=>input.checked=input.value===IRISMotion.preference);
 $('#systemMotionNote').hidden=!IRISMotion.reduced;
}
$('#appearanceSettings').addEventListener('click',()=>{
 $('#settingsPanel [data-close-settings]').click();syncAppearance();openDialog('appearanceDialog');returnFocus.set($('#appearanceDialog'),$('#settingsTrigger'));
});
document.querySelectorAll('[name="motion"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked)IRISMotion.setPreference(input.value)}));
addEventListener('iris:motion',syncAppearance);
function mode(){return app.className.match(/mode-(\w+)/)?.[1]||'home'}
function view(name,push=true){
 dismissToast();
 dispatchEvent(new CustomEvent('iris:close-menu'));
 app.dataset.view=name;$('#statistics').hidden=name!=='stats';if($('#dailyJournal'))$('#dailyJournal').hidden=name!=='journal';if($('#plansView'))$('#plansView').hidden=name!=='plans';$('#stage').inert=name!=='eye'||app.dataset.welcome==='true';
 $('#eyeTab').setAttribute('aria-current',name==='eye'?'page':'false');$('#statsTab').setAttribute('aria-current',name==='stats'?'page':'false');
 $('#journalTab')?.setAttribute('aria-current',name==='journal'?'page':'false');$('#plansTab')?.setAttribute('aria-current',name==='plans'?'page':'false');
 dispatchEvent(new CustomEvent('iris:visibility'));
 const hash=name==='stats'?'#statistics':name==='journal'?'#journal':name==='plans'?'#plans':'';
 if(push&&location.hash!==hash)history.pushState(null,'',location.pathname+location.search+hash);
}
$('#eyeTab').addEventListener('click',()=>{view('eye');dispatchEvent(new CustomEvent('iris:navigate',{detail:'home'}))});
$('#statsBack').addEventListener('click',()=>view('eye'));
$('#statsTab').addEventListener('click',()=>view('stats'));
addEventListener('popstate',()=>view(location.hash==='#statistics'?'stats':location.hash==='#journal'?'journal':location.hash==='#plans'?'plans':'eye',false));
addEventListener('iris:statistics',()=>view('stats'));
const welcomed=localStorage.getItem('irisWelcomedV39')==='1';
app.dataset.welcome=String(!welcomed);$('#welcome').hidden=welcomed;
if(!welcomed)$('#stage').inert=true;
$('#enterIris').addEventListener('click',()=>{
 try{localStorage.setItem('irisWelcomedV39','1')}catch{}
 app.dataset.welcome='false';$('#welcome').hidden=true;$('#stage').inert=false;view('eye',false);
});
let readoutMode=null;
function renderReadout(force=false){
 const m=mode();if(!force&&readoutMode===m)return;readoutMode=m;
 const sum=(m==='food'||m==='sleep')?D.summary():null;
 if(m==='food'){
  $('#metricLabel').textContent='ПИТАНИЕ';$('#metricValue').textContent=sum.present.food?number(sum.food):'—';
  const plan=D.dailyPlan(),remaining=plan.targets.food-sum.food;
  $('#metricCaption').textContent=sum.present.food?(plan.active.food?`из ${number(plan.targets.food)} ккал · ${remaining>=0?'Осталось '+number(remaining):'Сверх цели '+number(-remaining)} ккал`:'Записано за сегодня · без цели'):'Сегодня пока нет записей';
  const latest=D.entries.food.filter(e=>e.date===D.day()).sort((a,b)=>b.at-a.at)[0];
  $('#latestFood').hidden=!latest;
  if(latest){$('#latestFood').dataset.id=latest.id;$('#latestFood').innerHTML=`${icon('food')}<span>${esc(latest.meal)} · ${number(latest.kcal)} ккал</span><time>${time(latest.at)}</time>`}
 }else if(m==='sleep'){
  $('#metricLabel').textContent='СОН';$('#metricValue').textContent=sum.present.sleep?duration(sum.sleep):'—';
  $('#metricCaption').textContent=sum.present.sleep?'С пробуждением сегодня':'Время для восстановления';
 }
 $('#foodGoal').textContent='Цели и личный режим';
}
function openFood(id=null,date=D.day(),copy=null){
 const e=id?D.entries.food.find(e=>e.id===id):copy;if(id&&!e)return;
 editId=id;editKind='food';$('#entryTitle').textContent=id?'Приём пищи':copy?'Повторить блюдо':'Добавить еду';
 let at=id?e.at:Date.now();if(!id&&date!==D.day())at=new Date(date+'T12:00').getTime();
 $('#entryFields').innerHTML=`<label>Название блюда<input name="name" type="text" maxlength="100" placeholder="Например, омлет с овощами" value="${esc(e?.name||'')}" required></label><div class="form-pair"><label>Калории<input name="kcal" type="number" inputmode="numeric" min="0" max="20000" step="1" placeholder="ккал" value="${e?.kcal??''}" required></label><label>Приём пищи<select name="meal">${['Завтрак','Обед','Ужин','Перекус'].map(x=>`<option ${x===(e?.meal||'Перекус')?'selected':''}>${x}</option>`).join('')}</select></label></div><label>Дата и время<input name="at" type="datetime-local" value="${localInput(at)}" max="${localInput(Date.now())}" required></label>`;
 if(!id)$('#entryFields').insertAdjacentHTML('afterbegin',`<button id="chooseFavorite" class="favorite-shortcut" type="button">☆ Избранные блюда <span>${(D.entries.favorites||[]).length||''}</span></button>`);
 if(id){const b=document.createElement('button');b.type='button';b.className='favorite-shortcut';b.textContent='Повторить сегодня';b.addEventListener('click',()=>openFood(null,D.day(),e));$('#entryFields').prepend(b)}
 if(copy){$('#entryFields').insertAdjacentHTML('beforeend','<label>Порция относительно записи<select id="repeatPortion"><option value="0.5">Половина</option><option value="1" selected>Такая же</option><option value="1.5">Полторы</option><option value="2">Двойная</option></select></label><p class="field-note">Калории пересчитаны по исходной записи. Проверь их и нажми «Сохранить».</p>');$('#repeatPortion').addEventListener('change',e=>$('#entryForm [name="kcal"]').value=Math.round(copy.kcal*Number(e.target.value)))}
 $('#entryFields').insertAdjacentHTML('beforeend','<label class="check-field"><input name="favorite" type="checkbox"><span>Сохранить блюдо в избранное</span></label>');
 prepareEntry(id);
}
function openSleep(id=null,date=D.day()){
 const e=id?D.entries.sleep.find(e=>e.id===id):null;if(id&&!e)return;
 editId=id;editKind='sleep';$('#entryTitle').textContent=id?'Запись сна':'Записать сон';
 $('#entryFields').innerHTML=`<p class="field-note">Укажи фактическое время. Сон попадёт в день пробуждения.</p><label>Засыпание<input name="start" type="datetime-local" value="${e?localInput(e.start):''}" max="${localInput(Date.now())}" required></label><label>Пробуждение<input name="end" type="datetime-local" value="${e?localInput(e.end):''}" max="${localInput(Date.now())}" required></label>`;
 $('#entryFields').insertAdjacentHTML('beforeend',`<label>Качество сна · по желанию<select name="quality"><option value="">Не отмечать</option>${['Очень плохое','Плохое','Среднее','Хорошее','Отличное'].map((s,i)=>`<option value="${i+1}" ${e?.quality===i+1?'selected':''}>${i+1} · ${s}</option>`).join('')}</select></label>`);
 if(!e&&date!==D.day())$('#entryFields .field-note').textContent=`Запись за ${dateLabel(date)}. Укажи время засыпания и пробуждения.`;
 prepareEntry(id);
}
function prepareEntry(id){$('#entryError').textContent='';$('#deleteEntry').hidden=!id;$('#deleteEntry').dataset.confirm='';$('#deleteEntry').textContent='Удалить запись';openDialog('entryDialog')}
$('#entryForm').addEventListener('submit',e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);
 try{
  if(editKind==='food')D.saveFood({id:editId,name:f.get('name'),kcal:f.get('kcal'),meal:f.get('meal'),at:new Date(f.get('at')).getTime(),favorite:f.has('favorite')});
  else if(editKind==='sleep')D.saveSleep({id:editId,start:new Date(f.get('start')).getTime(),end:new Date(f.get('end')).getTime(),quality:f.get('quality')});
  else D.goal(f.get('goal'));
  $('#entryDialog').close();dispatchEvent(new CustomEvent('iris:record',{detail:editKind}));toast('Сохранено');
 }catch(error){$('#entryError').textContent=error.message}
});
$('#deleteEntry').addEventListener('click',e=>{
 if(!e.currentTarget.dataset.confirm){e.currentTarget.dataset.confirm='1';e.currentTarget.textContent='Да, удалить';return}
 try{const token=D.remove(editKind,editId);$('#entryDialog').close();toast('Запись удалена',{label:'Отменить',run:()=>D.undoRemove(token)})}catch(error){$('#entryError').textContent=error.message}
});
$('#addFood').addEventListener('click',()=>openFood());$('#latestFood').addEventListener('click',e=>openFood(e.currentTarget.dataset.id));
$('#addSleep').addEventListener('click',()=>openSleep());
$('#foodGoal').addEventListener('click',()=>dispatchEvent(new CustomEvent('iris:goals')));
function eventText(e){
 if(e.kind==='food')return{title:e.name,sub:`${e.meal} · ${number(e.kcal)} ккал`};
 if(e.kind==='sleep')return{title:duration(e.ms/3600000),sub:`${time(e.start)} — ${time(e.end)} · Сон`};
 if(e.kind==='water')return{title:`${e.ml>0?'+':''}${number(e.ml)} мл`,sub:e.legacy?'Сохранённый итог дня':e.ml<0?'Поправка воды':'Вода'};
 return{title:`${number(e.ms/60000)} мин`,sub:e.running?'Тренировка идёт':e.legacy?'Сохранённая тренировка':D.sportTypes[e.type]||'Спорт'};
}
function eventRow(e){const t=eventText(e);return `<button class="event-row" data-entry="${esc(e.id)}" data-kind="${e.kind}" type="button" style="--event-color:${kinds[e.kind].color}"><span class="event-icon">${icon(e.kind)}</span><span class="event-copy"><strong>${esc(t.title)}</strong><small>${esc(t.sub)}</small></span><time>${e.legacy?'Без времени':time(e.at)}</time></button>`}
function renderHistory(){
 $('#historyTitle').textContent=historyKind==='food'?'История питания':'История сна';$('#foodGoal').hidden=historyKind!=='food';
 $('#historyDate').value=historyDate;$('#historyDate').max=D.day();$('#historyNext').disabled=historyDate>=D.day();
 const entries=D.events(historyDate).filter(e=>e.kind===historyKind),s=D.summary(historyDate);
 $('#historyTotal').textContent=entries.length?historyKind==='food'?`${number(s.food)} ккал за день`:duration(s.sleep):'Нет записей за этот день';
 $('#historyEntries').innerHTML=entries.length?entries.map(eventRow).join(''):'<p class="empty-note">Добавь запись — она появится здесь и в статистике.</p>';
 $('#historyAdd').innerHTML=icon('plus')+(historyKind==='food'?'Добавить еду':'Записать сон');
}
function showHistory(k){historyKind=k;historyDate=D.day();renderHistory();openDialog('historyDialog')}
const fromSettings=fn=>{ $('#settingsPanel [data-close-settings]').click();fn() };
$('#settingsStats').addEventListener('click',()=>fromSettings(()=>view('stats')));
$('#settingsFoodHistory').addEventListener('click',()=>fromSettings(()=>showHistory('food')));
$('#settingsSleepHistory').addEventListener('click',()=>fromSettings(()=>showHistory('sleep')));
$('#settingsFoodGoal').addEventListener('click',()=>fromSettings(()=>$('#foodGoal').click()));
$('#foodHistory').addEventListener('click',()=>showHistory('food'));$('#sleepHistory').addEventListener('click',()=>showHistory('sleep'));
$('#historyPrev').addEventListener('click',()=>{historyDate=D.shift(historyDate,-1);renderHistory()});
$('#historyNext').addEventListener('click',()=>{if(historyDate<D.day()){historyDate=D.shift(historyDate,1);renderHistory()}});
$('#historyDate').addEventListener('change',e=>{if(D.validDate(e.target.value)&&e.target.value<=D.day()){historyDate=e.target.value;renderHistory()}});
$('#historyAdd').addEventListener('click',()=>historyKind==='food'?openFood(null,historyDate):openSleep(null,historyDate));
function inspectEntry(id,k,date=selected){
 if(k==='food'){openFood(id);return}if(k==='sleep'){openSleep(id);return}
 if(k==='water'||k==='sport'){dispatchEvent(new CustomEvent('iris:edit',{detail:{id,kind:k,date}}));return}
 const entry=D.events(date).find(e=>e.id===id);if(!entry)return;
 const t=eventText(entry);$('#detailTitle').textContent=kinds[k].label;
 $('#detailBody').innerHTML=`<p class="detail-value">${esc(t.title)}</p><p>${esc(t.sub)}</p><p class="field-note">${dateLabel(date)} · ${entry.legacy?'Время старой записи не сохранялось':time(entry.at)}</p>`;openDialog('detailDialog');
}
['historyEntries','statsEvents'].forEach(id=>$('#'+id).addEventListener('click',e=>{const row=e.target.closest('[data-entry]');if(row)inspectEntry(row.dataset.entry,row.dataset.kind,id==='historyEntries'?historyDate:selected);const b=e.target.closest('[data-day]');if(b){selected=b.dataset.day;period='day';renderStats()}}));
const dates=()=>Array.from({length:period==='day'?1:period==='week'?7:30},(_,i)=>D.shift(selected,i-(period==='day'?0:period==='week'?6:29)));
function timeline(events){
 const grouped=new Map();for(const e of events.filter(e=>!e.legacy&&e.at)){
  const d=new Date(e.at),x=18+(d.getHours()+d.getMinutes()/60)/24*324,key=e.kind+':'+Math.round(x/4);
  if(grouped.has(key))grouped.get(key).count++;else grouped.set(key,{e,x,count:1});
 }
 const points=[...grouped.values()];
 const yAt=x=>88+49*Math.tanh(points.reduce((sum,p)=>sum+(p.e.kind==='sleep'?1:-1)*Math.exp(-Math.pow((x-p.x)/5,2)),0)*.66);
 let path='';for(let x=18;x<=342;x++)path+=(x===18?'M':'L')+x+' '+yAt(x).toFixed(2);
 return `<svg viewBox="0 0 360 174" role="img" aria-label="Время записей за день, не медицинский график"><defs><filter id="lineGlow"><feGaussianBlur stdDeviation="3"/></filter></defs><path d="${path}" fill="none" stroke="#97c3e4" opacity=".25" stroke-width="5" filter="url(#lineGlow)"/><path d="${path}" fill="none" stroke="#b5d6ee" stroke-width="1.4"/>${points.map(p=>`<line x1="${p.x}" x2="${p.x}" y1="24" y2="142" stroke="${kinds[p.e.kind].color}" opacity=".12" stroke-dasharray="2 5"/><circle cx="${p.x}" cy="${yAt(p.x).toFixed(2)}" r="3" fill="${kinds[p.e.kind].color}"><title>${kinds[p.e.kind].label} · ${time(p.e.at)} · записей ${p.count}</title></circle>`).join('')}${[0,6,12,18,24].map((h,i)=>`<text x="${18+i*81}" y="165" text-anchor="middle" fill="#717782" font-size="10">${String(h).padStart(2,'0')}</text>`).join('')}</svg>`;
}
function bars(list){
 const max=Math.max(1,...list.map(s=>s[kind])),step=302/list.length,bw=Math.max(3,step*.5);
 return `<svg viewBox="0 0 360 174" role="img" aria-label="${kinds[kind].label}: ${kinds[kind].unit} по дням"><text x="5" y="19" fill="#8e949f" font-size="10">${number(max)} ${kinds[kind].unit}</text><line x1="35" x2="343" y1="139" y2="139" stroke="#20242a"/>${list.map((s,i)=>{const h=s[kind]/max*108,x=39+i*step;return `<rect x="${x}" y="${139-h}" width="${bw}" height="${Math.max(s.present[kind]?2:0,h)}" rx="${Math.min(3,bw/2)}" fill="${kinds[kind].color}" opacity=".78"><title>${dateLabel(s.date)}: ${s.present[kind]?number(s[kind])+' '+kinds[kind].unit:'Нет данных'}</title></rect>${i===0||i===list.length-1||list.length<=7||i%7===0?`<text x="${x+bw/2}" y="165" text-anchor="middle" fill="#717782" font-size="10">${Number(s.date.slice(-2))}</text>`:''}`}).join('')}</svg>`;
}
function renderStats(){
 if(!statsVisible()){scheduleStats();return}
 const dd=dates(),list=dd.map(d=>D.summary(d)),sums={};
 for(const k of Object.keys(kinds)){const present=list.filter(s=>s.present[k]);sums[k]={present:present.length>0,value:present.reduce((n,s)=>n+s[k],0)/(k==='sleep'&&period!=='day'?Math.max(1,present.length):1)}}
 $('#statsDate').value=selected;$('#statsDate').max=D.day();
 $('#statsDateLabel').textContent=period==='day'?dateLabel(selected):`${dateLabel(dd[0])} — ${dateLabel(selected)}`;
 $('#statsTitle').textContent=period==='day'?'Твой день':period==='week'?'Твоя неделя':'Твой месяц';
 $('#statsSubtitle').textContent=period==='day'?'Всё, что складывается в тебя.':'История твоего ритма.';
 $('#statsSummary').innerHTML=Object.entries(kinds).map(([k,v])=>`<button data-metric="${k}" type="button" aria-pressed="${kind===k}" style="--stat-color:${v.color}">${icon(k)}<span>${v.label}${k==='sleep'&&period!=='day'?' · ср.':''}</span><strong>${sums[k].present?number(sums[k].value):'—'}<small>${v.unit}</small></strong></button>`).join('');
 const events=D.journalEvents(selected).filter(e=>e.kind!=='checkins'),has=period==='day'?events.some(e=>!e.legacy):sums[kind].present;
 $('#graphCaption').textContent=period==='day'?'События за 24 часа':`${kinds[kind].label} · ${kinds[kind].unit} по дням`;
 $('#statsGraph').innerHTML=period==='day'?timeline(events):bars(list);
 $('#graphEmpty').hidden=has;
 $('#graphEmpty').innerHTML=period==='day'&&events.length?'Старые итоги сохранены ниже.<br>Новые записи появятся на линии времени.':'Пока нет записей за этот период.';
 document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.period===period));
 $('#eventsHeading').textContent=period==='day'?'События дня':`${kinds[kind].label} по дням`;
 $('#eventsCount').textContent=period==='day'?String(events.length):`${list.filter(s=>s.present[kind]).length} из ${list.length} дней`;
 $('#statsEvents').innerHTML=period==='day'?(events.length?events.map(eventRow).join(''):'<p class="empty-note">Вода, тренировки, питание и сон появятся здесь после записи.</p>'):list.slice().reverse().map(s=>`<button class="day-row" data-day="${s.date}" type="button"><span>${dateLabel(s.date,{weekday:'short',day:'numeric',month:'short'})}</span><strong>${s.present[kind]?number(s[kind])+' '+kinds[kind].unit:'Нет данных'}</strong></button>`).join('');
 dispatchEvent(new CustomEvent('iris:stats-render',{detail:{period,selected,dates:dd,list,kind}}));scheduleStats();
}
$('#statsDate').addEventListener('change',e=>{if(D.validDate(e.target.value)&&e.target.value<=D.day()){selected=e.target.value;renderStats()}});
$('#statsSummary').addEventListener('click',e=>{const b=e.target.closest('[data-metric]');if(b&&kind!==b.dataset.metric){kind=b.dataset.metric;renderStats()}});
document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{if(period!==b.dataset.period){period=b.dataset.period;renderStats()}}));
function refresh(){const today=D.day();if(today!==lastToday){if(selected===lastToday)selected=today;if(historyDate===lastToday)historyDate=today;lastToday=today}renderReadout(true);if(app.dataset.view==='stats')renderStats();if($('#historyDialog').open)renderHistory()}
new MutationObserver(()=>renderReadout()).observe(app,{attributes:true,attributeFilter:['class']});
addEventListener('iris:data',refresh);addEventListener('iris:error',e=>toast(e.detail));
function statsVisible(){return !document.hidden&&app.dataset.view==='stats'&&app.dataset.welcome!=='true'&&!document.querySelector('dialog[open]')}
function scheduleStats(){clearTimeout(statsTimer);statsTimer=0;if(statsVisible()&&window.IRISSport?.snapshot().running)statsTimer=setTimeout(renderStats,10000)}
addEventListener('iris:sport',()=>{if(statsVisible())renderStats();else scheduleStats()});
addEventListener('iris:visibility',()=>{if(statsVisible())renderStats();else scheduleStats()});
document.addEventListener('visibilitychange',()=>{if(statsVisible())renderStats();else scheduleStats()});
view(location.hash==='#statistics'?'stats':location.hash==='#journal'?'journal':'eye',false);if(!welcomed)$('#stage').inert=true;renderReadout();
if(D.error)toast(D.error);
window.IRISJournal={openDialog,registerDialog,toast,dismissToast,inspectEntry,eventRow,esc,icon,view,openFood,openSleep};
let toastMode=mode();new MutationObserver(()=>{const next=mode();if(next!==toastMode||app.classList.contains('settings-open'))dismissToast();toastMode=next}).observe(app,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',()=>{if(document.hidden)dismissToast()});
addEventListener('iris:favorite',e=>{
 const entry=(D.entries.favorites||[]).find(x=>x.id===e.detail);if(!entry||editKind!=='food')return;
 for(const key of ['name','kcal','meal'])$('#entryForm [name="'+key+'"]').value=entry[key];
 $('#entryForm [name="favorite"]').checked=false;$('#entryForm [name="kcal"]').focus();
});
})();
