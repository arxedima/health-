(()=>{
'use strict';
const app=document.getElementById('app'),motion=window.IRISMotion,sport=window.IRISSport,D=window.IRISData;
const metricLabel=document.getElementById('metricLabel'),metricValue=document.getElementById('metricValue'),metricCaption=document.getElementById('metricCaption');
if(!app||!sport)return;
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const setText=(el,value)=>{if(el.textContent!==value)el.textContent=value};
const controls=document.createElement('div');controls.className='v24-sport';
controls.innerHTML='<button class="main" type="button">Начать тренировку</button><div class="sport-tools"><button class="sport-type" type="button">Вид спорта</button><button class="reset" type="button">Завершить</button><button class="sport-history" type="button">История</button></div>';
document.getElementById('metric').appendChild(controls);
const startBtn=controls.querySelector('.main'),finishBtn=controls.querySelector('.reset'),typeBtn=controls.querySelector('.sport-type');
startBtn.addEventListener('click',e=>{e.stopPropagation();sport.toggle()});
finishBtn.addEventListener('click',e=>{e.stopPropagation();if(sport.finish())window.IRISJournal?.toast('Тренировка сохранена')});
typeBtn.addEventListener('click',()=>dispatchEvent(new CustomEvent('iris:workout-type')));
controls.querySelector('.sport-history').addEventListener('click',()=>dispatchEvent(new CustomEvent('iris:sport-history')));
let progress={home:0,water:0,sport:0,food:0,sleep:0},timerId=0;
const mode=()=>app.className.match(/mode-(\w+)/)?.[1]||'home';
const shown=()=>!document.hidden&&(!app.dataset.view||app.dataset.view==='eye')&&app.dataset.contemplation!=='true'&&app.dataset.welcome!=='true'&&!app.classList.contains('menu-open')&&!app.classList.contains('settings-open')&&!document.querySelector('dialog[open]');
function syncMetrics(){
 const m=mode(),s=sport.snapshot(),sum=D.summary(),plan=D.dailyPlan(),next=D.progress(sum);
 const changed=Object.keys(progress).some(k=>progress[k]!==next[k]);progress=next;
 if(m==='home'){
  setText(metricLabel,'ЦЕЛИ ДНЯ');setText(metricValue,next.count?Math.round(next.home*100)+'%':'—');
  setText(metricCaption,next.count?`${next.completed} из ${next.count} целей · твой ритм сегодня`:'Наблюдай за собой без целей');
 }else if(m==='sport'){
  const sec=Math.floor(s.ms/1000),min=Math.floor(sec/60),h=Math.floor(min/60),pad=n=>String(n).padStart(2,'0');
  setText(metricLabel,'СПОРТ');setText(metricValue,(h?pad(h)+':':'')+pad(min%60)+':'+pad(sec%60));
  const status=s.running?'идёт':s.ms>0?'на паузе':'твой темп';
  setText(metricCaption,`${D.sportTypes[s.type]} · ${status}\n${plan.rest?'День отдыха':plan.active.sport?`${Math.floor(sum.sport)} из ${plan.targets.sport} мин сегодня`:`${Math.floor(sum.sport)} мин сегодня`}`);
  setText(startBtn,s.running?'Пауза':s.ms>0?'Продолжить':'Начать тренировку');
  startBtn.classList.toggle('running',s.running);finishBtn.disabled=!s.running&&s.ms===0;typeBtn.disabled=s.running||s.ms>0;
 }
 if(changed&&!motion.intensity())motion.invalidate();
}
function refresh(){
 clearTimeout(timerId);timerId=0;
 progress=D.progress();
 if(!shown())return;
 syncMetrics();
 if(sport.snapshot().running&&['home','sport'].includes(mode()))timerId=setTimeout(refresh,1000-Date.now()%1000+12);
}
function draw(f,ctx){
 if(!ctx)return;
 const weight=1-f.menu*.88;if(weight<.003)return;
 // Every eye uses the same geometry, canvas and clock. Zero stays zero.
 let p=0;for(const k of ['home','water','sport','food','sleep'])p+=(progress[k]||0)*(f.motion.weights[k]||0);
 const r=f.r*1.035,start=-Math.PI*.76,light=app.classList.contains('iris-light'),col=light?[69,124,175]:f.col;
 ctx.save();ctx.globalCompositeOperation=light?'source-over':'screen';
 ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.strokeStyle=rgba(col,(light?.20:.13)*weight);ctx.lineWidth=.8;ctx.stroke();
 if(p>0){ctx.beginPath();ctx.arc(f.x,f.y,r,start,start+Math.PI*2*p);ctx.strokeStyle=rgba(col,(light?.82:.6)*weight);ctx.lineWidth=1.65;ctx.lineCap='round';ctx.stroke()}
 const a=start+Math.PI*2*p,dx=f.x+Math.cos(a)*r,dy=f.y+Math.sin(a)*r;
 ctx.beginPath();ctx.arc(dx,dy,p>0?2.05:1.5,0,Math.PI*2);ctx.fillStyle=rgba(light?col:(p>0?[255,255,255]:col),(p>0?.92:.48)*weight);ctx.fill();
 if(p>0){const g=ctx.createRadialGradient(dx,dy,0,dx,dy,13);g.addColorStop(0,rgba(col,.22*weight));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(dx,dy,13,0,Math.PI*2);ctx.fill()}
 ctx.restore();
}
motion.subscribe(draw);
new MutationObserver(refresh).observe(app,{attributes:true,attributeFilter:['class','data-view','data-contemplation','data-welcome']});
for(const name of ['iris:sport','iris:data','iris:visibility'])addEventListener(name,refresh);
document.addEventListener('visibilitychange',refresh);
refresh();
})();
