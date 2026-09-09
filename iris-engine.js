(()=>{
'use strict';

const $=s=>document.querySelector(s);
const C=$('#irisCanvas');
const X=C.getContext('2d',{alpha:true});
const A=$('#app'),S=$('#stage');
const ML=$('#metricLabel'),MV=$('#metricValue'),MC=$('#metricCaption'),MW=$('#modeWhisper');
const RM=$('#radialMenu'),RI=[...document.querySelectorAll('.radial-item')];
const TR=$('#touchRing'),MH=$('#motionHint'),MD=$('#modeDots');
const SP=$('#settingsPanel'),ST=$('#settingsTrigger'),IP=$('#insightPanel');
const soundToggle=$('#soundToggle'),soundSettings=$('#soundSettings'),soundState=$('#soundState');

const MODES={
  home:{label:'ГЛАВНАЯ',value:'',caption:'КОСНИСЬ ГЛАЗА',whisper:'IRIS НАБЛЮДАЕТ',a:[198,220,237],i:[108,143,165],w:[215,197,178],tone:110},
  sport:{label:'СПОРТ',value:'24:17',caption:'ТРЕНИРОВКА',whisper:'ПУЛЬС · ДВИЖЕНИЕ',a:[242,100,74],i:[128,52,42],w:[255,180,126],tone:123.47},
  water:{label:'ВОДА',value:'1,2 Л',caption:'СЕГОДНЯ',whisper:'БАЛАНС ЖИДКОСТИ',a:[108,188,240],i:[44,102,154],w:[194,232,255],tone:146.83},
  food:{label:'ПИТАНИЕ',value:'1 420',caption:'ККАЛ',whisper:'ЭНЕРГИЯ ИЗ ЕДЫ',a:[162,190,130],i:[78,104,64],w:[222,182,116],tone:164.81},
  sleep:{label:'СОН',value:'7 Ч 24 М',caption:'ПРОШЛОЙ НОЧЬЮ',whisper:'ВОССТАНОВЛЕНИЕ',a:[100,130,186],i:[40,56,90],w:[144,164,205],tone:98},
  insights:{label:'ИТОГИ',value:'84',caption:'ИНДЕКС ДНЯ',whisper:'СВОДКА СОСТОЯНИЯ',a:[208,220,230],i:[80,98,114],w:[198,190,181],tone:130.81}
};
const ORDER=['home','sport','water','food','sleep','insights'];

let mode='home',acc=[...MODES.home.a],inn=[...MODES.home.i],warm=[...MODES.home.w];
let W=0,H=0,D=1,cx=0,cy=0,R=130,scale=1,targetScale=1,yShift=0,targetYShift=0;
let eye={x:0,y:0},targetEye={x:0,y:0};
let fibers=[],crypts=[],dust=[],ripples=[],trail=[],streaks=[],drops=[];
let p={id:null,down:false,inside:false,startX:0,startY:0,x:0,y:0,startT:0,angle:0,dist:0,moved:false,lastMoveT:0,lastMoveX:0,lastMoveY:0,speed:0};
let holdTimer=0,menu=false,selection=null,lastSelection=null,menuMorph=0,targetMenuMorph=0,pupilKick=0,first=false,modeFlash=0,beatFlash=0,breathFlash=0,waterFlash=0,crystalFlash=0;

const rnd=n=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const lc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const rgba=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const ad=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d};

/* -------------------- AUDIO -------------------- */
let soundEnabled=localStorage.getItem('irisSound')!=='off';
let audio=null,audioTick=0;
let nextWorldEvent=0,nextSecondaryEvent=0;

function updateSoundUI(){
  soundToggle?.classList.toggle('active',soundEnabled);
  soundToggle?.classList.toggle('muted',!soundEnabled);
  soundToggle?.setAttribute('aria-pressed',soundEnabled?'true':'false');
  soundSettings?.classList.toggle('off',!soundEnabled);
  if(soundState)soundState.textContent=soundEnabled?'ВКЛ':'ВЫКЛ';
}

function noiseBuffer(ctx,dur=.85){
  const b=ctx.createBuffer(1,Math.max(1,(ctx.sampleRate*dur)|0),ctx.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
  return b;
}

function ensureAudio(){
  if(!soundEnabled)return null;
  if(audio){
    if(audio.ctx.state==='suspended')audio.ctx.resume().catch(()=>{});
    return audio.ctx;
  }
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return null;
  const ctx=new AC();
  const master=ctx.createGain(),comp=ctx.createDynamicsCompressor();
  master.gain.value=.0001;
  comp.threshold.value=-22;comp.knee.value=18;comp.ratio.value=4;comp.attack.value=.01;comp.release.value=.22;
  master.connect(comp);comp.connect(ctx.destination);

  const padFilter=ctx.createBiquadFilter(),padGain=ctx.createGain();
  padFilter.type='lowpass';padFilter.frequency.value=520;padFilter.Q.value=.35;padGain.gain.value=.045;
  padFilter.connect(padGain);padGain.connect(master);

  const o1=ctx.createOscillator(),o2=ctx.createOscillator(),o3=ctx.createOscillator();
  const g1=ctx.createGain(),g2=ctx.createGain(),g3=ctx.createGain();
  o1.type='sine';o2.type='triangle';o3.type='sine';
  g1.gain.value=.52;g2.gain.value=.11;g3.gain.value=.05;
  o1.connect(g1);o2.connect(g2);o3.connect(g3);g1.connect(padFilter);g2.connect(padFilter);g3.connect(padFilter);
  o1.start();o2.start();o3.start();

  const lfo=ctx.createOscillator(),lfoGain=ctx.createGain();
  lfo.type='sine';lfo.frequency.value=.07;lfoGain.gain.value=.008;lfo.connect(lfoGain);lfoGain.connect(padGain.gain);lfo.start();

  const movement=ctx.createOscillator(),moveFilter=ctx.createBiquadFilter(),moveGain=ctx.createGain();
  movement.type='sine';movement.frequency.value=220;moveFilter.type='bandpass';moveFilter.frequency.value=900;moveFilter.Q.value=.85;moveGain.gain.value=0;
  movement.connect(moveFilter);moveFilter.connect(moveGain);
  let pan=null;
  if(ctx.createStereoPanner){pan=ctx.createStereoPanner();moveGain.connect(pan);pan.connect(master)}else moveGain.connect(master);
  movement.start();

  const waterNoise=ctx.createBufferSource(),waterFilter=ctx.createBiquadFilter(),waterGain=ctx.createGain();
  waterNoise.buffer=noiseBuffer(ctx,2.5);waterNoise.loop=true;waterFilter.type='lowpass';waterFilter.frequency.value=680;waterFilter.Q.value=.2;waterGain.gain.value=0;
  waterNoise.connect(waterFilter);waterFilter.connect(waterGain);waterGain.connect(master);waterNoise.start();

  audio={ctx,master,comp,padFilter,padGain,o1,o2,o3,lfo,lfoGain,movement,moveFilter,moveGain,pan,noise:noiseBuffer(ctx,.9),waterNoise,waterFilter,waterGain};
  master.gain.exponentialRampToValueAtTime(.10,ctx.currentTime+.65);
  setAudioMode(mode,.02);
  nextWorldEvent=performance.now()+700;
  nextSecondaryEvent=performance.now()+1800;
  clearInterval(audioTick);
  audioTick=setInterval(audioWorldTick,120);
  return ctx;
}

function setSound(on){
  soundEnabled=!!on;localStorage.setItem('irisSound',soundEnabled?'on':'off');updateSoundUI();
  if(soundEnabled){
    const c=ensureAudio();
    if(c&&audio){audio.master.gain.cancelScheduledValues(c.currentTime);audio.master.gain.setTargetAtTime(.10,c.currentTime,.14);tone(MODES[mode].tone*4,.18,.016,'sine',1.04)}
  }else if(audio){
    const c=audio.ctx;audio.master.gain.cancelScheduledValues(c.currentTime);audio.master.gain.setTargetAtTime(.0001,c.currentTime,.09);stopMovementAudio();
    setTimeout(()=>{if(!soundEnabled&&audio?.ctx.state==='running')audio.ctx.suspend().catch(()=>{})},420);
  }
}

function setAudioMode(m,tc=.25){
  if(!audio)return;
  const c=audio.ctx,t=MODES[m].tone;
  const config={
    home:{f:560,g:.045,w:0,l:.07},
    sport:{f:760,g:.052,w:0,l:.10},
    water:{f:430,g:.036,w:.012,l:.055},
    food:{f:620,g:.043,w:0,l:.075},
    sleep:{f:260,g:.020,w:0,l:.035},
    insights:{f:900,g:.034,w:0,l:.065}
  }[m];
  audio.o1.frequency.setTargetAtTime(t,c.currentTime,tc);
  audio.o2.frequency.setTargetAtTime(t*1.503,c.currentTime,tc);
  audio.o3.frequency.setTargetAtTime(t*2.002,c.currentTime,tc);
  audio.padFilter.frequency.setTargetAtTime(config.f,c.currentTime,.28);
  audio.padGain.gain.setTargetAtTime(config.g,c.currentTime,.28);
  audio.waterGain.gain.setTargetAtTime(config.w,c.currentTime,.35);
  audio.lfo.frequency.setTargetAtTime(config.l,c.currentTime,.35);
  nextWorldEvent=performance.now()+350;
  nextSecondaryEvent=performance.now()+1200;
}

function tone(freq,dur=.22,gain=.025,type='sine',slide=1,delay=0){
  const c=ensureAudio();if(!c||!audio)return;
  const st=c.currentTime+delay,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),st);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*slide),st+dur);
  f.type='lowpass';f.frequency.value=2600;g.gain.setValueAtTime(.0001,st);g.gain.exponentialRampToValueAtTime(gain,st+.015);g.gain.exponentialRampToValueAtTime(.0001,st+dur);
  o.connect(f);f.connect(g);g.connect(audio.master);o.start(st);o.stop(st+dur+.04);
}

