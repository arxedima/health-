(()=>{
'use strict';

const $=s=>document.querySelector(s);
const C=$('#irisCanvas'),X=C.getContext('2d',{alpha:true}),A=$('#app'),S=$('#stage');
const ML=$('#metricLabel'),MV=$('#metricValue'),MC=$('#metricCaption'),RM=$('#radialMenu');
const RI=[...document.querySelectorAll('.radial-item')],TR=$('#touchRing'),MH=$('#motionHint'),MD=$('#modeDots');
const SP=$('#settingsPanel'),ST=$('#settingsTrigger'),IP=$('#insightPanel'),MW=$('#modeWhisper');
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
let fibers=[],crypts=[],dust=[],ripples=[],trail=[],streaks=[];
let p={id:null,down:false,inside:false,startX:0,startY:0,x:0,y:0,startT:0,angle:0,dist:0,moved:false,lastMoveT:0,lastMoveX:0,lastMoveY:0,speed:0};
let holdTimer=0,menu=false,selection=null,lastSelection=null,menuMorph=0,targetMenuMorph=0,pupilKick=0,first=false,modeFlash=0;

const rnd=n=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const lc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const rgba=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const ad=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d};

let soundEnabled=localStorage.getItem('irisSound')!=='off';
let audio=null,musicTimer=0;
function updateSoundUI(){
  soundToggle?.classList.toggle('active',soundEnabled);
  soundToggle?.classList.toggle('muted',!soundEnabled);
  soundToggle?.setAttribute('aria-pressed',soundEnabled?'true':'false');
  if(soundState)soundState.textContent=soundEnabled?'ВКЛ':'ВЫКЛ';
  soundSettings?.classList.toggle('off',!soundEnabled);
}
function makeNoiseBuffer(ctx,duration=.35){
  const b=ctx.createBuffer(1,Math.max(1,ctx.sampleRate*duration|0),ctx.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
  return b;
}
function ensureAudio(){
  if(!soundEnabled)return null;
  if(audio){if(audio.ctx.state==='suspended')audio.ctx.resume().catch(()=>{});return audio.ctx}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  const ctx=new AC();
  const master=ctx.createGain(),compressor=ctx.createDynamicsCompressor();
  master.gain.value=.0001;master.connect(compressor);compressor.connect(ctx.destination);
  compressor.threshold.value=-20;compressor.knee.value=18;compressor.ratio.value=4;compressor.attack.value=.01;compressor.release.value=.2;

  const padGain=ctx.createGain(),padFilter=ctx.createBiquadFilter();
  padGain.gain.value=.055;padFilter.type='lowpass';padFilter.frequency.value=520;padFilter.Q.value=.4;
  padFilter.connect(padGain);padGain.connect(master);
  const o1=ctx.createOscillator(),o2=ctx.createOscillator();
  o1.type='sine';o2.type='triangle';o1.frequency.value=MODES[mode].tone;o2.frequency.value=MODES[mode].tone*1.503;
  const og1=ctx.createGain(),og2=ctx.createGain();og1.gain.value=.55;og2.gain.value=.12;o1.connect(og1);o2.connect(og2);og1.connect(padFilter);og2.connect(padFilter);o1.start();o2.start();

  const lfo=ctx.createOscillator(),lfoG=ctx.createGain();lfo.type='sine';lfo.frequency.value=.075;lfoG.gain.value=.012;lfo.connect(lfoG);lfoG.connect(padGain.gain);lfo.start();

  const movement=ctx.createOscillator(),moveGain=ctx.createGain(),moveFilter=ctx.createBiquadFilter();
  movement.type='sine';movement.frequency.value=240;moveGain.gain.value=0;moveFilter.type='bandpass';moveFilter.frequency.value=900;moveFilter.Q.value=.8;
  movement.connect(moveFilter);moveFilter.connect(moveGain);moveGain.connect(master);movement.start();

  let pan=null;if(ctx.createStereoPanner){pan=ctx.createStereoPanner();moveGain.disconnect();moveGain.connect(pan);pan.connect(master)}

  audio={ctx,master,padGain,padFilter,o1,o2,movement,moveGain,moveFilter,pan,noise:makeNoiseBuffer(ctx,.7)};
  master.gain.exponentialRampToValueAtTime(.11,ctx.currentTime+.7);
  setAudioMode(mode,.01);
  clearInterval(musicTimer);
  musicTimer=setInterval(()=>ambientNote(),4200);
  return ctx;
}
function setSound(on){
  soundEnabled=!!on;localStorage.setItem('irisSound',soundEnabled?'on':'off');updateSoundUI();
  if(soundEnabled){const ctx=ensureAudio();if(ctx&&audio){audio.master.gain.cancelScheduledValues(ctx.currentTime);audio.master.gain.setTargetAtTime(.11,ctx.currentTime,.16)}}
  else if(audio){const c=audio.ctx;audio.master.gain.cancelScheduledValues(c.currentTime);audio.master.gain.setTargetAtTime(.0001,c.currentTime,.1);setTimeout(()=>{if(!soundEnabled&&audio?.ctx.state==='running')audio.ctx.suspend().catch(()=>{})},450)}
}
function setAudioMode(m,tc=.3){if(!audio)return;const c=audio.ctx,t=MODES[m].tone;audio.o1.frequency.setTargetAtTime(t,c.currentTime,tc);audio.o2.frequency.setTargetAtTime(t*1.503,c.currentTime,tc);audio.padFilter.frequency.setTargetAtTime(m==='sleep'?330:m==='sport'?700:520,c.currentTime,.3)}
function tone(freq,dur=.22,gain=.035,type='sine',slide=1){
  const c=ensureAudio();if(!c||!audio)return;const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*slide),c.currentTime+dur);
  f.type='lowpass';f.frequency.value=2600;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(gain,c.currentTime+.018);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);
  o.connect(f);f.connect(g);g.connect(audio.master);o.start();o.stop(c.currentTime+dur+.04);
}
function noiseWhoosh(dur=.26,gain=.035,cut=1200){
  const c=ensureAudio();if(!c||!audio)return;const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=audio.noise;f.type='bandpass';f.frequency.setValueAtTime(cut,c.currentTime);f.frequency.exponentialRampToValueAtTime(cut*1.8,c.currentTime+dur);f.Q.value=.8;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(gain,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);src.connect(f);f.connect(g);g.connect(audio.master);src.start();src.stop(c.currentTime+dur+.03)
}
function ambientNote(){if(!soundEnabled||!audio||audio.ctx.state!=='running')return;const root=MODES[mode].tone;tone(root*2,.95,.006,'sine',1.002);setTimeout(()=>tone(root*3,.7,.004,'sine',.998),420)}
function sfxTap(){tone(MODES[mode].tone*4,.18,.028,'sine',1.12);tone(MODES[mode].tone*6,.25,.012,'sine',.92)}
function sfxHold(){noiseWhoosh(.38,.028,480);tone(MODES[mode].tone,.55,.042,'sine',1.32);setTimeout(()=>tone(MODES[mode].tone*4,.34,.015,'sine',1.08),110)}
function sfxSelect(){tone(MODES[mode].tone*5,.09,.018,'triangle',1.04)}
function sfxSwipe(dir=1){noiseWhoosh(.28,.045,dir>0?720:1050);tone(MODES[mode].tone*2.4,.25,.017,'sine',dir>0?1.25:.8)}
function sfxMode(m){setAudioMode(m);tone(MODES[m].tone*2,.46,.022,'sine',1.01);setTimeout(()=>tone(MODES[m].tone*3,.36,.009,'sine',.995),80)}
function movementAudio(x,y,speed){if(!audio||!soundEnabled)return;const c=audio.ctx,e=eyeCenter(),nx=clamp((x-e.x)/(R*scale),-1,1),ny=clamp((y-e.y)/(R*scale),-1,1),v=clamp(speed/1.2,0,1);audio.movement.frequency.setTargetAtTime(190+(ny+1)*120,c.currentTime,.035);audio.moveFilter.frequency.setTargetAtTime(650+(1-Math.abs(nx))*1100,c.currentTime,.04);audio.moveGain.gain.setTargetAtTime(.002+v*.018,c.currentTime,.035);if(audio.pan)audio.pan.pan.setTargetAtTime(nx*.75,c.currentTime,.04)}
function stopMovementAudio(){if(audio)audio.moveGain.gain.setTargetAtTime(0,audio.ctx.currentTime,.06)}
updateSoundUI();

