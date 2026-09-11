(()=>{'use strict';
const app=document.getElementById('app'),stage=document.getElementById('stage');
if(!app||!stage||document.getElementById('irisUnifiedV34'))return;

const style=document.createElement('style');
style.id='irisV34Style';
style.textContent=`
#irisUnifiedV34{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;opacity:0;transition:opacity .4s ease;mix-blend-mode:screen}
.app.mode-water #irisUnifiedV34,.app.mode-sleep #irisUnifiedV34{opacity:1}
.app.mode-water #irisModeV30,.app.mode-sleep #irisSleepV29{opacity:0!important}
.app.mode-water #irisCanvas,.app.mode-sleep #irisCanvas{opacity:.03!important;filter:brightness(.46) saturate(.62)!important}
.app.mode-water #irisOrbitV23,.app.mode-sleep #irisOrbitV23{opacity:0!important}
.app.mode-water .mode-whisper{color:rgba(188,216,239,.34)!important}
.app.mode-sleep .mode-whisper{color:rgba(188,201,232,.34)!important}
`;
document.head.appendChild(style);

const c=document.createElement('canvas');c.id='irisUnifiedV34';c.setAttribute('aria-hidden','true');
const data=document.getElementById('irisV24Data'),orbit=document.getElementById('irisOrbitV23');
if(data&&data.parentNode===stage)stage.insertBefore(c,data);else if(orbit&&orbit.parentNode===stage)stage.insertBefore(c,orbit);else stage.appendChild(c);
const x=c.getContext('2d',{alpha:true}),TAU=Math.PI*2;
let W=0,H=0,D=1,ox=0,oy=0,tx=0,ty=0;
const themes={
 water:{a:[82,160,224],b:[28,76,125],o:[122,193,242],speed:.00023,energy:1},
 sleep:{a:[83,104,176],b:[35,50,100],o:[122,144,212],speed:.00008,energy:.78}
};
const rnd=i=>{const n=Math.sin(i*12.9898+78.233)*43758.5453;return n-Math.floor(n)};
const rgba=(col,a)=>`rgba(${col[0]},${col[1]},${col[2]},${a})`;
function mode(){return app.classList.contains('mode-water')?'water':app.classList.contains('mode-sleep')?'sleep':null}
function resize(){D=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;c.width=Math.max(1,Math.floor(W*D));c.height=Math.max(1,Math.floor(H*D));c.style.width=W+'px';c.style.height=H+'px';x.setTransform(D,0,0,D,0,0)}
function vars(){const s=getComputedStyle(document.documentElement);return{cx:parseFloat(s.getPropertyValue('--eye-x'))||W/2,cy:parseFloat(s.getPropertyValue('--eye-y'))||H*.435,r:parseFloat(s.getPropertyValue('--eye-r'))||Math.min(W*.34,H*.178,174)}}
function fibers(cx,cy,r,p,col,count,alpha,seed,t){for(let i=0;i<count;i++){const q=rnd(i+seed),q2=rnd(i+seed+311),a=i/count*TAU+(q-.5)*.07,ri=p*(1.1+q2*.32),ro=r*(.70+rnd(i+seed+733)*.27),bend=(q2-.5)*.02+Math.sin(i*.61+t*.00015)*.003,mid=(ri+ro)*.52;x.beginPath();x.moveTo(cx+Math.cos(a)*ri,cy+Math.sin(a)*ri);x.quadraticCurveTo(cx+Math.cos(a+bend)*mid,cy+Math.sin(a+bend)*mid,cx+Math.cos(a+bend*.35)*ro,cy+Math.sin(a+bend*.35)*ro);x.strokeStyle=rgba(col,alpha*(.45+q*.7));x.lineWidth=.28+q2*.42;x.stroke()}}
function drawEye(v,th,t){const cx=v.cx+ox,cy=v.cy+oy,r=v.r*.955*(1+Math.sin(t*.00052)*.0025),p=r*.205,e=th.energy;const glow=x.createRadialGradient(v.cx,v.cy,r*.35,v.cx,v.cy,r*1.24);glow.addColorStop(0,rgba(th.a,.07*e));glow.addColorStop(.58,rgba(th.a,.025*e));glow.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=glow;x.beginPath();x.arc(v.cx,v.cy,r*1.2,0,TAU);x.fill();x.save();x.beginPath();x.arc(cx,cy,r,0,TAU);x.clip();const g=x.createRadialGradient(cx,cy,r*.08,cx,cy,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.2,rgba(th.b,.27*e));g.addColorStop(.45,rgba(th.a,.24*e));g.addColorStop(.72,rgba(th.b,.20*e));g.addColorStop(.94,'rgba(3,6,13,.84)');g.addColorStop(1,'rgba(0,0,0,.985)');x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);fibers(cx,cy,r,p,th.a,270,.09*e,31,t);fibers(cx,cy,r,p,th.b,170,.065*e,901,t);const sh=x.createRadialGradient(cx,cy,r*.68,cx,cy,r);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.34)');x.fillStyle=sh;x.beginPath();x.arc(cx,cy,r,0,TAU);x.fill();x.fillStyle='rgba(0,0,0,.995)';x.beginPath();x.arc(cx,cy,p,0,TAU);x.fill();x.beginPath();x.arc(cx,cy,p*1.12,0,TAU);x.strokeStyle=rgba(th.a,.13*e);x.lineWidth=.7;x.stroke();const hx=cx-r*.20,hy=cy-r*.25,hg=x.createRadialGradient(hx,hy,0,hx,hy,r*.14);hg.addColorStop(0,`rgba(230,242,255,${.05*e})`);hg.addColorStop(1,'rgba(230,242,255,0)');x.fillStyle=hg;x.beginPath();x.arc(hx,hy,r*.14,0,TAU);x.fill();x.restore();x.beginPath();x.arc(cx,cy,r,0,TAU);x.strokeStyle=rgba(th.o,.11*e);x.lineWidth=.8;x.stroke();return{cx,cy,r}}
function drawOrbit(e,th,t){const r=e.r*1.095,a=t*th.speed-Math.PI*.62,e2=th.energy;x.beginPath();x.arc(e.cx,e.cy,r,0,TAU);x.strokeStyle=rgba(th.o,.055*e2);x.lineWidth=.6;x.stroke();x.beginPath();x.arc(e.cx,e.cy,r,a,a+.85);x.strokeStyle=rgba(th.o,.20*e2);x.lineWidth=1;x.lineCap='round';x.stroke()}
function draw(t){x.clearRect(0,0,W,H);ox+=(tx-ox)*.055;oy+=(ty-oy)*.055;const m=mode();if(m){const e=drawEye(vars(),themes[m],t);drawOrbit(e,themes[m],t)}requestAnimationFrame(draw)}
stage.addEventListener('pointermove',e=>{const v=vars();tx=Math.max(-1,Math.min(1,(e.clientX-v.cx)/W*2))*v.r*.03;ty=Math.max(-1,Math.min(1,(e.clientY-v.cy)/H*2))*v.r*.025},{passive:true});stage.addEventListener('pointerleave',()=>{tx=0;ty=0},{passive:true});
addEventListener('resize',resize,{passive:true});
const note=document.querySelector('.settings-note');if(note)note.textContent='IRIS v34: Вода и Сон используют один и тот же глаз; отличаются только цветом, яркостью и скоростью.';
resize();requestAnimationFrame(draw);
})();