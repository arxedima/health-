(()=>{
'use strict';
const app=document.getElementById('app');
const stage=document.getElementById('stage');
if(!app||!stage||document.getElementById('irisSleepV27'))return;

const style=document.createElement('style');
style.id='irisV27Style';
style.textContent=`
/* IRIS v27 — design repair: keep v24 language, repair Sleep, reduce noise */
.mode-whisper{color:rgba(241,246,250,.31)!important;letter-spacing:.40em!important}
.metric-label{color:rgba(246,249,252,.78)!important}
.metric-caption{color:rgba(229,236,242,.34)!important}
.motion-hint{opacity:.18!important}
.mode-dots.visible{opacity:.30!important}
.sound-trigger{opacity:.58;transition:opacity .22s ease,transform .22s ease}
.sound-trigger:active{opacity:.88;transform:scale(.96)}
#irisOrbitV23{transition:opacity .65s ease,filter .65s ease}
.app.mode-home #irisOrbitV23{opacity:.88}
.app.mode-sport #irisOrbitV23{opacity:.86}
.app.mode-water #irisOrbitV23{opacity:.82}
.app.mode-food #irisOrbitV23{opacity:.76}
.app.mode-sleep #irisOrbitV23{opacity:.32;filter:brightness(.72) saturate(.72)}
.app.mode-insights #irisOrbitV23{opacity:.48}

#irisSleepV27{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;opacity:0;transition:opacity .5s ease;mix-blend-mode:screen}
.app.mode-sleep #irisSleepV27{opacity:1}
.app.mode-sleep #irisCanvas{opacity:.035!important;filter:brightness(.45) saturate(.55)!important;transition:opacity .45s ease,filter .45s ease}
.app:not(.mode-sleep) #irisCanvas{opacity:1;filter:none}
.app.mode-sleep .mode-whisper{color:rgba(188,200,230,.27)!important}
.app.mode-sleep .metric-value{text-shadow:0 0 24px rgba(78,93,148,.08)!important}
.app.mode-sleep .motion-hint{opacity:.10!important}
.app.mode-sleep .mode-dots.visible{opacity:.22!important}

/* keep all modes on the same visual rhythm */
.metric{width:min(88vw,420px)!important}
.insight-panel{border-color:rgba(255,255,255,.055)!important;background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.009))!important;box-shadow:0 16px 42px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.028)!important}
.week-row span{border-color:rgba(255,255,255,.04)!important;background:rgba(255,255,255,.016)!important}
`;
document.head.appendChild(style);

const canvas=document.createElement('canvas');
canvas.id='irisSleepV27';
canvas.setAttribute('aria-hidden','true');
const orbit=document.getElementById('irisOrbitV23');
if(orbit&&orbit.parentNode===stage)stage.insertBefore(canvas,orbit);else stage.appendChild(canvas);
const ctx=canvas.getContext('2d',{alpha:true});
let W=0,H=0,D=1;
const TAU=Math.PI*2;

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
function col(a){return `rgba(82,101,164,${a})`}
function drawIris(v,t){
  const r=v.r*.985,cx=v.cx,cy=v.cy;
  ctx.save();
  ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.clip();

  const base=ctx.createRadialGradient(cx,cy,r*.10,cx,cy,r);
  base.addColorStop(0,'rgba(1,2,6,1)');
  base.addColorStop(.18,'rgba(10,16,34,.98)');
  base.addColorStop(.43,'rgba(41,58,105,.47)');
  base.addColorStop(.72,'rgba(29,43,84,.31)');
  base.addColorStop(.93,'rgba(6,10,22,.82)');
  base.addColorStop(1,'rgba(0,0,0,.98)');
  ctx.fillStyle=base;ctx.fillRect(cx-r,cy-r,r*2,r*2);

  // dense, thin fibers — same biological language as the main IRIS eye
  for(let i=0;i<390;i++){
    const n=Math.sin(i*12.9898+78.233)*43758.5453;
    const q=n-Math.floor(n);
    const a=i/390*TAU+(q-.5)*.055;
    const ri=r*(.22+((i*7)%17)/17*.10);
    const ro=r*(.72+((i*13)%23)/23*.24);
    const bend=.010*Math.sin(i*.77+t*.00018);
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*ri,cy+Math.sin(a)*ri);
    ctx.lineTo(cx+Math.cos(a+bend)*ro,cy+Math.sin(a+bend)*ro);
    ctx.strokeStyle=col(.032+(i%9)*.0062);
    ctx.lineWidth=.28+(i%4)*.09;
    ctx.stroke();
  }

  // smoky inner depth
  const smoke=ctx.createRadialGradient(cx,cy,r*.18,cx,cy,r*.82);
  smoke.addColorStop(0,'rgba(0,0,0,.48)');
  smoke.addColorStop(.42,'rgba(12,18,36,.05)');
  smoke.addColorStop(1,'rgba(0,0,0,.35)');
  ctx.fillStyle=smoke;ctx.beginPath();ctx.arc(cx,cy,r*.88,0,TAU);ctx.fill();

  const pr=r*(.235+.006*Math.sin(t*.00065));
  const pupil=ctx.createRadialGradient(cx-r*.025,cy-r*.035,0,cx,cy,pr);
  pupil.addColorStop(0,'rgba(0,0,0,1)');
  pupil.addColorStop(.78,'rgba(0,0,0,.995)');
  pupil.addColorStop(1,'rgba(8,11,20,.96)');
  ctx.fillStyle=pupil;ctx.beginPath();ctx.arc(cx,cy,pr,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(cx,cy,pr*1.12,0,TAU);ctx.strokeStyle=col(.12);ctx.lineWidth=.65;ctx.stroke();

  // very restrained highlight; Sleep must stay matte
  const hx=cx-r*.22,hy=cy-r*.30;
  const hg=ctx.createRadialGradient(hx,hy,0,hx,hy,r*.14);
  hg.addColorStop(0,'rgba(190,210,240,.075)');hg.addColorStop(1,'rgba(190,210,240,0)');
  ctx.fillStyle=hg;ctx.beginPath();ctx.arc(hx,hy,r*.14,0,TAU);ctx.fill();
  ctx.restore();

  // soft limbal edge
  ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.strokeStyle='rgba(77,96,158,.10)';ctx.lineWidth=.8;ctx.stroke();
}
function drawLids(v,t){
  const r=v.r*.99,cx=v.cx,cy=v.cy;
  const breathe=Math.sin(t*.00072)*r*.010;
  const topCenter=cy-r*.56+breathe;
  const bottomCenter=cy+r*.51-breathe*.55;

  // upper eyelid: covers the circle but keeps a broad, readable eye opening
  ctx.save();ctx.globalCompositeOperation='source-over';
  ctx.beginPath();
  ctx.moveTo(cx-r*1.18,cy-r*1.25);
  ctx.lineTo(cx+r*1.18,cy-r*1.25);
  ctx.lineTo(cx+r*1.18,cy+r*.03);
  ctx.quadraticCurveTo(cx,topCenter,cx-r*1.18,cy+r*.03);
  ctx.closePath();
  const ug=ctx.createLinearGradient(0,cy-r*.65,0,cy+r*.05);
  ug.addColorStop(0,'rgba(0,0,0,1)');ug.addColorStop(.78,'rgba(0,0,0,.995)');ug.addColorStop(1,'rgba(0,0,0,.94)');
  ctx.fillStyle=ug;ctx.fill();

  // lower eyelid is shallower — avoids the old "slit" look
  ctx.beginPath();
  ctx.moveTo(cx-r*1.18,cy-r*.01);
  ctx.quadraticCurveTo(cx,bottomCenter,cx+r*1.18,cy-r*.01);
  ctx.lineTo(cx+r*1.18,cy+r*1.25);
  ctx.lineTo(cx-r*1.18,cy+r*1.25);
  ctx.closePath();
  const lg=ctx.createLinearGradient(0,cy-r*.02,0,cy+r*.70);
  lg.addColorStop(0,'rgba(0,0,0,.94)');lg.addColorStop(.24,'rgba(0,0,0,.995)');lg.addColorStop(1,'rgba(0,0,0,1)');
  ctx.fillStyle=lg;ctx.fill();

  // eyelid edges: thin, nearly invisible blue-indigo line
  ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.quadraticCurveTo(cx,topCenter,cx+r,cy);ctx.strokeStyle='rgba(92,111,175,.085)';ctx.lineWidth=.75;ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.quadraticCurveTo(cx,bottomCenter,cx+r,cy);ctx.strokeStyle='rgba(80,99,160,.055)';ctx.lineWidth=.6;ctx.stroke();
  ctx.restore();
}
function draw(t){
  ctx.clearRect(0,0,W,H);
  if(app.classList.contains('mode-sleep')){
    const v=vars();
    drawIris(v,t);
    drawLids(v,t);
  }
  requestAnimationFrame(draw);
}

const note=document.querySelector('.settings-note');
if(note)note.textContent='IRIS v27: единый язык глаза во всех режимах, Сон переделан как живой полузакрытый глаз, меньше визуального шума.';
addEventListener('resize',resize,{passive:true});
resize();requestAnimationFrame(draw);
})();