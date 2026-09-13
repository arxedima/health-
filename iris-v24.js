(()=>{
'use strict';
const app=document.getElementById('app'),motion=window.IRISMotion,sport=window.IRISSport;
const metricLabel=document.getElementById('metricLabel'),metricValue=document.getElementById('metricValue'),metricCaption=document.getElementById('metricCaption');
if(!app||!sport)return;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const setText=(el,value)=>{if(el.textContent!==value)el.textContent=value};
const controls=document.createElement('div');controls.className='v24-sport';
controls.innerHTML='<button class="main" type="button">Начать тренировку</button><button class="reset" type="button">Сброс</button>';
document.getElementById('metric').appendChild(controls);
const startBtn=controls.querySelector('.main'),resetBtn=controls.querySelector('.reset');
startBtn.addEventListener('click',e=>{e.stopPropagation();sport.toggle()});
resetBtn.addEventListener('click',e=>{e.stopPropagation();sport.reset()});
let sportProgress=0,timerId=0;
const mode=()=>app.className.match(/mode-(\w+)/)?.[1]||'home';
const shown=()=>!document.hidden&&app.dataset.view!=='stats'&&app.dataset.contemplation!=='true'&&app.dataset.welcome!=='true'&&!app.classList.contains('menu-open')&&!app.classList.contains('settings-open')&&!document.querySelector('dialog[open]');
function syncMetrics(){
 const m=mode(),s=sport.snapshot(),goal=clamp(Number(localStorage.getItem('irisSportGoalMinV24'))||30,10,180);
 const sum=window.IRISData.summary(),progress=clamp(sum.sport/goal,0,1),changed=Math.abs(progress-sportProgress)>.000001;
 sportProgress=progress;
 if(m==='home'){
  const waterGoal=clamp(Number(localStorage.getItem('irisWaterGoalMl'))||2000,500,6000),water=clamp(sum.water*1000/waterGoal,0,1);
  setText(metricLabel,'IRIS');setText(metricValue,String(Math.round((water*.55+progress*.45)*100)));
  setText(metricCaption,`ВОДА ${Math.round(water*100)}% · СПОРТ ${Math.floor(sum.sport)}/${goal} МИН`);
 }else if(m==='sport'){
  const sec=Math.floor(s.ms/1000),min=Math.floor(sec/60),h=Math.floor(min/60),pad=n=>String(n).padStart(2,'0');
  setText(metricLabel,'СПОРТ');setText(metricValue,(h?pad(h)+':':'')+pad(min%60)+':'+pad(sec%60));
  setText(metricCaption,s.running?'Тренировка идёт':s.ms>0?'На паузе':'Твой темп. Твоё время.');
  setText(startBtn,s.running?'Пауза':s.ms>0?'Продолжить':'Начать тренировку');
  startBtn.classList.toggle('running',s.running);resetBtn.disabled=s.ms===0;resetBtn.style.opacity=s.ms>0?'1':'.35';
 }
 if(changed&&m==='sport'&&!motion.intensity())motion.invalidate();
}
function refresh(){
 clearTimeout(timerId);timerId=0;
 if(!shown())return;
 syncMetrics();
 if(sport.snapshot().running&&['home','sport'].includes(mode()))timerId=setTimeout(refresh,1000-Date.now()%1000+12);
}
function draw(f,ctx){
 if(!ctx)return;
 const weight=f.motion.weights.sport*(1-f.menu*.88);if(weight<.003)return;
 // Progress shares the eye's existing canvas and clock; no extra full-screen layers.
 const p=sportProgress,r=f.r*1.026,start=-Math.PI*.76,col=f.col;
 ctx.save();ctx.globalCompositeOperation='screen';
 ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.strokeStyle=rgba(col,.07*weight);ctx.lineWidth=.7;ctx.stroke();
 if(p>0){
  ctx.beginPath();ctx.arc(f.x,f.y,r,start,start+Math.PI*2*p);ctx.strokeStyle=rgba(col,.58*weight);ctx.lineWidth=1.65;ctx.lineCap='round';ctx.stroke();
  const a=start+Math.PI*2*p,dx=f.x+Math.cos(a)*r,dy=f.y+Math.sin(a)*r;
  ctx.beginPath();ctx.arc(dx,dy,2.05+f.motion.beat*.38,0,Math.PI*2);ctx.fillStyle=rgba([255,255,255],.92*weight);ctx.fill();
  const g=ctx.createRadialGradient(dx,dy,0,dx,dy,13);g.addColorStop(0,rgba(col,.22*weight));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(dx,dy,13,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
motion.subscribe(draw);
new MutationObserver(refresh).observe(app,{attributes:true,attributeFilter:['class','data-view','data-contemplation','data-welcome']});
for(const name of ['iris:sport','iris:data','iris:visibility'])addEventListener(name,refresh);
addEventListener('storage',e=>{if(['irisWaterGoalMl','irisSportGoalMinV24'].includes(e.key))refresh()});
document.addEventListener('visibilitychange',refresh);
refresh();
})();
