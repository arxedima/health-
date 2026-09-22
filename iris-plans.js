(()=>{
'use strict';
const app=document.getElementById('app'),J=window.IRISJournal;
if(!app||!J)return;
const $=s=>document.querySelector(s),esc=J.esc;
const KEY='irisPlansV1',day=(v=new Date())=>{const d=new Date(v);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dateName=d=>new Date(d+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'long'});
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
let items=[],selected=day(),filter='today',search='',editing=null;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))items=saved.filter(x=>x&&typeof x.id==='string'&&['task','note','habit'].includes(x.type)).slice(0,3000)}catch{}
const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14v14H5zM8 10h8M8 14h5"/></svg>';
$('#journalTab').insertAdjacentHTML('afterend','<button id="plansTab" type="button" aria-current="false">'+icon+'<span>Планы</span></button>');
const html=[
'<section id="plansView" class="plans-view" aria-labelledby="plansTitle" hidden>',
'<header class="plans-top"><button id="plansBack" type="button" aria-label="Назад">‹</button><span>ПЛАНЫ</span><button id="plansNewTop" type="button" aria-label="Новая запись">＋</button></header>',
'<div class="plans-intro"><h1 id="plansTitle">Сегодня</h1><p id="plansSub"></p></div><div class="plans-week" id="plansWeek" role="group" aria-label="Выбрать день недели"></div>',
'<div class="plans-toolbar"><label class="plans-date-label">Выбрать дату <input id="plansDate" type="date" aria-label="Выбранная дата"></label><button id="plansToday" type="button">Сегодня</button></div>',
'<div class="plans-progress"><div><span id="plansCount">0 из 0</span><span id="plansPercent">0%</span></div><div class="plans-track"><i id="plansFill"></i></div></div>',
'<div class="plans-filters" role="group" aria-label="Раздел планов"><button data-plan-filter="today" aria-pressed="true">Сегодня</button><button data-plan-filter="upcoming">Предстоящие</button><button data-plan-filter="habit">Привычки</button><button data-plan-filter="note">Заметки</button><button data-plan-filter="all">Все</button></div>',
'<button id="plansQuickAdd" class="plans-quick-trigger" type="button"><span>＋</span> Новая задача</button><label class="plans-search"><span>⌕</span><input id="plansSearch" type="search" placeholder="Поиск записей…" autocomplete="off" aria-label="Поиск записей"><button id="plansSearchClear" type="button" aria-label="Очистить поиск">×</button></label>',
'<div class="plans-section-head"><h2 id="plansListTitle">Сегодня</h2><span id="plansListCount"></span></div>',
'<div id="plansList" class="plans-list" aria-live="polite"></div>',
'<button id="plansAdd" class="plans-add" type="button"><span>＋</span> Добавить запись</button>',
'<p class="plans-privacy">Записи хранятся только в этом браузере на устройстве. Для сохранности не очищай данные сайта.</p>',
'</section>',
'<dialog id="plansDialog" class="plans-dialog" aria-labelledby="plansDialogTitle"><form id="plansForm">',
'<header><h2 id="plansDialogTitle">Новая задача</h2><button id="plansClose" type="button" aria-label="Закрыть">×</button></header>',
'<div class="plans-type" role="group" aria-label="Тип записи"><button type="button" data-plan-type="task" aria-pressed="true">Задача</button><button type="button" data-plan-type="habit">Привычка</button><button type="button" data-plan-type="note">Заметка</button></div>',
'<label class="plans-title-label"><input name="title" maxlength="180" required placeholder="Что нужно сделать?" aria-label="Название задачи"></label><button id="plansMore" type="button" aria-expanded="false">＋ Детали и дата</button><div id="plansExtra" hidden>',
'<label id="plansBodyLabel"><span>Описание / шаги</span><textarea name="body" rows="4" maxlength="6000" placeholder="Мысли, детали, чек-лист…"></textarea></label>',
'<div class="plans-form-row" id="plansDueRow"><label>Дата<input name="due" type="date"></label><label>Повтор<select name="repeat"><option value="none">Без повтора</option><option value="daily">Каждый день</option><option value="weekly">Каждую неделю</option></select></label></div>',
'<label id="plansPriorityRow" class="plans-priority"><input name="priority" type="checkbox"> Важная задача</label>',
'</div><p id="plansError" role="alert"></p><button class="plans-save" type="submit">Добавить задачу</button><button id="plansDelete" class="plans-delete" type="button" hidden>Удалить запись</button>',
'</form></dialog>'
].join('');
app.insertAdjacentHTML('beforeend',html);
const view=$('#plansView'),dialog=$('#plansDialog'),form=$('#plansForm');
function save(){try{localStorage.setItem(KEY,JSON.stringify(items));return true}catch{alert('Не удалось сохранить запись. Проверь свободное место браузера.');return false}}
function completed(x,d){return x.repeat==='none'?!!x.done:!!x.history?.includes(d)}
function active(x,d){if(x.type==='note')return true;if(x.repeat==='daily')return !x.due||x.due<=d;if(x.repeat==='weekly')return !!x.due&&x.due<=d&&new Date(x.due+'T12:00:00').getDay()===new Date(d+'T12:00:00').getDay();return (x.due||x.created?.slice(0,10)||day())<=d}
function toggle(id){const x=items.find(v=>v.id===id);if(!x||x.type==='note')return;if(x.repeat==='none')x.done=!x.done;else{const h=new Set(x.history||[]);h.has(selected)?h.delete(selected):h.add(selected);x.history=[...h].sort()}if(save())render()}
function listing(){let list=items.filter(x=>(x.title+' '+(x.body||'')).toLocaleLowerCase('ru').includes(search));if(filter==='today')list=list.filter(x=>x.type!=='note'&&active(x,selected));if(filter==='upcoming')list=list.filter(x=>x.type==='task'&&x.due>selected&&x.repeat==='none'&&!x.done);if(filter==='habit')list=list.filter(x=>x.type==='habit'&&active(x,selected));if(filter==='note')list=list.filter(x=>x.type==='note');return list.sort((a,b)=>Number(completed(a,selected))-Number(completed(b,selected))||Number(!!b.priority)-Number(!!a.priority)||(a.due||'').localeCompare(b.due||'')||(b.created||'').localeCompare(a.created||''))}
function render(){
 $('#plansDate').value=selected;$('#plansToday').disabled=selected===day();
 const base=new Date(selected+'T12:00:00'),start=new Date(base);start.setDate(base.getDate()-((base.getDay()+6)%7));
 $('#plansWeek').innerHTML=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const key=day(d),today=key===day();return '<button type="button" data-plan-day="'+key+'" aria-pressed="'+(key===selected)+'" aria-label="'+dateName(key)+'"><span>'+['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'][i]+'</span><strong>'+d.getDate()+'</strong>'+(today?'<i></i>':'')+'</button>'}).join('');
 $('#plansSearchClear').hidden=!search;
 const due=items.filter(x=>x.type!=='note'&&active(x,selected));const done=due.filter(x=>completed(x,selected)).length;
 $('#plansCount').textContent=done+' из '+due.length+' выполнено';$('#plansPercent').textContent=due.length?Math.round(done/due.length*100)+'%':'0%';$('#plansFill').style.width=(due.length?done/due.length*100:0)+'%';
 $('#plansSub').textContent=dateName(selected);$('#plansTitle').textContent=selected===day()?'Сегодня':dateName(selected);
 document.querySelectorAll('[data-plan-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.planFilter===filter)));
 const titles={today:'Задачи',upcoming:'Предстоящие',habit:'Привычки',note:'Заметки',all:'Все записи'};$('#plansListTitle').textContent=titles[filter];
 const list=listing();$('#plansListCount').textContent=list.length+' записей';
 $('#plansList').innerHTML=list.length?list.map(x=>{
 const done=completed(x,selected),type=x.type==='note'?'ЗАМЕТКА':x.type==='habit'?'ПРИВЫЧКА':'ЗАДАЧА';
 const detail=x.type==='note'?'':x.repeat==='daily'?'Каждый день':x.repeat==='weekly'?'Каждую неделю':x.due&&x.due!==selected?dateName(x.due):'';
 return '<article class="plans-card '+(done?'is-done ':'')+(x.priority?'is-priority':'')+'" data-plan-id="'+esc(x.id)+'"><button class="plans-check" data-plan-check="'+esc(x.id)+'" type="button" '+(x.type==='note'?'hidden':'')+' aria-label="'+(done?'Вернуть':'Выполнить')+' '+esc(x.title)+'">'+(done?'✓':'')+'</button><button class="plans-card-main" type="button" data-plan-edit="'+esc(x.id)+'"><span class="plans-card-meta">'+type+(x.priority?' · ВАЖНО':'')+'</span><strong>'+esc(x.title)+'</strong>'+(x.body?'<small>'+esc(x.body)+'</small>':'')+'<em>'+esc(detail)+'</em></button><button class="plans-card-edit" type="button" data-plan-edit="'+esc(x.id)+'" aria-label="Изменить '+esc(x.title)+'">›</button></article>';
 }).join(''):'<div class="plans-empty"><strong>Пока нет задач</strong><p>Добавь задачу, чтобы начать день.</p></div>';
}
function typeUI(type){form.dataset.type=type;form.querySelectorAll('[data-plan-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.planType===type)));$('#plansDueRow').hidden=type==='note';$('#plansPriorityRow').hidden=type!=='task';$('#plansBodyLabel').querySelector('span').textContent=type==='note'?'Текст заметки':type==='habit'?'Описание привычки':'Описание / шаги';}
function openEditor(id=null,type='task'){
 editing=id;const x=items.find(v=>v.id===id);form.reset();typeUI(x?.type||type);$('#plansDialogTitle').textContent=x?'Изменить запись':'Новая задача';$('#plansExtra').hidden=!x;$('#plansMore').setAttribute('aria-expanded',String(!!x));$('#plansMore').textContent=x?'− Скрыть детали':'＋ Детали и дата';form.querySelector('.plans-save').textContent=x?'Сохранить':'Добавить';form.elements.title.value=x?.title||'';form.elements.body.value=x?.body||'';form.elements.due.value=x?.due||selected;form.elements.repeat.value=x?.repeat|| (type==='habit'?'daily':'none');form.elements.priority.checked=!!x?.priority;$('#plansDelete').hidden=!x;$('#plansError').textContent='';dialog.showModal();requestAnimationFrame(()=>form.elements.title.focus());
}
form.addEventListener('click',e=>{const b=e.target.closest('[data-plan-type]');if(!b)return;typeUI(b.dataset.planType);form.elements.repeat.value=b.dataset.planType==='habit'?'daily':'none'});
form.addEventListener('submit',e=>{e.preventDefault();const title=form.elements.title.value.trim(),type=form.dataset.type;if(!title){$('#plansError').textContent='Напиши название';return}const x=items.find(v=>v.id===editing);const next={id:x?.id||uid(),type,title,body:form.elements.body.value.trim(),due:type==='note'?'':form.elements.due.value||selected,repeat:type==='note'?'none':form.elements.repeat.value,priority:type==='task'&&form.elements.priority.checked,created:x?.created||new Date().toISOString(),done:x?.done||false,history:x?.history||[]};if(x)items[items.indexOf(x)]=next;else items.push(next);if(save()){dialog.close();render()}});
$('#plansDelete').addEventListener('click',()=>{if(!editing||!confirm('Удалить эту запись?'))return;const before=items;items=items.filter(x=>x.id!==editing);if(save()){dialog.close();render()}else items=before});
$('#plansClose').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
$('#plansList').addEventListener('click',e=>{const check=e.target.closest('[data-plan-check]'),edit=e.target.closest('[data-plan-edit]');if(check)toggle(check.dataset.planCheck);else if(edit)openEditor(edit.dataset.planEdit)});
$('#plansAdd').addEventListener('click',()=>openEditor());$('#plansNewTop').addEventListener('click',()=>openEditor());
$('#plansWeek').addEventListener('click',e=>{const b=e.target.closest('[data-plan-day]');if(b){selected=b.dataset.planDay;filter='today';render()}});
$('#plansQuickAdd').addEventListener('click',()=>openEditor());
$('#plansMore').addEventListener('click',()=>{const extra=$('#plansExtra');extra.hidden=!extra.hidden;$('#plansMore').setAttribute('aria-expanded',String(!extra.hidden));$('#plansMore').textContent=extra.hidden?'＋ Детали и дата':'− Скрыть детали'});
$('#plansSearchClear').addEventListener('click',()=>{search='';$('#plansSearch').value='';render();$('#plansSearch').focus()});
$('#plansDate').addEventListener('change',e=>{if(e.target.value){selected=e.target.value;render()}});$('#plansToday').addEventListener('click',()=>{selected=day();render()});
$('#plansSearch').addEventListener('input',e=>{search=e.target.value.toLocaleLowerCase('ru').trim();render()});
$('.plans-filters').addEventListener('click',e=>{const b=e.target.closest('[data-plan-filter]');if(b){filter=b.dataset.planFilter;render()}});
$('#plansTab').addEventListener('click',()=>{J.view('plans');render();view.scrollTop=0});
$('#plansBack').addEventListener('click',()=>J.view('eye'));
addEventListener('popstate',()=>{if(location.hash==='#plans')render()});
if(location.hash==='#plans')J.view('plans',false);
render();
})();