function filteredNoise(dur=.28,gain=.025,cut=1000,type='bandpass',delay=0){
  const c=ensureAudio();if(!c||!audio)return;
  const st=c.currentTime+delay,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  src.buffer=audio.noise;f.type=type;f.frequency.setValueAtTime(cut,st);f.frequency.exponentialRampToValueAtTime(Math.max(90,cut*1.6),st+dur);f.Q.value=.8;
  g.gain.setValueAtTime(.0001,st);g.gain.exponentialRampToValueAtTime(gain,st+.018);g.gain.exponentialRampToValueAtTime(.0001,st+dur);
  src.connect(f);f.connect(g);g.connect(audio.master);src.start(st);src.stop(st+dur+.03);
}

function heartbeat(){
  if(!soundEnabled||mode!=='sport')return;
  beatFlash=1;
  tone(58,.12,.04,'sine',.72);filteredNoise(.09,.012,180,'lowpass',.01);
  tone(46,.15,.03,'sine',.68,.17);filteredNoise(.08,.008,150,'lowpass',.18);
}
function waterDrop(){
  if(!soundEnabled||mode!=='water')return;
  waterFlash=1;
  const root=MODES.water.tone;
  tone(root*5.2,.24,.012,'sine',1.42);tone(root*7.8,.32,.006,'sine',.82,.06);
  const e=eyeCenter();drops.push({x:e.x+(Math.random()-.5)*R*1.35,y:e.y-R*.88+Math.random()*R*.35,life:1});
}
function foodPulse(){
  if(!soundEnabled||mode!=='food')return;
  const r=MODES.food.tone;
  tone(r*2,.23,.012,'triangle',1.06);tone(r*3,.18,.008,'sine',.97,.08);tone(r*4,.3,.005,'sine',1.01,.16);
}
function sleepBreath(){
  if(!soundEnabled||mode!=='sleep')return;
  breathFlash=1;
  filteredNoise(2.6,.006,260,'lowpass');
  tone(MODES.sleep.tone,.9,.005,'sine',1.01,.3);
}
function insightCrystal(){
  if(!soundEnabled||mode!=='insights')return;
  crystalFlash=1;
  const r=MODES.insights.tone;
  tone(r*4,.65,.008,'sine',1.006);tone(r*6,.8,.005,'sine',.997,.12);tone(r*8,.5,.0035,'sine',1.003,.26);
}
function homeWhisper(){
  if(!soundEnabled||mode!=='home')return;
  const r=MODES.home.tone;tone(r*2,.85,.005,'sine',1.002);tone(r*3,.65,.003,'sine',.998,.26);
}

