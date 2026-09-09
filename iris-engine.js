(()=>{
'use strict';
const $=s=>document.querySelector(s);
const C=$('#irisCanvas'),X=C.getContext('2d',{alpha:true}),A=$('#app'),S=$('#stage'),ML=$('#metricLabel'),MV=$('#metricValue'),MC=$('#metricCaption'),RM=$('#radialMenu'),RI=[...document.querySelectorAll('.radial-item')],TR=$('#touchRing'),MH=$('#motionHint'),MD=$('#modeDots'),SP=$('#settingsPanel'),ST=$('#settingsTrigger'),IP=$('#insightPanel'),MW=$('#modeWhisper');
const MODES={
 home:{label:'ГЛАВНАЯ',value:'',caption:'КОСНИСЬ ГЛАЗА',whisper:'IRIS НАБЛЮДАЕТ',a:[198,220,237],i:[108,143,165],w:[215,197,178]},
 sport:{label:'СПОРТ',value:'24:17',caption:'ТРЕНИРОВКА',whisper:'ПУЛЬС · ДВИЖЕНИЕ',a:[242,100,74],i:[128,52,42],w:[255,180,126]},
 water:{label:'ВОДА',value:'1,2 Л',caption:'СЕГОДНЯ',whisper:'БАЛАНС ЖИДКОСТИ',a:[108,188,240],i:[44,102,154],w:[194,232,255]},
 food:{label:'ПИТАНИЕ',value:'1 420',caption:'ККАЛ',whisper:'ЭНЕРГИЯ ИЗ ЕДЫ',a:[162,190,130],i:[78,104,64],w:[222,182,116]},
 sleep:{label:'СОН',value:'7 Ч 24 М',caption:'ПРОШЛОЙ НОЧЬЮ',whisper:'ВОССТАНОВЛЕНИЕ',a:[100,130,186],i:[40,56,90],w:[144,164,205]},
 insights:{label:'ИТОГИ',value:'84',caption:'ИНДЕКС ДНЯ',whisper:'СВОДКА СОСТОЯНИЯ',a:[208,220,230],i:[80,98,114],w:[198,190,181]}
};
const ORDER=['home','sport','water','food','sleep','insights'];
let mode='home',acc=[...MODES.home.a],inn=[...MODES.home.i],warm=[...MODES.home.w];
let W=0,H=0,D=1,cx=0,cy=0,R=130,scale=1,targetScale=1,yShift=0,targetYShift=0,eye={x:0,y:0},targetEye={x:0,y:0};
let fibers=[],crypts=[],dust=[],ripples=[];
let p={id:null,down:false,inside:false,startX:0,startY:0,x:0,y:0,startT:0,angle:0,dist:0,moved:false};
let holdTimer=0,menu=false,selection=null,menuMorph=0,targetMenuMorph=0,pupilKick=0,first=false;
const rnd=n=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const lc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const rgba=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const ad=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d};
function eyeCenter(){return{x:cx+eye.x,y:cy+yShift+eye.y}}
function build(){
 fibers=[];crypts=[];dust=[];
 const n=clamp(Math.floor(R*4.6),520,820);
 for(let k=0;k<n;k++)fibers.push({a:k/n*Math.PI*2+(rnd(k)-.5)*.05,ri:.2+rnd(k*3.7)*.18,ro:.68+rnd(k*8.1)*.31,w:.18+rnd(k*5.4)*.95,al:.045+rnd(k*7.2)*.25,b:(rnd(k*9.4)-.5)*.29,hot:rnd(k*11.1)>.84,s:rnd(k*13.5)});
 for(let k=0;k<58;k++)crypts.push({a:k/58*Math.PI*2+rnd(k*9.3)*.12,r1:.34+rnd(k*2.1)*.17,r2:.64+rnd(k*4.8)*.24,w:.5+rnd(k*5.7)*1.6,al:.12+rnd(k*8.4)*.19});
 for(let k=0;k<100;k++)dust.push({a:rnd(k*1.9)*Math.PI*2,r:.96+rnd(k*3.1)*.35,s:.35+rnd(k*4.9)*1.2,al:.03+rnd(k*7.7)*.13});
}
function resize(){
 D=Math.min(2,devicePixelRatio||1);W=Math.floor(innerWidth);H=Math.floor(innerHeight);C.width=W*D;C.height=H*D;C.style.width=W+'px';C.style.height=H+'px';X.setTransform(D,0,0,D,0,0);cx=W/2;cy=H*.455;R=Math.min(W*.405,H*.235,212);build();positionMenu();
}
function positionMenu(){const e=eyeCenter();RM.style.left=e.x+'px';RM.style.top=e.y+'px'}
function insideEye(x,y,mult=1.08){const e=eyeCenter(),rr=R*scale*mult;return Math.hypot(x-e.x,y-e.y)<=rr}
function palette(){const m=MODES[mode];acc=lc(acc,m.a,.03);inn=lc(inn,m.i,.03);warm=lc(warm,m.w,.03);document.documentElement.style.setProperty('--accent',`${acc[0]|0} ${acc[1]|0} ${acc[2]|0}`)}
function ui(){const m=MODES[mode];ML.textContent=m.label;MV.textContent=m.value;MC.textContent=m.caption;MW.textContent=m.whisper;A.className=`app mode-${mode}${menu?' menu-open':''}${SP.classList.contains('open')?' settings-open':''}`;IP.classList.toggle('visible',mode==='insights');IP.setAttribute('aria-hidden',mode==='insights'?'false':'true');targetScale=mode==='insights'?.68:1;targetYShift=mode==='insights'?-H*.12:0;dots();positionMenu()}
function dots(){MD.innerHTML='';ORDER.forEach(m=>{const s=document.createElement('span');if(m===mode)s.className='active';MD.appendChild(s)});MD.classList.toggle('visible',mode!=='home')}
function hint(){if(first)return;first=true;MH.classList.add('hidden')}
function setMode(m){if(!MODES[m])return;mode=m;pupilKick=1;ui();hint();try{navigator.vibrate?.(8)}catch{}}
function tapPulse(x,y){TR.style.left=x+'px';TR.style.top=y+'px';TR.classList.remove('pulse');void TR.offsetWidth;TR.classList.add('pulse');ripples.push({x,y,life:1});pupilKick=1}
function openMenu(){if(menu||!p.down||!p.inside)return;menu=true;selection=null;targetMenuMorph=1;RM.classList.add('open');RM.setAttribute('aria-hidden','false');A.classList.add('menu-open');positionMenu();hint();try{navigator.vibrate?.(12)}catch{}}
function closeMenu(commit=true){if(!menu)return;if(commit&&selection)setMode(selection);menu=false;selection=null;targetMenuMorph=0;RI.forEach(i=>i.classList.remove('active'));RM.classList.remove('open');RM.setAttribute('aria-hidden','true');A.classList.remove('menu-open')}
function choose(x,y){if(!menu)return;const e=eyeCenter(),dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy);if(d<R*.38)selection=null;else{const a=Math.atan2(dy,dx);if(a>-.25*Math.PI&&a<=.25*Math.PI)selection='food';else if(a>.25*Math.PI&&a<=.75*Math.PI)selection='sleep';else if(a<=-.25*Math.PI&&a>-.75*Math.PI)selection='sport';else selection='water'}RI.forEach(i=>i.classList.toggle('active',i.dataset.mode===selection))}
function openSettings(){closeMenu(false);SP.classList.add('open');SP.setAttribute('aria-hidden','false');A.classList.add('settings-open');hint()}
function closeSettings(){SP.classList.remove('open');SP.setAttribute('aria-hidden','true');A.classList.remove('settings-open')}
function down(e){if(e.target.closest('button'))return;const x=e.clientX,y=e.clientY;if(!insideEye(x,y,1.12))return;p.id=e.pointerId;p.down=true;p.inside=true;p.startX=p.x=x;p.startY=p.y=y;p.startT=performance.now();p.moved=false;const ec=eyeCenter(),dx=x-ec.x,dy=y-ec.y;p.angle=Math.atan2(dy,dx);p.dist=Math.hypot(dx,dy);try{S.setPointerCapture(e.pointerId)}catch{};clearTimeout(holdTimer);holdTimer=setTimeout(openMenu,560);targetEye.x=clamp(dx/W*30,-15,15);targetEye.y=clamp(dy/H*30,-13,13)}
function move(e){if(!p.down||e.pointerId!==p.id)return;const x=e.clientX,y=e.clientY;p.x=x;p.y=y;const ec=eyeCenter(),dx=x-ec.x,dy=y-ec.y;p.angle=Math.atan2(dy,dx);p.dist=Math.hypot(dx,dy);const moved=Math.hypot(x-p.startX,y-p.startY);if(moved>14){p.moved=true;if(!menu)clearTimeout(holdTimer)}targetEye.x=clamp(dx/W*32,-17,17);targetEye.y=clamp(dy/H*32,-15,15);if(menu)choose(x,y)}
function finish(e,cancel=false){if(!p.down||e.pointerId!==p.id)return;clearTimeout(holdTimer);const x=e.clientX,y=e.clientY,dt=performance.now()-p.startT,dx=x-p.startX,dy=y-p.startY,dist=Math.hypot(dx,dy);p.down=false;p.inside=false;targetEye.x=targetEye.y=0;try{S.releasePointerCapture(e.pointerId)}catch{};p.id=null;if(cancel){closeMenu(false);return}if(menu){closeMenu(true);return}if(dt<380&&dist<22){tapPulse(x,y);hint();if(mode==='home'){MC.textContent='УДЕРЖИВАЙ ДЛЯ МЕНЮ';setTimeout(()=>{if(mode==='home')MC.textContent=MODES.home.caption},1200)}return}if(Math.abs(dx)>68&&Math.abs(dx)>Math.abs(dy)*1.18){const i=ORDER.indexOf(mode);setMode(dx<0?ORDER[(i+1)%ORDER.length]:ORDER[(i-1+ORDER.length)%ORDER.length]);return}if(dy<-86&&Math.abs(dy)>Math.abs(dx)*1.1){setMode('insights');return}if(dy>86&&Math.abs(dy)>Math.abs(dx)*1.1)openSettings()}
function background(ec,r){X.clearRect(0,0,W,H);const g=X.createRadialGradient(ec.x,ec.y,r*.18,ec.x,ec.y,r*3);g.addColorStop(0,rgba(acc,.065));g.addColorStop(.34,rgba(acc,.02));g.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=g;X.fillRect(0,0,W,H);ripples=ripples.filter(q=>q.life>.02);X.save();X.globalCompositeOperation='screen';for(const q of ripples){const rr=(1-q.life)*230;X.beginPath();X.arc(q.x,q.y,rr,0,Math.PI*2);X.strokeStyle=rgba(acc,q.life*.075);X.lineWidth=1;X.stroke();q.life*=.955}X.restore()}
function modeFX(t,ec,r){
 if(mode==='sport'){const pr=.74;X.save();X.beginPath();X.arc(ec.x,ec.y,r*1.095,-Math.PI*.7,Math.PI*1.3);X.strokeStyle='rgba(255,255,255,.075)';X.lineWidth=1.2;X.stroke();X.beginPath();X.arc(ec.x,ec.y,r*1.095,-Math.PI*.7,-Math.PI*.7+Math.PI*2*pr);X.strokeStyle=rgba(acc,.92);X.lineWidth=1.8;X.shadowBlur=12;X.shadowColor=rgba(acc,.42);X.stroke();X.restore()}
 if(mode==='water'){X.save();X.globalCompositeOperation='screen';X.beginPath();for(let k=0;k<=42;k++){const xx=ec.x-r*1.04+r*2.08*k/42,yy=ec.y+r*.83+Math.sin(k/42*Math.PI*2+t*.0024)*r*.035;k?X.lineTo(xx,yy):X.moveTo(xx,yy)}X.strokeStyle=rgba(warm,.15);X.lineWidth=1.1;X.stroke();X.restore()}
 if(mode==='food'){X.save();X.globalCompositeOperation='screen';for(let k=0;k<16;k++){const a=rnd(k*2.4)*Math.PI*2+t*.00023*(k%2?1:-1),rr=r*(.96+rnd(k*3.7)*.2);X.beginPath();X.arc(ec.x+Math.cos(a)*rr,ec.y+Math.sin(a)*rr,1+rnd(k*8.1)*1.7,0,Math.PI*2);X.fillStyle=k%3?rgba(acc,.09):rgba(warm,.13);X.fill()}X.restore()}
}
function drawMenuSpokes(ec,r){if(menuMorph<.01)return;X.save();X.globalCompositeOperation='screen';const ease=1-Math.pow(1-menuMorph,3),len=r*(.52+.55*ease);for(let k=0;k<4;k++){const a=-Math.PI/2+k*Math.PI/2;X.beginPath();X.moveTo(ec.x+Math.cos(a)*r*.26,ec.y+Math.sin(a)*r*.26);X.lineTo(ec.x+Math.cos(a)*len,ec.y+Math.sin(a)*len);X.strokeStyle=rgba(acc,.05+.16*ease);X.lineWidth=.75;X.stroke();const px=ec.x+Math.cos(a)*len,py=ec.y+Math.sin(a)*len;X.beginPath();X.arc(px,py,1.5+2*ease,0,Math.PI*2);X.fillStyle=rgba(acc,.18+.5*ease);X.fill()}X.restore()}
function eyeDraw(t){palette();scale=lerp(scale,targetScale,.06);yShift=lerp(yShift,targetYShift,.06);eye.x=lerp(eye.x,targetEye.x,.08);eye.y=lerp(eye.y,targetEye.y,.08);menuMorph=lerp(menuMorph,targetMenuMorph,.12);pupilKick=lerp(pupilKick,0,.05);const ec=eyeCenter(),r=R*scale*(1+Math.sin(t*.00082)*.01);positionMenu();background(ec,r);modeFX(t,ec,r);X.save();X.translate(ec.x,ec.y);
 for(let k=0;k<6;k++){X.beginPath();X.arc(0,0,r*(1.025+k*.047),0,Math.PI*2);X.strokeStyle=rgba(acc,.05-k*.006);X.lineWidth=.55;X.stroke()}
 const base=X.createRadialGradient(0,0,r*.08,0,0,r*1.02);base.addColorStop(0,'rgba(0,0,0,1)');base.addColorStop(.17,rgba(inn,.86));base.addColorStop(.4,rgba(acc,.45));base.addColorStop(.75,rgba(inn,.32));base.addColorStop(1,'rgba(2,4,6,.08)');X.beginPath();X.arc(0,0,r,0,Math.PI*2);X.fillStyle=base;X.fill();
 X.save();X.beginPath();X.arc(0,0,r*.995,0,Math.PI*2);X.clip();X.globalCompositeOperation='screen';
 for(let k=0;k<fibers.length;k++){const f=fibers[k],j=Math.sin(t*.0012+f.s*20)*.009,a=f.a+j;const influence=p.down?Math.exp(-Math.pow(ad(a,p.angle),2)/.14)*clamp(1.18-p.dist/(r*1.25),0,1):0;const r1=r*(f.ri-influence*.015),r2=r*(f.ro+influence*.035),m=(r1+r2)*.52,ma=a+f.b*.38+Math.sin(f.s*18+t*.0005)*.013;X.beginPath();X.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);X.quadraticCurveTo(Math.cos(ma)*m,Math.sin(ma)*m,Math.cos(a+f.b+influence*.018)*r2,Math.sin(a+f.b+influence*.018)*r2);X.strokeStyle=f.hot?rgba(warm,f.al*.75*(1+influence)):rgba(acc,f.al*(1+influence));X.lineWidth=f.w+influence*.5;X.stroke()}
 X.globalCompositeOperation='source-over';for(const c of crypts){X.beginPath();X.moveTo(Math.cos(c.a)*r*c.r1,Math.sin(c.a)*r*c.r1);X.lineTo(Math.cos(c.a+.018)*r*c.r2,Math.sin(c.a+.018)*r*c.r2);X.strokeStyle=`rgba(0,0,0,${c.al})`;X.lineWidth=c.w;X.stroke()}
 const glass=X.createLinearGradient(-r*.7,-r*.6,r*.75,r*.65);glass.addColorStop(0,'rgba(255,255,255,.13)');glass.addColorStop(.28,'rgba(255,255,255,.015)');glass.addColorStop(.68,rgba(acc,.07));glass.addColorStop(1,'rgba(255,255,255,0)');X.fillStyle=glass;X.beginPath();X.arc(0,0,r*.98,0,Math.PI*2);X.fill();X.restore();
 const rim=X.createRadialGradient(0,0,r*.82,0,0,r*1.06);rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(.78,rgba(acc,.055));rim.addColorStop(.92,'rgba(2,5,7,.75)');rim.addColorStop(1,'rgba(0,0,0,.99)');X.beginPath();X.arc(0,0,r*1.06,0,Math.PI*2);X.fillStyle=rim;X.fill();
 const pupil=r*(.215+menuMorph*.09+pupilKick*.024+Math.sin(t*.0005)*.006);const pg=X.createRadialGradient(-pupil*.14,-pupil*.14,pupil*.04,0,0,pupil*1.2);pg.addColorStop(0,'#090b0d');pg.addColorStop(.72,'#000');pg.addColorStop(1,rgba(acc,.035));X.beginPath();X.arc(0,0,pupil,0,Math.PI*2);X.fillStyle=pg;X.fill();X.beginPath();X.arc(0,0,pupil*1.02,0,Math.PI*2);X.strokeStyle=rgba(acc,.17);X.lineWidth=.7;X.stroke();
 X.save();X.globalCompositeOperation='screen';const hx=-r*.24,hy=-r*.30,hg=X.createRadialGradient(hx,hy,0,hx,hy,r*.16);hg.addColorStop(0,'rgba(255,255,255,.36)');hg.addColorStop(.18,'rgba(255,255,255,.14)');hg.addColorStop(1,'rgba(255,255,255,0)');X.fillStyle=hg;X.beginPath();X.arc(hx,hy,r*.16,0,Math.PI*2);X.fill();X.restore();
 if(mode==='sleep'){const close=.39+Math.sin(t*.00055)*.014;X.fillStyle='rgba(0,0,0,.988)';X.beginPath();X.ellipse(0,-r*(1.05-close),r*1.36,r*.84,0,0,Math.PI*2);X.fill();X.beginPath();X.ellipse(0,r*(1.05-close),r*1.36,r*.84,0,0,Math.PI*2);X.fill()}
 X.restore();drawMenuSpokes(ec,r);
 X.save();X.globalCompositeOperation='screen';for(let k=0;k<dust.length;k++){const d=dust[k],a=d.a+t*.000015*(k%2?1:-1),rr=r*d.r;X.beginPath();X.arc(ec.x+Math.cos(a)*rr,ec.y+Math.sin(a)*rr,d.s,0,Math.PI*2);X.fillStyle=rgba(acc,d.al);X.fill()}X.restore();requestAnimationFrame(eyeDraw)}
RI.forEach(i=>i.addEventListener('click',e=>{e.stopPropagation();selection=i.dataset.mode;closeMenu(true)}));
ST.addEventListener('click',openSettings);document.querySelectorAll('[data-close-settings]').forEach(el=>el.addEventListener('click',closeSettings));
S.addEventListener('pointerdown',down);S.addEventListener('pointermove',move);S.addEventListener('pointerup',e=>finish(e,false));S.addEventListener('pointercancel',e=>finish(e,true));S.addEventListener('lostpointercapture',e=>{if(p.down&&e.pointerId===p.id)finish(e,true)});
addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(holdTimer);p.down=false;p.id=null;closeMenu(false);targetEye.x=targetEye.y=0}});
resize();ui();requestAnimationFrame(eyeDraw);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=iris06').catch(()=>{}));
})();
