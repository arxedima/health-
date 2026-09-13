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
let W=0,H=0,D=1;
const TAU=Math.PI*2;
const dust=Array.from({length:48},(_,i)=>({a:i/48*TAU+((i*37)%17)*.019,k:1.075+(i%11)*.024,z:.35+(i%5)*.19,o:.025+(i%8)*.009,p:i*1.417}));
const rgba=(a,c)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
function size(f){if(W===f.width&&H===f.height&&D===f.dpr)return;W=f.width;H=f.height;D=f.dpr;c.width=Math.max(1,Math.round(W*D));c.height=Math.max(1,Math.round(H*D));c.style.width=W+'px';c.style.height=H+'px';x.setTransform(D,0,0,D,0,0)}
function draw(f){
 size(f);x.clearRect(0,0,W,H);
 const {x:cx,y:cy,r,t,col,motion:q}=f,w=q.weights,fade=1-f.menu*.88;
 const phase=t*q.amount;
 x.save();x.globalCompositeOperation='screen';
 // Leave room for actual diary marks and the training progress arc.
 const speed=w.home*.000011+w.water*.000019+w.food*.000007+w.sleep*.000003+w.sport*.000005;
 for(const d of dust){
  const a=d.a+phase*speed+Math.sin(phase*.00025+d.p)*.008;
  const rr=r*d.k,xx=cx+Math.cos(a)*rr,yy=cy+Math.sin(a)*rr;
  const delta=Math.atan2(Math.sin(a-q.touchAngle),Math.cos(a-q.touchAngle));
  const echo=q.touchEcho*Math.exp(-delta*delta/.2)*q.amount;
  const tw=.75+.25*Math.sin(phase*.00075+d.p);
  const alpha=(d.o*tw*.37+echo*.065)*fade*(1-w.sleep*.55);
  x.beginPath();x.arc(xx,yy,d.z+echo*.4,0,TAU);x.fillStyle=rgba(alpha,col);x.fill();
 }
 x.restore();
}
window.IRISMotion.subscribe(draw);
})();