function audioWorldTick(){
  if(!soundEnabled||!audio||audio.ctx.state!=='running'||document.hidden)return;
  const now=performance.now();
  if(now<nextWorldEvent)return;
  if(mode==='sport'){heartbeat();nextWorldEvent=now+760;}
  else if(mode==='water'){waterDrop();nextWorldEvent=now+1550+Math.random()*750;}
  else if(mode==='food'){foodPulse();nextWorldEvent=now+2150+Math.random()*900;}
  else if(mode==='sleep'){sleepBreath();nextWorldEvent=now+5600;}
  else if(mode==='insights'){insightCrystal();nextWorldEvent=now+3300+Math.random()*1000;}
  else {homeWhisper();nextWorldEvent=now+4300+Math.random()*1200;}
}

function sfxTap(){
  if(mode==='water'){waterDrop();return;}
  if(mode==='sleep'){tone(MODES.sleep.tone*2,.35,.009,'sine',.92);return;}
  tone(MODES[mode].tone*4,.17,.022,'sine',1.12);tone(MODES[mode].tone*6,.24,.009,'sine',.92,.03);
}
function sfxHold(){filteredNoise(.38,.022,480);tone(MODES[mode].tone,.56,.032,'sine',1.32);tone(MODES[mode].tone*4,.32,.011,'sine',1.08,.12);}
function sfxSelect(){tone(MODES[mode].tone*5,.09,.014,'triangle',1.04);}
function sfxSwipe(dir=1){filteredNoise(.28,.032,dir>0?720:1050);tone(MODES[mode].tone*2.4,.24,.014,'sine',dir>0?1.25:.8);}
function sfxMode(m){setAudioMode(m);tone(MODES[m].tone*2,.42,.016,'sine',1.01);tone(MODES[m].tone*3,.34,.006,'sine',.995,.08);}

