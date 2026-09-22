(()=>{
'use strict';
const app=document.getElementById('app'),J=window.IRISJournal;
if(!app||!J)return;
const $=s=>document.querySelector(s),esc=J.esc;
const KEY='irisPlansV1',day=(v=new Date())=>{const d=new Date(v);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
let items=[],selected=day(),editing=null,activeFilter='today';
try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))items=saved.filter(x=>x&&typeof x.id==='string'&&['task','note','habit'].includes(x.type)).slice(0,3000)}catch{}
const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14v14H5zM8 10h8M8 14h5"/></svg>';
$('#journalTab').insertAdjacentHTML('afterend','<button id="plansTab" type="button" aria-current="false">'+icon+'<span>Планы</span></button>');
const html=[
'<section id="plansView" class="plans-view" aria-labelledby="plansTitle" hidden>',
'<header class="plans-top"><button id="plansBack" type="button" aria-label="Меню">☰</button><span id="plansTitle">IRIS <i> / </i> ПЛАНЫ</span><label class="plans-calendar" aria-label="Выбрать дату"><input id="plansDate" type="date"><span>▦</span></label></header><div class="plans-overview"><div><span class="plans-overview-label" id="plansDayLabel">СЕГОДНЯ</span><strong id="plansDayProgress">0 / 0</strong></div><div class="plans-overview-track"><span id="plansDayFill"></span></div><p id="plansDayCaption">Твой день, твой ритм.</p></div>',
'<form id="plansQuickForm" class="plans-quick"><span aria-hidden="true">＋</span><input id="plansQuickInput" maxlength="180" autocomplete="off" placeholder="Новая задача…" aria-label="Новая задача"><button type="submit" aria-label="Добавить задачу">↑</button></form><nav class="plans-filters" aria-label="Период"><button type="button" data-plan-filter="today" class="active">Сегодня</button><button type="button" data-plan-filter="tomorrow">Завтра</button><button type="button" data-plan-filter="week">На неделе</button><button type="button" data-plan-filter="later">Потом</button></nav><div class="plans-groups" id="plansGroups" aria-live="polite"></div><section class="plans-shortcuts"><h3>Быстрые действия</h3><div><button type="button" data-plan-create="task">＋<small>Задача</small></button><button type="button" data-plan-create="note">▤<small>Заметка</small></button><button type="button" data-plan-create="habit">↻<small>Привычка</small></button></div></section>',
'<button id="plansFab" class="plans-fab" type="button" aria-label="Новая задача">＋</button>',
'<div class="plans-menu" id="plansMenu" hidden><button id="plansGoEye" type="button">← На главную</button><button data-plan-create="habit" type="button">＋ Привычка</button><button data-plan-create="note" type="button">＋ Заметка</button><button id="plansMenuClose" type="button">Закрыть</button></div>',
'</section>',
'<dialog id="plansDialog" class="plans-dialog" aria-labelledby="plansDialogTitle"><form id="plansForm">',
'<div class="plans-handle" aria-hidden="true"></div><header><h2 id="plansDialogTitle">Новая задача</h2><button id="plansClose" type="button" aria-label="Закрыть">×</button></header>',
'<label class="plans-title-label"><input name="title" maxlength="180" required placeholder="Новая задача" aria-label="Название задачи" autocomplete="off"></label>',
'<button id="plansSubtask" type="button" class="plans-inline-action">↳ <span>Добавить подзадачу</span></button>',
'<button id="plansNote" type="button" class="plans-inline-action">▤ <span>Добавить заметку</span></button>',
'<div class="plans-subtasks" id="plansSubtasks" hidden></div>',
'<label class="plans-body-label" id="plansBodyLabel" hidden><textarea name="body" rows="2" maxlength="6000" placeholder="Заметка к задаче…"></textarea></label>',
'<div class="plans-form-spacer"></div>',
'<div class="plans-bottom-controls"><button type="button" id="plansDueToggle" class="plans-date-button" aria-label="Выбрать дату">▦ <span id="plansDueText">Сегодня</span></button><button type="button" id="plansRepeatToggle" class="plans-option" aria-label="Повтор">♧</button><button type="button" id="plansPriorityToggle" class="plans-option" aria-label="Важная задача">◇</button></div>',
'<div class="plans-extra" id="plansExtra" hidden><label>Дата <input name="due" type="date"></label><label>Повтор <select name="repeat"><option value="none">Без повтора</option><option value="daily">Каждый день</option><option value="weekly">Каждую неделю</option></select></label><label class="plans-priority"><input name="priority" type="checkbox"> Важная задача</label><label>Тип <select name="type"><option value="task">Задача</option><option value="habit">Привычка</option><option value="note">Заметка</option></select></label></div>',
'<p id="plansError" role="alert"></p><button class="plans-save" type="submit" aria-label="Сохранить">↑</button><button id="plansDelete" class="plans-delete" type="button" hidden>Удалить запись</button>',
'</form></dialog>'
].join('');
app.insertAdjacentHTML('beforeend',html);
const view=$('#plansView'),dialog=$('#plansDialog'),form=$('#plansForm');
function save(){try{localStorage.setItem(KEY,JSON.stringify(items));return true}catch{alert('Не удалось сохранить запись. Проверь свободное место браузера.');return false}}
function completed(x,d){return x.repeat==='none'?!!x.done:!!x.history?.includes(d)}
function toggle(id){const x=items.find(v=>v.id===id);if(!x||x.type==='note')return;if(x.repeat==='none')x.done=!x.done;else{const h=new Set(x.history||[]);h.has(day())?h.delete(day()):h.add(day());x.history=[...h].sort()}if(save())render()}
function shift(d,n){const v=new Date(d+'T12:00:00');v.setDate(v.getDate()+n);return day(v)}
function render(){
 const now=day(),tomorrow=shift(now,1),weekEnd=shift(now,7);
 const groups=[
  {name:'СЕГОДНЯ',cls:'today',test:x=>x.type==='task'&&((x.repeat==='none'&&x.due&&x.due<=now)||(x.repeat==='daily'&&(!x.due||x.due<=now))||(x.repeat==='weekly'&&x.due&&x.due<=now&&new Date(x.due+'T12:00:00').getDay()===new Date(now+'T12:00:00').getDay()))},
  {name:'ЗАВТРА',cls:'tomorrow',test:x=>x.type==='task'&&x.repeat==='none'&&x.due===tomorrow},
  {name:'НА НЕДЕЛЕ',cls:'week',test:x=>x.type==='task'&&x.repeat==='none'&&x.due>tomorrow&&x.due<=weekEnd},
  {name:'ПОТОМ',cls:'later',test:x=>x.type==='task'&&x.repeat==='none'&&(!x.due||x.due>weekEnd)},
  {name:'ПРИВЫЧКИ',cls:'habits',test:x=>x.type==='habit'},
  {name:'ЗАМЕТКИ',cls:'notes',test:x=>x.type==='note'}
 ];
 $('#plansDate').value=selected;
 const todayItems=items.filter(x=>x.type==='task'&&((x.repeat==='none'&&x.due&&x.due<=now)||(x.repeat==='daily'&&(!x.due||x.due<=now))||(x.repeat==='weekly'&&x.due&&x.due<=now&&new Date(x.due+'T12:00:00').getDay()===new Date(now+'T12:00:00').getDay())));
 const finished=todayItems.filter(x=>completed(x,now)).length;
 $('#plansDayProgress').textContent=(todayItems.length?Math.round(finished/todayItems.length*100):0)+'%';
 $('#plansDayFill').style.width=(todayItems.length?Math.round(finished/todayItems.length*100):0)+'%';
 $('#plansDayCaption').textContent=todayItems.length?(finished===todayItems.length?'На сегодня всё готово':(todayItems.length-finished)+' осталось на сегодня'):'Добавь первую задачу на сегодня';
 const card=x=>{
  const done=completed(x,now),isNote=x.type==='note';
  const detail=x.body?'<small>'+esc(x.body)+'</small>':'';
  const sub=Array.isArray(x.subtasks)&&x.subtasks.length?'<small>'+x.subtasks.filter(t=>t.done).length+'/'+x.subtasks.length+' подзадач</small>':'';
  return '<article class="plans-row '+(done?'is-done':'')+'" data-plan-id="'+esc(x.id)+'">'+(isNote?'<span class="plans-note-icon">▤</span>':'<button class="plans-check" data-plan-check="'+esc(x.id)+'" type="button" aria-label="'+(done?'Вернуть':'Выполнить')+' '+esc(x.title)+'">'+(done?'✓':'')+'</button>')+'<button class="plans-row-title" type="button" data-plan-edit="'+esc(x.id)+'"><strong>'+esc(x.title)+'</strong>'+sub+detail+'</button><button class="plans-row-edit" type="button" data-plan-edit="'+esc(x.id)+'" aria-label="Редактировать '+esc(x.title)+'">☷</button></article>';
 };
 $('#plansGroups').innerHTML=groups.filter(g=>g.cls===activeFilter).map(g=>{
  let list=items.filter(g.test).sort((a,b)=>Number(completed(a,now))-Number(completed(b,now))||Number(!!b.priority)-Number(!!a.priority)||(a.due||'').localeCompare(b.due||''));
  const total=list.length,done=list.filter(x=>completed(x,now)).length;
  return '<section class="plans-group plans-group-'+g.cls+'"><h2>'+g.name+'<span class="plans-badge">'+(g.cls==='today'?done+'/'+total:total)+'</span></h2><div class="plans-group-list">'+(total?list.map(card).join(''):(g.cls==='today'?'<div class="plans-empty-state"><span>✓</span><strong>Задач на сегодня нет</strong><p>Добавь первую задачу</p><button type="button" data-plan-create="task">＋ Добавить задачу</button></div>':''))+'</div></section>';
 }).join('');
}
$('#plansQuickForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#plansQuickInput'),title=input.value.trim();if(!title)return;const due=activeFilter==='tomorrow'?shift(day(),1):activeFilter==='week'?shift(day(),3):activeFilter==='later'?'':day();items.push({id:uid(),type:'task',title,body:'',subtasks:[],due,repeat:'none',priority:false,created:new Date().toISOString(),done:false,history:[]});if(save()){input.value='';render()}});
$('.plans-filters').addEventListener('click',e=>{const b=e.target.closest('[data-plan-filter]');if(!b)return;activeFilter=b.dataset.planFilter;document.querySelectorAll('[data-plan-filter]').forEach(x=>x.classList.toggle('active',x===b));render()});
$('.plans-shortcuts').addEventListener('click',e=>{const b=e.target.closest('[data-plan-create]');if(b)openEditor(null,b.dataset.planCreate)});
function updateDue(){const d=form.elements.due.value;$('#plansDueText').textContent=d===day()?'Сегодня':d===shift(day(),1)?'Завтра':d?new Date(d+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'Потом'}
function addSubtask(title='',done=false){
 $('#plansSubtasks').hidden=false;
 const row=document.createElement('div');row.className='plans-subtask-row';
 const check=document.createElement('input');check.type='checkbox';check.checked=done;check.setAttribute('aria-label','Подзадача выполнена');
 const input=document.createElement('input');input.type='text';input.maxLength=180;input.placeholder='Подзадача';input.value=title;
 const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Удалить подзадачу');remove.addEventListener('click',()=>{row.remove();if(!$('#plansSubtasks').children.length)$('#plansSubtasks').hidden=true});
 row.append(check,input,remove);$('#plansSubtasks').append(row);return input;
}
function openEditor(id=null,type='task'){
 editing=id;const x=items.find(v=>v.id===id);form.reset();
 form.elements.type.value=x?.type||type;form.elements.title.value=x?.title||'';
 form.elements.body.value=x?.body||'';form.elements.due.value=x?.due||selected||day();
 form.elements.repeat.value=x?.repeat|| (type==='habit'?'daily':'none');
 form.elements.priority.checked=!!x?.priority;
 $('#plansDialogTitle').textContent=x?'Изменить запись':type==='note'?'Новая заметка':type==='habit'?'Новая привычка':'Новая задача';
 $('#plansBodyLabel').hidden=!(x?.body||type==='note');$('#plansSubtasks').replaceChildren();$('#plansSubtasks').hidden=true;
 (x?.subtasks||[]).forEach(t=>addSubtask(t.title,t.done));
 $('#plansExtra').hidden=true;$('#plansDelete').hidden=!x;$('#plansError').textContent='';
 updateDue();$('#plansMenu').hidden=true;dialog.showModal();requestAnimationFrame(()=>form.elements.title.focus());
}
$('#plansSubtask').addEventListener('click',()=>addSubtask().focus());
$('#plansNote').addEventListener('click',()=>{$('#plansBodyLabel').hidden=false;form.elements.body.focus()});
$('#plansDueToggle').addEventListener('click',()=>{$('#plansExtra').hidden=false;form.elements.due.focus();form.elements.due.showPicker?.()});
$('#plansRepeatToggle').addEventListener('click',()=>{$('#plansExtra').hidden=false;form.elements.repeat.focus()});
$('#plansPriorityToggle').addEventListener('click',()=>{form.elements.priority.checked=!form.elements.priority.checked;$('#plansPriorityToggle').classList.toggle('active',form.elements.priority.checked)});
form.elements.due.addEventListener('change',updateDue);
form.addEventListener('submit',e=>{e.preventDefault();const title=form.elements.title.value.trim(),type=form.elements.type.value;if(!title){$('#plansError').textContent='Напиши название';return}
 const x=items.find(v=>v.id===editing);
 const subtasks=[...$('#plansSubtasks').children].map(row=>({title:row.querySelector('input[type="text"]').value.trim(),done:row.querySelector('input[type="checkbox"]').checked})).filter(t=>t.title);
 const next={id:x?.id||uid(),type,title,body:form.elements.body.value.trim(),subtasks,due:type==='note'?'':form.elements.due.value,repeat:type==='note'?'none':form.elements.repeat.value,priority:type==='task'&&form.elements.priority.checked,created:x?.created||new Date().toISOString(),done:x?.done||false,history:x?.history||[]};
 if(x)items[items.indexOf(x)]=next;else items.push(next);
 if(save()){dialog.close();render()}
});
$('#plansDelete').addEventListener('click',()=>{if(!editing||!confirm('Удалить эту запись?'))return;const before=items;items=items.filter(x=>x.id!==editing);if(save()){dialog.close();render()}else items=before});
$('#plansClose').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
$('#plansGroups').addEventListener('click',e=>{const create=e.target.closest('[data-plan-create]');if(create){openEditor(null,create.dataset.planCreate);return}const check=e.target.closest('[data-plan-check]'),edit=e.target.closest('[data-plan-edit]');if(check)toggle(check.dataset.planCheck);else if(edit)openEditor(edit.dataset.planEdit)});
$('#plansFab').addEventListener('click',()=>openEditor());
$('#plansBack').addEventListener('click',()=>{$('#plansMenu').hidden=!$('#plansMenu').hidden});
$('#plansMenuClose').addEventListener('click',()=>{$('#plansMenu').hidden=true});
$('#plansMenu').addEventListener('click',e=>{const b=e.target.closest('[data-plan-create]');if(b)openEditor(null,b.dataset.planCreate)});
$('#plansDate').addEventListener('change',e=>{if(e.target.value){selected=e.target.value;openEditor(null,'task')}});
$('#plansTab').addEventListener('click',()=>{selected=day();J.view('plans');render();view.scrollTop=0});
$('#plansGoEye').addEventListener('click',()=>{ $('#plansMenu').hidden=true;J.view('eye') });
addEventListener('popstate',()=>{if(location.hash==='#plans')render()});
if(location.hash==='#plans')J.view('plans',false);
render();
})();