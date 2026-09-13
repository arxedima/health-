(()=>{
'use strict';
const KEY='irisJournalV39';
const day=(value=new Date())=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const dateAt=(date)=>new Date(date+'T00:00:00');
const shift=(date,n)=>{const d=dateAt(date);d.setDate(d.getDate()+n);return day(d)};
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&day(dateAt(value))===value;
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const empty=()=>({version:1,food:[],sleep:[],water:[],sport:[],favorites:[],foodGoal:2100});
function load(){
 const raw=localStorage.getItem(KEY);if(!raw)return null;
 const s=JSON.parse(raw);
 if(s.version!==1||!['food','sleep','water','sport'].every(k=>Array.isArray(s[k])))throw Error('Не удалось прочитать дневник. Записи сохранены на устройстве.');
 return s;
}
let state,loadError=null;const summaryCache=new Map();
try{state=load()}catch(e){loadError=e;state=empty()}
function commit(next){
 if(loadError)throw loadError;
 try{localStorage.setItem(KEY,JSON.stringify(next))}catch{throw Error('Не удалось сохранить запись. Освободи немного места на устройстве и попробуй ещё раз.')}
 state=next;summaryCache.clear();mirrorWater();window.dispatchEvent(new CustomEvent('iris:data'));
}
function fresh(){if(loadError)throw loadError;const s=load();if(s)state=s;return structuredClone(state)}
function waterTotal(date=day()){return Math.max(0,state.water.filter(e=>e.date===date).reduce((n,e)=>n+e.ml,0))}
function mirrorWater(){try{localStorage.setItem('irisWaterDateV24',day());localStorage.setItem('irisWaterMl',String(waterTotal()))}catch{}}
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
}else if(!loadError)mirrorWater();
function changeWater(delta){
 if(!Number.isFinite(delta))throw Error('Не удалось изменить количество воды.');
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
 if(!Number.isFinite(at)||at>Date.now()+60000)throw Error('Выбери время, которое уже наступило.');
 if(!['Завтрак','Обед','Ужин','Перекус'].includes(meal))throw Error('Выбери приём пищи.');
 const s=fresh(),entry={id:id||uid(),name,kcal:Math.round(kcal),meal,at,date:day(at)};
 if(id&&!s.food.some(e=>e.id===id))throw Error('Эта запись уже удалена.');
 s.food=s.food.filter(e=>e.id!==id);s.food.push(entry);
 if(favorite){s.favorites||=[];if(!s.favorites.some(e=>sameMeal(e,entry))){if(s.favorites.length>=100)throw Error('В избранном уже 100 блюд. Удали ненужное и попробуй снова.');s.favorites.push({id:uid(),name:entry.name,kcal:entry.kcal,meal:entry.meal})}}
 commit(s);return entry;
}
function removeFavorite(id){const s=fresh();s.favorites=(s.favorites||[]).filter(e=>e.id!==id);commit(s)}
function saveSleep({id,start,end}){
 start=Number(start);end=Number(end);const duration=end-start;
 if(!Number.isFinite(duration)||duration<=0||duration>24*3600000||end>Date.now()+60000)throw Error('Проверь время сна: пробуждение должно быть позже засыпания, продолжительность — до 24 часов.');
 const s=fresh();
 if(s.sleep.some(e=>e.id!==id&&start<e.end&&end>e.start))throw Error('На это время уже есть запись сна. Открой её, чтобы исправить.');
 const entry={id:id||uid(),date:day(end),at:end,start,end,ms:duration};
 if(id&&!s.sleep.some(e=>e.id===id))throw Error('Эта запись уже удалена.');
 s.sleep=s.sleep.filter(e=>e.id!==id);s.sleep.push(entry);commit(s);return entry;
}
function remove(kind,id){if(!['food','sleep'].includes(kind))return;const s=fresh();s[kind]=s[kind].filter(e=>e.id!==id);commit(s)}
function addSport(start,end){
 if(!(start>0&&end>start))return;
 const s=fresh();if(s.sport.some(e=>e.start===start&&e.end===end))return;
 s.sport.push({id:uid(),date:day(end),start,end,ms:end-start,at:end});commit(s);
}
function allSport(includeRunning=true){
 const list=[...state.sport],start=Number(localStorage.getItem('irisSportStartedV11'));
 if(includeRunning&&localStorage.getItem('irisSportRunningV11')==='1'&&start>0)list.push({id:'running',start,end:Date.now(),ms:Date.now()-start,at:Date.now(),running:true});
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
 const start=Number(localStorage.getItem('irisSportStartedV11'));
 const active=localStorage.getItem('irisSportRunningV11')==='1'&&start>0?Math.max(0,Math.min(Date.now(),dateAt(shift(date,1)).getTime())-Math.max(start,dateAt(date).getTime()))/60000:0;
 return {...saved,sport:saved.sport+active,present:{...saved.present,sport:saved.present.sport||active>0}};
}
function events(date){return [
 ...state.food.filter(e=>e.date===date).map(e=>({...e,kind:'food'})),
 ...state.sleep.filter(e=>e.date===date).map(e=>({...e,kind:'sleep'})),
 ...state.water.filter(e=>e.date===date).map(e=>({...e,kind:'water'})),
 ...sportFor(date).map(e=>({...e,kind:'sport'}))
 ].sort((a,b)=>(b.at||0)-(a.at||0))}
function goal(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>20000)throw Error('Укажи цель от 1 до 20 000 ккал.');const s=fresh();s.foodGoal=n;commit(s)}
// Backups contain only journal data. Explicit field validation keeps imports atomic.
const BACKUP_FORMAT='iris-journal',BACKUP_LIMIT=10*1024*1024;
function exportBackup(){return JSON.stringify({format:BACKUP_FORMAT,version:1,exportedAt:new Date().toISOString(),journal:fresh()},null,2)}
function readBackup(text){
 const fail=()=>{throw Error('Файл не похож на целую резервную копию IRIS. Проверь, что выбран нужный JSON-файл.')};
 if(typeof text!=='string'||text.length>BACKUP_LIMIT)throw Error('Выбери копию размером до 10 МБ.');
 let file;try{file=JSON.parse(text)}catch{fail()}
 if(!file||file.format!==BACKUP_FORMAT||file.version!==1||file.journal?.version!==1)fail();
 const raw=file.journal,out=empty(),keys=['food','sleep','water','sport'];
 if(!keys.every(k=>Array.isArray(raw[k]))||keys.reduce((n,k)=>n+raw[k].length,0)>50000)fail();
 if(!Number.isInteger(raw.foodGoal)||raw.foodGoal<1||raw.foodGoal>20000)fail();out.foodGoal=raw.foodGoal;
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
 return out;
}
function previewBackup(text){
 const incoming=readBackup(text),next=fresh(),revision=localStorage.getItem(KEY),counts={added:0,duplicates:0,conflicts:0},added={food:0,sleep:0,water:0,sport:0,favorites:0};
 for(const k of ['food','sleep','sport']){
  const ids=new Set(next[k].map(e=>e.id));
  for(const e of incoming[k]){
   if(ids.has(e.id)){counts.duplicates++;continue}
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
 return {next,revision,counts,added,foodGoal:incoming.foodGoal,empty:['food','water','sleep','sport'].every(k=>!state[k].length)};
}
function restoreBackup(text,{revision,restoreGoal=false}={}){
 const plan=previewBackup(text);
 if(revision!==undefined&&revision!==plan.revision)throw Error('Дневник изменился после просмотра копии. Выбери файл ещё раз, чтобы обновить список.');
 if(restoreGoal)plan.next.foodGoal=plan.foodGoal;
 commit(plan.next);return plan.counts;
}
window.IRISData={day,shift,validDate,summary,events,changeWater,undoWater,saveFood,saveSleep,remove,removeFavorite,addSport,goal,exportBackup,previewBackup,restoreBackup,get foodGoal(){return state.foodGoal},get error(){return loadError?.message},get entries(){return structuredClone(state)}};
addEventListener('storage',e=>{if(e.key===KEY){try{state=load()||empty();summaryCache.clear();loadError=null;mirrorWater();dispatchEvent(new CustomEvent('iris:data'))}catch(error){loadError=error}}});
let currentDay=day(),dayTimer=0;
function checkDay(){
 clearTimeout(dayTimer);dayTimer=0;if(document.hidden)return;
 const today=day();if(currentDay!==today){currentDay=today;mirrorWater();dispatchEvent(new CustomEvent('iris:data'))}
 const next=new Date();next.setHours(24,0,0,0);
 dayTimer=setTimeout(checkDay,Math.max(1000,next.getTime()-Date.now()+50));
}
document.addEventListener('visibilitychange',checkDay);addEventListener('pageshow',checkDay);checkDay();
})();