function movementAudio(x,y,speed){
  if(!audio||!soundEnabled)return;
  const c=audio.ctx,e=eyeCenter(),nx=clamp((x-e.x)/(R*scale),-1,1),ny=clamp((y-e.y)/(R*scale),-1,1),v=clamp(speed/1.2,0,1);
  const cfg={
    home:{base:190,span:220,g:.014,f:900},
    sport:{base:145,span:130,g:.020,f:700},
    water:{base:260,span:300,g:.010,f:1350},
    food:{base:210,span:260,g:.012,f:1100},
    sleep:{base:90,span:90,g:.004,f:420},
    insights:{base:340,span:420,g:.009,f:1800}
  }[mode];
  audio.movement.frequency.setTargetAtTime(cfg.base+(ny+1)*cfg.span*.5,c.currentTime,.035);
  audio.moveFilter.frequency.setTargetAtTime(cfg.f+(1-Math.abs(nx))*650,c.currentTime,.04);
  audio.moveGain.gain.setTargetAtTime(.001+v*cfg.g,c.currentTime,.035);
  if(audio.pan)audio.pan.pan.setTargetAtTime(nx*.78,c.currentTime,.04);
  if(mode==='water')audio.waterFilter.frequency.setTargetAtTime(420+v*1100,c.currentTime,.05);
}
function stopMovementAudio(){if(audio)audio.moveGain.gain.setTargetAtTime(0,audio.ctx.currentTime,.06);}

updateSoundUI();

/* -------------------- IRIS ENGINE -------------------- */
function eyeCenter(){return{x:cx+eye.x,y:cy+yShift+eye.y}}
function build(){
  fibers=[];crypts=[];dust=[];
  const n=clamp(Math.floor(R*4.7),540,840);
  for(let k=0;k<n;k++)fibers.push({a:k/n*Math.PI*2+(rnd(k)-.5)*.052,ri:.2+rnd(k*3.7)*.18,ro:.68+rnd(k*8.1)*.31,w:.17+rnd(k*5.4)*.98,al:.044+rnd(k*7.2)*.25,b:(rnd(k*9.4)-.5)*.31,hot:rnd(k*11.1)>.84,s:rnd(k*13.5)});
  for(let k=0;k<62;k++)crypts.push({a:k/62*Math.PI*2+rnd(k*9.3)*.13,r1:.33+rnd(k*2.1)*.18,r2:.63+rnd(k*4.8)*.25,w:.45+rnd(k*5.7)*1.7,al:.11+rnd(k*8.4)*.20});
  for(let k=0;k<110;k++)dust.push({a:rnd(k*1.9)*Math.PI*2,r:.95+rnd(k*3.1)*.36,s:.35+rnd(k*4.9)*1.25,al:.028+rnd(k*7.7)*.14});
}
function resize(){
  D=Math.min(2,devicePixelRatio||1);W=Math.floor(innerWidth);H=Math.floor(innerHeight);
  C.width=W*D;C.height=H*D;C.style.width=W+'px';C.style.height=H+'px';X.setTransform(D,0,0,D,0,0);
  cx=W/2;cy=H*.455;R=Math.min(W*.405,H*.235,212);build();positionMenu();
}
function positionMenu(){const e=eyeCenter();RM.style.left=e.x+'px';RM.style.top=e.y+'px'}
function insideEye(x,y,mult=1.08){const e=eyeCenter(),rr=R*scale*mult;return Math.hypot(x-e.x,y-e.y)<=rr}
function palette(){const m=MODES[mode];acc=lc(acc,m.a,.03);inn=lc(inn,m.i,.03);warm=lc(warm,m.w,.03);document.documentElement.style.setProperty('--accent',`${acc[0]|0} ${acc[1]|0} ${acc[2]|0}`)}
function dots(){MD.innerHTML='';ORDER.forEach(m=>{const s=document.createElement('span');if(m===mode)s.className='active';MD.appendChild(s)});MD.classList.toggle('visible',mode!=='home')}
function ui(){
  const m=MODES[mode];ML.textContent=m.label;MV.textContent=m.value;MC.textContent=m.caption;MW.textContent=m.whisper;
  A.className=`app mode-${mode}${menu?' menu-open':''}${SP.classList.contains('open')?' settings-open':''}`;
  IP.classList.toggle('visible',mode==='insights');IP.setAttribute('aria-hidden',mode==='insights'?'false':'true');
  targetScale=mode==='insights'?.68:1;targetYShift=mode==='insights'?-H*.12:0;dots();positionMenu();
}
function hint(){if(first)return;first=true;MH.classList.add('hidden')}
function setMode(m,fx=true){if(!MODES[m])return;mode=m;pupilKick=1;modeFlash=1;ui();hint();if(fx)sfxMode(m);else setAudioMode(m);try{navigator.vibrate?.(8)}catch{}}
function tapPulse(x,y){TR.style.left=x+'px';TR.style.top=y+'px';TR.classList.remove('pulse');void TR.offsetWidth;TR.classList.add('pulse');ripples.push({x,y,life:1});pupilKick=1;sfxTap()}
function openMenu(){if(menu||!p.down||!p.inside)return;menu=true;selection=null;lastSelection=null;targetMenuMorph=1;RM.classList.add('open');RM.setAttribute('aria-hidden','false');A.classList.add('menu-open');positionMenu();hint();sfxHold();try{navigator.vibrate?.(12)}catch{}}
function closeMenu(commit=true){if(!menu)return;const chosen=selection;menu=false;selection=null;lastSelection=null;targetMenuMorph=0;RI.forEach(i=>i.classList.remove('active'));RM.classList.remove('open');RM.setAttribute('aria-hidden','true');A.classList.remove('menu-open');if(commit&&chosen)setMode(chosen)}
function choose(x,y){
  if(!menu)return;const e=eyeCenter(),dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy);
  if(d<R*.38)selection=null;else{const a=Math.atan2(dy,dx);if(a>-.25*Math.PI&&a<=.25*Math.PI)selection='food';else if(a>.25*Math.PI&&a<=.75*Math.PI)selection='sleep';else if(a<=-.25*Math.PI&&a>-.75*Math.PI)selection='sport';else selection='water'}
  RI.forEach(i=>i.classList.toggle('active',i.dataset.mode===selection));
  if(selection&&selection!==lastSelection){lastSelection=selection;sfxSelect();try{navigator.vibrate?.(4)}catch{}}
}
function openSettings(){closeMenu(false);SP.classList.add('open');SP.setAttribute('aria-hidden','false');A.classList.add('settings-open');hint();tone(MODES[mode].tone*3,.2,.01,'sine',.86)}
function closeSettings(){SP.classList.remove('open');SP.setAttribute('aria-hidden','true');A.classList.remove('settings-open');tone(MODES[mode].tone*3,.18,.008,'sine',1.08)}

