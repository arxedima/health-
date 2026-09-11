(()=>{
'use strict';
const app=document.getElementById('app');
const stage=document.getElementById('stage');
if(!app||!stage||document.getElementById('sleepEyeV26'))return;

const style=document.createElement('style');
style.textContent=`
#sleepEyeV26{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;opacity:0;transition:opacity .45s ease;mix-blend-mode:screen}
.app.mode-sleep #sleepEyeV26{opacity:1}
.app.mode-sleep #irisCanvas{opacity:.52;filter:brightness(.78) saturate(.74);transition:opacity .45s ease,filter .45s ease}
.app:not(.mode-sleep) #irisCanvas{opacity:1;filter:none}
`;
document.head.appendChild(style);

const c=document.createElement('canvas');
c.id='sleepEyeV26';
c.setAttribute('aria-hidden','true');
const orbit=document.getElementById('irisOrbitV23');
if(orbit&&orbit.parentNode===stage)stage.insertBefore(c,orbit);else stage.appendChild(c);
const x=c.getContext('2d',{alpha:true});
let W=0,H=0,D=1;
const TAU=Math.PI*2;
function resize(){
  D=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;
  c.width=Math.max(1,Math.floor(W*D));c.height=Math.max(1,Math.floor(H*D));
  c.style.width=W+'px';c.style.height=H+'px';x.setTransform(D,0,0,D,0,0);
}
function vars(){
  const s=getComputedStyle(document.documentElement);
  const raw=(s.getPropertyValue('--accent')||'78 93 148').trim().split(/\s+/).map(Number);
  return{
    cx:parseFloat(s.getPropertyValue('--eye-x'))||W/2,
    cy:parseFloat(s.getPropertyValue('--eye-y'))||H*.435,
    r:parseFloat(s.getPropertyValue('--eye-r'))||Math.min(W*.34,H*.178,174),
    col:[raw[0]||78,raw[1]||93,raw[2]||148]
  };
}
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
function draw(t){
  x.clearRect(0,0,W,H);
  if(app.classList.contains('mode-sleep')){
    const v=vars();
    const r=v.r*.98;
    const slit=.27+.018*Math.sin(t*.0008);
    x.save();
    x.beginPath();x.ellipse(v.cx,v.cy,r,r*slit,0,0,TAU);x.clip();

    const g=x.createRadialGradient(v.cx,v.cy,r*.12,v.cx,v.cy,r);
    g.addColorStop(0,'rgba(0,0,0,.98)');
    g.addColorStop(.24,rgba(v.col,.20));
    g.addColorStop(.58,rgba(v.col,.13));
    g.addColorStop(.86,rgba(v.col,.055));
    g.addColorStop(1,'rgba(0,0,0,.92)');
    x.fillStyle=g;x.beginPath();x.arc(v.cx,v.cy,r,0,TAU);x.fill();

    for(let i=0;i<210;i++){
      const a=i/210*TAU+Math.sin(i*2.17)*.018;
      const ri=r*(.25+(i%9)*.006);
      const ro=r*(.76+(i%11)*.012);
      x.beginPath();
      x.moveTo(v.cx+Math.cos(a)*ri,v.cy+Math.sin(a)*ri);
      x.lineTo(v.cx+Math.cos(a+.018*Math.sin(t*.00025+i))*ro,v.cy+Math.sin(a+.018*Math.sin(t*.00025+i))*ro);
      x.strokeStyle=rgba(v.col,.035+(i%7)*.006);x.lineWidth=.35+(i%3)*.12;x.stroke();
    }

    x.beginPath();x.arc(v.cx,v.cy,r*.235,0,TAU);x.fillStyle='rgba(0,0,0,.995)';x.fill();
    x.beginPath();x.arc(v.cx,v.cy,r*.265,0,TAU);x.strokeStyle=rgba(v.col,.11);x.lineWidth=.7;x.stroke();
    x.restore();

    x.beginPath();x.ellipse(v.cx,v.cy,r,r*slit,0,0,TAU);x.strokeStyle=rgba(v.col,.08);x.lineWidth=.65;x.stroke();
  }
  requestAnimationFrame(draw);
}
addEventListener('resize',resize,{passive:true});
resize();requestAnimationFrame(draw);
})();