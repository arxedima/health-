(()=>{'use strict';
const $=s=>document.querySelector(s),C=$('#irisCanvas'),X=C.getContext('2d',{alpha:false}),A=$('#app'),S=$('#stage'),ML=$('#metricLabel'),MV=$('#metricValue'),MC=$('#metricCaption'),MW=$('#modeWhisper'),RM=$('#radialMenu'),RI=[...document.querySelectorAll('.radial-item')],TR=$('#touchRing'),MH=$('#motionHint'),MD=$('#modeDots'),IP=$('#insightPanel'),SP=$('#settingsPanel'),ST=$('#settingsTrigger'),SO=$('#soundToggle'),SS=$('#soundSettings'),SW=$('#soundState');
const M={home:['ГЛАВНАЯ','','КОСНИСЬ ГЛАЗА','IRIS НАБЛЮДАЕТ',[188,211,229],[73,108,135],55],sport:['СПОРТ','24:17','ТРЕНИРОВКА','ПУЛЬС · ДВИЖЕНИЕ',[214,78,65],[95,33,31],61.7],water:['ВОДА','','ДНЕВНОЙ БАЛАНС','ЖИДКОСТЬ · БАЛАНС',[80,162,224],[27,78,126],73.4],food:['ПИТАНИЕ','—','Нет записей','ЭНЕРГИЯ ИЗ ЕДЫ',[137,160,102],[54,75,43],82.4],sleep:['СОН','—','Нет записей','ВОССТАНОВЛЕНИЕ',[162,125,218],[65,43,99],49],insights:['ИТОГИ','84','ИНДЕКС ДНЯ','СВОДКА СОСТОЯНИЯ',[187,202,214],[62,80,96],65.4]},O=['home','sport','water','food','sleep'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rnd=n=>{let q=Math.sin(n*12.9898+78.233)*43758.5453;return q-Math.floor(q)},rgba=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
let mode='home',W=0,H=0,D=1,cx=0,cy=0,R=135,eyeX=0,eyeY=0,targetX=0,targetY=0,scale=1,targetScale=1,yShift=0,targetShift=0,fib=[],dots=[],rip=[],menu=false,sel=null,hold=0,mm=0,tmm=0,pupil=0;
let p={id:null,down:false,sx:0,sy:0,x:0,y:0,st:0,lx:0,ly:0,lt:0,v:0,a:0,d:0};
let waterMl=clamp(parseInt(localStorage.getItem('irisWaterMl')||'0',10)||0,0,6000),waterGoal=clamp(parseInt(localStorage.getItem('irisWaterGoalMl')||'2000',10)||2000,500,6000),wave=0;
const motion=window.IRISMotion;
let touchEnergy=0,transitionLight=0,waterLevel=clamp(waterMl/waterGoal,0,1);
let animationId=0,lastTick=null,lastPaint=null,clock=0,boostUntil=0;
let entrance=localStorage.getItem('irisWelcomedV39')==='1'?0:1;
function visible(){return !document.hidden&&A.dataset.view!=='stats'&&!SP.classList.contains('open')&&!document.querySelector('dialog[open]')}
function wake(){
 boostUntil=performance.now()+1100;
 if(!visible()){cancelGesture();if(animationId)cancelAnimationFrame(animationId);animationId=0;lastTick=lastPaint=null;return}
 if(!animationId)animationId=requestAnimationFrame(tick);
}
function tick(now){
 animationId=0;if(!visible()){lastTick=lastPaint=null;return}
 const dt=lastTick===null?16.667:clamp(now-lastTick,0,50);lastTick=now;clock+=dt;
 const active=p.down||Math.abs(mm-tmm)>.003||now<boostUntil;
 if(lastPaint===null||now-lastPaint>=(active?1000/60:1000/30)-.5){
  draw(clock,lastPaint===null?16.667:clamp(now-lastPaint,1,50));lastPaint=now;
 }
 if(motion.intensity())animationId=requestAnimationFrame(tick);else lastTick=lastPaint=null;
}
let sportRunning=localStorage.getItem('irisSportRunningV11')==='1';
addEventListener('iris:sport',()=>{sportRunning=localStorage.getItem('irisSportRunningV11')==='1';wake()});
addEventListener('iris:record',e=>{if(e.detail===mode)motion.record(e.detail)});
addEventListener('iris:motion',wake);addEventListener('iris:visibility',wake);
let accent=[...M.home[4]],shade=[...M.home[5]];
const fmt=ml=>(ml/1000).toFixed(2).replace('.',',').replace(/,00$/,',0')+' Л';

const wp=document.createElement('section');wp.className='water-panel';wp.innerHTML='<div class="water-line"><span></span></div><div class="water-head"><strong></strong><small></small></div><div class="water-actions"><button type="button" data-water="-250" aria-label="Убрать 250 мл воды">− 250 мл</button><button type="button" data-water="250" aria-label="Добавить 250 мл воды">+ 250 мл</button></div><div class="water-hint">СВАЙП ВВЕРХ · +250 МЛ</div>';$('#metric').appendChild(wp);const wbar=wp.querySelector('.water-line span'),wcur=wp.querySelector('strong'),wgoal=wp.querySelector('small');
function waterUI(){if(window.IRISData)waterMl=IRISData.summary().water*1000;let pr=clamp(waterMl/waterGoal,0,1);wbar.style.width=pr*100+'%';wcur.textContent=fmt(waterMl);wgoal.textContent='ИЗ '+fmt(waterGoal);if(mode==='water'){MV.textContent=fmt(waterMl);MC.textContent=`ИЗ ${fmt(waterGoal)} · ${Math.round(pr*100)}%`}}

let sound=false,unlocked=false,audio=null,worldT=0,epoch=0;
function soundUI(){let locked=sound&&!unlocked;SO?.classList.toggle('locked',locked);SO?.classList.toggle('muted',!sound);SO?.setAttribute('aria-pressed',sound?'true':'false');if(SW)SW.textContent=!sound?'ВЫКЛ':locked?'КОСНИСЬ':'ВКЛ'}
function makeAudio(){if(audio)return audio.c;let AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;let c=new AC(),master=c.createGain(),f=c.createBiquadFilter(),g=c.createGain(),o1=c.createOscillator(),o2=c.createOscillator(),o3=c.createOscillator(),move=c.createOscillator(),mg=c.createGain();master.gain.value=.0001;master.connect(c.destination);f.type='lowpass';f.frequency.value=210;f.connect(g);g.gain.value=.05;g.connect(master);[o1,o2,o3].forEach(o=>o.connect(f));o1.type='sine';o2.type='triangle';o3.type='sine';o1.detune.value=-8;o2.detune.value=5;o3.detune.value=11;o1.start();o2.start();o3.start();move.type='sine';move.frequency.value=160;mg.gain.value=0;move.connect(mg);mg.connect(master);move.start();audio={c,master,f,g,o1,o2,o3,move,mg};audioMode();return c}
async function unlock(){if(!sound)return false;let c=makeAudio();if(!c)return false;try{if(c.state!=='running')await c.resume();let o=c.createOscillator(),g=c.createGain();g.gain.value=.000001;o.connect(g);g.connect(audio.master);o.start();o.stop(c.currentTime+.02);unlocked=c.state==='running';if(unlocked){audio.master.gain.cancelScheduledValues(c.currentTime);audio.master.gain.setValueAtTime(.0001,c.currentTime);audio.master.gain.exponentialRampToValueAtTime(.095,c.currentTime+.3);world();tone(M[mode][6]*4,.22,.006)}}catch{unlocked=false}soundUI();return unlocked}
function tone(fr,d=.2,g=.012,type='sine',slide=1){if(!sound||!unlocked||!audio||audio.c.state!=='running')return;let c=audio.c,o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.setValueAtTime(fr,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,fr*slide),c.currentTime+d);v.gain.setValueAtTime(.0001,c.currentTime);v.gain.exponentialRampToValueAtTime(g,c.currentTime+.015);v.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(v);v.connect(audio.master);o.start();o.stop(c.currentTime+d+.03)}
function audioMode(){if(!audio)return;let c=audio.c,r=M[mode][6];audio.o1.frequency.setTargetAtTime(r,c.currentTime,.4);audio.o2.frequency.setTargetAtTime(r*1.498,c.currentTime,.4);audio.o3.frequency.setTargetAtTime(r*.5,c.currentTime,.4);audio.f.frequency.setTargetAtTime(mode==='sleep'?145:mode==='sport'?285:mode==='water'?250:205,c.currentTime,.3);audio.g.gain.setTargetAtTime(mode==='sleep'?.026:.05,c.currentTime,.3)}
function stopWorld(){epoch++;clearTimeout(worldT)}function world(){stopWorld();if(!sound||!unlocked||document.hidden)return;audioMode();let e=epoch;const loop=()=>{if(e!==epoch||!sound||!unlocked||document.hidden)return;let d=6000;if(mode==='sport'){tone(42,.48,.014,'sine',.78);setTimeout(()=>tone(64,.28,.006,'sine',.82),190);d=780}else if(mode==='water'){tone(260+Math.random()*120,.7,.004,'sine',.94+Math.random()*.14);d=2600+Math.random()*1200}else if(mode==='sleep'){tone(34,2.5,.003,'sine',1.01);d=5800}else if(mode==='food'){tone(96,.9,.004,'triangle',.94);d=4500}else if(mode==='insights'){tone(392,.8,.004);setTimeout(()=>tone(523,.6,.003),180);d=5300}else{tone(42,.7,.006,'sine',.84);d=7200}worldT=setTimeout(loop,d)};worldT=setTimeout(loop,mode==='sport'?200:900)}
function setSound(v){sound=!!v;localStorage.setItem('irisSound',sound?'on':'off');if(!sound){stopWorld();unlocked=false;if(audio){let c=audio.c;audio.master.gain.setTargetAtTime(.0001,c.currentTime,.06);setTimeout(()=>audio?.c.state==='running'&&audio.c.suspend().catch(()=>{}),260)}}soundUI()}
function moveAudio(x,y,v){if(!unlocked||!audio)return;let c=audio.c,e=ec(),ny=clamp((y-e.y)/(R*scale),-1,1);audio.move.frequency.setTargetAtTime(115+(ny+1)*95,c.currentTime,.03);audio.mg.gain.setTargetAtTime(.001+clamp(v/1.1,0,1)*(mode==='sleep'?.003:.01),c.currentTime,.03)}
function waterSfx(add){tone(add?480:280,.3,.009,'sine',add?1.45:.72);setTimeout(()=>tone(add?820:420,.2,.004,'sine',add?1.1:.8),70)}
soundUI();

function ec(){return{x:cx+eyeX,y:cy+yShift+eyeY+H*.13*entrance}}
function build(){
 if(fib.length)return;
 const n=520,sector=Math.PI*2/n;
 // One strand per angular sector prevents clumps and gaps. Edge variation stays subtle.
 for(let i=0;i<n;i++){
  const a=i*sector+(rnd(i)-.5)*sector*.48;
  fib.push({a,ri:.232+rnd(i*3.2)*.082,ro:.913+Math.sin(a*7+.6)*.008+(rnd(i*7.7)-.5)*.022,b:(rnd(i*9.1)-.5)*.14,w:.16+rnd(i*4.4)*.46,al:.04+rnd(i*6.7)*.13,s:rnd(i*11.3),bend:0,velocity:0});
 }
 for(let i=0;i<120;i++)dots.push({a:rnd(i*2.3)*Math.PI*2,r:.31+rnd(i*3.1)*.56,s:.25+rnd(i*4.8),al:.02+rnd(i*7.9)*.1});
}
function resize(){
  const bounds=A.getBoundingClientRect();
  const oldW=W,oldH=H,oldD=D,oldR=R;
  D=Math.min(2,devicePixelRatio||1);W=Math.round(bounds.width);H=Math.round(bounds.height);
  const safe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--content-bottom'))||18;
  // Fixed readout reservation prevents the eye from jumping when labels or controls change.
  const available=H-safe-226-20;
  R=Math.max(48,Math.min(W*.34,H*.178,174,(available-110)/2));
  cx=W/2;cy=Math.max(110+R,Math.min(H*.435,available-R));
  if(oldW===W&&oldH===H&&oldD===D&&Math.abs(oldR-R)<.01)return;
  C.width=W*D;C.height=H*D;C.style.width=W+'px';C.style.height=H+'px';X.setTransform(D,0,0,D,0,0);
  build();layout();wake();
}
function layout(){
  const rr=R*(mode==='insights'?.66:1),yy=cy+(mode==='insights'?-H*.1:0);
  document.documentElement.style.setProperty('--eye-x',cx+'px');
  document.documentElement.style.setProperty('--eye-y',yy+'px');
  document.documentElement.style.setProperty('--eye-r',rr+'px');
  MW.style.top=Math.max(88,yy-rr-34)+'px';
  $('#metric').style.top=(yy+rr+24)+'px';
}
function point(e){const b=S.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top}}
function inside(x,y,m=1.08){let e=ec();return Math.hypot(x-e.x,y-e.y)<=R*scale*(1-entrance*.2)*m}
function ui(){let m=M[mode];document.documentElement.style.setProperty('--accent',m[4].join(' '));ML.textContent=m[0];MV.textContent=m[1];MC.textContent=m[2];MW.textContent=m[3];A.className=`app mode-${mode}${menu?' menu-open':''}${SP.classList.contains('open')?' settings-open':''}`;IP.classList.toggle('visible',mode==='insights');targetScale=mode==='insights'?.66:1;targetShift=mode==='insights'?-H*.1:0;MD.innerHTML='';O.forEach(v=>{let d=document.createElement('span');if(v===mode)d.className='active';MD.appendChild(d)});MD.classList.toggle('visible',mode!=='home'&&mode!=='water');layout();waterUI();audioMode();requestAnimationFrame(resize)}
function setMode(m){cancelGesture();if(m==='insights'){dispatchEvent(new CustomEvent('iris:statistics'));return}if(!M[m])return;if(m===mode){wake();return}mode=m;pupil=1;transitionLight=1;ui();const el=$('#metric');el.classList.remove('readout-enter');void el.offsetWidth;el.classList.add('readout-enter');wake();world();if(unlocked)tone(M[m][6]*2,.3,.007);try{navigator.vibrate?.(8)}catch{}}
function pulse(x,y){wake();TR.style.left=x+'px';TR.style.top=y+'px';TR.classList.remove('pulse');void TR.offsetWidth;TR.classList.add('pulse');rip.push({x,y,l:1});pupil=1;if(unlocked)tone(M[mode][6]*4,.16,.01,'sine',1.1)}
function openMenu(keyboard=false){if(menu||!visible()||A.dataset.contemplation==='true'||A.dataset.welcome==='true'||(!p.down&&!keyboard))return;menu=true;$('#metric').inert=true;sel=null;tmm=1;RM.classList.add('open');RM.setAttribute('aria-hidden','false');RM.inert=false;A.classList.add('menu-open');dispatchEvent(new CustomEvent('iris:gesture'));wake();if(keyboard)RI[0]?.focus({preventScroll:true});if(unlocked)tone(M[mode][6],.48,.018,'sine',1.28)}function closeMenu(commit=true){if(!menu)return;let s=sel;menu=false;$('#metric').inert=false;sel=null;tmm=0;RI.forEach(i=>i.classList.remove('active'));RM.classList.remove('open');RM.setAttribute('aria-hidden','true');RM.inert=true;A.classList.remove('menu-open');wake();if(commit&&s)setMode(s)}
function choose(x,y){let e=ec(),dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy);if(d<R*.4)sel=null;else{let a=Math.atan2(dy,dx);sel=a>-.25*Math.PI&&a<=.25*Math.PI?'food':a>.25*Math.PI&&a<=.75*Math.PI?'sleep':a<=-.25*Math.PI&&a>-.75*Math.PI?'sport':'water'}RI.forEach(i=>i.classList.toggle('active',i.dataset.mode===sel))}
function changeWater(d){
 const before=waterMl;
 try{waterMl=window.IRISData?IRISData.changeWater(d):clamp(waterMl+d,0,6000)}catch(error){dispatchEvent(new CustomEvent('iris:error',{detail:error.message}));return}
 try{localStorage.setItem('irisWaterMl',waterMl)}catch{}waterUI();if(waterMl===before)return;
 wave=1;motion.record('water');wake();if(unlocked)waterSfx(d>0);try{navigator.vibrate?.(d>0?10:6)}catch{}
}
function down(e){if(!visible()||S.inert||A.dataset.contemplation==='true'||A.dataset.welcome==='true'||e.target.closest('button')||p.down||e.isPrimary===false)return;let {x,y}=point(e);if(menu&&!inside(x,y,1.2)){closeMenu(false);return}if(!inside(x,y,1.1))return;p.id=e.pointerId;p.down=true;p.sx=p.x=p.lx=x;p.sy=p.y=p.ly=y;p.st=p.lt=performance.now();p.v=0;touchEnergy=Math.max(touchEnergy,.55);let q=ec(),dx=x-q.x,dy=y-q.y;p.a=Math.atan2(dy,dx);p.d=Math.hypot(dx,dy);motion.touch(p.a);wake();try{S.setPointerCapture(e.pointerId)}catch{}clearTimeout(hold);hold=setTimeout(openMenu,560);targetX=clamp(dx/R*2.8,-2.8,2.8);targetY=clamp(dy/R*2.4,-2.4,2.4);moveAudio(x,y,0)}
function move(e){if(!p.down||e.pointerId!==p.id)return;let n=performance.now(),{x,y}=point(e),dt=Math.max(1,n-p.lt);p.v=Math.hypot(x-p.lx,y-p.ly)/dt;p.lt=n;p.lx=x;p.ly=y;p.x=x;p.y=y;let q=ec(),dx=x-q.x,dy=y-q.y;p.a=Math.atan2(dy,dx);p.d=Math.hypot(dx,dy);if(Math.hypot(x-p.sx,y-p.sy)>15&&!menu)clearTimeout(hold);targetX=clamp(dx/R*3.2,-3.2,3.2);targetY=clamp(dy/R*2.7,-2.7,2.7);moveAudio(x,y,p.v);wake();if(menu)choose(x,y)}
function finish(e,cancel=false){if(!p.down||e.pointerId!==p.id)return;if(cancel){cancelGesture();closeMenu(false);wake();return}clearTimeout(hold);if(audio)audio.mg.gain.setTargetAtTime(0,audio.c.currentTime,.05);let {x,y}=point(e),dt=performance.now()-p.st,dx=x-p.sx,dy=y-p.sy,dist=Math.hypot(dx,dy);p.down=false;targetX=targetY=0;wake();const pointerId=p.id;p.id=null;try{S.releasePointerCapture(pointerId)}catch{}if(cancel){closeMenu(false);return}if(menu){if(sel||dist>22)closeMenu(true);return}if(dt<390&&dist<22){pulse(x,y);const center=ec();if(Math.hypot(x-center.x,y-center.y)<=Math.max(22,R*scale*.24))S.dispatchEvent(new CustomEvent('iris:pupil-tap'));return}if(Math.abs(dx)>68&&Math.abs(dx)>Math.abs(dy)*1.15){dispatchEvent(new CustomEvent('iris:gesture'));let i=O.indexOf(mode);setMode(dx<0?O[(i+1)%O.length]:O[(i-1+O.length)%O.length]);return}if(Math.abs(dy)>72&&Math.abs(dy)>Math.abs(dx)*1.08){if(mode==='water'){changeWater(dy<0?250:-250);return}if(dy<0)setMode('insights')}}

