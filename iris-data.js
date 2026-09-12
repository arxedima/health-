(()=>{
'use strict';
const KEY='irisJournalV39';
const day=(value=new Date())=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const dateAt=(date)=>new Date(date+'T00:00:00');
const shift=(date,n)=>{const d=dateAt(date);d.setDate(d.getDate()+n);return day(d)};
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&day(dateAt(value))===value;
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const empty=()=>({version:1,food:[],sleep:[],water:[],sport:[],foodGoal:2100});
function load(){
 const raw=localStorage.getItem(KEY);if(!raw)return null;
 const s=JSON.parse(raw);
 if(s.version!==1||!['food','sleep','water','sport'].every(k=>Array.isArray(s[k])))throw Error('Не удалось прочитать дневник. Записи сохранены на устройстве.');
 return s;
}
let state,loadError=null;
try{state=load()}catch(e){loadError=e;state=empty()}
function commit(next){
 if(loadError)throw loadError;
 try{localStorage.setItem(KEY,JSON.stringify(next))}catch{throw Error('Не удалось сохранить запись. Освободи немного места на устройстве и попробуй ещё раз.')}
 state=next;mirrorWater();window.dispatchEvent(new CustomEvent('iris:data'));
}
function fresh(){if(loadError)throw loadError;const s=load();if(s)state=s;return structuredClone(state)}
function waterTotal(date=day()){return Math.max(0,state.water.filter(e=>e.date===date).reduce((n,e)=>n+e.ml,0))}
function mirrorWater(){localStorage.setItem('irisWaterDateV24',day());localStorage.setItem('irisWaterMl',String(waterTotal()))}
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
 const s=fresh(),date=day();
 const total=Math.max(0,s.water.filter(e=>e.date===date).reduce((n,e)=>n+e.ml,0));
 const value=Math.max(0,Math.min(6000,total+delta)),ml=value-total;
 if(ml)s.water.push({id:uid(),date,ml,at:Date.now()});
 commit(s);return value;
}
function saveFood({id,name,kcal,meal,at}){
 name=String(name||'').trim();kcal=Number(kcal);at=Number(at);
 if(!name||name.length>100)throw Error('Напиши название блюда — до 100 символов.');
 if(!Number.isFinite(kcal)||kcal<0||kcal>20000)throw Error('Укажи калории от 0 до 20 000.');
 if(!Number.isFinite(at)||at>Date.now()+60000)throw Error('Выбери время, которое уже наступило.');
 if(!['Завтрак','Обед','Ужин','Перекус'].includes(meal))throw Error('Выбери приём пищи.');
 const s=fresh(),entry={id:id||uid(),name,kcal:Math.round(kcal),meal,at,date:day(at)};
 if(id&&!s.food.some(e=>e.id===id))throw Error('Эта запись уже удалена.');
 s.food=s.food.filter(e=>e.id!==id);s.food.push(entry);commit(s);return entry;
}
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
function allSport(){
 const list=[...state.sport],start=Number(localStorage.getItem('irisSportStartedV11'));
 if(localStorage.getItem('irisSportRunningV11')==='1'&&start>0)list.push({id:'running',start,end:Date.now(),ms:Date.now()-start,at:Date.now(),running:true});
 return list;
}
function sportFor(date){
 const from=dateAt(date).getTime(),to=dateAt(shift(date,1)).getTime();
 return allSport().map(e=>e.legacy?e.date===date?e:null:{...e,ms:Math.max(0,Math.min(e.end,to)-Math.max(e.start,from)),at:Math.min(e.end,to-1),date}).filter(e=>e&&e.ms>0);
}
function summary(date=day()){
 const food=state.food.filter(e=>e.date===date),sleep=state.sleep.filter(e=>e.date===date),water=state.water.filter(e=>e.date===date),sport=sportFor(date);
 return{date,food:food.reduce((n,e)=>n+e.kcal,0),sleep:sleep.reduce((n,e)=>n+e.ms,0)/3600000,water:Math.max(0,water.reduce((n,e)=>n+e.ml,0))/1000,sport:sport.reduce((n,e)=>n+e.ms,0)/60000,present:{food:!!food.length,sleep:!!sleep.length,water:!!water.length,sport:!!sport.length}};
}
function events(date){return [
 ...state.food.filter(e=>e.date===date).map(e=>({...e,kind:'food'})),
 ...state.sleep.filter(e=>e.date===date).map(e=>({...e,kind:'sleep'})),
 ...state.water.filter(e=>e.date===date).map(e=>({...e,kind:'water'})),
 ...sportFor(date).map(e=>({...e,kind:'sport'}))
 ].sort((a,b)=>(b.at||0)-(a.at||0))}
function goal(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>20000)throw Error('Укажи цель от 1 до 20 000 ккал.');const s=fresh();s.foodGoal=n;commit(s)}
window.IRISData={day,shift,validDate,summary,events,changeWater,saveFood,saveSleep,remove,addSport,goal,get foodGoal(){return state.foodGoal},get error(){return loadError?.message},get entries(){return structuredClone(state)}};
addEventListener('storage',e=>{if(e.key===KEY){try{state=load()||empty();loadError=null;mirrorWater();dispatchEvent(new CustomEvent('iris:data'))}catch(error){loadError=error}}});
let currentDay=day();
setInterval(()=>{if(currentDay!==day()){currentDay=day();mirrorWater();dispatchEvent(new CustomEvent('iris:data'))}},15000);
})();
