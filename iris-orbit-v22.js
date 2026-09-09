(()=>{
'use strict';
const stage=document.getElementById('stage');
if(!stage||document.getElementById('irisOrbitCanvas'))return;
const orbit=document.createElement('canvas');
orbit.id='irisOrbitCanvas';
orbit.setAttribute('aria-hidden','true');
orbit.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;mix-blend-mode:screen;';
const touch=document.getElementById('touchRing');
if(touch)stage.insertBefore(orbit,touch);else stage.appendChild(orbit);
const ctx=orbit.getContext('2d',{alpha:true});
let W=0,H=0,D=1,px=0,py=0,power=0;
const particles=Array.from({length:54},(_,i)=>({
  a:(i/54)*Math.PI*2+(i%7)*.13,
  ring:1.09+(i%9)*.035,
  speed:(i%2?1:-1)*(.000018+(i%6)*.000004),
  size:.45+(i%5)*.23,
  alpha:.06+(i%8)*.022,
  wobble:.012+(i%4)*.006,
  phase:i*1.731
}));
function resize(){
  D=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;
  orbit.width=Math.max(1,Math.floor(W*D));orbit.height=Math.max(1,Math.floor(H*D));
  orbit.style.width=W+'px';orbit.style.height=H+'px';ctx.setTransform(D,0,0,D,0,0);
}
function vars(){
  const s=getComputedStyle(document.documentElement);
  const x=parseFloat(s.getPropertyValue('--eye-x'))||W/2;
  const y=parseFloat(s.getPropertyValue('--eye-y'))||H*.435;
  const r=parseFloat(s.getPropertyValue('--eye-r'))||Math.min(W*.34,H*.178,174);
  const raw=(s.getPropertyValue('--accent')||'198 220 237').trim().split(/\s+/).map(Number);
  return{x,y,r,c:[raw[0]||198,raw[1]||220,raw[2]||237]};
}
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
function arcSegment(x,y,r,start,len,c,a,w=1){ctx.beginPath();ctx.arc(x,y,r,start,start+len);ctx.strokeStyle=rgba(c,a);ctx.lineWidth=w;ctx.stroke();}
function draw(t){
  ctx.clearRect(0,0,W,H);
  const {x,y,r,c}=vars();
  const app=document.getElementById('app');
  const menu=app?.classList.contains('menu-open');
  const sport=app?.classList.contains('mode-sport');
  const sleep=app?.classList.contains('mode-sleep');
  const insights=app?.classList.contains('mode-insights');
  const base=(sleep?.38:insights?.58:1)*(menu?1.28:1);
  const breath=1+Math.sin(t*.00115)*.008;
  ctx.save();
  ctx.globalCompositeOperation='screen';

  // Soft halo just outside the biological iris.
  let g=ctx.createRadialGradient(x,y,r*.92,x,y,r*1.42);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(.30,rgba(c,.018*base));
  g.addColorStop(.61,rgba(c,.055*base));
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*1.45,0,Math.PI*2);ctx.fill();

  // The several thin concentric circles visible in the original design.
  [1.035,1.075,1.125,1.19,1.275,1.36].forEach((k,i)=>{
    ctx.beginPath();ctx.arc(x,y,r*k*breath,0,Math.PI*2);
    ctx.strokeStyle=rgba(c,(i<3?.075:.035)*base);ctx.lineWidth=i===0?.9:.55;ctx.stroke();
  });

  // Rotating broken arcs: slow, restrained, mechanical/organic.
  const rot=t*(sport?.00024:.000075);
  const sets=[
    [1.08,0,.62,.15],[1.08,2.08,.43,.08],[1.08,4.32,.72,.12],
    [1.17,.8,.34,.08],[1.17,2.82,.58,.115],[1.17,5.06,.29,.07],
    [1.27,.18,.26,.07],[1.27,1.66,.72,.09],[1.27,4.46,.48,.08],
    [1.36,1.05,.21,.055],[1.36,3.15,.43,.07],[1.36,5.42,.25,.055]
  ];
  sets.forEach((s,i)=>arcSegment(x,y,r*s[0]*breath,s[1]+rot*(i%2?-.72:1),s[2],c,s[3]*base,i<3?1.15:.65));

  // Fine rotating tick marks just outside the iris edge.
  const tickRot=-t*.000028;
  for(let i=0;i<84;i++){
    const a=i/84*Math.PI*2+tickRot;
    const major=i%7===0;
    const rr=r*(1.045+(major?.008:0));
    const len=r*(major?.042:.019);
    const ca=Math.cos(a),sa=Math.sin(a);
    ctx.beginPath();ctx.moveTo(x+ca*rr,y+sa*rr);ctx.lineTo(x+ca*(rr+len),y+sa*(rr+len));
    ctx.strokeStyle=rgba(c,(major?.11:.035)*base);ctx.lineWidth=major?.72:.45;ctx.stroke();
  }

  // Orbiting dust/points: this is the moving field that used to circle the eye.
  particles.forEach((p,i)=>{
    const a=p.a+t*p.speed+Math.sin(t*.00045+p.phase)*p.wobble;
    const rr=r*p.ring*(1+Math.sin(t*.0007+p.phase)*.009);
    const xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr;
    const pulse=.62+.38*Math.sin(t*.0021+p.phase);
    const near=Math.hypot(xx-px,yy-py);
    const touchBoost=power*Math.max(0,1-near/(r*.8));
    const al=(p.alpha*pulse+touchBoost*.15)*base;
    ctx.beginPath();ctx.arc(xx,yy,p.size+(touchBoost*1.4),0,Math.PI*2);ctx.fillStyle=rgba(c,al);ctx.fill();
    if(i%11===0){ctx.beginPath();ctx.arc(xx,yy,p.size*4.5,0,Math.PI*2);ctx.fillStyle=rgba(c,al*.12);ctx.fill();}
  });

  // Four subtle anchor nodes, brighter when the hold menu is open.
  [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach((a,i)=>{
    const rr=r*1.105,xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr;
    const pulse=.72+.28*Math.sin(t*.002+i*1.7);
    ctx.beginPath();ctx.arc(xx,yy,menu?2.8:1.45,0,Math.PI*2);ctx.fillStyle=rgba(c,(menu?.64:.19)*pulse*base);ctx.fill();
    ctx.beginPath();ctx.arc(xx,yy,menu?8:4.5,0,Math.PI*2);ctx.strokeStyle=rgba(c,(menu?.13:.035)*base);ctx.lineWidth=.6;ctx.stroke();
  });

  // A faint traveling spark around the outer orbit.
  const sa=t*(sport?.00115:.00034)-Math.PI/2;
  const sr=r*1.29, sx=x+Math.cos(sa)*sr, sy=y+Math.sin(sa)*sr;
  ctx.beginPath();ctx.arc(sx,sy,sport?2.2:1.25,0,Math.PI*2);ctx.fillStyle=rgba(c,(sport?.62:.30)*base);ctx.fill();
  const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,sport?18:10);sg.addColorStop(0,rgba(c,(sport?.20:.10)*base));sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,sport?18:10,0,Math.PI*2);ctx.fill();

  ctx.restore();
  power*=.92;
  requestAnimationFrame(draw);
}
stage.addEventListener('pointerdown',e=>{px=e.clientX;py=e.clientY;power=1},{passive:true});
stage.addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY;if(e.buttons||e.pressure)power=Math.min(1,power+.09)},{passive:true});
addEventListener('resize',resize,{passive:true});
resize();requestAnimationFrame(draw);
})();