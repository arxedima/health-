import {dateKey,today} from './nova-store.js';

export const monthName=(d=new Date())=>new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(d).replace(/^./,s=>s.toUpperCase());
export const fullDate=(d=new Date())=>new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(d).replace(/^./,s=>s.toUpperCase());

export function dayPlan(state,date=new Date()){
  const {log}=today(state,date);
  const p=log.plan||{};
  return [
    {id:'water',time:'08:00',title:'Стакан воды',subtitle:'Мягкий старт дня',done:log.water>=2||p.water},
    {id:'breakfast',time:'09:00',title:'Завтрак',subtitle:'Добавить приём пищи',done:Boolean(p.breakfast)},
    {id:'work',time:'12:00',title:'Фокус',subtitle:'25 минут без отвлечений',done:log.focus>=25||p.work},
    {id:'lunch',time:'13:00',title:'Обед',subtitle:'Сбалансированный приём пищи',done:Boolean(p.lunch)},
    {id:'walk',time:'16:00',title:'Прогулка',subtitle:'10 минут спокойного темпа',done:Boolean(p.walk)},
    {id:'move',time:'19:00',title:'Тренировка',subtitle:'Сегодняшнее движение',done:log.moveMinutes>=10||p.move},
    {id:'read',time:'21:00',title:'Чтение',subtitle:'Спокойное переключение',done:Boolean(p.read)},
    {id:'sleep',time:'22:30',title:'Сон',subtitle:'Подготовка ко сну',done:log.sleep>=7||p.sleep}
  ];
}

export function metrics(state,date=new Date()){
  const {log,meals}=today(state,date);
  const kcal=meals.reduce((s,m)=>s+(Number(m.kcal)||0),0);
  const protein=meals.reduce((s,m)=>s+(Number(m.protein)||0),0);
  const fat=meals.reduce((s,m)=>s+(Number(m.fat)||0),0);
  const carbs=meals.reduce((s,m)=>s+(Number(m.carbs)||0),0);
  return {
    movement:{done:Math.min(3,Math.round((Number(log.moveMinutes)||0)/10)),target:3},
    food:{done:Math.min(8,meals.length),target:8},
    water:{done:Math.min(8,Number(log.water)||0),target:8},
    sleep:{done:Math.min(8,Math.round(Number(log.sleep)||0)),target:8},
    steps:Number(log.steps)||0,
    minutes:Number(log.moveMinutes)||0,
    moveKcal:Number(log.moveKcal)||0,
    kcal,protein,fat,carbs
  };
}

export function overallProgress(state,date=new Date()){
  const m=metrics(state,date);
  const parts=[m.movement.done/m.movement.target,m.food.done/Math.max(1,m.food.target/2),m.water.done/m.water.target,m.sleep.done/m.sleep.target];
  return Math.max(0,Math.min(1,parts.reduce((a,b)=>a+Math.min(1,b),0)/parts.length));
}

export function monthRhythm(state,date=new Date()){
  const year=date.getFullYear(),month=date.getMonth(),days=new Date(year,month+1,0).getDate(),todayN=date.getDate();
  const out=[];
  for(let d=1;d<=days;d++){
    const dt=new Date(year,month,d),key=dateKey(dt),log=state.daily[key]||{},meals=state.meals[key]||[];
    let score=0;
    if((log.water||0)>=4)score++;
    if((log.moveMinutes||0)>=10)score++;
    if((log.sleep||0)>=7)score++;
    if(meals.length>=2)score++;
    let status='neutral';
    if(d<=todayN&&score>=1)status='partial';
    if(d<=todayN&&score>=3)status='good';
    out.push({day:d,status,today:d===todayN});
  }
  return out;
}

export function weeklyBars(state,date=new Date()){
  const labels=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const start=new Date(date);const shift=(date.getDay()+6)%7;start.setDate(date.getDate()-shift);
  return labels.map((label,i)=>{
    const d=new Date(start);d.setDate(start.getDate()+i);
    const p=overallProgress(state,d);
    return {label,value:Math.round(p*100),active:dateKey(d)===dateKey(date)};
  });
}

export function greeting(date=new Date()){
  const h=date.getHours();
  if(h<11)return['Доброе утро','Пора сделать первый шаг.'];
  if(h<17)return['Добрый день','Держим хороший ритм.'];
  if(h<22)return['Спокойный вечер','Хороший день. Время восстановиться.'];
  return['Спокойной ночи','Сегодня уже достаточно.'];
}

export function dailyTip(state,date=new Date()){
  const m=metrics(state,date),h=date.getHours();
  if(m.water.done<2)return{icon:'💧',title:'Стакан воды',text:'Небольшой шаг, который легко выполнить прямо сейчас.'};
  if(m.movement.done===0&&h>14)return{icon:'🏃',title:'10 минут движения',text:'Короткая прогулка или мягкая тренировка поддержит ритм.'};
  if(m.food.done<2&&h>13)return{icon:'🍎',title:'Добавь приём пищи',text:'Сделай следующий приём пищи простым и сбалансированным.'};
  return{icon:'🌙',title:'Снизь темп',text:'Оставь немного времени на спокойное завершение дня.'};
}