function eyeCenter(){return{x:cx+eye.x,y:cy+yShift+eye.y}}
function build(){
  fibers=[];crypts=[];dust=[];
  const n=clamp(Math.floor(R*4.7),540,840);
  for(let k=0;k<n;k++)fibers.push({a:k/n*Math.PI*2+(rnd(k)-.5)*.052,ri:.2+rnd(k*3.7)*.18,ro:.68+rnd(k*8.1)*.31,w:.17+rnd(k*5.4)*.98,al:.044+rnd(k*7.2)*.25,b:(rnd(k*9.4)-.5)*.31,hot:rnd(k*11.1)>.84,s:rnd(k*13.5)});
  for(let k=0;k<62;k++)crypts.push({a:k/62*Math.PI*2+rnd(k*9.3)*.13,r1:.33+rnd(k*2.1)*.18,r2:.63+rnd(k*4.8)*.25,w:.45+rnd(k*5.7)*1.7,al:.11+rnd(k*8.4)*.20});
  for(let k=0;k<110;k++)dust.push({a:rnd(k*1.9)*Math.PI*2,r:.95+rnd(k*3.1)*.36,s:.35+rnd(k*4.9)*1.25,al:.028+rnd(k*7.7)*.14});
}
function resize(){D=Math.min(2,devicePixelRatio||1);W=Math.floor(innerWidth);H=Math.floor(innerHeight);C.width=W*D;C.height=H*D;C.style.width=W+'px';C.style.height=H+'px';X.setTransform(D,0,0,D,0,0);cx=W/2;cy=H*.455;R=Math.min(W*.405,H*.235,212);build();positionMenu()}
function positionMenu(){const e=eyeCenter();RM.style.left=e.x+'px';RM.style.top=e.y+'px'}
function insideEye(x,y,mult=1.08){const e=eyeCenter(),rr=R*scale*mult;return Math.hypot(x-e.x,y-e.y)<=rr}
function palette(){const m=MODES[mode];acc=lc(acc,m.a,.03);inn=lc(inn,m.i,.03);warm=lc(warm,m.w,.03);document.documentElement.style.setProperty('--accent',`${acc[0]|0} ${acc[1]|0} ${acc[2]|0}`)}
function ui(){const m=MODES[mode];ML.textContent=m.label;MV.textContent=m.value;MC.textContent=m.caption;MW.textContent=m.whisper;A.className=`app mode-${mode}${menu?' menu-open':''}${SP.classList.contains('open')?' settings-open':''}`;IP.classList.toggle('visible',mode==='insights');IP.setAttribute('aria-hidden',mode==='insights'?'false':'true');targetScale=mode==='insights'?.68:1;targetYShift=mode==='insights'?-H*.12:0;dots();positionMenu()}
function dots(){MD.innerHTML='';ORDER.forEach(m=>{const s=document.createElement('span');if(m===mode)s.className='active';MD.appendChild(s)});MD.classList.toggle('visible',mode!=='home')}
function hint(){if(first)return;first=true;MH.classList.add('hidden')}
function setMode(m,fx=true){if(!MODES[m])return;mode=m;pupilKick=1;modeFlash=1;ui();hint();if(fx)sfxMode(m);try{navigator.vibrate?.(8)}catch{}}
function tapPulse(x,y){TR.style.left=x+'px';TR.style.top=y+'px';TR.classList.remove('pulse');void TR.offsetWidth;TR.classList.add('pulse');ripples.push({x,y,life:1});pupilKick=1;sfxTap()}
function openMenu(){if(menu||!p.down||!p.inside)return;menu=true;selection=null;lastSelection=null;targetMenuMorph=1;RM.classList.add('open');RM.setAttribute('aria-hidden','false');A.classList.add('menu-open');positionMenu();hint();sfxHold();try{navigator.vibrate?.(12)}catch{}}
function closeMenu(commit=true){if(!menu)return;const chosen=selection;menu=false;selection=null;lastSelection=null;targetMenuMorph=0;RI.forEach(i=>i.classList.remove('active'));RM.classList.remove('open');RM.setAttribute('aria-hidden','true');A.classList.remove('menu-open');if(commit&&chosen)setMode(chosen)}
function choose(x,y){
  if(!menu)return;const e=eyeCenter(),dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy);
  if(d<R*.38)selection=null;else{const a=Math.atan2(dy,dx);if(a>-.25*Math.PI&&a<=.25*Math.PI)selection='food';else if(a>.25*Math.PI&&a<=.75*Math.PI)selection='sleep';else if(a<=-.25*Math.PI&&a>-.75*Math.PI)selection='sport';else selection='water'}
  RI.forEach(i=>i.classList.toggle('active',i.dataset.mode===selection));
  if(selection&&selection!==lastSelection){lastSelection=selection;sfxSelect();try{navigator.vibrate?.(4)}catch{}}
}
function openSettings(){closeMenu(false);SP.classList.add('open');SP.setAttribute('aria-hidden','false');A.classList.add('settings-open');hint();tone(MODES[mode].tone*3,.2,.012,'sine',.86)}
function closeSettings(){SP.classList.remove('open');SP.setAttribute('aria-hidden','true');A.classList.remove('settings-open');tone(MODES[mode].tone*3,.18,.01,'sine',1.08)}