function down(e){
  if(e.target.closest('button'))return;const x=e.clientX,y=e.clientY;if(!insideEye(x,y,1.12))return;
  if(soundEnabled)ensureAudio();
  p.id=e.pointerId;p.down=true;p.inside=true;p.startX=p.x=x;p.startY=p.y=y;p.startT=performance.now();p.lastMoveT=p.startT;p.lastMoveX=x;p.lastMoveY=y;p.speed=0;p.moved=false;
  const ec=eyeCenter(),dx=x-ec.x,dy=y-ec.y;p.angle=Math.atan2(dy,dx);p.dist=Math.hypot(dx,dy);trail=[{x,y,life:1}];movementAudio(x,y,0);
  try{S.setPointerCapture(e.pointerId)}catch{}clearTimeout(holdTimer);holdTimer=setTimeout(openMenu,560);targetEye.x=clamp(dx/W*30,-15,15);targetEye.y=clamp(dy/H*30,-13,13)
}
function move(e){
  if(!p.down||e.pointerId!==p.id)return;
  const x=e.clientX,y=e.clientY,now=performance.now(),dt=Math.max(1,now-p.lastMoveT),step=Math.hypot(x-p.lastMoveX,y-p.lastMoveY);
  p.speed=step/dt;p.lastMoveT=now;p.lastMoveX=x;p.lastMoveY=y;p.x=x;p.y=y;
  const ec=eyeCenter(),dx=x-ec.x,dy=y-ec.y;p.angle=Math.atan2(dy,dx);p.dist=Math.hypot(dx,dy);
  const moved=Math.hypot(x-p.startX,y-p.startY);if(moved>14){p.moved=true;if(!menu)clearTimeout(holdTimer)}
  targetEye.x=clamp(dx/W*32,-17,17);targetEye.y=clamp(dy/H*32,-15,15);trail.push({x,y,life:1});if(trail.length>18)trail.shift();movementAudio(x,y,p.speed);if(menu)choose(x,y)
}
function finish(e,cancel=false){
  if(!p.down||e.pointerId!==p.id)return;clearTimeout(holdTimer);stopMovementAudio();
  const x=e.clientX,y=e.clientY,dt=performance.now()-p.startT,dx=x-p.startX,dy=y-p.startY,dist=Math.hypot(dx,dy);
  p.down=false;p.inside=false;targetEye.x=targetEye.y=0;try{S.releasePointerCapture(e.pointerId)}catch{}p.id=null;
  if(cancel){closeMenu(false);return}if(menu){closeMenu(true);return}
  if(dt<380&&dist<22){tapPulse(x,y);hint();if(mode==='home'){MC.textContent='УДЕРЖИВАЙ ДЛЯ МЕНЮ';setTimeout(()=>{if(mode==='home')MC.textContent=MODES.home.caption},1200)}return}
  if(Math.abs(dx)>68&&Math.abs(dx)>Math.abs(dy)*1.18){const i=ORDER.indexOf(mode);streaks.push({x:p.startX,y:p.startY,dx,dy,life:1});sfxSwipe(dx<0?1:-1);setMode(dx<0?ORDER[(i+1)%ORDER.length]:ORDER[(i-1+ORDER.length)%ORDER.length],false);return}
  if(dy<-86&&Math.abs(dy)>Math.abs(dx)*1.1){streaks.push({x:p.startX,y:p.startY,dx,dy,life:1});sfxSwipe(1);setMode('insights',false);return}
  if(dy>86&&Math.abs(dy)>Math.abs(dx)*1.1){sfxSwipe(-1);openSettings()}
}

