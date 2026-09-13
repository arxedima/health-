(()=>{
'use strict';
const D=window.IRISData,J=window.IRISJournal,M=window.IRISMotion,$=s=>document.querySelector(s),app=$('#app'),stage=$('#stage');
const {esc,icon}=J;
const labels={water:'Вода',sport:'Спорт',food:'Питание',sleep:'Сон',favorites:'Избранные блюда'};
const colors={water:'#6db8ec',sport:'#e8887c',food:'#a8bb7b',sleep:'#b39be7'};
const close=id=>`<button class="round-button" type="button" data-close="${id}" aria-label="Закрыть">${icon('close')}</button>`;
const dialog=(id,title,body)=>`<dialog id="${id}" class="iris-dialog" aria-labelledby="${id}Title"><div class="sheet-handle"></div><header class="sheet-header"><h2 id="${id}Title">${title}</h2>${close(id)}</header>${body}</dialog>`;
app.insertAdjacentHTML('beforeend',
 dialog('trailDialog','След дня','<p id="trailCaption" class="field-note"></p><div id="trailEntries" class="event-list"></div>')+
 dialog('favoritesDialog','Избранные блюда','<p class="field-note">Выбери блюдо, проверь порцию и сохрани новый приём пищи.</p><div id="favoriteEntries"></div><p id="favoriteError" class="form-error" role="alert"></p>')+
 dialog('backupDialog','Копия дневника',`<p class="field-note">Сохрани записи, цель питания и избранные блюда в файл, чтобы перенести их на другое устройство.</p><button id="exportBackup" class="primary-action" type="button">Скачать копию</button><p id="backupSportNote" class="field-note" hidden>Текущая тренировка попадёт в копию после паузы.</p><div class="backup-import"><h3>Восстановить из файла</h3><p class="field-note">Новые записи добавятся к твоей истории. Уже сохранённые останутся на месте.</p><label class="file-picker">Выбрать копию<input id="backupFile" type="file" accept=".json,application/json"></label></div><div id="backupPreview" hidden><p id="backupFileName" class="field-note"></p><dl id="backupCounts" class="backup-counts"></dl><p id="backupSkipped" class="field-note"></p><label class="check-field"><input id="backupGoal" type="checkbox"><span id="backupGoalLabel"></span></label><button id="restoreBackup" class="primary-action" type="button">Добавить записи</button></div><p id="backupError" class="form-error" role="alert"></p>`) +
 '<button id="leaveContemplation" class="leave-contemplation" type="button" aria-label="Вернуться к управлению" hidden><span>Коснись, чтобы вернуться</span></button>'
);
['trailDialog','favoritesDialog','backupDialog'].forEach(id=>J.registerDialog($('#'+id)));
$('#settingsPanel .settings-list').insertAdjacentHTML('beforeend','<button id="settingsFavorites" type="button">Избранные блюда <b>›</b></button><button id="settingsContemplation" type="button">Созерцание <b>›</b></button><button id="settingsBackup" type="button">Резервная копия <b>›</b></button>');
const fromSettings=fn=>()=>{$('#settingsPanel .close-settings').click();fn()};

// A short, record-specific undo never changes an unrelated water entry.
addEventListener('iris:water-change',e=>{
 const {id,ml}=e.detail;
 J.toast(`${ml>0?'+':''}${ml} мл воды`,{label:'Отменить',run:()=>D.undoWater(id)});
});

// Each mark groups actual events in a time slot; there are no invented points.
const trail=document.createElement('div');trail.id='dayTrail';trail.setAttribute('role','group');trail.setAttribute('aria-label','След дня: записи вокруг глаза');stage.append(trail);
$('#openSections').after(Object.assign(document.createElement('button'),{id:'openDayTrail',className:'quiet-action trail-link',type:'button',textContent:'След дня'}));
let slots=12,groups=[],lastFrame=null,trailSlot=null;
function rebuildTrail(){
 const all=D.events(D.day()).filter(e=>!e.legacy&&!e.running&&e.at);
 const grouped=new Map();
 for(const e of all){const at=new Date(e.at),minutes=at.getHours()*60+at.getMinutes(),bin=Math.min(slots-1,Math.floor(minutes/1440*slots));if(!grouped.has(bin))grouped.set(bin,[]);grouped.get(bin).push(e)}
 groups=[...grouped].sort((a,b)=>a[0]-b[0]).map(([bin,entries])=>({bin,entries}));
 trail.innerHTML=groups.map(({bin,entries})=>{
  const types=[...new Set(entries.map(e=>e.kind))],color=types.length===1?colors[types[0]]:'#c5d7e6';
  const times=entries.map(e=>new Date(e.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}));
  return `<button type="button" class="day-mark" data-slot="${bin}" style="--mark-color:${color}" aria-label="${esc(types.map(k=>labels[k]).join(', '))}, ${esc(times.at(-1))}${times.length>1?' — '+esc(times[0]):''}. Записей: ${entries.length}"><span></span>${entries.length>1?'<i></i>':''}</button>`;
 }).join('');
 const count=D.events(D.day()).length;$('#openDayTrail').textContent=count?`След дня · ${count}`:'След дня';
 if(lastFrame)placeTrail(lastFrame);
 if($('#trailDialog').open)renderTrail();
}
function placeTrail(f){
 const show=app.classList.contains('mode-home')&&app.dataset.welcome!=='true'&&app.dataset.view!=='stats'&&app.dataset.contemplation!=='true'&&!app.classList.contains('menu-open');
 trail.hidden=!show;if(!show)return;
 trail.style.left=f.x+'px';trail.style.top=f.y+'px';
 for(const b of trail.children){const angle=(Number(b.dataset.slot)+.5)/slots*Math.PI*2-Math.PI/2;b.style.left=Math.cos(angle)*f.r*1.055+'px';b.style.top=Math.sin(angle)*f.r*1.055+'px'}
}
M.subscribe(f=>{
 lastFrame=f;const count=Math.min(12,Math.max(5,Math.floor(Math.PI*2*f.r*1.055/48)));
 if(count!==slots){slots=count;rebuildTrail()}else placeTrail(f);
});
function renderTrail(){
 const entries=trailSlot===null?D.events(D.day()):groups.find(g=>g.bin===trailSlot)?.entries||[];
 $('#trailCaption').textContent=trailSlot===null?'Сегодня · цвет точки соответствует разделу. Коснись записи, чтобы открыть её.':'Записи рядом по времени. Выбери одну, чтобы открыть.';
 $('#trailEntries').innerHTML=entries.length?entries.map(J.eventRow).join(''):'<p class="empty-note">Добавь воду, еду, сон или тренировку. События с сохранённым временем появятся точками вокруг глаза.</p>';
}
function openTrail(slot=null){trailSlot=slot;renderTrail();J.openDialog('trailDialog')}
$('#openDayTrail').addEventListener('click',()=>openTrail());
trail.addEventListener('click',e=>{const b=e.target.closest('[data-slot]');if(b){e.stopPropagation();openTrail(Number(b.dataset.slot))}});
$('#trailEntries').addEventListener('click',e=>{const b=e.target.closest('[data-entry]');if(b)J.inspectEntry(b.dataset.entry,b.dataset.kind,D.day())});

function renderFavorites(){
 const entries=D.entries.favorites||[];
 $('#favoriteEntries').innerHTML=entries.length?entries.map(e=>`<div class="favorite-row"><button type="button" class="favorite-use" data-favorite="${esc(e.id)}"><strong>${esc(e.name)}</strong><small>${esc(e.meal)} · ${e.kcal} ккал</small></button><button type="button" class="round-button favorite-remove" data-remove-favorite="${esc(e.id)}" aria-label="Убрать ${esc(e.name)} из избранного">${icon('close')}</button></div>`).join(''):'<p class="empty-note">При добавлении еды отметь «Сохранить блюдо в избранное». Здесь появятся твои частые блюда.</p>';
 const count=$('#chooseFavorite span');if(count)count.textContent=entries.length||'';
}
function openFavorites(){renderFavorites();$('#favoriteError').textContent='';J.openDialog('favoritesDialog')}
document.addEventListener('click',e=>{if(e.target.closest('#chooseFavorite'))openFavorites()});
$('#settingsFavorites').addEventListener('click',fromSettings(openFavorites));
$('#favoriteEntries').addEventListener('click',e=>{
 const remove=e.target.closest('[data-remove-favorite]');
 if(remove){try{D.removeFavorite(remove.dataset.removeFavorite);renderFavorites()}catch(error){$('#favoriteError').textContent=error.message}return}
 const b=e.target.closest('[data-favorite]');if(!b)return;
 const id=b.dataset.favorite;$('#favoritesDialog').close();if(!$('#entryDialog').open)$('#addFood').click();dispatchEvent(new CustomEvent('iris:favorite',{detail:id}));
});

// Background light is independent of both the iris and its motion setting.
$('#appearanceTitle').textContent='Внешний вид';
$('#appearanceDialog .motion-options').before(Object.assign(document.createElement('h3'),{className:'appearance-section',textContent:'Движение глаза'}));
$('#appearanceDialog .primary-action').insertAdjacentHTML('beforebegin','<div class="background-setting"><label for="backgroundBrightness">Яркость фона <output id="backgroundValue" for="backgroundBrightness"></output></label><input id="backgroundBrightness" type="range" min="0" max="100" step="5"><p class="field-note">Меняет свечение вокруг глаза. При нуле фон чёрный.</p></div>');
function syncBackground(){$('#backgroundBrightness').value=M.background;$('#backgroundValue').textContent=M.background+'%'}
$('#backgroundBrightness').addEventListener('input',e=>M.setBackground(Number(e.target.value)));
addEventListener('iris:motion',syncBackground);syncBackground();

// The exit surface consumes the tap so it cannot start a timer or add water.
const leave=$('#leaveContemplation');
function contemplate(on){
 dispatchEvent(new CustomEvent('iris:close-menu'));app.dataset.contemplation=String(on);leave.hidden=!on;
 for(const el of [$('#metric'),$('.topbar'),$('.bottom-nav')])el.inert=on;
 stage.tabIndex=on?-1:0;trail.inert=on;
 if(on){$('#journalToast').hidden=true;leave.focus({preventScroll:true})}else $('#settingsTrigger').focus({preventScroll:true});
 M.invalidate();
}
$('#settingsContemplation').addEventListener('click',fromSettings(()=>contemplate(true)));
leave.addEventListener('pointerdown',e=>e.stopPropagation());
leave.addEventListener('click',e=>{e.stopPropagation();contemplate(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&app.dataset.contemplation==='true'){e.preventDefault();contemplate(false)}});
addEventListener('iris:navigate',()=>{if(app.dataset.contemplation==='true')contemplate(false)});
addEventListener('iris:statistics',()=>{if(app.dataset.contemplation==='true')contemplate(false)});
addEventListener('iris:visibility',()=>{if(app.dataset.view==='stats'&&app.dataset.contemplation==='true')contemplate(false)});

let pendingBackup=null,fileRead=0;
function backupNote(){$('#backupSportNote').hidden=localStorage.getItem('irisSportRunningV11')!=='1'}
$('#settingsBackup').addEventListener('click',fromSettings(()=>{backupNote();J.openDialog('backupDialog')}));
addEventListener('iris:sport',backupNote);
$('#exportBackup').addEventListener('click',()=>{
 try{
  const blob=new Blob([D.exportBackup()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`iris-backup-${D.day()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#backupError').textContent='';
 }catch(error){$('#backupError').textContent=error.message}
});
$('#backupFile').addEventListener('change',async e=>{
 const token=++fileRead,file=e.target.files?.[0];pendingBackup=null;$('#backupPreview').hidden=true;$('#backupError').textContent='';
 if(!file)return;
 try{
  if(file.size>10*1024*1024)throw Error('Выбери копию размером до 10 МБ.');
  const text=await file.text();if(token!==fileRead)return;
  const plan=D.previewBackup(text);pendingBackup={text,revision:plan.revision};
  $('#backupFileName').textContent=file.name;
  $('#backupCounts').innerHTML=Object.entries(plan.added).map(([k,n])=>`<div><dt>${labels[k]}</dt><dd>+${n}</dd></div>`).join('');
  $('#backupSkipped').textContent=`Уже есть: ${plan.counts.duplicates}. Пропустим пересечения и несовместимые итоги: ${plan.counts.conflicts}.`;
  $('#backupGoal').checked=plan.empty;$('#backupGoalLabel').textContent=`Восстановить цель питания: ${plan.foodGoal} ккал`;
  $('#restoreBackup').textContent=plan.counts.added?`Добавить записи · ${plan.counts.added}`:'Применить копию';$('#backupPreview').hidden=false;
 }catch(error){if(token===fileRead)$('#backupError').textContent=error.message}
});
$('#restoreBackup').addEventListener('click',()=>{
 if(!pendingBackup)return;
 try{
  const result=D.restoreBackup(pendingBackup.text,{revision:pendingBackup.revision,restoreGoal:$('#backupGoal').checked});
  pendingBackup=null;$('#backupPreview').hidden=true;$('#backupFile').value='';$('#backupDialog').close();J.toast(result.added?`Добавлено: ${result.added}`:'Копия применена. Дубликатов нет.');
 }catch(error){$('#backupError').textContent=error.message}
});
addEventListener('iris:data',()=>{rebuildTrail();if($('#favoritesDialog').open)renderFavorites()});
rebuildTrail();
})();