function down(e){
  if(e.target.closest('button'))return;const x=e.clientX,y=e.clientY;if(!insideEye(x,y,1.12))return;
  if(soundEnabled)ensureAudio();
  p.id=e.pointerId;p.down=true;p.inside=true;p.startX=p.x=x;p.startY=p.y=y;p.startT=performance.now();p.lastMoveT=p.startT;p.lastMoveX=x;p.lastMoveY=y;p.speed=0;p.moved=false;
  const ec=eyeCenter(),dx=x-ec.x,dy=y-ec.y;p.angle=Math.atan2(dy,dx);p.dist=Math.hypot(dx,dy);trail=[{x,y,life:1}];movementAudio(x,y,0);
  try{S.setPointerCapture(e.pointerId)}catch{}clearTimeout(holdTimer);holdTimer=setTimeout(openMenu,560);targetEye.x=clamp(dx/W*30,-15,15);targetEye.y=clamp(dy/H*30,-13,13)
}
function move(e){
  if(!p.down||e.pointerId!==p.id)return;const x=e.clientX,y=e.clientY,now=performance.now(),dt=Math.max(1,now-p.lastMoveT),step=Math.hypot(x-p.lastMoveX,y-p.lastMoveY);p.speed=step/dt;p.lastMoveT=now;p.lastMoveX=x;p.lastMoveY=y;p.x=x;p.y=y;
  const ec=eyeCenter(),dx=x-ec.x,dy=y-ec.y;p.angle=Math.atan2(dy,dx);p.dist=Math.hypot(dx,dy);const moved=Math.hypot(x-p.startX,y-p.startY);if(moved>14){p.moved=true;if(!menu)clearTimeout(holdTimer)}
  targetEye.x=clamp(dx/W*32,-17,17);targetEye.y=clamp(dy/H*32,-15,15);trail.push({x,y,life:1});if(trail.length>18)trail.shift();movementAudio(x,y,p.speed);if(menu)choose(x,y)
}
function finish(e,cancel=false){
  if(!p.down||e.pointerId!==p.id)return;clearTimeout(holdTimer);stopMovementAudio();const x=e.clientX,y=e.clientY,dt=performance.now()-p.startT,dx=x-p.startX,dy=y-p.startY,dist=Math.hypot(dx,dy);p.down=false;p.inside=false;targetEye.x=targetEye.y=0;
  try{S.releasePointerCapture(e.pointerId)}catch{}p.id=null;if(cancel){closeMenu(false);return}if(menu){closeMenu(true);return}
  if(dt<380&&dist<22){tapPulse(x,y);hint();if(mode==='home'){MC.textContent='УДЕРЖИВАЙ ДЛЯ МЕНЮ';setTimeout(()=>{if(mode==='home')MC.textContent=MODES.home.caption},1200)}return}
  if(Math.abs(dx)>68&&Math.abs(dx)>Math.abs(dy)*1.18){const i=ORDER.indexOf(mode);streaks.push({x:p.startX,y:p.startY,dx,dy,life:1});sfxSwipe(dx<0?1:-1);setMode(dx<0?ORDER[(i+1)%ORDER.length]:ORDER[(i-1+ORDER.length)%ORDER.length],false);return}
  if(dy<-86&&Math.abs(dy)>Math.abs(dx)*1.1){streaks.push({x:p.startX,y:p.startY,dx,dy,life:1});sfxSwipe(1);setMode('insights',false);return}
  if(dy>86&&Math.abs(dy)>Math.abs(dx)*1.1){streaks.push({x:p.startX,y:p.startY,dx,dy,life:1});sfxSwipe(-1);openSettings()}
}