/* -------------------- VISUAL FX -------------------- */
function background(ec,r){
  X.clearRect(0,0,W,H);
  const g=X.createRadialGradient(ec.x,ec.y,r*.18,ec.x,ec.y,r*3);g.addColorStop(0,rgba(acc,.065+.05*modeFlash));g.addColorStop(.34,rgba(acc,.02));g.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=g;X.fillRect(0,0,W,H);
  ripples=ripples.filter(q=>q.life>.02);X.save();X.globalCompositeOperation='screen';
  for(const q of ripples){const rr=(1-q.life)*230;X.beginPath();X.arc(q.x,q.y,rr,0,Math.PI*2);X.strokeStyle=rgba(acc,q.life*.075);X.lineWidth=1;X.stroke();q.life*=.955}X.restore();
}
function modeFX(t,ec,r){
  if(mode==='sport'){
    const pr=.74,pulse=beatFlash;
    X.save();X.beginPath();X.arc(ec.x,ec.y,r*(1.095+pulse*.035),-Math.PI*.7,Math.PI*1.3);X.strokeStyle=rgba(acc,.08+pulse*.32);X.lineWidth=1.2+pulse*1.8;X.shadowBlur=12+pulse*24;X.shadowColor=rgba(acc,.42);X.stroke();
    X.beginPath();X.arc(ec.x,ec.y,r*1.095,-Math.PI*.7,-Math.PI*.7+Math.PI*2*pr);X.strokeStyle=rgba(acc,.92);X.lineWidth=1.8;X.stroke();X.restore();
  }
  if(mode==='water'){
    X.save();X.globalCompositeOperation='screen';
    for(let row=0;row<2;row++){X.beginPath();for(let k=0;k<=42;k++){const xx=ec.x-r*1.06+r*2.12*k/42,yy=ec.y+r*(.79+row*.08)+Math.sin(k/42*Math.PI*2+t*.0022+row*1.2)*r*(.032+waterFlash*.012);k?X.lineTo(xx,yy):X.moveTo(xx,yy)}X.strokeStyle=rgba(warm,.10+row*.04+waterFlash*.05);X.lineWidth=1;X.stroke()}
    X.restore();
    drops=drops.filter(d=>d.life>.02);for(const d of drops){X.beginPath();X.arc(d.x,d.y+(1-d.life)*32,3+(1-d.life)*14,0,Math.PI*2);X.strokeStyle=rgba(acc,d.life*.16);X.lineWidth=.8;X.stroke();d.life*=.94}
  }
  if(mode==='food'){
    X.save();X.globalCompositeOperation='screen';for(let k=0;k<18;k++){const a=rnd(k*2.4)*Math.PI*2+t*.00022*(k%2?1:-1),rr=r*(.95+rnd(k*3.7)*.23);X.beginPath();X.arc(ec.x+Math.cos(a)*rr,ec.y+Math.sin(a)*rr,1+rnd(k*8.1)*1.8,0,Math.PI*2);X.fillStyle=k%3?rgba(acc,.09):rgba(warm,.13);X.fill()}X.restore();
  }
  if(mode==='sleep'){
    X.save();const glow=.025+breathFlash*.055;const gg=X.createRadialGradient(ec.x,ec.y,0,ec.x,ec.y,r*1.7);gg.addColorStop(0,rgba(acc,glow));gg.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=gg;X.fillRect(ec.x-r*1.8,ec.y-r*1.8,r*3.6,r*3.6);X.restore();
  }
  if(mode==='insights'&&crystalFlash>.02){X.save();X.globalCompositeOperation='screen';for(let k=0;k<8;k++){const a=k/8*Math.PI*2+t*.0002,rr=r*(1.05+k%2*.12);X.beginPath();X.arc(ec.x+Math.cos(a)*rr,ec.y+Math.sin(a)*rr,1.2+crystalFlash*2,0,Math.PI*2);X.fillStyle=rgba(acc,.12*crystalFlash);X.fill()}X.restore()}
}
function drawMotionFX(){
  trail=trail.filter(q=>q.life>.03);if(trail.length){X.save();X.globalCompositeOperation='screen';for(let k=1;k<trail.length;k++){const a=trail[k-1],b=trail[k];X.beginPath();X.moveTo(a.x,a.y);X.lineTo(b.x,b.y);X.strokeStyle=rgba(acc,.12*b.life);X.lineWidth=1+b.life*1.4;X.stroke();a.life*=.91;b.life*=.94}X.restore()}
  streaks=streaks.filter(q=>q.life>.02);if(streaks.length){X.save();X.globalCompositeOperation='screen';for(const q of streaks){const ex=q.x+q.dx*(1.08-q.life*.08),ey=q.y+q.dy*(1.08-q.life*.08);X.beginPath();X.moveTo(q.x,q.y);X.lineTo(ex,ey);X.strokeStyle=rgba(acc,.18*q.life);X.lineWidth=1.4;X.stroke();q.life*=.90}X.restore()}
}
function drawMenuSpokes(ec,r){if(menuMorph<.01)return;X.save();X.globalCompositeOperation='screen';const ease=1-Math.pow(1-menuMorph,3),len=r*(.52+.55*ease);for(let k=0;k<4;k++){const a=-Math.PI/2+k*Math.PI/2;X.beginPath();X.moveTo(ec.x+Math.cos(a)*r*.26,ec.y+Math.sin(a)*r*.26);X.lineTo(ec.x+Math.cos(a)*len,ec.y+Math.sin(a)*len);X.strokeStyle=rgba(acc,.05+.16*ease);X.lineWidth=.75;X.stroke();const px=ec.x+Math.cos(a)*len,py=ec.y+Math.sin(a)*len;X.beginPath();X.arc(px,py,1.5+2*ease,0,Math.PI*2);X.fillStyle=rgba(acc,.18+.5*ease);X.fill()}X.restore()}