function waterFill(t,r,q){
 if(q.weights.water<.003||waterLevel<.002)return;
 const yy=r*(1-2*waterLevel),amp=r*(.012+.018*wave)*q.amount;
 X.save();X.beginPath();X.arc(0,0,r*.97,0,Math.PI*2);X.clip();
 const g=X.createLinearGradient(0,yy-r*.2,0,r);g.addColorStop(0,rgba(M.water[4],.035*q.weights.water));g.addColorStop(.3,rgba(M.water[4],.09*q.weights.water));g.addColorStop(1,rgba(M.water[5],.24*q.weights.water));
 X.beginPath();for(let i=0;i<=44;i++){const xx=-r+2*r*i/44,y=yy+Math.sin(i/44*Math.PI*2+t*.0016)*amp;i?X.lineTo(xx,y):X.moveTo(xx,y)}
 X.lineTo(r,r);X.lineTo(-r,r);X.fillStyle=g;X.fill();X.restore();
}
function draw(t,dt){
 const step=clamp(dt/16.667,.25,3),q=motion.update(mode,t,dt,sportRunning),still=!q.amount;
 const ease=(rate)=>still?1:1-Math.pow(1-rate,step);
 if(still)t=0;
 touchEnergy=lerp(touchEnergy,p.down&&!menu?1:0,ease(.12));
 accent=accent.map((v,i)=>lerp(v,M[mode][4][i],ease(.065)));shade=shade.map((v,i)=>lerp(v,M[mode][5][i],ease(.065)));
 scale=lerp(scale,targetScale,ease(.06));yShift=lerp(yShift,targetShift,ease(.06));
 const idleX=p.down||menu?0:Math.sin(t*.00021)*R*.006*q.wander*q.amount;
 const idleY=p.down||menu?0:Math.sin(t*.00017+1.3)*R*.004*q.wander*q.amount;
 eyeX=lerp(eyeX,(targetX+idleX)*q.amount,ease(.08));eyeY=lerp(eyeY,(targetY+idleY)*q.amount,ease(.08));
 mm=lerp(mm,tmm,ease(.11));pupil=lerp(pupil,0,ease(.05));transitionLight=lerp(transitionLight,0,ease(.026));
 waterLevel=lerp(waterLevel,clamp(waterMl/waterGoal,0,1),ease(.055));wave*=Math.pow(.95,step);
 const breath=q.breathing,beat=q.beat;
 entrance=lerp(entrance,A.dataset.welcome==='true'?1:0,ease(.085));
 const e=ec();
 const r=R*scale*(1-entrance*.2)*(1+mm*.12+breath*q.breath+beat*.012),col=accent,low=shade;
 const px=0,py=0;
 if(menu){RM.style.left=e.x+'px';RM.style.top=e.y+'px'}
 const frame={x:e.x,y:e.y,r,baseRadius:R,t,width:W,height:H,dpr:D,mode,col,menu:mm,motion:q,waterLevel};
 X.fillStyle='#000';X.fillRect(0,0,W,H);motion.backdrop(X,frame);
 rip=still?[]:rip.filter(v=>v.l>.02);
 for(const v of rip){X.beginPath();X.arc(v.x,v.y,(1-v.l)*r*1.1,0,Math.PI*2);X.strokeStyle=rgba(col,v.l*.06*q.amount);X.lineWidth=.65;X.stroke();v.l*=Math.pow(.95,step)}
 X.save();X.translate(e.x,e.y);
 const base=X.createRadialGradient(0,0,r*.13,0,0,r);
 base.addColorStop(0,'#000');base.addColorStop(.13,rgba(low,.85));base.addColorStop(.35,rgba(col,.29));base.addColorStop(.61,rgba(low,.61));base.addColorStop(.86,rgba(low,.22));base.addColorStop(1,rgba(low,0));
 X.beginPath();X.arc(0,0,r,0,Math.PI*2);X.fillStyle=base;X.fill();
 X.save();X.beginPath();X.arc(0,0,r*.985,0,Math.PI*2);X.clip();
 // A shared circular fade softens every strand before it reaches the edge.
 const strandGradient=color=>{const g=X.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,rgba(color,0));g.addColorStop(.22,rgba(color,1));g.addColorStop(.70,rgba(color,1));g.addColorStop(.86,rgba(color,.72));g.addColorStop(.955,rgba(color,0));g.addColorStop(1,rgba(color,0));return g};
 const fineInk=strandGradient(col),deepInk=strandGradient(low);X.lineCap='round';X.lineJoin='round';
 // Broad, darker fibers under the fine strands give the iris a second depth plane.
 for(let i=0;i<fib.length;i+=2){
  const f=fib[i],a=f.a+f.b*.18+motion.fiber(f,t,q)*.4,ri=r*(f.ri-.025),ro=r*f.ro;
  X.beginPath();X.moveTo(px*.5+Math.cos(a)*ri,py*.5+Math.sin(a)*ri);
  X.quadraticCurveTo(Math.cos(a-f.b*.7)*r*.57,Math.sin(a-f.b*.7)*r*.57,Math.cos(a+f.b)*ro,Math.sin(a+f.b)*ro);
  X.strokeStyle=deepInk;X.globalAlpha=.17+f.al*.8;X.lineWidth=.8+f.w*1.3;X.stroke();
 }
 X.globalAlpha=1;X.globalCompositeOperation='screen';
 for(const f of fib){
  const a=f.a+motion.fiber(f,t,q)+Math.sin(t*q.pace+f.s*18)*.003*q.amount;
  const delta=Math.atan2(Math.sin(p.a-a),Math.cos(p.a-a));
  const influence=touchEnergy*Math.exp(-delta*delta/.12)*clamp(1.25-p.d/(r*1.3),0,1);
  const target=influence*(.09+clamp(delta,-.35,.35)*.65)*(still?.3:1);
  if(still){f.bend=target;f.velocity=0}else{const n=Math.ceil(step),h=step/n;for(let i=0;i<n;i++){f.velocity=(f.velocity+(target-f.bend)*.16*h)*Math.pow(.73,h);f.bend+=f.velocity*h}}
  const r1=r*(f.ri-influence*.015),r2=r*(f.ro+influence*.035),mid=(r1+r2)*.52,ma=a+f.b*.4+f.bend;
  const echoDelta=Math.atan2(Math.sin(q.touchAngle-a),Math.cos(q.touchAngle-a));
  const echo=q.touchEcho*Math.exp(-echoDelta*echoDelta/.22)*.22*q.amount;
  const lift=1+influence*.95+echo+q.energy*(q.weights.food+q.weights.sleep)*.26+beat*.2;
  X.beginPath();X.moveTo(px*.65+Math.cos(a)*r1,py*.65+Math.sin(a)*r1);
  X.quadraticCurveTo(Math.cos(ma)*mid,Math.sin(ma)*mid,Math.cos(a+f.b+f.bend*.65)*r2,Math.sin(a+f.b+f.bend*.65)*r2);
  X.strokeStyle=fineInk;X.globalAlpha=Math.min(1,f.al*lift*(.9+f.s*.45));X.lineWidth=f.w+influence*.28;X.stroke();
  // Fine branches remain attached to the same spring as the strand being touched.
  if(f.s>.48){
   const split=r*(.47+f.s*.15),end=r2*(.88+f.s*.1),turn=ma+f.b*.45;
   X.beginPath();X.moveTo(Math.cos(ma)*split,Math.sin(ma)*split);
   X.quadraticCurveTo(Math.cos(turn)*r*.73,Math.sin(turn)*r*.73,Math.cos(a+f.b*1.2+f.bend*.7)*end,Math.sin(a+f.b*1.2+f.bend*.7)*end);
   X.strokeStyle=fineInk;X.globalAlpha=f.al*.43*lift;X.lineWidth=.22+f.w*.2;X.stroke();
  }
 }
 X.globalAlpha=1;
 // An irregular inner collar, with small breaks, replaces a flat luminous disk.
 for(let i=0;i<fib.length;i+=3){
  const f=fib[i],a=f.a,ri=r*(.222+f.s*.015),ro=r*(.29+f.s*.09),aa=a+f.b*.3+f.bend*.2;
  X.beginPath();X.moveTo(px+Math.cos(a)*ri,py+Math.sin(a)*ri);
  X.quadraticCurveTo(px+Math.cos(aa)*r*.26,py+Math.sin(aa)*r*.26,Math.cos(aa)*ro,Math.sin(aa)*ro);
  X.strokeStyle=rgba(col,.045+f.al*.3);X.lineWidth=.45+f.w*.6;X.stroke();
 }
 for(const d of dots){X.beginPath();X.arc(Math.cos(d.a)*r*d.r,Math.sin(d.a)*r*d.r,d.s*.7,0,Math.PI*2);X.fillStyle=rgba(col,d.al*.6);X.fill()}
 waterFill(t,r,q);motion.inner(X,frame);
 const outward=1-transitionLight;
 if(!still&&transitionLight>.015){
  const radius=r*(.22+outward*.76),light=X.createRadialGradient(0,0,Math.max(0,radius-r*.12),0,0,radius+r*.12);
  light.addColorStop(0,'rgba(0,0,0,0)');light.addColorStop(.5,rgba(col,Math.sin(outward*Math.PI)*.09*q.amount));light.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=light;X.fillRect(-r,-r,r*2,r*2);
 }
 X.restore();
 const rim=X.createRadialGradient(0,0,r*.73,0,0,r*1.04);
 rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(.4,'rgba(0,0,0,.14)');rim.addColorStop(.65,'rgba(0,0,0,.35)');rim.addColorStop(.85,'rgba(0,0,0,.20)');rim.addColorStop(1,'rgba(0,0,0,0)');X.beginPath();X.arc(0,0,r*1.04,0,Math.PI*2);X.fillStyle=rim;X.fill();
 // Directional shade and a restrained reflection imply a curved, glassy surface.
 const shadow=X.createLinearGradient(-r*.5,-r,r*.6,r);shadow.addColorStop(0,'rgba(0,0,0,0)');shadow.addColorStop(.5,'rgba(0,0,0,.035)');shadow.addColorStop(1,'rgba(0,0,0,.20)');X.beginPath();X.arc(0,0,r*.97,0,Math.PI*2);X.fillStyle=shadow;X.fill();
 const pr=r*(.205+mm*.08+pupil*.018*q.amount+breath*q.pupil-beat*.004);
 const well=X.createRadialGradient(px,py,pr*.86,px,py,pr*1.25);well.addColorStop(0,'#000');well.addColorStop(.53,'rgba(0,0,0,.98)');well.addColorStop(1,'rgba(0,0,0,0)');X.beginPath();X.arc(px,py,pr*1.25,0,Math.PI*2);X.fillStyle=well;X.fill();
 X.beginPath();X.arc(px,py,pr,0,Math.PI*2);X.fillStyle='#000';X.fill();
 X.beginPath();X.arc(px,py,pr*1.025,Math.PI*.98,Math.PI*1.86);X.strokeStyle=rgba(col,.13);X.lineWidth=.65;X.stroke();
 X.save();X.globalCompositeOperation='screen';X.translate(-r*.29-eyeX*.12,-r*.32-eyeY*.12);X.rotate(-.65);X.scale(1,.47);
 const highlight=X.createRadialGradient(0,0,0,0,0,r*.24);highlight.addColorStop(0,'rgba(223,240,252,.21)');highlight.addColorStop(.3,'rgba(210,233,250,.075)');highlight.addColorStop(1,'rgba(210,233,250,0)');X.fillStyle=highlight;X.beginPath();X.arc(0,0,r*.24,0,Math.PI*2);X.fill();X.restore();
 X.beginPath();X.arc(-r*.025,-r*.025,r*.905,Math.PI*1.11,Math.PI*1.47);X.strokeStyle=rgba(col,.065);X.lineWidth=.8;X.stroke();
 X.restore();motion.frame(frame,X);
}

