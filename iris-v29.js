(()=>{
'use strict';
const app=document.getElementById('app');
const stage=document.getElementById('stage');
const metric=document.getElementById('metric');
if(!app||!stage||!metric||document.getElementById('irisSleepV29'))return;

const style=document.createElement('style');
style.id='irisV29Style';
style.textContent=`
:root{--iris-bottom-ui:22px;--sport-controls-top:calc(var(--eye-y) + var(--eye-r) + 150px)}

/* lower UI: one safe layout for Safari / in-app browser / standalone */
.motion-hint{bottom:calc(var(--iris-bottom-ui) + 18px)!important;opacity:.20!important}
.mode-dots{bottom:calc(var(--iris-bottom-ui) + 50px)!important}
.water-panel{bottom:calc(var(--iris-bottom-ui) + 64px)!important}

/* SPORT: timer owns the metric block; buttons are a separate layer */
.app.mode-sport .metric-value{font-size:clamp(29px,7.8vw,40px)!important;line-height:1!important;min-height:40px!important;margin-top:8px!important}
.app.mode-sport .metric-caption{margin-top:8px!important}
.app.mode-sport .v24-sport{top:var(--sport-controls-top)!important;bottom:auto!important;gap:8px!important;z-index:11!important}
.app.mode-sport .v24-sport button{height:32px!important;padding:0 14px!important;border-radius:16px!important;font-size:7px!important;letter-spacing:.17em!important;background:rgba(255,255,255,.014)!important;border:1px solid rgba(255,255,255,.06)!important;color:rgba(255,255,255,.50)!important;box-shadow:none!important}
.app.mode-sport .v24-sport .main{min-width:104px!important}
.app.mode-sport .v24-sport .main.running{color:rgba(255,255,255,.88)!important;border-color:rgba(var(--accent),.30)!important;box-shadow:0 0 16px rgba(var(--accent),.055)!important}
.app.mode-sport .v24-sport .reset{min-width:70px!important;color:rgba(255,255,255,.25)!important}

/* SLEEP: deliberately a normal round IRIS eye. No slit, no eyelids. */
#irisSleepV29{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;opacity:0;transition:opacity .45s ease;mix-blend-mode:screen}
.app.mode-sleep #irisSleepV29{opacity:1}
.app.mode-sleep #irisCanvas{opacity:.018!important;filter:brightness(.36) saturate(.52)!important}
.app:not(.mode-sleep) #irisCanvas{opacity:1;filter:none}
.app.mode-sleep #irisOrbitV23{opacity:.40!important;filter:brightness(.80) saturate(.72)!important}
.app.mode-sleep .mode-whisper{color:rgba(188,201,232,.34)!important}
.app.mode-sleep .metric-value{text-shadow:0 0 22px rgba(88,108,178,.10)!important}
.app.mode-sleep .motion-hint{opacity:.13!important}

/* keep the vertical rhythm stable */
.metric{width:min(88vw,420px)!important}
@media(max-height:720px){
  .app.mode-sport .metric-value{font-size:30px!important}
  .app.mode-sport .v24-sport button{height:30px!important}
}
`;
document.head.appendChild(style);

const canvas=document.createElement('canvas');
canvas.id='irisSleepV29';
canvas.setAttribute('aria-hidden','true');
const orbit=document.getElementById('irisOrbitV23');
if(orbit&&orbit.parentNode===stage)stage.insertBefore(canvas,orbit);else stage.appendChild(canvas);
const ctx=canvas.getContext('2d',{alpha:true});
let W=0,H=0,D=1;
const TAU=Math.PI*2;
const sleepCol=[83,104,176];
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rnd=i=>{const n=Math.sin(i*12.9898+78.233)*43758.5453;return n-Math.floor(n)};

function resize(){
  D=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;
  canvas.width=Math.max(1,Math.floor(W*D));canvas.height=Math.max(1,Math.floor(H*D));
  canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(D,0,0,D,0,0);
  syncLayout();
}
function eyeVars(){
  const s=getComputedStyle(document.documentElement);
  return{
    cx:parseFloat(s.getPropertyValue('--eye-x'))||W/2,
    cy:parseFloat(s.getPropertyValue('--eye-y'))||H*.435,
    r:parseFloat(s.getPropertyValue('--eye-r'))||Math.min(W*.34,H*.178,174)
  };
}
function drawSleepEye(v,t){
  const cx=v.cx,cy=v.cy,r=v.r*.985;
  const breathe=1+Math.sin(t*.00055)*.003;
  const rr=r*breathe;

  ctx.save();ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.clip();
  const base=ctx.createRadialGradient(cx,cy,rr*.07,cx,cy,rr);
  base.addColorStop(0,'rgba(0,0,2,1)');
  base.addColorStop(.17,'rgba(7,11,27,.995)');
  base.addColorStop(.40,'rgba(45,63,119,.55)');
  base.addColorStop(.67,'rgba(31,47,94,.39)');
  base.addColorStop(.89,'rgba(8,13,30,.88)');
  base.addColorStop(1,'rgba(0,0,0,.995)');
  ctx.fillStyle=base;ctx.fillRect(cx-rr,cy-rr,rr*2,rr*2);

  for(let i=0;i<455;i++){
    const a=i/455*TAU+(rnd(i)-.5)*.064;
    const ri=rr*(.225+rnd(i+31)*.115);
    const ro=rr*(.70+rnd(i+97)*.275);
    const bend=.010*Math.sin(i*.71+t*.00014);
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*ri,cy+Math.sin(a)*ri);
    ctx.lineTo(cx+Math.cos(a+bend)*ro,cy+Math.sin(a+bend)*ro);
    ctx.strokeStyle=rgba(sleepCol,.026+rnd(i+7)*.082);
    ctx.lineWidth=.24+rnd(i+19)*.42;
    ctx.stroke();
  }

  const haze=ctx.createRadialGradient(cx,cy,rr*.18,cx,cy,rr*.88);
  haze.addColorStop(0,'rgba(0,0,0,.43)');
  haze.addColorStop(.48,'rgba(14,21,46,.035)');
  haze.addColorStop(1,'rgba(0,0,0,.40)');
  ctx.fillStyle=haze;ctx.beginPath();ctx.arc(cx,cy,rr*.90,0,TAU);ctx.fill();

  const pr=rr*(.224+.004*Math.sin(t*.00048));
  const pupil=ctx.createRadialGradient(cx-rr*.018,cy-rr*.024,0,cx,cy,pr);
  pupil.addColorStop(0,'rgba(0,0,0,1)');pupil.addColorStop(.82,'rgba(0,0,0,.999)');pupil.addColorStop(1,'rgba(7,10,20,.97)');
  ctx.fillStyle=pupil;ctx.beginPath();ctx.arc(cx,cy,pr,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(cx,cy,pr*1.12,0,TAU);ctx.strokeStyle=rgba(sleepCol,.12);ctx.lineWidth=.65;ctx.stroke();

  const hx=cx-rr*.22,hy=cy-rr*.28;
  const hg=ctx.createRadialGradient(hx,hy,0,hx,hy,rr*.13);
  hg.addColorStop(0,'rgba(194,212,245,.052)');hg.addColorStop(1,'rgba(194,212,245,0)');
  ctx.fillStyle=hg;ctx.beginPath();ctx.arc(hx,hy,rr*.13,0,TAU);ctx.fill();
  ctx.restore();

  ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.strokeStyle=rgba(sleepCol,.105);ctx.lineWidth=.75;ctx.stroke();
}
function draw(t){
  ctx.clearRect(0,0,W,H);
  if(app.classList.contains('mode-sleep'))drawSleepEye(eyeVars(),t);
  requestAnimationFrame(draw);
}

function syncLayout(){
  const standalone=navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;
  let bottom=standalone?Math.max(22,Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom'))||22):92;
  if(!standalone&&window.visualViewport){
    const vv=visualViewport;
    const occlusion=Math.max(0,innerHeight-(vv.height+vv.offsetTop));
    bottom=Math.max(bottom,occlusion+24);
  }
  document.documentElement.style.setProperty('--iris-bottom-ui',`${Math.round(bottom)}px`);

  if(app.classList.contains('mode-sport')){
    const mr=metric.getBoundingClientRect();
    const controls=document.querySelector('.v24-sport');
    const reserve=bottom+56;
    const desired=mr.bottom+18;
    const maxTop=Math.max(mr.bottom+10,innerHeight-reserve-(controls?.offsetHeight||34));
    document.documentElement.style.setProperty('--sport-controls-top',`${Math.round(Math.min(desired,maxTop))}px`);
  }
}

new MutationObserver(()=>requestAnimationFrame(syncLayout)).observe(app,{attributes:true,attributeFilter:['class']});
if(window.visualViewport){visualViewport.addEventListener('resize',syncLayout,{passive:true});visualViewport.addEventListener('scroll',syncLayout,{passive:true});}
addEventListener('resize',resize,{passive:true});
setInterval(()=>{if(app.classList.contains('mode-sport'))syncLayout()},500);

const note=document.querySelector('.settings-note');
if(note)note.textContent='IRIS v29: Сон — нормальный круглый глаз; Спорт и нижний интерфейс адаптированы под safe-area iPhone.';
resize();requestAnimationFrame(draw);
})();