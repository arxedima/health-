(()=>{
'use strict';
const stage=document.getElementById('stage');
const app=document.getElementById('app');
if(!stage||!app||document.getElementById('irisOrbitV23'))return;

const style=document.createElement('style');
style.textContent=`
#irisOrbitV23{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;mix-blend-mode:screen}
.v11-panel{display:none!important}
.sound-trigger{opacity:.52;transform:scale(.88);transform-origin:left center}
.sound-trigger::after{opacity:.42}
.mode-whisper{opacity:.62}
.motion-hint{opacity:.72}

`;
document.head.appendChild(style);

const c=document.createElement('canvas');
c.id='irisOrbitV23';c.setAttribute('aria-hidden','true');
const touch=document.getElementById('touchRing');
if(touch)stage.insertBefore(c,touch);else stage.appendChild(c);
const x=c.getContext('2d',{alpha:true});
let W=0,H=0,D=1,touchEnergy=0,px=0,py=0;
const dust=Array.from({length:74},(_,i)=>({
 a:i/74*Math.PI*2+((i*37)%17)*.019,
 k:1.075+(i%11)*.024,
 s:(i%2?1:-1)*(.000010+(i%7)*.0000022),
 z:.35+(i%5)*.24,
 o:.028+(i%8)*.011,
 p:i*1.417
}));
const rgba=(a,c)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
function resize(){D=Math.min(2,devicePixelRatio||1);W=stage.clientWidth;H=stage.clientHeight;c.width=Math.max(1,Math.floor(W*D));c.height=Math.max(1,Math.floor(H*D));c.style.width=W+'px';c.style.height=H+'px';x.setTransform(D,0,0,D,0,0)}
function vars(){const s=getComputedStyle(document.documentElement),raw=(s.getPropertyValue('--accent')||'198 220 237').trim().split(/\s+/).map(Number);return{cx:parseFloat(s.getPropertyValue('--eye-x'))||W/2,cy:parseFloat(s.getPropertyValue('--eye-y'))||H*.435,r:parseFloat(s.getPropertyValue('--eye-r'))||Math.min(W*.34,H*.178,174),col:[raw[0]||198,raw[1]||220,raw[2]||237]}}
function mode(){for(const m of ['sport','water','food','sleep','insights','home'])if(app.classList.contains('mode-'+m))return m;return'home'}
function ring(cx,cy,r,col,a,w=.5){x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.strokeStyle=rgba(a,col);x.lineWidth=w;x.stroke()}
function arc(cx,cy,r,a0,len,col,a,w=1){x.beginPath();x.arc(cx,cy,r,a0,a0+len);x.strokeStyle=rgba(a,col);x.lineWidth=w;x.lineCap='round';x.stroke()}
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function draw(t){
 if(reducedMotion.matches)t=0;
 x.clearRect(0,0,W,H);
 const v=vars(),m=mode(),menu=app.classList.contains('menu-open');
 const fade=menu?.12:m==='insights'?.55:1;
 const breath=1+Math.sin(t*.00062)*.0036;
 const speed=m==='sport'?.00105:m==='water'?.00023:m==='food'?.00016:m==='sleep'?.000045:.00012;
 x.save();x.globalCompositeOperation='screen';
 [1.04,1.12].forEach((k,i)=>ring(v.cx,v.cy,v.r*k*breath,v.col,(i===0?.042:.018)*fade*(menu?1.45:1),i===0?.72:.42));
 const rot=t*.000042;
 const segs=[
  [1.08,.15,.42,.060],[1.08,2.15,.62,.050],[1.08,4.48,.34,.055],
  [1.17,.88,.28,.038],[1.17,3.06,.46,.043],[1.17,5.20,.30,.036],
  [1.28,.36,.22,.028],[1.28,2.02,.38,.032],[1.28,4.76,.31,.030]
 ];
 segs.slice(0,3).forEach((q,i)=>arc(v.cx,v.cy,v.r*q[0],q[1]+rot*(i%2?-1:1),q[2],v.col,q[3]*fade*(menu?1.6:1),.55));
 dust.forEach((d,i)=>{
  const a=d.a+t*d.s+Math.sin(t*.00034+d.p)*.012;
  const rr=v.r*d.k*(1+Math.sin(t*.00046+d.p)*.004);
  const xx=v.cx+Math.cos(a)*rr,yy=v.cy+Math.sin(a)*rr;
  const tw=.55+.45*Math.sin(t*.0014+d.p);
  const near=Math.hypot(xx-px,yy-py),boost=touchEnergy*Math.max(0,1-near/(v.r*.75));
  const al=(d.o*tw*.42+boost*.055)*fade;
  x.beginPath();x.arc(xx,yy,d.z+boost*.9,0,Math.PI*2);x.fillStyle=rgba(al,v.col);x.fill();
  if(i%13===0){x.beginPath();x.arc(xx,yy,(d.z+1)*3.1,0,Math.PI*2);x.fillStyle=rgba(al*.09,v.col);x.fill();}
 });
 const lineR=v.r*1.025*breath;
 const a0=t*speed-Math.PI*.64;
 if(m!=='sport'){
   const len=m==='water'?1.05:m==='food'?.78:.92;
   const alpha=m==='home'?.20:m==='water'?.24:m==='food'?.17:.14;
   arc(v.cx,v.cy,lineR,a0,len,v.col,alpha*(menu?1.7:1),1.05);
   arc(v.cx,v.cy,lineR,a0+Math.PI*1.08,len*.34,v.col,alpha*.42,0.7);
   const sa=a0+len,dx=v.cx+Math.cos(sa)*lineR,dy=v.cy+Math.sin(sa)*lineR;
   x.beginPath();x.arc(dx,dy,1.15+touchEnergy*.8,0,Math.PI*2);x.fillStyle=rgba((alpha+.12+touchEnergy*.16),v.col);x.fill();
 }
 x.restore();touchEnergy*=.93;requestAnimationFrame(draw);
}
stage.addEventListener('pointerdown',e=>{const b=stage.getBoundingClientRect();px=e.clientX-b.left;py=e.clientY-b.top;touchEnergy=1},{passive:true});
stage.addEventListener('pointermove',e=>{const b=stage.getBoundingClientRect();px=e.clientX-b.left;py=e.clientY-b.top;if(e.buttons||e.pressure)touchEnergy=Math.min(1,touchEnergy+.07)},{passive:true});
addEventListener('resize',resize,{passive:true});resize();requestAnimationFrame(draw);
})();