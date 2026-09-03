import { todayKey } from './vector-store.js';

export function period(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}
export function minutesNow(date = new Date()) { return date.getHours()*60 + date.getMinutes(); }
export function fmtTime(mins) { const m=((mins%1440)+1440)%1440; return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; }
function dayLog(state,date=todayKey()){ state.dailyLogs[date]=state.dailyLogs[date]||{}; state.dailyLogs[date].actions=state.dailyLogs[date].actions||{}; return state.dailyLogs[date]; }
function actionStats(state,id){ state.behavior.actions[id]=state.behavior.actions[id]||{offered:0,completed:0,skipped:0}; return state.behavior.actions[id]; }
function hourStats(state,id,hour){ const key=`${id}:${hour}`; state.behavior.hours[key]=state.behavior.hours[key]||{offered:0,completed:0,skipped:0}; return state.behavior.hours[key]; }
function doseStats(state,minutes){ const key=String(minutes); state.behavior.dose[key]=state.behavior.dose[key]||{offered:0,completed:0,skipped:0}; return state.behavior.dose[key]; }
export function chooseMoveDose(state){
  const today=dayLog(state); const wellbeing=Number(today.energy||3); const options=[2,4,8,12,24];
  const history=options.map(minutes=>{const s=state.behavior.dose[String(minutes)]||{offered:0,completed:0,skipped:0};const attempts=s.completed+s.skipped;return{minutes,attempts,rate:attempts?s.completed/attempts:null};});
  const proven=history.filter(x=>x.attempts>=2&&x.rate>=.65).sort((a,b)=>a.minutes-b.minutes)[0];
  let dose=proven?.minutes||(wellbeing<=2?4:wellbeing===3?8:12); const p=period(); if(p==='evening')dose=Math.min(dose,8); if(p==='night')dose=Math.min(dose,4); return dose;
}
export function bestHourFor(state,id,fallback=18){const candidates=[];for(let h=6;h<=22;h++){const s=state.behavior.hours[`${id}:${h}`];if(!s)continue;const attempts=s.completed+s.skipped;if(attempts>=2)candidates.push({h,rate:s.completed/attempts,attempts});}candidates.sort((a,b)=>b.rate-a.rate||b.attempts-a.attempts);return candidates[0]?.rate>=.6?candidates[0].h:fallback;}
export function getTodayData(state,date=todayKey()){const daily=state.dailyLogs[date]||{};const food=state.foodLogs[date]||[];const actions=daily.actions||{};const kcal=food.reduce((s,x)=>s+(Number(x.kcal)||0),0);const protein=food.reduce((s,x)=>s+(Number(x.protein)||0),0);const fat=food.reduce((s,x)=>s+(Number(x.fat)||0),0);const carbs=food.reduce((s,x)=>s+(Number(x.carbs)||0),0);return{daily,food,actions,kcal,protein,fat,carbs,water:Number(daily.water)||0,steps:Number(daily.steps)||0,sleep:Number(daily.sleep)||0,energy:Number(daily.energy)||3};}
export function buildRoute(state,date=new Date()){
  const key=todayKey(date),data=getTodayData(state,key),moveDose=chooseMoveDose(state),moveHour=bestHourFor(state,'move',10);
  const base=[
    {id:'water',at:8*60+30,label:'Вода',detail:'≈ 200 мл',icon:'drop'},
    {id:'move',at:moveHour*60,label:`Движение · ${moveDose} мин`,detail:'Minimal dose',icon:'pulse',dose:moveDose},
    {id:'meal',at:13*60,label:'Еда · следующий приём',detail:'Фото или запись',icon:'food'},
    {id:'walk',at:14*60,label:'Прогулка',detail:'7–8 минут',icon:'walk',dose:8},
    {id:'focus',at:16*60,label:'Фокус-сессия',detail:'10 минут',icon:'focus',dose:10},
    {id:'relax',at:21*60+30,label:'Расслабление',detail:'4 минуты',icon:'moon',dose:4},
    {id:'sleep',at:23*60,label:'Сон',detail:'Завершение дня',icon:'sleep'}
  ];
  const skippedMove=data.actions.move?.status==='skipped'; if(skippedMove&&!data.actions.microMove)base.splice(5,0,{id:'microMove',at:19*60+30,label:'Движение · 5 мин',detail:'Маршрут перестроен',icon:'pulse',dose:5,recalculated:true});
  return base.map(x=>({...x,status:data.actions[x.id]?.status||(x.id==='water'&&data.water>=.2?'done':'pending')}));
}
export function nextAction(state,date=new Date()){
  const p=period(date),now=minutesNow(date),route=buildRoute(state,date),data=getTodayData(state);
  if(p==='night'&&now>=23*60)return{id:'closeDay',kind:'rest',title:'Сегодня больше ничего делать не нужно.',detail:'Остальное завтра.',button:'Завершить день',calm:true};
  if(data.water<.2&&now<12*60)return{id:'water',kind:'water',title:'Выпей стакан воды',detail:'≈ 200 мл',button:'Готово'};
  const due=route.find(x=>x.status==='pending'&&x.at<=now+35);
  if(due){
    if(due.id==='move'||due.id==='microMove')return{id:due.id,kind:'move',title:`Сегодня хватит ${due.dose} минут`,detail:due.recalculated?'VECTOR перестроил нагрузку под твой день.':'Минимально достаточная нагрузка прямо сейчас.',button:`Начать ${due.dose} минут`,dose:due.dose};
    if(due.id==='meal')return{id:'meal',kind:'food',title:'Сфотографируй еду',detail:'Я сначала скажу главное, цифры будут ниже.',button:'Открыть камеру'};
    if(due.id==='walk')return{id:'walk',kind:'walk',title:'Пройдись 7 минут',detail:'Небольшой шаг после еды.',button:'Начать 7 минут',dose:7};
    if(due.id==='focus')return{id:'focus',kind:'focus',title:'10 минут без отвлечений',detail:'Одна короткая фокус-сессия.',button:'Запустить таймер',dose:10};
    if(due.id==='relax')return{id:'relax',kind:'relax',title:'Снизь темп на 4 минуты',detail:'Спокойное дыхание и меньше света.',button:'Начать',dose:4};
    if(due.id==='sleep')return{id:'sleep',kind:'sleep',title:'Пора завершать день',detail:'Сегодня уже достаточно.',button:'Завершить день'};
  }
  return{id:'silence',kind:'silence',title:'Сейчас ничего делать не нужно.',detail:'VECTOR молчит, когда действие не принесёт пользы.',button:'Всё нормально',calm:true};
}
export function markOffered(state,action,date=new Date()){if(!action||['silence','closeDay'].includes(action.id))return state;const log=dayLog(state);if(log.actions[action.id]?.offered)return state;log.actions[action.id]={...(log.actions[action.id]||{}),offered:true,offeredAt:Date.now(),status:log.actions[action.id]?.status||'pending',dose:action.dose||null};actionStats(state,action.kind||action.id).offered++;hourStats(state,action.kind||action.id,date.getHours()).offered++;if(action.dose)doseStats(state,action.dose).offered++;return state;}
export function completeAction(state,action,meta={}){const log=dayLog(state);log.actions[action.id]={...(log.actions[action.id]||{}),status:'done',doneAt:Date.now(),dose:action.dose||meta.dose||null};if(action.id==='water')log.water=Math.round(((Number(log.water)||0)+.2)*100)/100;const id=action.kind||action.id;actionStats(state,id).completed++;hourStats(state,id,new Date().getHours()).completed++;if(action.dose)doseStats(state,action.dose).completed++;if(action.id==='walk'){const ex=state.behavior.experiments.postMealWalk;ex.offered=(ex.offered||0)+1;ex.completed=(ex.completed||0)+1;}state.routeEvents.push({type:'complete',action:action.id,at:Date.now(),date:todayKey()});return state;}
export function skipAction(state,action){const log=dayLog(state);log.actions[action.id]={...(log.actions[action.id]||{}),status:'skipped',skippedAt:Date.now(),dose:action.dose||null};const id=action.kind||action.id;actionStats(state,id).skipped++;hourStats(state,id,new Date().getHours()).skipped++;if(action.dose)doseStats(state,action.dose).skipped++;state.routeEvents.push({type:'recalculated',action:action.id,at:Date.now(),date:todayKey(),message:'Маршрут перестроен'});return state;}
export function addWater(state,amount=.2){const log=dayLog(state);log.water=Math.round(((Number(log.water)||0)+amount)*100)/100;log.actions.water={...(log.actions.water||{}),status:'done',doneAt:Date.now()};return state;}
export function setFeeling(state,energy){const log=dayLog(state);log.energy=Number(energy);return state;}
export function momentum(state){let weighted=0,total=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const data=getTodayData(state,todayKey(d));const weight=7-i,done=Object.values(data.actions).filter(a=>a?.status==='done').length,possible=Math.max(1,Object.values(data.actions).filter(Boolean).length||3);weighted+=Math.min(1,done/possible)*weight;total+=weight;}return Math.round(weighted/total*100);}
export function stateSphere(state){const d=getTodayData(state),p=period(),m=momentum(state);const load=Math.min(100,(d.steps/8000)*45+(d.actions.move?.status==='done'?35:0)+(d.actions.walk?.status==='done'?20:0));const recovery=Math.max(25,Math.min(100,(d.sleep?d.sleep/8*65:45)+(p==='night'?15:0)+(d.energy-3)*8));let mood='steady';if(p==='night')mood='sleepy';else if(recovery<45)mood='soft';else if(load>70)mood='charged';return{mood,momentum:m,recovery:Math.round(recovery),load:Math.round(load),data:d};}
export function latestRecalculation(state){const today=todayKey();return[...state.routeEvents].reverse().find(e=>e.date===today&&e.type==='recalculated')||null;}