function background(ec,r){
  X.clearRect(0,0,W,H);const g=X.createRadialGradient(ec.x,ec.y,r*.18,ec.x,ec.y,r*3);g.addColorStop(0,rgba(acc,.065+.025*modeFlash));g.addColorStop(.34,rgba(acc,.02));g.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=g;X.fillRect(0,0,W,H);
  ripples=ripples.filter(q=>q.life>.02);X.save();X.globalCompositeOperation='screen';for(const q of ripples){const rr=(1-q.life)*230;X.beginPath();X.arc(q.x,q.y,rr,0,Math.PI*2);X.strokeStyle=rgba(acc,q.life*.075);X.lineWidth=1;X.stroke();q.life*=.955}X.restore();
}
function drawMotionFX(){
  trail=trail.filter(q=>q.life>.04);if(trail.length>1){X.save();X.globalCompositeOperation='screen';X.lineCap='round';for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i];X.beginPath();X.moveTo(a.x,a.y);X.lineTo(b.x,b.y);X.strokeStyle=rgba(acc,.028*Math.min(a.life,b.life));X.lineWidth=1.2+2*Math.min(a.life,b.life);X.stroke();a.life*=.87}trail[trail.length-1].life*=.9;X.restore()}
  streaks=streaks.filter(s=>s.life>.03);X.save();X.globalCompositeOperation='screen';for(const s of streaks){const t=1-s.life;const ex=s.x+s.dx*(.25+.75*t),ey=s.y+s.dy*(.25+.75*t);X.beginPath();X.moveTo(s.x+s.dx*t*.2,s.y+s.dy*t*.2);X.lineTo(ex,ey);X.strokeStyle=rgba(acc,.11*s.life);X.lineWidth=1.5;X.stroke();s.life*=.88}X.restore();
}
function modeFX(t,ec,r){
  if(mode==='sport'){const pr=.74;X.save();X.beginPath();X.arc(ec.x,ec.y,r*1.095,-Math.PI*.7,Math.PI*1.3);X.strokeStyle='rgba(255,255,255,.075)';X.lineWidth=1.2;X.stroke();X.beginPath();X.arc(ec.x,ec.y,r*1.095,-Math.PI*.7,-Math.PI*.7+Math.PI*2*pr);X.strokeStyle=rgba(acc,.92);X.lineWidth=1.8;X.shadowBlur=12;X.shadowColor=rgba(acc,.42);X.stroke();X.restore()}
  if(mode==='water'){X.save();X.globalCompositeOperation='screen';X.beginPath();for(let k=0;k<=42;k++){const xx=ec.x-r*1.04+r*2.08*k/42,yy=ec.y+r*.83+Math.sin(k/42*Math.PI*2+t*.0024)*r*.035;k?X.lineTo(xx,yy):X.moveTo(xx,yy)}X.strokeStyle=rgba(warm,.15);X.lineWidth=1.1;X.stroke();X.restore()}
  if(mode==='food'){X.save();X.globalCompositeOperation='screen';for(let k=0;k<16;k++){const a=rnd(k*2.4)*Math.PI*2+t*.00023*(k%2?1:-1),rr=r*(.96+rnd(k*3.7)*.2);X.beginPath();X.arc(ec.x+Math.cos(a)*rr,ec.y+Math.sin(a)*rr,1+rnd(k*8.1)*1.7,0,Math.PI*2);X.fillStyle=k%3?rgba(acc,.09):rgba(warm,.13);X.fill()}X.restore()}
}
function drawMenuSpokes(ec,r){if(menuMorph<.01)return;X.save();X.globalCompositeOperation='screen';const ease=1-Math.pow(1-menuMorph,3),len=r*(.52+.55*ease);for(let k=0;k<4;k++){const a=-Math.PI/2+k*Math.PI/2;X.beginPath();X.moveTo(ec.x+Math.cos(a)*r*.26,ec.y+Math.sin(a)*r*.26);X.lineTo(ec.x+Math.cos(a)*len,ec.y+Math.sin(a)*len);X.strokeStyle=rgba(acc,.05+.16*ease);X.lineWidth=.75;X.stroke();const px=ec.x+Math.cos(a)*len,py=ec.y+Math.sin(a)*len;X.beginPath();X.arc(px,py,1.5+2*ease,0,Math.PI*2);X.fillStyle=rgba(acc,.18+.5*ease);X.fill()}X.restore()}