function eyeDraw(t){
  palette();scale=lerp(scale,targetScale,.06);yShift=lerp(yShift,targetYShift,.06);eye.x=lerp(eye.x,targetEye.x,.08);eye.y=lerp(eye.y,targetEye.y,.08);
  menuMorph=lerp(menuMorph,targetMenuMorph,.12);pupilKick=lerp(pupilKick,0,.05);modeFlash=lerp(modeFlash,0,.06);beatFlash=lerp(beatFlash,0,.12);breathFlash=lerp(breathFlash,0,.018);waterFlash=lerp(waterFlash,0,.08);crystalFlash=lerp(crystalFlash,0,.07);
  const ec=eyeCenter(),r=R*scale*(1+Math.sin(t*.00082)*.01);positionMenu();background(ec,r);modeFX(t,ec,r);drawMotionFX();
  X.save();X.translate(ec.x,ec.y);
  for(let k=0;k<6;k++){X.beginPath();X.arc(0,0,r*(1.025+k*.047),0,Math.PI*2);X.strokeStyle=rgba(acc,.05-k*.006);X.lineWidth=.55;X.stroke()}
  const base=X.createRadialGradient(0,0,r*.08,0,0,r*1.02);base.addColorStop(0,'rgba(0,0,0,1)');base.addColorStop(.17,rgba(inn,.86));base.addColorStop(.4,rgba(acc,.45));base.addColorStop(.75,rgba(inn,.32));base.addColorStop(1,'rgba(2,4,6,.08)');X.beginPath();X.arc(0,0,r,0,Math.PI*2);X.fillStyle=base;X.fill();
  X.save();X.beginPath();X.arc(0,0,r*.995,0,Math.PI*2);X.clip();X.globalCompositeOperation='screen';
  for(let k=0;k<fibers.length;k++){
    const f=fibers[k],j=Math.sin(t*.0012+f.s*20)*.009,a=f.a+j;
    const influence=p.down?Math.exp(-Math.pow(ad(a,p.angle),2)/.14)*clamp(1.18-p.dist/(r*1.25),0,1):0;
    const r1=r*(f.ri-influence*.015),r2=r*(f.ro+influence*.035),m=(r1+r2)*.52,ma=a+f.b*.38+Math.sin(f.s*18+t*.0005)*.013;
    X.beginPath();X.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);X.quadraticCurveTo(Math.cos(ma)*m,Math.sin(ma)*m,Math.cos(a+f.b+influence*.018)*r2,Math.sin(a+f.b+influence*.018)*r2);
    X.strokeStyle=f.hot?rgba(warm,f.al*.75*(1+influence)):rgba(acc,f.al*(1+influence));X.lineWidth=f.w+influence*.5;X.stroke();
  }
  X.globalCompositeOperation='source-over';for(const c of crypts){X.beginPath();X.moveTo(Math.cos(c.a)*r*c.r1,Math.sin(c.a)*r*c.r1);X.lineTo(Math.cos(c.a+.018)*r*c.r2,Math.sin(c.a+.018)*r*c.r2);X.strokeStyle=`rgba(0,0,0,${c.al})`;X.lineWidth=c.w;X.stroke()}
  const glass=X.createLinearGradient(-r*.7,-r*.6,r*.75,r*.65);glass.addColorStop(0,'rgba(255,255,255,.13)');glass.addColorStop(.28,'rgba(255,255,255,.015)');glass.addColorStop(.68,rgba(acc,.07));glass.addColorStop(1,'rgba(255,255,255,0)');X.fillStyle=glass;X.beginPath();X.arc(0,0,r*.98,0,Math.PI*2);X.fill();X.restore();
  const rim=X.createRadialGradient(0,0,r*.82,0,0,r*1.06);rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(.78,rgba(acc,.055));rim.addColorStop(.92,'rgba(2,5,7,.75)');rim.addColorStop(1,'rgba(0,0,0,.99)');X.beginPath();X.arc(0,0,r*1.06,0,Math.PI*2);X.fillStyle=rim;X.fill();
  const pupil=r*(.215+menuMorph*.09+pupilKick*.024+beatFlash*.008+Math.sin(t*.0005)*.006);const pg=X.createRadialGradient(-pupil*.14,-pupil*.14,pupil*.04,0,0,pupil*1.2);pg.addColorStop(0,'#090b0d');pg.addColorStop(.72,'#000');pg.addColorStop(1,rgba(acc,.035));X.beginPath();X.arc(0,0,pupil,0,Math.PI*2);X.fillStyle=pg;X.fill();X.beginPath();X.arc(0,0,pupil*1.02,0,Math.PI*2);X.strokeStyle=rgba(acc,.17);X.lineWidth=.7;X.stroke();
  X.save();X.globalCompositeOperation='screen';const hx=-r*.24,hy=-r*.30,hg=X.createRadialGradient(hx,hy,0,hx,hy,r*.16);hg.addColorStop(0,'rgba(255,255,255,.36)');hg.addColorStop(.18,'rgba(255,255,255,.14)');hg.addColorStop(1,'rgba(255,255,255,0)');X.fillStyle=hg;X.beginPath();X.arc(hx,hy,r*.16,0,Math.PI*2);X.fill();X.restore();
  if(mode==='sleep'){const close=.39+Math.sin(t*.00055)*.014+breathFlash*.018;X.fillStyle='rgba(0,0,0,.988)';X.beginPath();X.ellipse(0,-r*(1.05-close),r*1.36,r*.84,0,0,Math.PI*2);X.fill();X.beginPath();X.ellipse(0,r*(1.05-close),r*1.36,r*.84,0,0,Math.PI*2);X.fill()}
  X.restore();drawMenuSpokes(ec,r);
  X.save();X.globalCompositeOperation='screen';for(let k=0;k<dust.length;k++){const d=dust[k],a=d.a+t*.000015*(k%2?1:-1),rr=r*d.r;X.beginPath();X.arc(ec.x+Math.cos(a)*rr,ec.y+Math.sin(a)*rr,d.s,0,Math.PI*2);X.fillStyle=rgba(acc,d.al);X.fill()}X.restore();
  requestAnimationFrame(eyeDraw);
}

