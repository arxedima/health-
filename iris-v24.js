(()=>{
'use strict';
const app=document.getElementById('app');
const stage=document.getElementById('stage');
const metricLabel=document.getElementById('metricLabel');
const metricValue=document.getElementById('metricValue');
const metricCaption=document.getElementById('metricCaption');
if(!app||!stage||!metricLabel||!metricValue||!metricCaption||document.getElementById('irisV24Data'))return;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const today=localDay();
const DAY_KEY='irisWaterDateV24';
if(localStorage.getItem(DAY_KEY)!==today){
  localStorage.setItem(DAY_KEY,today);
  localStorage.setItem('irisWaterMl','0');
}
if(!localStorage.getItem('irisWaterGoalMl'))localStorage.setItem('irisWaterGoalMl','2000');
if(!localStorage.getItem('irisSportGoalMinV24'))localStorage.setItem('irisSportGoalMinV24','30');

const dataCanvas=document.createElement('canvas');
dataCanvas.id='irisV24Data';
dataCanvas.setAttribute('aria-hidden','true');
const orbit=document.getElementById('irisOrbitV23');
if(orbit&&orbit.parentNode===stage)stage.insertBefore(dataCanvas,orbit);else stage.appendChild(dataCanvas);
const ctx=dataCanvas.getContext('2d',{alpha:true});
let W=0,H=0,D=1;
function resize(){
  D=Math.min(2,window.devicePixelRatio||1);W=stage.clientWidth;H=stage.clientHeight;
  dataCanvas.width=Math.max(1,Math.floor(W*D));dataCanvas.height=Math.max(1,Math.floor(H*D));
  dataCanvas.style.width=W+'px';dataCanvas.style.height=H+'px';ctx.setTransform(D,0,0,D,0,0);
}
function vars(){
  const s=getComputedStyle(document.documentElement);
  const raw=(s.getPropertyValue('--accent')||'198 220 237').trim().split(/\s+/).map(Number);
  return{
    x:parseFloat(s.getPropertyValue('--eye-x'))||W/2,
    y:parseFloat(s.getPropertyValue('--eye-y'))||H*.435,
    r:parseFloat(s.getPropertyValue('--eye-r'))||Math.min(W*.34,H*.178,174),
    c:[raw[0]||198,raw[1]||220,raw[2]||237]
  };
}
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
function mode(){for(const m of ['home','sport','water','food','sleep','insights'])if(app.classList.contains('mode-'+m))return m;return'home'}
function waterState(){
  const ml=clamp(parseInt(localStorage.getItem('irisWaterMl')||'0',10)||0,0,6000);
  const goal=clamp(parseInt(localStorage.getItem('irisWaterGoalMl')||'2000',10)||2000,500,6000);
  return{ml,goal,p:clamp(ml/goal,0,1)};
}
function sportNow(){
  let elapsed=Math.max(0,+localStorage.getItem('irisSportElapsedV11')||0);
  const running=localStorage.getItem('irisSportRunningV11')==='1';
  const started=+localStorage.getItem('irisSportStartedV11')||0;
  if(running&&started)elapsed+=Math.max(0,Date.now()-started);
  return{ms:elapsed,running};
}
function sportTodayMs(){
  let total=sportNow().ms;
  try{
    const h=JSON.parse(localStorage.getItem('irisSportHistoryV11')||'[]');
    const d=new Date();d.setHours(0,0,0,0);
    if(Array.isArray(h))for(const x of h)if(x&&x.t>=d.getTime())total+=Math.max(0,+x.ms||0);
  }catch{}
  return total;
}
function score(){
  const water=waterState().p;
  const goalMin=clamp(+localStorage.getItem('irisSportGoalMinV24')||30,10,180);
  const sport=clamp(sportTodayMs()/(goalMin*60000),0,1);
  return{value:Math.round((water*.55+sport*.45)*100),water,sport,goalMin};
}
function fmtMin(ms){const m=Math.floor(ms/60000);return `${m} МИН`}

const controls=document.createElement('div');
controls.className='v24-sport';
controls.innerHTML='<button class="main" type="button">СТАРТ</button><button class="reset" type="button">СБРОС</button>';
document.getElementById('metric').appendChild(controls);
const startBtn=controls.querySelector('.main');
const resetBtn=controls.querySelector('.reset');
function legacyButton(sel){return document.querySelector(sel)}
startBtn.addEventListener('click',e=>{e.stopPropagation();legacyButton('.v11-panel .v11-btn.main')?.click()});
resetBtn.addEventListener('click',e=>{e.stopPropagation();legacyButton('.v11-panel .v11-btn.ghost')?.click()});

function syncSportControls(){
  const s=sportNow();
  startBtn.textContent=s.running?'ПАУЗА':s.ms>0?'ПРОДОЛЖИТЬ':'СТАРТ';
  startBtn.classList.toggle('running',s.running);
  resetBtn.style.opacity=s.ms>0?'1':'.45';
}
function syncMetrics(){
  const m=mode();
  if(m==='home'){
    const sc=score(),w=Math.round(sc.water*100),sm=Math.floor(sportTodayMs()/60000);
    metricLabel.textContent='IRIS';
    metricValue.textContent=String(sc.value);
    metricCaption.textContent=`ВОДА ${w}% · СПОРТ ${sm}/${sc.goalMin} МИН`;
  }else if(m==='sport'){
    const s=sportNow();
    metricLabel.textContent='СПОРТ';
    const sec=Math.floor(s.ms/1000),min=Math.floor(sec/60),ss=sec%60,h=Math.floor(min/60),mm=min%60;
    metricValue.textContent=h?`${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    metricCaption.textContent=s.running?'ТРЕНИРОВКА ИДЁТ · ЗРАЧОК — ПАУЗА':s.ms>0?'ПАУЗА · ЗРАЧОК — ПРОДОЛЖИТЬ':'ЗРАЧОК — СТАРТ';
  }else if(m==='insights'){
    const stats=[...document.querySelectorAll('.insight-stats > div')];
    const sc=score(),w=waterState();
    if(stats[0]){stats[0].querySelector('strong').textContent=String(sc.value);stats[0].querySelector('span').textContent='IRIS'}
    if(stats[1]){stats[1].querySelector('strong').textContent=Math.round(w.p*100)+'%';stats[1].querySelector('span').textContent='Вода'}
    if(stats[2]){stats[2].querySelector('strong').textContent=fmtMin(sportTodayMs());stats[2].querySelector('span').textContent='Спорт'}
  }
  syncSportControls();
}

const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function draw(t){
 if(reducedMotion.matches)t=0;
  ctx.clearRect(0,0,W,H);
  const m=mode(),v=vars();
  ctx.save();ctx.globalCompositeOperation='screen';
  if(m==='sport'){
    const goalMin=clamp(+localStorage.getItem('irisSportGoalMinV24')||30,10,180);
    const p=clamp(sportTodayMs()/(goalMin*60000),0,1);
    const r=v.r*1.026,start=-Math.PI*.76;
    ctx.beginPath();ctx.arc(v.x,v.y,r,0,Math.PI*2);ctx.strokeStyle=rgba(v.c,.07);ctx.lineWidth=.7;ctx.stroke();
    if(p>0){
      ctx.beginPath();ctx.arc(v.x,v.y,r,start,start+Math.PI*2*p);ctx.strokeStyle=rgba(v.c,.58);ctx.lineWidth=1.65;ctx.lineCap='round';ctx.stroke();
      const a=start+Math.PI*2*p,dx=v.x+Math.cos(a)*r,dy=v.y+Math.sin(a)*r;
      const running=sportNow().running,pulse=running?(1+Math.sin(t*.006)*.22):1;
      ctx.beginPath();ctx.arc(dx,dy,2.05*pulse,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fill();
      const g=ctx.createRadialGradient(dx,dy,0,dx,dy,13);g.addColorStop(0,rgba(v.c,.22));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(dx,dy,13,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();requestAnimationFrame(draw);
}

const waterPanel=document.querySelector('.water-panel');
if(waterPanel){
  waterPanel.querySelectorAll('[data-water]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(syncMetrics,0)));
}
new MutationObserver(syncMetrics).observe(app,{attributes:true,attributeFilter:['class']});
addEventListener('storage',syncMetrics);
addEventListener('resize',resize,{passive:true});
setInterval(syncMetrics,250);
resize();syncMetrics();requestAnimationFrame(draw);
})();