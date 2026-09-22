(()=>{
'use strict';
const D=window.IRISData,J=window.IRISJournal,M=window.IRISMotion,$=s=>document.querySelector(s),app=$('#app');
if(!D||!J)return;
const {esc,icon}=J;
const labels={water:'Вода',sport:'Спорт',food:'Питание',sleep:'Сон',checkins:'Самочувствие'};
const colors={water:'#6db8ec',sport:'#e8887c',food:'#a8bb7b',sleep:'#b39be7',checkins:'#c5d7e6'};
const units={water:'л',sport:'мин',food:'ккал',sleep:'ч'};
const book='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" aria-hidden="true"><path d="M5 3h13v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 14h13M8 7h6M8 11h4"/></svg>';
const fmt=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const dateLabel=d=>new Date(d+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
const localInput=ms=>{const d=new Date(ms);return D.day(d)+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const atDate=d=>d===D.day()?Date.now():new Date(d+'T12:00').getTime();
const header=(id,title)=>`<div class="sheet-handle"></div><header class="sheet-header"><h2 id="${id}Title">${title}</h2><button class="round-button" type="button" data-close="${id}" aria-label="Закрыть">${icon('close')}</button></header>`;
const dialog=(id,title,body)=>`<dialog id="${id}" class="iris-dialog" aria-labelledby="${id}Title">${header(id,title)}${body}</dialog>`;
let journalDate=D.day(),journalFilter='all',journalTimer=0,lastToday=D.day(),editing=null;

$('#eyeTab').insertAdjacentHTML('afterend',`<button id="journalTab" type="button">${book}<span>Журнал</span></button>`);
app.insertAdjacentHTML('beforeend',`
 <section id="dailyJournal" class="journal-view" aria-labelledby="journalTitle" hidden>
  <header class="stats-header"><button id="journalBack" class="round-button" type="button" aria-label="К глазу">${icon('back')}</button><span>ЖУРНАЛ</span><button id="journalAdd" class="round-button" type="button" aria-label="Добавить запись">${icon('plus')}</button></header>
  <div class="journal-heading"><p class="eyebrow">ТВОЙ РИТМ</p><h1 id="journalTitle">Каждый день — твой.</h1><p>Всё, что ты отметил. В одном месте.</p></div>
  <div class="journal-date"><button id="journalPrev" class="round-button" type="button" aria-label="Предыдущий день">${icon('back')}</button><label><span class="sr-only">Дата журнала</span><input id="journalDate" type="date"></label><button id="journalNext" class="round-button forward" type="button" aria-label="Следующий день">${icon('back')}</button><button id="journalToday" class="quiet-action" type="button">Сегодня</button></div>
  <div id="journalSummary" class="journal-summary"></div>
  <div class="journal-filters" role="group" aria-label="Фильтр записей">${Object.entries({all:'Всё',...labels}).map(([k,v])=>`<button type="button" data-journal-filter="${k}" aria-pressed="${k==='all'}">${v}</button>`).join('')}</div>
  <div class="list-heading"><h2 id="journalDayHeading"></h2><span id="journalCount"></span></div><div id="journalEntries" class="event-list"></div>
  <button id="journalAddBottom" class="primary-action" type="button">${icon('plus')}Добавить запись</button>
 </section>`+
 dialog('quickAddDialog','Что запишем?',`<p id="quickAddDate" class="field-note"></p><div class="quick-grid">${Object.entries(labels).map(([k,v])=>`<button type="button" data-add-kind="${k}" style="--quick-color:${colors[k]}">${icon(k==='checkins'?'eye':k)}<span>${v}</span></button>`).join('')}</div>`)+
 dialog('nextEntryDialog','Новая запись','<form id="nextEntryForm"><div id="nextEntryFields" class="entry-fields"></div><p id="nextEntryError" class="form-error" role="alert"></p><button id="nextEntrySave" class="primary-action" type="submit">Сохранить</button><button id="nextEntryDelete" class="delete-action" type="button" hidden>Удалить запись</button></form>')+
 dialog('goalsDialog','Личный режим','<p class="field-note">Выбери, что хочешь отслеживать. Это твои ориентиры для дневника, не медицинские нормы.</p><form id="goalsForm"><div id="goalsFields" class="entry-fields"></div><p id="goalsError" class="form-error" role="alert"></p><button class="primary-action" type="submit">Сохранить режим</button></form>')+
 dialog('pauseDialog','Минута для себя','<p class="field-note">Можно просто остановиться. Дыши как удобно, без задержек и заданного темпа.</p><div id="pauseClock" class="pause-clock" role="timer">1:00</div><p id="pauseStatus" class="field-note">Тихая пауза · 1 минута</p><button id="pauseStart" class="primary-action" type="button">Начать паузу</button>')
 );
['quickAddDialog','nextEntryDialog','goalsDialog','pauseDialog'].forEach(id=>J.registerDialog($('#'+id)));
$('#journalTab').addEventListener('click',()=>J.view('journal'));
$('#journalBack').addEventListener('click',()=>J.view('eye'));
$('#journalPrev').addEventListener('click',()=>{journalDate=D.shift(journalDate,-1);renderJournal()});
$('#journalNext').addEventListener('click',()=>{if(journalDate<D.day()){journalDate=D.shift(journalDate,1);renderJournal()}});
$('#journalToday').addEventListener('click',()=>{journalDate=D.day();renderJournal()});
$('#journalDate').addEventListener('change',e=>{if(D.validDate(e.target.value)&&e.target.value<=D.day()){journalDate=e.target.value;renderJournal()}});
$('.journal-filters').addEventListener('click',e=>{const b=e.target.closest('[data-journal-filter]');if(b){journalFilter=b.dataset.journalFilter;renderJournal()}});
function checkinRow(e){return `<button type="button" class="event-row" data-entry="${esc(e.id)}" data-kind="checkins" style="--event-color:${colors.checkins}"><span class="event-icon">${icon('eye')}</span><span class="event-copy"><strong>Как ты себя чувствовал</strong><small>Энергия ${e.energy} · настроение ${e.mood} · стресс ${e.stress}${e.note?'<br>'+esc(e.note):''}</small></span></button>`}
function renderJournal(){
 clearTimeout(journalTimer);journalTimer=0;
 if(app.dataset.view!=='journal'||document.hidden||document.querySelector('dialog[open]'))return;
 $('#dailyJournal').hidden=false;$('#journalDate').value=journalDate;$('#journalDate').max=D.day();$('#journalNext').disabled=journalDate>=D.day();$('#journalToday').hidden=journalDate===D.day();
 $('#journalDayHeading').textContent=journalDate===D.day()?'Сегодня':dateLabel(journalDate);
 const sum=D.summary(journalDate),entries=D.journalEvents(journalDate).filter(e=>journalFilter==='all'||e.kind===journalFilter);
 $('#journalSummary').innerHTML=Object.keys(units).map(k=>`<span style="--quick-color:${colors[k]}">${icon(k)}<strong>${sum.present[k]?fmt(sum[k])+' '+units[k]:'—'}</strong></span>`).join('');
 document.querySelectorAll('[data-journal-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journalFilter===journalFilter)));
 $('#journalCount').textContent=String(entries.length);
 $('#journalEntries').innerHTML=entries.length?entries.map(e=>e.kind==='checkins'?checkinRow(e):J.eventRow(e)).join(''):'<p class="empty-note">Здесь пока тихо.<br>Добавь запись, когда будет удобно — пропущенный день не обнуляет твою историю.</p>';
 if(D.workout.running)journalTimer=setTimeout(renderJournal,10000);
}
$('#journalEntries').addEventListener('click',e=>{const b=e.target.closest('[data-entry]');if(b)editEntry(b.dataset.kind,b.dataset.entry,journalDate)});
let quickDate=D.day();
function quickAdd(date=D.day()){quickDate=date;$('#quickAddDate').textContent=date===D.day()?'Сегодня':dateLabel(date);J.openDialog('quickAddDialog')}
for(const id of ['journalAdd','journalAddBottom'])$('#'+id).addEventListener('click',()=>quickAdd(journalDate));
$('#quickAddDialog').addEventListener('click',e=>{const b=e.target.closest('[data-add-kind]');if(!b)return;$('#quickAddDialog').close();editEntry(b.dataset.addKind,null,quickDate)});
function openForm(kind,id,date,title,fields){
 editing={kind,id,date};$('#nextEntryDialogTitle').textContent=title;$('#nextEntryFields').innerHTML=fields;$('#nextEntryError').textContent='';
 $('#nextEntryDelete').hidden=!id;$('#nextEntryDelete').dataset.confirm='';$('#nextEntryDelete').textContent='Удалить запись';$('#nextEntrySave').hidden=false;
 J.openDialog('nextEntryDialog');
}
const rating=(name,title,value,ends)=>`<fieldset class="rating-field"><legend>${title}</legend><div class="rating-options">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="${name}" value="${n}" ${value===n?'checked':''} required><span>${n}</span></label>`).join('')}</div><p>${ends}</p></fieldset>`;
function editEntry(kind,id=null,date=D.day()){
 if(kind==='food'){J.openFood(id,date);return}if(kind==='sleep'){J.openSleep(id,date);return}
 if(kind==='checkins'){
  const e=id?D.entries.checkins.find(x=>x.id===id):D.entries.checkins.find(x=>x.date===date);
  if(id&&!e){J.toast('Запись уже удалена');return}
  openForm(kind,e?.id||null,e?.date||date,'Как ты?',`<p class="field-note">${dateLabel(e?.date||date)} · это только твоя оценка. Можно не отмечать каждый день.</p>${rating('energy','Энергия',e?.energy,'1 — мало сил · 5 — много сил')}${rating('mood','Настроение',e?.mood,'1 — тяжёлый день · 5 — хороший день')}${rating('stress','Стресс',e?.stress,'1 — спокойно · 5 — напряжённо')}<label>Что повлияло? · по желанию<textarea name="note" maxlength="200" rows="2" placeholder="Пару слов для себя">${esc(e?.note||'')}</textarea></label>`);return;
 }
 if(kind==='water'){
  const e=id?D.entries.water.find(x=>x.id===id):null;if(id&&!e){J.toast('Запись уже удалена');return}
  openForm(kind,id,date,id?'Запись воды':'Добавить воду',`<p class="field-note">${e?.legacy?'У старого итога нет времени. При сохранении он станет обычной записью.':'Отрицательное число — поправка к итогу дня.'}</p><label>Количество, мл<input name="ml" type="number" inputmode="numeric" min="-6000" max="6000" step="1" value="${e?.ml??D.routine.waterPortion}" required></label><label>Дата и время<input name="at" type="datetime-local" value="${localInput(e?.at||atDate(e?.date||date))}" max="${localInput(Date.now())}" required></label>`);return;
 }
 if(kind==='sport'){
  let e=id?D.workoutEntry(id):null;
  // Timeline marks may carry a segment ID. Always edit the whole workout.
  if(e?.sessionId){id=e.sessionId;e=D.workoutEntry(id)}
  if(id&&!e){J.toast('Запись уже удалена');return}
  if(id&&id===D.workout.id){document.querySelectorAll('.iris-dialog[open]').forEach(el=>el.close());J.view('eye');dispatchEvent(new CustomEvent('iris:navigate',{detail:'sport'}));J.toast('Сначала заверши текущую тренировку');return}
  const end=e?.end||atDate(e?.date||date);
  openForm(kind,id,date,id?'Тренировка':'Записать тренировку',`<p class="field-note">${e?.legacy?'У старой записи нет времени. Укажи его, чтобы сохранить исправление.':e?.source==='timer'?'Паузы не входят в длительность. Если изменить время или длительность, запись станет ручной, без отдельных пауз.':'Запиши фактическую длительность. Таймер запускать не нужно.'}</p><label>Вид тренировки<select name="type">${Object.entries(D.sportTypes).map(([k,v])=>`<option value="${k}" ${k===(e?.type||D.workout.type)?'selected':''}>${v}</option>`).join('')}</select></label><div class="form-pair"><label>Длительность, мин<input name="minutes" type="number" inputmode="decimal" min="0.01" max="1440" step="any" value="${e?e.ms/60000:''}" required></label><label>Нагрузка · по желанию<select name="effort"><option value="">Не отмечать</option>${['Лёгкая','Небольшая','Средняя','Высокая','Очень высокая'].map((v,i)=>`<option value="${i+1}" ${e?.effort===i+1?'selected':''}>${i+1} · ${v}</option>`).join('')}</select></label></div><label>Завершение<input name="end" type="datetime-local" value="${localInput(end)}" max="${localInput(Date.now())}" required></label><label>Заметка · по желанию<textarea name="note" maxlength="200" rows="2">${esc(e?.note||'')}</textarea></label>`);
  // Preserve the exact timer endpoint when the minute-level input was not changed.
  editing.exactEnd=end;editing.initialEnd=localInput(end);return;
 }
}
$('#nextEntryForm').addEventListener('submit',e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),{kind,id,date}=editing;
 try{
  if(kind==='water')D.saveWater({id,ml:f.get('ml'),at:new Date(f.get('at')).getTime()});
  else if(kind==='sport')D.saveSport({id,type:f.get('type'),end:f.get('end')===editing.initialEnd?editing.exactEnd:new Date(f.get('end')).getTime(),minutes:f.get('minutes'),note:f.get('note'),effort:f.get('effort')});
  else if(kind==='checkins')D.saveCheckin({date,energy:f.get('energy'),mood:f.get('mood'),stress:f.get('stress'),note:f.get('note')});
  else if(kind==='portion')D.setPortion(f.get('portion'));
  else if(kind==='type')window.IRISSport.setType(f.get('type'));
  $('#nextEntryDialog').close();dispatchEvent(new CustomEvent('iris:record',{detail:kind}));J.toast('Сохранено');
 }catch(error){$('#nextEntryError').textContent=error.message}
});
$('#nextEntryDelete').addEventListener('click',e=>{
 const b=e.currentTarget;if(!b.dataset.confirm){b.dataset.confirm='1';b.textContent='Да, удалить';return}
 try{const token=D.remove(editing.kind,editing.id);$('#nextEntryDialog').close();J.toast('Запись удалена',{label:'Отменить',run:()=>D.undoRemove(token)})}catch(error){$('#nextEntryError').textContent=error.message}
});
addEventListener('iris:edit',e=>editEntry(e.detail.kind,e.detail.id,e.detail.date));
addEventListener('iris:workout-type',()=>openForm('type',null,D.day(),'Вид тренировки',`<label>Для следующей тренировки<select name="type">${Object.entries(D.sportTypes).map(([k,v])=>`<option value="${k}" ${k===D.workout.type?'selected':''}>${v}</option>`).join('')}</select></label>`));
addEventListener('iris:sport-history',()=>{journalDate=D.day();journalFilter='sport';J.view('journal')});

// Quick actions have explicit labels. A tap on the iris itself never creates a food/water record.
const home=$('.home-actions'),footer=document.createElement('div');footer.className='home-links';home.append(footer);footer.append($('#openSections'),$('#openDayTrail'));
$('#openSections').className='quiet-action';$('#openSections').textContent='Разделы';
$('#openDayTrail').textContent='След дня';
home.insertAdjacentHTML('afterbegin',`<div class="home-quick">${['water','food','sleep','sport'].map(k=>`<button type="button" data-home-add="${k}" style="--quick-color:${colors[k]}">${icon(k)}<span>${k==='water'?'+ '+D.routine.waterPortion:k==='food'?'Еда':labels[k]}</span></button>`).join('')}</div>`);
footer.insertAdjacentHTML('beforeend','<button id="homeCheckin" class="quiet-action" type="button">Как ты?</button>');
// The home readout is taller after the quick actions mount; recalculate eye geometry.
requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
$('#homeCheckin').addEventListener('click',()=>editEntry('checkins'));
home.addEventListener('click',e=>{const b=e.target.closest('[data-home-add]');if(!b)return;const k=b.dataset.homeAdd;if(k==='water'){try{D.changeWater(D.routine.waterPortion)}catch(error){J.toast(error.message)}}else if(k==='sport'){dispatchEvent(new CustomEvent('iris:navigate',{detail:'sport'}))}else editEntry(k)});
$('.water-panel').insertAdjacentHTML('beforeend','<button id="waterPortion" class="quiet-action" type="button"></button>');
function portionLabel(){$('#waterPortion').textContent='Порция · '+D.routine.waterPortion+' мл';$('[data-home-add="water"] span').textContent='+ '+D.routine.waterPortion;$('[data-home-add="water"]').setAttribute('aria-label','Добавить '+D.routine.waterPortion+' мл воды')}
$('#waterPortion').addEventListener('click',()=>openForm('portion',null,D.day(),'Твоя порция воды',`<label>Порция, мл<input name="portion" type="number" min="50" max="1000" step="1" inputmode="numeric" value="${D.routine.waterPortion}" required></label><p class="field-note">Эту порцию добавляют кнопка на главной, кнопки воды и свайп вверх.</p>`));

const goalInputs=(g,prefix='')=>`<div class="form-pair"><label>Вода, мл<input name="${prefix}waterMl" type="number" min="500" max="6000" step="1" value="${g.waterMl}" required></label><label>Спорт, мин<input name="${prefix}sportMin" type="number" min="1" max="600" step="1" value="${g.sportMin}" required></label><label>Питание, ккал<input name="${prefix}foodKcal" type="number" min="1" max="20000" step="1" value="${g.foodKcal}" required></label><label>Сон, ч<input name="${prefix}sleepHours" type="number" min="1" max="24" step="0.25" value="${g.sleepHours}" required></label></div>`;
function openGoals(){
 const g=D.goals,r=D.routine;
 $('#goalsFields').innerHTML=`<fieldset class="plain-fieldset"><legend>Какие цели учитывать</legend><div class="enabled-grid">${Object.keys(units).map(k=>`<label class="check-field"><input type="checkbox" name="enabled-${k}" ${r.enabled[k]?'checked':''}><span>${labels[k]}</span></label>`).join('')}</div><p class="field-note">Отключённый показатель останется в журнале, но не будет влиять на дугу и процент целей.</p></fieldset>${goalInputs(g)}<fieldset class="plain-fieldset"><legend>Дни активности</legend><div class="weekday-options">${[[1,'Пн'],[2,'Вт'],[3,'Ср'],[4,'Чт'],[5,'Пт'],[6,'Сб'],[0,'Вс']].map(([n,t])=>`<label><input name="sportDays" type="checkbox" value="${n}" ${r.sportDays.includes(n)?'checked':''}><span>${t}</span></label>`).join('')}</div><p class="field-note">В остальные дни цель спорта не учитывается. Записывать тренировки можно всегда.</p></fieldset><label class="check-field"><input name="weekendEnabled" type="checkbox" ${r.weekend?'checked':''}><span>Другие цели в субботу и воскресенье</span></label><fieldset id="weekendFields" class="plain-fieldset" ${r.weekend?'':'disabled hidden'}><legend>Выходные</legend>${goalInputs(r.weekend||g,'weekend-')}</fieldset><label>Порция воды, мл<input name="waterPortion" type="number" min="50" max="1000" step="1" value="${r.waterPortion}" required></label><p class="field-note">Цели можно менять без потери записей. Сравнение с целями, в том числе за прошлые дни, использует текущие настройки.</p>`;
 $('#goalsFields [name="weekendEnabled"]').addEventListener('change',e=>{const f=$('#weekendFields');f.hidden=!e.target.checked;f.disabled=!e.target.checked});
 $('#goalsError').textContent='';J.openDialog('goalsDialog');
}
$('#goalsForm').addEventListener('submit',e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),read=(p='')=>Object.fromEntries(['waterMl','sportMin','foodKcal','sleepHours'].map(k=>[k,Number(f.get(p+k))]));
 try{D.setGoals({...read(),routine:{enabled:Object.fromEntries(Object.keys(units).map(k=>[k,f.has('enabled-'+k)])),sportDays:f.getAll('sportDays').map(Number),waterPortion:Number(f.get('waterPortion')),weekend:f.has('weekendEnabled')?read('weekend-'):null}});$('#goalsDialog').close();J.toast('Личный режим сохранён')}catch(error){$('#goalsError').textContent=error.message}
});
$('#settingsFoodGoal').innerHTML='Личный режим и цели <b>›</b>';
addEventListener('iris:goals',openGoals);

$('#statistics .period-tabs').insertAdjacentHTML('afterend','<section id="statsPerspective" class="stats-perspective" aria-label="Наблюдения по записям"></section>');
function renderPerspective({period,selected,dates,list}){
 const area=$('#statsPerspective'),entries=D.entries,checks=entries.checkins.filter(e=>dates.includes(e.date)),rated=entries.sleep.filter(e=>dates.includes(e.date)&&e.quality!=null);
 const checkinBlock=`<div class="perspective-heading"><h2>Самочувствие</h2><span>${checks.length?checks.length+' отметок':'Без отметок'}</span></div>${checks.length?`<div class="wellbeing-summary">${[['energy','Энергия'],['mood','Настроение'],['stress','Стресс']].map(([k,v])=>`<div><span>${v}</span><strong>${fmt(checks.reduce((s,e)=>s+e[k],0)/checks.length)}<small> / 5</small></strong></div>`).join('')}</div>`:'<p class="field-note">Энергия, настроение и стресс — только по твоим отметкам.</p>'}${rated.length?`<p class="field-note">Качество сна: ${fmt(rated.reduce((s,e)=>s+e.quality,0)/rated.length)} / 5 · ${rated.length} записей</p>`:''}`;
 if(period==='day'){
  const plan=D.dailyPlan(selected),p=D.progress(list[0]);
  area.innerHTML=`<div class="perspective-heading"><h2>Цели дня</h2><span>${p.count?p.completed+' из '+p.count:'Без целей'}</span></div><p class="field-note">${plan.rest?'День отдыха: спорт не влияет на общий прогресс. ':''}Прогресс выбранных целей — не оценка здоровья.</p>${checkinBlock}<button class="quiet-action" data-stats-checkin="${selected}" type="button">${checks.length?'Изменить отметку':'Отметить самочувствие'}</button>`;return;
 }
 const prev=dates.map(d=>D.summary(D.shift(d,-dates.length)));
 const cards=Object.keys(units).map(k=>{
  const current=list.filter(s=>s.present[k]),previous=prev.filter(s=>s.present[k]);
  const avg=a=>a.reduce((n,s)=>n+s[k],0)/a.length,a=current.length?avg(current):null,b=previous.length?avg(previous):null,delta=a!==null&&b!==null?a-b:null;
  const goalDays=current.filter(s=>D.dailyPlan(s.date).active[k]),done=goalDays.filter(s=>s[k]>=D.dailyPlan(s.date).targets[k]).length;
  return `<article class="comparison-card" style="--quick-color:${colors[k]}"><div>${icon(k)}<h3>${labels[k]} · в среднем</h3></div><strong>${a===null?'—':fmt(a)+' '+units[k]}</strong><p>${current.length} из ${dates.length} дней с записями</p><p>${delta===null?'Для сравнения пока мало записей':`${delta>0?'+':''}${fmt(delta)} ${units[k]} к прошлому периоду (${previous.length} дн.)`}</p>${goalDays.length?`<p>Цель выполнена: ${done} из ${goalDays.length} отмеченных дней</p>`:''}</article>`;
 }).join('');
 area.innerHTML=`<div class="perspective-heading"><h2>Твой ритм в цифрах</h2></div><p class="field-note">Средние — только по дням с записями. Нет данных ≠ ноль. Текущий период может быть неполным; изменения не объясняют причины самочувствия.</p><div class="comparison-grid">${cards}</div>${checkinBlock}`;
}
addEventListener('iris:stats-render',e=>renderPerspective(e.detail));
$('#statsPerspective').addEventListener('click',e=>{const b=e.target.closest('[data-stats-checkin]');if(b)editEntry('checkins',null,b.dataset.statsCheckin)});

// A quiet pause has one timestamp-based timeout, no animation loop or health claims.
$('#settingsPanel .settings-list').insertAdjacentHTML('beforeend','<button id="settingsPause" type="button">Минута для себя <b>›</b></button>');
let pauseEnd=0,pauseTimer=0;
function updatePause(){
 clearTimeout(pauseTimer);pauseTimer=0;if(!$('#pauseDialog').open||document.hidden)return;
 const seconds=pauseEnd?Math.max(0,Math.ceil((pauseEnd-Date.now())/1000)):60;
 $('#pauseClock').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 $('#pauseStatus').textContent=pauseEnd?(seconds?'Можно никуда не спешить':'Пауза закончилась. Возвращайся в своём темпе.'):'Тихая пауза · 1 минута';
 $('#pauseStart').textContent=pauseEnd&&seconds?'Закончить раньше':pauseEnd?'Ещё минута':'Начать паузу';
 if(pauseEnd&&seconds)pauseTimer=setTimeout(updatePause,1000);
}
$('#settingsPause').addEventListener('click',()=>{$('#settingsPanel .close-settings').click();pauseEnd=0;J.openDialog('pauseDialog');updatePause()});
$('#pauseStart').addEventListener('click',()=>{if(pauseEnd>Date.now()){$('#pauseDialog').close();return}pauseEnd=Date.now()+60000;updatePause()});
$('#pauseDialog').addEventListener('close',()=>{clearTimeout(pauseTimer);pauseTimer=0;pauseEnd=0});

function refresh(){const today=D.day();if(today!==lastToday){if(journalDate===lastToday)journalDate=today;lastToday=today}portionLabel();renderJournal()}
addEventListener('iris:data',refresh);addEventListener('iris:sport',renderJournal);
addEventListener('iris:visibility',renderJournal);
document.addEventListener('visibilitychange',()=>{refresh();updatePause()});
portionLabel();J.view(app.dataset.view||'eye',false);dispatchEvent(new Event('resize'));M.invalidate();
})();
