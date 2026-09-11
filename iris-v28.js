(()=>{
'use strict';
const app=document.getElementById('app');
const stage=document.getElementById('stage');
if(!app||!stage||document.getElementById('irisSleepV28'))return;

const style=document.createElement('style');
style.id='irisV28Style';
style.textContent=`
/* IRIS v28 — layout repair from real iPhone screenshots */
.mode-whisper{color:rgba(241,246,250,.34)!important}
.metric-caption{color:rgba(229,236,242,.38)!important}
.motion-hint{opacity:.20!important}
.mode-dots.visible{opacity:.34!important}

/* SPORT: timer first, controls second — never overlap */
.app.mode-sport .metric-value{font-size:clamp(27px,7.4vw,38px)!important;min-height:38px!important;margin-top:8px!important;line-height:1!important}
.app.mode-sport .metric-caption{margin-top:7px!important}
.app.mode-sport .v24-sport{top:calc(var(--eye-y) + var(--eye-r) + 148px)!important;gap:8px!important;z-index:10!important}
.app.mode-sport .v24-sport button{height:32px!important;padding:0 14px!important;border-radius:16px!important;font-size:7px!important;letter-spacing:.17em!important;background:rgba(255,255,255,.014)!important;border-color:rgba(255,255,255,.065)!important;color:rgba(255,255,255,.48)!important;box-shadow:none!important}
.app.mode-sport .v24-sport .main{min-width:102px!important}
.app.mode-sport .v24-sport .main.running{color:rgba(255,255,255,.84)!important;border-color:rgba(var(--accent),.28)!important;box-shadow:0 0 16px rgba(var(--accent),.055)!important}
.app.mode-sport .v24-sport .reset{min-width:68px!important;color:rgba(255,255,255,.24)!important}

/* SLEEP: same IRIS eye, softly closing — not a thin slit */
#irisSleepV28{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;opacity:0;transition:opacity .5s ease;mix-blend-mode:screen}
.app.mode-sleep #irisSleepV28{opacity:1}
.app.mode-sleep #irisCanvas{opacity:.025!important;filter:brightness(.42) saturate(.55)!important}
.app:not(.mode-sleep) #irisCanvas{opacity:1;filter:none}
.app.mode-sleep #irisOrbitV23{opacity:.44!important;filter:brightness(.82) saturate(.76)!important}
.app.mode-sleep .metric{transform:translate(-50%,-44px)!important}
.app.mode-sleep .mode-whisper{color:rgba(188,200,230,.34)!important}
.app.mode-sleep .metric-value{text-shadow:0 0 22px rgba(82,101,164,.09)!important}
.app.mode-sleep .motion-hint{opacity:.15!important}

/* Browser chrome on iPhone covers the lower UI: lift only in browser mode */
@media (display-mode: browser){
  .motion-hint{bottom:calc(var(--safe-bottom) + 76px)!important}
  .mode-dots{bottom:calc(var(--safe-bottom) + 108px)!important}
  .app.mode-sport .v24-sport{top:calc(var(--eye-y) + var(--eye-r) + 144px)!important}
}
@media (max-height:720px){
  .app.mode-sport .v24-sport{top:calc(var(--eye-y) + var(--eye-r) + 132px)!important}
  .app.mode-sleep .metric{transform:translate(-50%,-34px)!important}
}
`;
document.head.appendChild(style);

const canvas=document.createElement('canvas');
canvas.id='irisSleepV28';
canvas.setAttribute('aria-hidden','true');
const orbit=document.getElementById('irisOrbitV23');
if(orbit&&orbit.parentNode===stage)stage.insertBefore(canvas,orbit);else stage.appendChild(canvas);
const ctx=canvas.getContext('2d',{alpha:true});
let W=0,H=0,D=1;
const TAU=Math.PI*2;
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
const sleepCol=[79,99,166];

function resize(){
  D=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;
  canvas.width=Math.max(1,Math.floor(W*D));canvas.height=Math.max(1,Math.floor(H*D));
  canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(D,0,0,D,0,0);
}
function vars(){
  const s=getComputedStyle(document.documentElement);
  return{
    cx:parseFloat(s.getPropertyValue('--eye-x'))||W/2,
    cy:parseFloat(s.getPropertyValue('--eye-y'))||H*.435,
    r:parseFloat(s.getPropertyValue('--eye-r'))||Math.min(W*.34,H*.178,174)
  };
}
function rnd(i){const n=Math.sin(i*12.9898+78.233)*43758.5453;return n-Math.floor(n)}

function drawIris(v,t){
  const {cx,cy}=v,r=v.r*.985;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.clip();

  const base=ctx.createRadialGradient(cx,cy,r*.08,cx,cy,r);
  base.addColorStop(0,'rgba(0,0,2,1)');
  base.addColorStop(.18,'rgba(8,12,28,.99)');
  base.addColorStop(.42,'rgba(43,59,112,.54)');
  base.addColorStop(.68,'rgba(31,46,91,.38)');
  base.addColorStop(.90,'rgba(8,13,29,.86)');
  base.addColorStop(1,'rgba(0,0,0,.99)');
  ctx.fillStyle=base;ctx.fillRect(cx-r,cy-r,r*2,r*2);

  for(let i=0;i<430;i++){
    const q=rnd(i);
    const a=i/430*TAU+(q-.5)*.062;
    const ri=r*(.225+rnd(i+71)*.11);
    const ro=r*(.70+rnd(i+151)*.27);
    const bend=.011*Math.sin(i*.73+t*.00016);
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*ri,cy+Math.sin(a)*ri);
    ctx.lineTo(cx+Math.cos(a+bend)*ro,cy+Math.sin(a+bend)*ro);
    ctx.strokeStyle=rgba(sleepCol,.028+rnd(i+9)*.080);
    ctx.lineWidth=.26+rnd(i+33)*.40;
    ctx.stroke();
  }

  const haze=ctx.createRadialGradient(cx,cy,r*.20,cx,cy,r*.86);
  haze.addColorStop(0,'rgba(0,0,0,.40)');
  haze.addColorStop(.48,'rgba(15,22,47,.04)');
  haze.addColorStop(1,'rgba(0,0,0,.38)');
  ctx.fillStyle=haze;ctx.beginPath();ctx.arc(cx,cy,r*.88,0,TAU);ctx.fill();

  const pr=r*(.226+.004*Math.sin(t*.00058));
  const pg=ctx.createRadialGradient(cx-r*.018,cy-r*.024,0,cx,cy,pr);
  pg.addColorStop(0,'rgba(0,0,0,1)');pg.addColorStop(.82,'rgba(0,0,0,.998)');pg.addColorStop(1,'rgba(7,10,19,.97)');
  ctx.fillStyle=pg;ctx.beginPath();ctx.arc(cx,cy,pr,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(cx,cy,pr*1.12,0,TAU);ctx.strokeStyle=rgba(sleepCol,.12);ctx.lineWidth=.65;ctx.stroke();

  const hx=cx-r*.22,hy=cy-r*.28;
  const hg=ctx.createRadialGradient(hx,hy,0,hx,hy,r*.13);
  hg.addColorStop(0,'rgba(190,210,245,.055)');hg.addColorStop(1,'rgba(190,210,245,0)');
  ctx.fillStyle=hg;ctx.beginPath();ctx.arc(hx,hy,r*.13,0,TAU);ctx.fill();
  ctx.restore();

  ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.strokeStyle=rgba(sleepCol,.10);ctx.lineWidth=.72;ctx.stroke();
}

function drawLids(v,t){
  const {cx,cy}=v,r=v.r*.995;
  const breathe=Math.sin(t*.00058)*r*.008;
  // Much wider opening than v27: the eye stays recognisable.
  const topControl=cy-r*.98+breathe;
  const bottomControl=cy+r*.86-breathe*.45;

  ctx.save();ctx.globalCompositeOperation='source-over';
  ctx.beginPath();
  ctx.moveTo(cx-r*1.22,cy-r*1.30);ctx.lineTo(cx+r*1.22,cy-r*1.30);ctx.lineTo(cx+r*1.22,cy);
  ctx.quadraticCurveTo(cx,topControl,cx-r*1.22,cy);ctx.closePath();
  const ug=ctx.createLinearGradient(0,cy-r*.82,0,cy+.04*r);
  ug.addColorStop(0,'rgba(0,0,0,1)');ug.addColorStop(.80,'rgba(0,0,0,.995)');ug.addColorStop(1,'rgba(1,2,7,.94)');
  ctx.fillStyle=ug;ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx-r*1.22,cy);ctx.quadraticCurveTo(cx,bottomControl,cx+r*1.22,cy);
  ctx.lineTo(cx+r*1.22,cy+r*1.30);ctx.lineTo(cx-r*1.22,cy+r*1.30);ctx.closePath();
  const lg=ctx.createLinearGradient(0,cy-r*.01,0,cy+r*.80);
  lg.addColorStop(0,'rgba(1,2,7,.93)');lg.addColorStop(.26,'rgba(0,0,0,.994)');lg.addColorStop(1,'rgba(0,0,0,1)');
  ctx.fillStyle=lg;ctx.fill();

  ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.quadraticCurveTo(cx,topControl,cx+r,cy);ctx.strokeStyle=rgba([100,119,187],.09);ctx.lineWidth=.72;ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.quadraticCurveTo(cx,bottomControl,cx+r,cy);ctx.strokeStyle=rgba([86,105,170],.06);ctx.lineWidth=.60;ctx.stroke();
  ctx.restore();
}

function draw(t){
  ctx.clearRect(0,0,W,H);
  if(app.classList.contains('mode-sleep')){
    const v=vars();drawIris(v,t);drawLids(v,t);
  }
  requestAnimationFrame(draw);
}

const note=document.querySelector('.settings-note');
if(note)note.textContent='IRIS v28: исправлены Сон, компоновка Спорта и нижняя safe-area в браузере.';
addEventListener('resize',resize,{passive:true});resize();requestAnimationFrame(draw);
})();