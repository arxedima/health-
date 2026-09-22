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
 const next={id:x?.id||uid(),type,title,body:form.elements.body.value.trim(),subtasks,due:type==='note'?'':form.elements.due.value||day(),repeat:type==='note'?'none':form.elements.repeat.value,priority:type==='task'&&form.elements.priority.checked,created:x?.created||new Date().toISOString(),done:x?.done||false,history:x?.history||[]};
 if(x)items[items.indexOf(x)]=next;else items.push(next);
 if(save()){dialog.close();render()}
});
$('#plansDelete').addEventListener('click',()=>{if(!editing||!confirm('Удалить эту запись?'))return;const before=items;items=items.filter(x=>x.id!==editing);if(save()){dialog.close();render()}else items=before});
$('#plansClose').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
$('#plansGroups').addEventListener('click',e=>{const check=e.target.closest('[data-plan-check]'),edit=e.target.closest('[data-plan-edit]');if(check)toggle(check.dataset.planCheck);else if(edit)openEditor(edit.dataset.planEdit)});
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