RI.forEach(i=>i.addEventListener('click',e=>{e.stopPropagation();if(soundEnabled)ensureAudio();selection=i.dataset.mode;sfxSelect();closeMenu(true)}));
ST.addEventListener('click',()=>{if(soundEnabled)ensureAudio();openSettings()});
document.querySelectorAll('[data-close-settings]').forEach(el=>el.addEventListener('click',closeSettings));
soundToggle?.addEventListener('click',e=>{e.stopPropagation();setSound(!soundEnabled)});
soundSettings?.addEventListener('click',e=>{e.stopPropagation();setSound(!soundEnabled)});
document.addEventListener('pointerdown',()=>{if(soundEnabled)ensureAudio()},{capture:true});
S.addEventListener('pointerdown',down);S.addEventListener('pointermove',move);S.addEventListener('pointerup',e=>finish(e,false));S.addEventListener('pointercancel',e=>finish(e,true));S.addEventListener('lostpointercapture',e=>{if(p.down&&e.pointerId===p.id)finish(e,true)});
addEventListener('resize',resize,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(holdTimer);p.down=false;p.id=null;closeMenu(false);targetEye.x=targetEye.y=0;stopMovementAudio()}});

resize();ui();updateSoundUI();requestAnimationFrame(eyeDraw);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=iris08').catch(()=>{}));
})();