function cancelGesture(){
 clearTimeout(hold);rip=[];pupil=0;TR.classList.remove('pulse');const id=p.id;p.down=false;p.id=null;p.v=0;targetX=targetY=0;touchEnergy=0;
 if(id!==null)try{S.releasePointerCapture(id)}catch{}
 if(audio)audio.mg.gain.setTargetAtTime(0,audio.c.currentTime,.05);
}
function settings(open){
 cancelGesture();closeMenu(false);SP.inert=!open;SP.classList.toggle('open',open);SP.setAttribute('aria-hidden',String(!open));A.classList.toggle('settings-open',open);
 S.inert=open||A.dataset.view==='stats'||A.dataset.welcome==='true';$('.topbar').inert=open;
 const nav=$('.bottom-nav');if(nav)nav.inert=open;
 if(open)SP.querySelector('.close-settings').focus({preventScroll:true});else ST.focus({preventScroll:true});wake();
}
function focusEye(){const trigger=mode==='home'?$('#openSections'):S;trigger?.focus({preventScroll:true})}
addEventListener('iris:menu',()=>openMenu(true));
addEventListener('iris:close-menu',()=>{cancelGesture();closeMenu(false)});
document.addEventListener('keydown',e=>{
 if(document.querySelector('dialog[open]'))return;
 if(SP.classList.contains('open')){
  if(e.key==='Escape'){e.preventDefault();settings(false);return}
  if(e.key==='Tab'){
   const buttons=[...SP.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
  return;
 }
 if(e.key==='Escape'&&menu){e.preventDefault();closeMenu(false);cancelGesture();focusEye()}
 if((e.key==='Enter'||e.key===' ')&&e.target===S){e.preventDefault();openMenu(true)}
});
S.tabIndex=0;S.setAttribute('aria-description','Коснись волокон. Удерживай глаз или нажми Enter, чтобы открыть разделы.');
addEventListener('iris:navigate',e=>{cancelGesture();closeMenu(false);setMode(e.detail)});
addEventListener('iris:data',()=>{waterUI();wake()});
RI.forEach(i=>i.addEventListener('click',e=>{e.stopPropagation();sel=i.dataset.mode;closeMenu(true)}));
wp.querySelectorAll('button').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();changeWater(+b.dataset.water)}));
ST.addEventListener('click',()=>settings(true));
document.querySelectorAll('[data-close-settings]').forEach(el=>el.addEventListener('click',()=>settings(false)));
SO.addEventListener('click',async e=>{e.stopPropagation();if(!sound){setSound(true);await unlock()}else if(!unlocked)await unlock();else setSound(false)});
SS.addEventListener('click',async e=>{e.stopPropagation();if(!sound){setSound(true);await unlock()}else if(!unlocked)await unlock();else setSound(false)});
document.addEventListener('pointerdown',()=>{if(sound&&!unlocked)unlock()},{capture:true,passive:true});
S.addEventListener('pointerdown',down);S.addEventListener('pointermove',move);S.addEventListener('pointerup',e=>finish(e));S.addEventListener('pointercancel',e=>finish(e,true));S.addEventListener('lostpointercapture',e=>finish(e,true));
addEventListener('resize',resize,{passive:true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){stopWorld();cancelGesture();closeMenu(false)}
 else if(sound&&audio){audio.c.resume().then(()=>{unlocked=audio.c.state==='running';soundUI();if(unlocked)world()}).catch(()=>{unlocked=false;soundUI()})}
 wake();
});
addEventListener('storage',e=>{if(['irisSportRunningV11','irisSportStartedV11','irisSportElapsedV11'].includes(e.key)){sportRunning=localStorage.getItem('irisSportRunningV11')==='1';wake()}});
if(window.ResizeObserver)new ResizeObserver(resize).observe(A);
RM.inert=true;SP.inert=true;resize();ui();waterUI();wake();
})();
