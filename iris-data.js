(()=>{
'use strict';
const KEY='irisJournalV39';
const day=(value=new Date())=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const dateAt=(date)=>new Date(date+'T00:00:00');
const shift=(date,n)=>{const d=dateAt(date);d.setDate(d.getDate()+n);return day(d)};
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&day(dateAt(value))===value;
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const kinds=['water','sport','food','sleep'];
const sportTypes=Object.freeze({training:'Тренировка',walk:'Прогулка',rehab:'ЛФК',run:'Бег',strength:'Силовая',bike:'Велосипед',yoga:'Йога'});
const bounded=(v,d,min,max)=>Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):d;
const legacyGoals=()=>({waterMl:Math.round(bounded(localStorage.getItem('irisWaterGoalMl'),2000,500,6000)),sportMin:Math.round(bounded(localStorage.getItem('irisSportGoalMinV24'),30,1,600)),sleepHours:8});
const idleWorkout=(type='training')=>({id:null,type,elapsed:0,started:0,running:false});
function legacyWorkout(){
 const elapsed=bounded(localStorage.getItem('irisSportElapsedV11'),0,0,Number.MAX_SAFE_INTEGER),started=bounded(localStorage.getItem('irisSportStartedV11'),0,0,Date.now());
 const running=localStorage.getItem('irisSportRunningV11')==='1'&&started>0;
 return {...idleWorkout(),elapsed,started:running?started:0,running,id:elapsed||running?'legacy-'+(started||Date.now()):null};
}
const defaultRoutine=()=>({enabled:{water:true,sport:true,food:true,sleep:true},sportDays:[0,1,2,3,4,5,6],weekend:null,waterPortion:250});
const empty=()=>({version:1,food:[],sleep:[],water:[],sport:[],favorites:[],checkins:[],foodGoal:2100,goals:legacyGoals(),routine:defaultRoutine(),workout:legacyWorkout()});
function load(){
 const raw=localStorage.getItem(KEY);if(!raw)return null;
 const s=JSON.parse(raw);
 if(s.version!==1||!['food','sleep','water','sport'].every(k=>Array.isArray(s[k])))throw Error('Не удалось прочитать дневник. Записи сохранены на устройстве.');
 s.goals||=legacyGoals();s.routine||=defaultRoutine();s.workout||=legacyWorkout();s.checkins||=[];s.favorites||=[];return s;
}
let state,loadError=null;const summaryCache=new Map();
try{state=load()}catch(e){loadError=e;state=empty()}
function commit(next){
 if(loadError)throw loadError;
 try{localStorage.setItem(KEY,JSON.stringify(next))}catch{throw Error('Не удалось сохранить запись. Освободи немного места на устройстве и попробуй ещё раз.')}
 state=next;summaryCache.clear();mirrorWater();mirrorPreferences();window.dispatchEvent(new CustomEvent('iris:data'));
}
function fresh(){if(loadError)throw loadError;const s=load();if(s){state=s;summaryCache.clear()}return structuredClone(state)}
function waterTotal(date=day()){return Math.max(0,state.water.filter(e=>e.date===date).reduce((n,e)=>n+e.ml,0))}
function mirrorWater(){try{localStorage.setItem('irisWaterDateV24',day());localStorage.setItem('irisWaterMl',String(waterTotal()))}catch{}}
function mirrorPreferences(){
 // Compatibility keys are mirrors, never the source of truth after migration.
 try{localStorage.setItem('irisWaterGoalMl',String(state.goals.waterMl));localStorage.setItem('irisSportGoalMinV24',String(state.goals.sportMin));
 const w=state.workout;localStorage.setItem('irisSportElapsedV11',String(w.elapsed));localStorage.setItem('irisSportStartedV11',String(w.started));localStorage.setItem('irisSportRunningV11',w.running?'1':'0')}catch{}
}
// Import only real legacy values, preserving the date without inventing event times.
if(!state){
 state=empty();
 const wd=localStorage.getItem('irisWaterDateV24')||day(),ml=Number(localStorage.getItem('irisWaterMl'));
 if(validDate(wd)&&ml>0)state.water.push({id:uid(),date:wd,ml:Math.min(6000,ml),at:null,legacy:true});
 let history=[];try{history=JSON.parse(localStorage.getItem('irisSportHistoryV11')||'[]')}catch{}
 if(Array.isArray(history))for(const item of history){if(Number.isFinite(item.t)&&item.ms>0)state.sport.push({id:uid(),date:day(item.t),ms:item.ms,start:null,end:null,legacy:true})}
 const elapsed=Number(localStorage.getItem('irisSportElapsedV11'))||0;
 if(elapsed>0)state.sport.push({id:uid(),date:day(),ms:elapsed,start:null,end:null,legacy:true});
 try{commit(state)}catch(e){loadError=e}
}else if(!loadError){mirrorWater();mirrorPreferences()}
function changeWater(delta){
 if(!Number.isInteger(delta))throw Error('Укажи количество воды в целых миллилитрах.');
 const s=fresh(),date=day();
 const total=Math.max(0,s.water.filter(e=>e.date===date).reduce((n,e)=>n+e.ml,0));
 const value=Math.max(0,Math.min(6000,total+delta)),ml=value-total;
 if(!ml)return value;
 const entry={id:uid(),date,ml,at:Date.now()};s.water.push(entry);
 commit(s);dispatchEvent(new CustomEvent('iris:water-change',{detail:entry}));return value;
}
function undoWater(id){
 const s=fresh(),last=s.water.filter(e=>e.date===day()).at(-1);
 if(!last||last.id!==id)throw Error('После этого вода уже менялась. Отмени самое последнее действие.');
 s.water=s.water.filter(e=>e.id!==id);commit(s);return waterTotal();
}
const sameMeal=(a,b)=>a.name.toLocaleLowerCase('ru')===b.name.toLocaleLowerCase('ru')&&a.kcal===b.kcal&&a.meal===b.meal;
function saveFood({id,name,kcal,meal,at,favorite=false}){
 name=String(name||'').trim();kcal=Number(kcal);at=Number(at);
 if(!name||name.length>100)throw Error('Напиши название блюда — до 100 символов.');
 if(!Number.isFinite(kcal)||kcal<0||kcal>20000)throw Error('Укажи калории от 0 до 20 000.');
 if(!Number.isFinite(at)||at<0||at>Date.now()+60000)throw Error('Выбери время, которое уже наступило.');
 if(!['Завтрак','Обед','Ужин','Перекус'].includes(meal))throw Error('Выбери приём пищи.');
 const s=fresh(),entry={id:id||uid(),name,kcal:Math.round(kcal),meal,at,date:day(at)};
 if(id&&!s.food.some(e=>e.id===id))throw Error('Эта запись уже удалена.');
 s.food=s.food.filter(e=>e.id!==id);s.food.push(entry);
 if(favorite){s.favorites||=[];if(!s.favorites.some(e=>sameMeal(e,entry))){if(s.favorites.length>=100)throw Error('В избранном уже 100 блюд. Удали ненужное и попробуй снова.');s.favorites.push({id:uid(),name:entry.name,kcal:entry.kcal,meal:entry.meal})}}
 commit(s);return entry;
}
function removeFavorite(id){const s=fresh();s.favorites=(s.favorites||[]).filter(e=>e.id!==id);commit(s)}
function saveSleep({id,start,end,quality=null}){
 start=Number(start);end=Number(end);const duration=end-start;
 if(!Number.isFinite(duration)||start<0||duration<=0||duration>24*3600000||end>Date.now()+60000)throw Error('Проверь время сна: пробуждение должно быть позже засыпания, продолжительность — до 24 часов.');
 const s=fresh();
 if(s.sleep.some(e=>e.id!==id&&start<e.end&&end>e.start))throw Error('На это время уже есть запись сна. Открой её, чтобы исправить.');
 quality=quality===''||quality===null?null:Number(quality);if(quality!==null&&(!Number.isInteger(quality)||quality<1||quality>5))throw Error('Оцени качество сна от 1 до 5.');
 const entry={id:id||uid(),date:day(end),at:end,start,end,ms:duration,quality};
 if(id&&!s.sleep.some(e=>e.id===id))throw Error('Эта запись уже удалена.');
 s.sleep=s.sleep.filter(e=>e.id!==id);s.sleep.push(entry);commit(s);return entry;
}
function validateWater(list){const totals=new Map();for(const e of list)totals.set(e.date,(totals.get(e.date)||0)+e.ml);if([...totals.values()].some(n=>n<0||n>6000))throw Error('После изменения итог воды должен оставаться от 0 до 6000 мл.');}
const sportMatches=(e,id)=>!!id&&(e.id===id||e.sessionId===id);
function remove(kind,id){
 if(![...kinds,'checkins'].includes(kind))throw Error('Неизвестный раздел.');
 const s=fresh();if(kind==='sport'&&s.workout.id===id)throw Error('Сначала заверши текущую тренировку.');
 const removed=s[kind].filter(e=>kind==='sport'?sportMatches(e,id):e.id===id);if(!removed.length)throw Error('Запись уже удалена.');
 s[kind]=s[kind].filter(e=>!removed.includes(e));if(kind==='water')validateWater(s.water);commit(s);
 return {kind,entries:removed,revision:localStorage.getItem(KEY)};
}
function undoRemove(token){
 if(!token||localStorage.getItem(KEY)!==token.revision)throw Error('Дневник уже изменился. Эту отмену больше нельзя применить.');
 const s=fresh();s[token.kind].push(...token.entries);commit(s);
}
function saveWater({id,ml,at}){
 ml=Number(ml);at=Number(at);if(!Number.isInteger(ml)||!ml||Math.abs(ml)>6000||!Number.isFinite(at)||at<0||at>Date.now()+60000)throw Error('Проверь количество воды и время записи.');
 const s=fresh();if(id&&!s.water.some(e=>e.id===id))throw Error('Запись уже удалена.');
 const entry={id:id||uid(),date:day(at),ml,at};s.water=s.water.filter(e=>e.id!==id);s.water.push(entry);validateWater(s.water);commit(s);return entry;
}
function appendSport(s,start,end,{sessionId,type='training'}={}){
 if(!(Number.isFinite(start)&&Number.isFinite(end)&&start>0&&end>start&&end<=Date.now()+60000))return;
 if(s.sport.some(e=>e.start===start&&e.end===end))return;
 s.sport.push({id:uid(),date:day(end),start,end,ms:end-start,at:end,...(sessionId?{sessionId,type,source:'timer'}:{})});
}
function addSport(start,end){const s=fresh(),before=s.sport.length;appendSport(s,start,end);if(before!==s.sport.length)commit(s)}
function updateWorkout(finish=false){
 const s=fresh(),w=s.workout,now=Date.now();if(finish&&!w.running&&!w.elapsed)return false;
 if(w.running){appendSport(s,w.started,now,{sessionId:w.id,type:w.type});s.workout={...w,elapsed:w.elapsed+Math.max(0,now-w.started),started:0,running:false}}
 else if(!finish)s.workout={...w,id:w.id||uid(),started:now,running:true};
 if(finish)s.workout=idleWorkout(w.type);commit(s);return true;
}
function setWorkoutType(type){
 if(!Object.hasOwn(sportTypes,type))throw Error('Выбери вид тренировки.');const s=fresh();if(s.workout.running||s.workout.elapsed)throw Error('Сначала заверши текущую тренировку.');s.workout=idleWorkout(type);commit(s);
}
function saveSport({id,end,minutes,type='training',note='',effort=null}){
 end=Number(end);const ms=Math.round(Number(minutes)*60000),start=end-ms;note=String(note).trim();effort=effort===''||effort===null?null:Number(effort);
 if(!Number.isFinite(end)||!Number.isFinite(ms)||ms<=0||ms>86400000||start<0||end>Date.now()+60000||!Object.hasOwn(sportTypes,type)||note.length>200||effort!==null&&(!Number.isInteger(effort)||effort<1||effort>5))throw Error('Проверь время, длительность (до 24 ч) и вид тренировки.');
 const s=fresh(),old=s.sport.filter(e=>sportMatches(e,id));if(id&&!old.length)throw Error('Запись уже удалена.');
 if(id&&(s.workout.id===id||old.some(e=>e.sessionId===s.workout.id)))throw Error('Сначала заверши текущую тренировку.');
 const sameTime=old.length&&old.reduce((n,e)=>n+e.ms,0)===ms&&Math.max(...old.map(e=>e.end||e.at||0))===end;
 if(sameTime){for(const e of old)Object.assign(e,{type,note,effort});commit(s);return}
 const other=s.sport.filter(e=>!old.includes(e)),active=s.workout;
 if(other.some(e=>!e.legacy&&start<e.end&&end>e.start)||active.running&&start<Date.now()&&end>active.started)throw Error('На это время уже есть тренировка. Проверь записи в журнале.');
 s.sport=other;s.sport.push({id:id||uid(),date:day(end),start,end,ms,at:end,type,note,effort,source:'manual'});commit(s);
}
function allSport(includeRunning=true){
 const list=[...state.sport],w=state.workout,now=Date.now();
 if(includeRunning&&w.running&&w.started>0)list.push({id:'running',sessionId:w.id,type:w.type,start:w.started,end:now,ms:Math.max(0,now-w.started),at:now,running:true,source:'timer'});
 return list;
}
function sportFor(date,includeRunning=true){
 const from=dateAt(date).getTime(),to=dateAt(shift(date,1)).getTime();
 return allSport(includeRunning).map(e=>e.legacy?e.date===date?e:null:{...e,ms:Math.max(0,Math.min(e.end,to)-Math.max(e.start,from)),at:Math.min(e.end,to-1),date}).filter(e=>e&&e.ms>0);
}
function summary(date=day()){
 let saved=summaryCache.get(date);
 if(!saved){
  const food=state.food.filter(e=>e.date===date),sleep=state.sleep.filter(e=>e.date===date),water=state.water.filter(e=>e.date===date),sport=sportFor(date,false);
  saved={date,food:food.reduce((n,e)=>n+e.kcal,0),sleep:sleep.reduce((n,e)=>n+e.ms,0)/3600000,water:Math.max(0,water.reduce((n,e)=>n+e.ml,0))/1000,sport:sport.reduce((n,e)=>n+e.ms,0)/60000,present:{food:!!food.length,sleep:!!sleep.length,water:!!water.length,sport:!!sport.length}};
  if(summaryCache.size>=128)summaryCache.delete(summaryCache.keys().next().value);summaryCache.set(date,saved);
 }
 const {started:start,running}=state.workout;
 const active=running&&start>0?Math.max(0,Math.min(Date.now(),dateAt(shift(date,1)).getTime())-Math.max(start,dateAt(date).getTime()))/60000:0;
 return {...saved,sport:saved.sport+active,present:{...saved.present,sport:saved.present.sport||active>0}};
}
function events(date){return [
 ...state.food.filter(e=>e.date===date).map(e=>({...e,kind:'food'})),
 ...state.sleep.filter(e=>e.date===date).map(e=>({...e,kind:'sleep'})),
 ...state.water.filter(e=>e.date===date).map(e=>({...e,kind:'water'})),
 ...sportFor(date).map(e=>({...e,kind:'sport'}))
 ].sort((a,b)=>(b.at||0)-(a.at||0))}
function workouts(date=day()){
 const groups=new Map();for(const e of sportFor(date)){const id=e.sessionId||e.id;if(!groups.has(id))groups.set(id,{...e,id,kind:'sport',ms:0,segments:0});const w=groups.get(id);w.ms+=e.ms;w.segments++;w.running=!!(w.running||e.running);if(!e.legacy){w.start=Math.min(w.start,e.start);w.end=Math.max(w.end,e.end);w.at=Math.max(w.at,e.at)}}
 return [...groups.values()].sort((a,b)=>(b.at||0)-(a.at||0));
}
function workoutEntry(id){const list=allSport().filter(e=>sportMatches(e,id));if(!list.length)return null;const e=list[0];return {...e,id,ms:list.reduce((n,x)=>n+x.ms,0),end:Math.max(...list.map(x=>x.end||0)),running:list.some(x=>x.running),segments:list.length};}
function validGoals(g){return g&&Number.isInteger(g.waterMl)&&g.waterMl>=500&&g.waterMl<=6000&&Number.isInteger(g.sportMin)&&g.sportMin>=1&&g.sportMin<=600&&Number.isFinite(g.sleepHours)&&g.sleepHours>=1&&g.sleepHours<=24&&Number.isInteger(g.sleepHours*4);}
function validRoutine(r){return r&&kinds.every(k=>typeof r.enabled?.[k]==='boolean')&&Array.isArray(r.sportDays)&&r.sportDays.length<=7&&new Set(r.sportDays).size===r.sportDays.length&&r.sportDays.every(n=>Number.isInteger(n)&&n>=0&&n<=6)&&Number.isInteger(r.waterPortion)&&r.waterPortion>=50&&r.waterPortion<=1000&&(r.weekend===null||validGoals(r.weekend)&&Number.isInteger(r.weekend.foodKcal)&&r.weekend.foodKcal>=1&&r.weekend.foodKcal<=20000);}
function setGoals({waterMl,sportMin,sleepHours,foodKcal,routine}){
 const goals={waterMl:Number(waterMl),sportMin:Number(sportMin),sleepHours:Number(sleepHours)},foodGoal=Number(foodKcal);
 if(!validGoals(goals)||!Number.isInteger(foodGoal)||foodGoal<1||foodGoal>20000)throw Error('Проверь цели: вода 500–6000 мл, спорт 1–600 мин, сон 1–24 ч (шаг 15 минут), питание 1–20 000 ккал.');
 if(routine&&!validRoutine(routine))throw Error('Проверь личный режим и порцию воды (50–1000 мл).');
 const s=fresh();s.goals=goals;s.foodGoal=foodGoal;if(routine)s.routine=structuredClone(routine);commit(s);
}
function setPortion(value){const s=fresh(),n=Number(value);if(!Number.isInteger(n)||n<50||n>1000)throw Error('Порция воды — от 50 до 1000 мл.');s.routine.waterPortion=n;commit(s)}
function dailyPlan(date=day()){
 const weekday=dateAt(date).getDay(),r=state.routine,g=(weekday===0||weekday===6)&&r.weekend?r.weekend:{...state.goals,foodKcal:state.foodGoal};
 return {targets:{water:g.waterMl/1000,sport:g.sportMin,food:g.foodKcal,sleep:g.sleepHours},active:{...r.enabled,sport:r.enabled.sport&&r.sportDays.includes(weekday)},rest:r.enabled.sport&&!r.sportDays.includes(weekday)};
}
function progress(sum=summary()){
 const plan=dailyPlan(sum.date),p={};let count=0,total=0,completed=0;
 for(const k of kinds){p[k]=plan.active[k]?Math.max(0,Math.min(1,sum[k]/plan.targets[k])):null;if(p[k]!==null){count++;total+=p[k];if(p[k]>=1)completed++}}
 return {...p,home:count?total/count:null,count,completed};
}
function saveCheckin({date=day(),energy,mood,stress,note=''}){
 const values={energy:Number(energy),mood:Number(mood),stress:Number(stress)};note=String(note).trim();
 if(!validDate(date)||date>day()||date<'1970-01-01'||!Object.values(values).every(n=>Number.isInteger(n)&&n>=1&&n<=5)||note.length>200)throw Error('Оцени самочувствие от 1 до 5 и проверь дату.');
 const s=fresh(),old=s.checkins.find(e=>e.date===date),entry={id:old?.id||uid(),date,at:date===day()?Date.now():dateAt(date).getTime()+12*3600000,...values,note};
 s.checkins=s.checkins.filter(e=>e.date!==date);s.checkins.push(entry);commit(s);return entry;
}
function journalEvents(date){return [...events(date).filter(e=>e.kind!=='sport'),...workouts(date),...state.checkins.filter(e=>e.date===date).map(e=>({...e,kind:'checkins'}))].sort((a,b)=>(b.at||0)-(a.at||0))}
function goal(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>20000)throw Error('Укажи цель от 1 до 20 000 ккал.');const s=fresh();s.foodGoal=n;commit(s)}
// Backups contain only journal data. Explicit field validation keeps imports atomic.
const BACKUP_FORMAT='iris-journal',BACKUP_LIMIT=10*1024*1024;
function exportBackup(){const {workout,...journal}=fresh();return JSON.stringify({format:BACKUP_FORMAT,version:1,exportedAt:new Date().toISOString(),journal},null,2)}
function readBackup(text){
 const fail=()=>{throw Error('Файл не похож на целую резервную копию IRIS. Проверь, что выбран нужный JSON-файл.')};
 if(typeof text!=='string'||text.length>BACKUP_LIMIT)throw Error('Выбери копию размером до 10 МБ.');
 let file;try{file=JSON.parse(text)}catch{fail()}
 if(!file||file.format!==BACKUP_FORMAT||file.version!==1||file.journal?.version!==1)fail();
 const raw=file.journal,out=empty(),keys=['food','sleep','water','sport'];
 if(!keys.every(k=>Array.isArray(raw[k]))||keys.reduce((n,k)=>n+raw[k].length,0)>50000)fail();
 if(!Number.isInteger(raw.foodGoal)||raw.foodGoal<1||raw.foodGoal>20000)fail();out.foodGoal=raw.foodGoal;
 out.goals=null;if(raw.goals!==undefined){if(!validGoals(raw.goals))fail();out.goals={waterMl:raw.goals.waterMl,sportMin:raw.goals.sportMin,sleepHours:raw.goals.sleepHours}}
 out.routine=null;if(raw.routine!==undefined){if(!validRoutine(raw.routine))fail();out.routine=structuredClone(raw.routine)}
 const now=Date.now()+60000,stamp=n=>Number.isFinite(n)&&n>=0&&n<=now;
 const validId=s=>typeof s==='string'&&s.length>0&&s.length<=128&&!/[\u0000-\u001f]/.test(s);
 const foodFields=e=>typeof e.name==='string'&&e.name.trim().length>0&&e.name.length<=100&&Number.isInteger(e.kcal)&&e.kcal>=0&&e.kcal<=20000&&['Завтрак','Обед','Ужин','Перекус'].includes(e.meal);
 for(const k of keys){
  const seen=new Set();
  for(const e of raw[k]){
   if(!e||!validId(e.id)||seen.has(e.id)||!validDate(e.date)||e.date<'1970-01-01'||e.date>day())fail();seen.add(e.id);
   let entry={id:e.id,date:e.date};
   if(k==='food'){
    if(!foodFields(e)||!stamp(e.at)||day(e.at)!==e.date)fail();
    entry={...entry,name:e.name.trim(),kcal:e.kcal,meal:e.meal,at:e.at};
   }else if(k==='water'){
    if(!Number.isInteger(e.ml)||e.ml===0||Math.abs(e.ml)>6000||(!e.legacy&&(!stamp(e.at)||day(e.at)!==e.date)))fail();
    entry={...entry,ml:e.ml,at:e.legacy?null:e.at,...(e.legacy?{legacy:true}:{})};
   }else if(k==='sport'&&e.legacy){
    if(!Number.isFinite(e.ms)||e.ms<=0)fail();entry={...entry,ms:e.ms,start:null,end:null,legacy:true};
   }else{
    if(!stamp(e.start)||!stamp(e.end)||e.end<=e.start||e.ms!==e.end-e.start||day(e.end)!==e.date||(k==='sleep'&&e.ms>86400000))fail();
    entry={...entry,start:e.start,end:e.end,ms:e.ms,at:e.end};
   }
   if(k==='sleep'&&e.quality!=null){if(!Number.isInteger(e.quality)||e.quality<1||e.quality>5)fail();entry.quality=e.quality}
   if(k==='sport'){
    if(e.sessionId!==undefined){if(!validId(e.sessionId))fail();entry.sessionId=e.sessionId}
    if(e.type!==undefined){if(!Object.hasOwn(sportTypes,e.type))fail();entry.type=e.type}
    if(e.source!==undefined){if(!['timer','manual','import'].includes(e.source))fail();entry.source=e.source}
    if(e.note!==undefined){if(typeof e.note!=='string'||e.note.length>200)fail();entry.note=e.note}
    if(e.effort!=null){if(!Number.isInteger(e.effort)||e.effort<1||e.effort>5)fail();entry.effort=e.effort}
   }
   out[k].push(entry);
  }
 }
 const sleeps=[...out.sleep].sort((a,b)=>a.start-b.start);
 if(sleeps.some((e,i)=>i&&e.start<sleeps[i-1].end))fail();
 const totals=new Map();for(const e of out.water)totals.set(e.date,(totals.get(e.date)||0)+e.ml);
 if([...totals.values()].some(n=>n<0||n>6000))fail();
 if(raw.favorites!==undefined&&!Array.isArray(raw.favorites))fail();
 const favs=raw.favorites||[];if(favs.length>100)fail();
 for(const e of favs){if(!e||!validId(e.id)||!foodFields(e))fail();if(!out.favorites.some(f=>sameMeal(f,e)))out.favorites.push({id:e.id,name:e.name.trim(),kcal:e.kcal,meal:e.meal})}
 if(raw.checkins!==undefined&&!Array.isArray(raw.checkins))fail();const checkins=raw.checkins||[];if(checkins.length>50000)fail();const dates=new Set(),ids=new Set();
 for(const e of checkins){if(!e||!validId(e.id)||ids.has(e.id)||!validDate(e.date)||e.date<'1970-01-01'||e.date>day()||dates.has(e.date)||!stamp(e.at)||day(e.at)!==e.date||!['energy','mood','stress'].every(k=>Number.isInteger(e[k])&&e[k]>=1&&e[k]<=5)||typeof(e.note??'')!=='string'||(e.note||'').length>200)fail();ids.add(e.id);dates.add(e.date);out.checkins.push({id:e.id,date:e.date,at:e.at,energy:e.energy,mood:e.mood,stress:e.stress,note:e.note||''})}
 return out;
}
function previewBackup(text){
 const incoming=readBackup(text),next=fresh(),revision=localStorage.getItem(KEY),counts={added:0,duplicates:0,conflicts:0},added={food:0,sleep:0,water:0,sport:0,favorites:0,checkins:0};
 for(const k of ['food','sleep','sport']){
  const ids=new Set(next[k].map(e=>e.id));
  for(const e of incoming[k]){
   if(ids.has(e.id)){counts.duplicates++;continue}
   if(k==='sport'&&next.workout.running&&e.end>next.workout.started&&e.start<Date.now()){counts.conflicts++;continue}
   if((k==='sleep'||k==='sport')&&!e.legacy&&next[k].some(x=>!x.legacy&&e.start<x.end&&e.end>x.start)){counts.conflicts++;continue}
   next[k].push(e);ids.add(e.id);added[k]++;counts.added++;
  }
 }
 const waterIds=new Set(next.water.map(e=>e.id)),byDay=new Map();
 for(const e of incoming.water){if(waterIds.has(e.id)){counts.duplicates++;continue}if(!byDay.has(e.date))byDay.set(e.date,[]);byDay.get(e.date).push(e)}
 for(const [date,list] of byDay){
  const total=next.water.filter(e=>e.date===date).reduce((n,e)=>n+e.ml,0)+list.reduce((n,e)=>n+e.ml,0);
  if(total<0||total>6000){counts.conflicts+=list.length;continue}
  next.water.push(...list);added.water+=list.length;counts.added+=list.length;
 }
 next.water.sort((a,b)=>a.date.localeCompare(b.date)||(a.at||0)-(b.at||0));
 next.favorites||=[];
 for(const e of incoming.favorites){
  if(next.favorites.some(f=>f.id===e.id||sameMeal(f,e))){counts.duplicates++;continue}
  if(next.favorites.length>=100){counts.conflicts++;continue}
  next.favorites.push(e);added.favorites++;counts.added++;
 }
 for(const e of incoming.checkins){if(next.checkins.some(x=>x.id===e.id)){counts.duplicates++;continue}if(next.checkins.some(x=>x.date===e.date)){counts.conflicts++;continue}next.checkins.push(e);added.checkins++;counts.added++}
 return {next,revision,counts,added,foodGoal:incoming.foodGoal,goals:incoming.goals,routine:incoming.routine,empty:['food','water','sleep','sport','checkins'].every(k=>!state[k].length)};
}
function restoreBackup(text,{revision,restoreGoal=false}={}){
 const plan=previewBackup(text);
 if(revision!==undefined&&revision!==plan.revision)throw Error('Дневник изменился после просмотра копии. Выбери файл ещё раз, чтобы обновить список.');
 if(restoreGoal){plan.next.foodGoal=plan.foodGoal;if(plan.goals)plan.next.goals=plan.goals;if(plan.routine)plan.next.routine=plan.routine}
 commit(plan.next);return plan.counts;
}
window.IRISData={day,shift,validDate,summary,events,journalEvents,changeWater,undoWater,saveWater,saveFood,saveSleep,saveSport,saveCheckin,remove,undoRemove,removeFavorite,addSport,goal,setGoals,setPortion,dailyPlan,progress,workouts,workoutEntry,updateWorkout,setWorkoutType,sportTypes,exportBackup,previewBackup,restoreBackup,get goals(){return {...state.goals,foodKcal:state.foodGoal}},get routine(){return structuredClone(state.routine)},get workout(){return {...state.workout}},get foodGoal(){return state.foodGoal},get error(){return loadError?.message},get entries(){return structuredClone(state)}};
addEventListener('storage',e=>{if(e.key===KEY){try{state=load()||empty();summaryCache.clear();loadError=null;mirrorWater();mirrorPreferences();dispatchEvent(new CustomEvent('iris:data'))}catch(error){loadError=error}}});
let currentDay=day(),dayTimer=0;
function checkDay(){
 clearTimeout(dayTimer);dayTimer=0;if(document.hidden)return;
 const today=day();if(currentDay!==today){currentDay=today;mirrorWater();dispatchEvent(new CustomEvent('iris:data'))}
 const next=new Date();next.setHours(24,0,0,0);
 dayTimer=setTimeout(checkDay,Math.max(1000,next.getTime()-Date.now()+50));
}
document.addEventListener('visibilitychange',checkDay);addEventListener('pageshow',checkDay);checkDay();
})();