function eyeDraw(t){
  palette();scale=lerp(scale,targetScale,.06);yShift=lerp(yShift,targetYShift,.06);eye.x=lerp(eye.x,targetEye.x,.08);eye.y=lerp(eye.y,targetEye.y,.08);menuMorph=lerp(menuMorph,targetMenuMorph,.12);pupilKick=lerp(pupilKick,0,.05);modeFlash=lerp(modeFlash,0,.06);
  const ec=eyeCenter(),r=R*scale*(1+Math.sin(t*.00082)*.01);positionMenu();background(ec,r);modeFX(t,ec,r);drawMotionFX();
  X.save();X.translate(ec.x,ec.y);
  for(let k=0;k<6;k++){X.beginPath();X.arc(0,0,r*(1.025+k*.047),0,Math.PI*2);X.strokeStyle=rgba(acc,.05-k*.006);X.lineWidth=.55;X.stroke()}
  const base=X.createRadialGradient(0,0,r*.08,0,0,r*1.02);base.addColorStop(0,'rgba(0,0,0,1)');base.addColorStop(.17,rgba(inn,.86));base.addColorStop(.4,rgba(acc,.45));base.addColorStop(.75,rgba(inn,.32));base.addColorStop(1,'rgba(2,4,6,.08)');X.beginPath();X.arc(0,0,r,0,Math.PI*2);X.fillStyle=base;X.fill();
  X.save();X.beginPath();X.arc(0,0,r*.995,0,Math.PI*2);X.clip();X.globalCompositeOperation='screen';
  for(let k=0;k<fibers.length;k++){
    const f=fibers[k],j=Math.sin(t*.0012+f.s*20)*.009,a=f.a+j;const influence=p.down?Math.exp(-Math.pow(ad(a,p.angle),2)/.14)*clamp(1.18-p.dist/(r*1.25),0,1):0;
    const r1=r*(f.ri-influence*.015),r2=r*(f.ro+influence*.035),m=(r1+r2)*.52,ma=a+f.b*.38+Math.sin(f.s*18+t*.0005)*.013;
    X.beginPath();X.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);X.quadraticCurveTo(Math.cos(ma)*m,Math.sin(ma)*m,Math.cos(a+f.b+influence*.018)*r2,Math.sin(a+f.b+influence*.018)*r2);X.strokeStyle=f.hot?rgba(warm,f.al*.75*(1+influence)):rgba(acc,f.al*(1+influence));X.lineWidth=f.w+influence*.5;X.stroke()
  }
  X.globalCompositeOperation='source-over';for(const c of crypts){X.beginPath();X.moveTo(Math.cos(c.a)*r*c.r1,Math.sin(c.a)*r*c.r1);X.lineTo(Math.cos(c.a+.018)*r*c.r2,Math.sin(c.a+.018)*r*c.r2);X.strokeStyle=`rgba(0,0,0,${c.al})`;X.lineWidth=c.w;X.stroke()}
  const glass=X.createLinearGradient(-r*.7,-r*.6,r*.75,r*.65);glass.addColorStop(0,'rgba(255,255,255,.13)');glass.addColorStop(.28,'rgba(255,255,255,.015)');glass.addColorStop(.68,rgba(acc,.07));glass.addColorStop(1,'rgba(255,255,255,0)');X.fillStyle=glass;X.beginPath();X.arc(0,0,r*.98,0,Math.PI*2);X.fill();X.restore();
  const rim=X.createRadialGradient(0,0,r*.82,0,0,r*1.06);rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(.78,rgba(acc,.055));rim.addColorStop(.92,'rgba(2,5,7,.75)');rim.addColorStop(1,'rgba(0,0,0,.99)');X.beginPath();X.arc(0,0,r*1.06,0,Math.PI*2);X.fillStyle=rim;X.fill();
  const pupil=r*(.215+menuMorph*.09+pupilKick*.024+Math.sin(t*.0005)*.006);const pg=X.createRadialGradient(-pupil*.14,-pupil*.14,pupil*.04,0,0,pupil*1.2);pg.addColorStop(0,'#090b0d');pg.addColorStop(.72,'#000');pg.addColorStop(1,rgba(acc,.035));X.beginPath();X.arc(0,0,pupil,0,Math.PI*2);X.fillStyle=pg;X.fill();X.beginPath();X.arc(0,0,pupil*1.02,0,Math.PI*2);X.strokeStyle=rgba(acc,.17);X.lineWidth=.7;X.stroke();
  X.save();X.globalCompositeOperation='screen';const hx=-r*.24,hy=-r*.30,hg=X.createRadialGradient(hx,hy,0,hx,hy,r*.16);hg.addColorStop(0,'rgba(255,255,255,.36)');hg.addColorStop(.18,'rgba(255,255,255,.14)');hg.addColorStop(1,'rgba(255,255,255,0)');X.fillStyle=hg;X.beginPath();X.arc(hx,hy,r*.16,0,Math.PI*2);X.fill();X.restore();
  if(mode==='sleep'){const close=.39+Math.sin(t*.00055)*.014;X.fillStyle='rgba(0,0,0,.988)';X.beginPath();X.ellipse(0,-r*(1.05-close),r*1.36,r*.84,0,0,Math.PI*2);X.fill();X.beginPath();X.ellipse(0,r*(1.05-close),r*1.36,r*.84,0,0,Math.PI*2);X.fill()}
  X.restore();drawMenuSpokes(ec,r);
  X.save();X.globalCompositeOperation='screen';for(let k=0;k<dust.length;k++){const d=dust[k],a=d.a+t*.000015*(k%2?1:-1),rr=r*d.r;X.beginPath();X.arc(ec.x+Math.cos(a)*rr,ec.y+Math.sin(a)*rr,d.s,0,Math.PI*2);X.fillStyle=rgba(acc,d.al);X.fill()}X.restore();
  requestAnimationFrame(eyeDraw)
}

RI.forEach(i=>i.addEventListener('click',e=>{e.stopPropagation();if(soundEnabled)ensureAudio();selection=i.dataset.mode;sfxSelect();closeMenu(true)}));
ST.addEventListener('click',()=>{if(soundEnabled)ensureAudio();openSettings()});
document.querySelectorAll('[data-close-settings]').forEach(el=>el.addEventListener('click',closeSettings));
soundToggle?.addEventListener('click',e=>{e.stopPropagation();setSound(!soundEnabled);if(soundEnabled)tone(MODES[mode].tone*4,.22,.02,'sine',1.06)});
soundSettings?.addEventListener('click',e=>{e.stopPropagation();setSound(!soundEnabled);if(soundEnabled)tone(MODES[mode].tone*4,.22,.02,'sine',1.06)});
document.addEventListener('pointerdown',()=>{if(soundEnabled)ensureAudio()},{capture:true});
S.addEventListener('pointerdown',down);S.addEventListener('pointermove',move);S.addEventListener('pointerup',e=>finish(e,false));S.addEventListener('pointercancel',e=>finish(e,true));S.addEventListener('lostpointercapture',e=>{if(p.down&&e.pointerId===p.id)finish(e,true)});
addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(holdTimer);p.down=false;p.id=null;closeMenu(false);targetEye.x=targetEye.y=0;stopMovementAudio()}});
resize();ui();updateSoundUI();requestAnimationFrame(eyeDraw);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=iris07').catch(()=>{}));
})();
