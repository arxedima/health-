(()=>{'use strict';
const app=document.getElementById('app'),stage=document.getElementById('stage');
if(!app||!stage||document.getElementById('irisMasterV33'))return;

const style=document.createElement('style');
style.id='irisV33Style';
style.textContent=`
#irisMasterV33{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;opacity:0;transition:opacity .42s ease;mix-blend-mode:screen}
.app.mode-home #irisMasterV33,.app.mode-sport #irisMasterV33,.app.mode-water #irisMasterV33,.app.mode-sleep #irisMasterV33{opacity:1}
.app.mode-home #irisCanvas,.app.mode-sport #irisCanvas,.app.mode-water #irisCanvas,.app.mode-sleep #irisCanvas{opacity:0!important}
.app.mode-home #irisOrbitV23,.app.mode-sport #irisOrbitV23,.app.mode-water #irisOrbitV23,.app.mode-sleep #irisOrbitV23{opacity:0!important}
.app.mode-sleep #irisSleepV29,#irisModeV30{opacity:0!important}
.app.mode-home .mode-whisper{color:rgba(220,235,247,.39)!important}
.app.mode-sport .mode-whisper{color:rgba(247,192,187,.39)!important}
.app.mode-water .mode-whisper{color:rgba(192,224,247,.40)!important}
.app.mode-sleep .mode-whisper{color:rgba(194,207,242,.36)!important}
`;
document.head.appendChild(style);

const c=document.createElement('canvas');c.id='irisMasterV33';c.setAttribute('aria-hidden','true');
const data=document.getElementById('irisV24Data'),orbit=document.getElementById('irisOrbitV23');
if(data&&data.parentNode===stage)stage.insertBefore(c,data);else if(orbit&&orbit.parentNode===stage)stage.insertBefore(c,orbit);else stage.appendChild(c);
const x=c.getContext('2d',{alpha:true});
const TAU=Math.PI*2;
let W=0,H=0,D=1,gx=0,gy=0,tgx=0,tgy=0;

const themes={
 home:{a:[202,226,244],b:[66,105,142],hi:[239,249,255],o:[207,229,245],bright:1.00,glow:.19,fiber:.145,pupil:.202,breath:.00055,speed:.00016,orbit:.23},
 sport:{a:[238,94,82],b:[104,31,37],hi:[255,176,156],o:[246,132,116],bright:1.10,glow:.25,fiber:.170,pupil:.202,breath:.00086,speed:.00080,orbit:.25},
 water:{a:[91,179,241],b:[23,78,136],hi:[194,237,255],o:[139,211,250],bright:1.12,glow:.26,fiber:.180,pupil:.198,breath:.00050,speed:.00026,orbit:.27},
 sleep:{a:[106,135,224],b:[34,53,112],hi:[196,212,255],o:[143,164,235],bright:.92,glow:.18,fiber:.150,pupil:.208,breath:.00034,speed:.00008,orbit:.19}
};
const rnd=n=>{const q=Math.sin(n*12.9898+78.233)*43758.5453;return q-Math.floor(q)};
const rgba=(q,a)=>`rgba(${q[0]},${q[1]},${q[2]},${a})`;
const fibers=Array.from({length:390},(_,i)=>({a:i/390*TAU+(rnd(i)-.5)*.075,ri:.215+rnd(i+91)*.115,ro:.69+rnd(i+211)*.285,b:(rnd(i+397)-.5)*.038,w:.22+rnd(i+503)*.46,al:.44+rnd(i+607)*.66,g:rnd(i+701),p:rnd(i+811)*TAU}));
const corona=Array.from({length:126},(_,i)=>({a:i/126*TAU+(rnd(i+1201)-.5)*.05,len:.20+rnd(i+1301)*.19,al:.35+rnd(i+1401)*.55,w:.20+rnd(i+1501)*.34}));
const dust=Array.from({length:24},(_,i)=>({a:i/24*TAU+rnd(i+1701)*.22,k:1.08+rnd(i+1801)*.22,s:(i%2?1:-1)*(.000012+rnd(i+1901)*.000018),z:.55+rnd(i+2001)*1.05,al:.06+rnd(i+2101)*.11,p:rnd(i+2201)*TAU}));

function mode(){for(const m of ['sport','water','sleep','home'])if(app.classList.contains('mode-'+m))return m;return null}
function resize(){D=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;c.width=Math.max(1,Math.floor(W*D));c.height=Math.max(1,Math.floor(H*D));c.style.width=W+'px';c.style.height=H+'px';x.setTransform(D,0,0,D,0,0)}
function vars(){const s=getComputedStyle(document.documentElement);return{cx:parseFloat(s.getPropertyValue('--eye-x'))||W/2,cy:parseFloat(s.getPropertyValue('--eye-y'))||H*.435,r:parseFloat(s.getPropertyValue('--eye-r'))||Math.min(W*.34,H*.178,174)}}
function mix(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}

function drawEye(v,th,t,m){
 const fixedX=v.cx,fixedY=v.cy;
 const breathe=1+Math.sin(t*th.breath)*.0042;
 const r=v.r*.975*breathe;
 const cx=fixedX+gx,cy=fixedY+gy;
 const p=r*th.pupil;

 // luminous atmosphere, kept tight so the eye stays premium rather than neon
 const outer=x.createRadialGradient(fixedX,fixedY,r*.34,fixedX,fixedY,r*1.30);
 outer.addColorStop(0,rgba(th.a,th.glow*.46));outer.addColorStop(.55,rgba(th.a,th.glow*.17));outer.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=outer;x.beginPath();x.arc(fixedX,fixedY,r*1.28,0,TAU);x.fill();

 x.save();x.beginPath();x.arc(fixedX,fixedY,r,0,TAU);x.clip();
 const base=x.createRadialGradient(cx-r*.025,cy-r*.035,r*.055,cx,cy,r*1.01);
 base.addColorStop(0,'rgba(0,0,0,1)');
 base.addColorStop(.16,rgba(th.b,.35*th.bright));
 base.addColorStop(.36,rgba(th.a,.31*th.bright));
 base.addColorStop(.58,rgba(mix(th.a,th.b,.48),.27*th.bright));
 base.addColorStop(.79,rgba(th.b,.22*th.bright));
 base.addColorStop(.94,'rgba(4,7,15,.84)');base.addColorStop(1,'rgba(0,0,0,.99)');
 x.fillStyle=base;x.fillRect(fixedX-r,fixedY-r,r*2,r*2);

 // irregular organic radial fibres; the same geometry is shared by all four modes
 fibers.forEach((f,i)=>{
   const shimmer=.78+.22*Math.sin(t*.00105+f.p);
   const a=f.a+Math.sin(t*.00012+f.p)*.0034;
   const ri=r*f.ri,ro=r*f.ro;
   const bend=f.b+Math.sin(t*.00017+i*.41)*.004;
   const mid=(ri+ro)*.52;
   const col=f.g<.22?th.hi:f.g<.76?th.a:th.b;
   const boost=f.g<.22?1.16:1;
   x.beginPath();x.moveTo(cx+Math.cos(a)*ri,cy+Math.sin(a)*ri);
   x.quadraticCurveTo(cx+Math.cos(a+bend)*mid,cy+Math.sin(a+bend)*mid,cx+Math.cos(a+bend*.30)*ro,cy+Math.sin(a+bend*.30)*ro);
   x.strokeStyle=rgba(col,th.fiber*f.al*shimmer*boost);x.lineWidth=f.w;x.lineCap='round';x.stroke();
 });

 // short inner corona breaks the flat-disc look
 corona.forEach((f,i)=>{
   const a=f.a+Math.sin(t*.00020+f.a*3)*.003;
   const ri=p*1.10,ro=p*(1.52+f.len);
   const col=i%4===0?th.hi:th.a;
   x.beginPath();x.moveTo(cx+Math.cos(a)*ri,cy+Math.sin(a)*ri);x.lineTo(cx+Math.cos(a)*ro,cy+Math.sin(a)*ro);
   x.strokeStyle=rgba(col,th.fiber*.46*f.al);x.lineWidth=f.w;x.stroke();
 });

 // asymmetric smoke/depth
 const haze=x.createRadialGradient(cx-r*.18,cy+r*.13,r*.20,cx,cy,r*.91);
 haze.addColorStop(0,'rgba(0,0,0,.05)');haze.addColorStop(.48,'rgba(9,13,24,.02)');haze.addColorStop(1,'rgba(0,0,0,.28)');
 x.fillStyle=haze;x.beginPath();x.arc(fixedX,fixedY,r*.94,0,TAU);x.fill();
 const side=x.createLinearGradient(fixedX-r,fixedY,fixedX+r,fixedY);
 side.addColorStop(0,'rgba(0,0,0,.24)');side.addColorStop(.34,'rgba(0,0,0,0)');side.addColorStop(.72,'rgba(0,0,0,.035)');side.addColorStop(1,'rgba(0,0,0,.20)');
 x.fillStyle=side;x.fillRect(fixedX-r,fixedY-r,r*2,r*2);

 // living pupil
 const pulse=1+Math.sin(t*(m==='sport'?.0048:m==='sleep'?.0015:.0028))*(m==='sport'?.018:.010);
 const pr=p*pulse;
 const pg=x.createRadialGradient(cx-r*.018,cy-r*.025,0,cx,cy,pr);
 pg.addColorStop(0,'rgba(0,0,0,1)');pg.addColorStop(.78,'rgba(0,0,0,.998)');pg.addColorStop(1,'rgba(7,10,18,.97)');
 x.fillStyle=pg;x.beginPath();x.arc(cx,cy,pr,0,TAU);x.fill();
 x.beginPath();x.arc(cx,cy,pr*1.11,0,TAU);x.strokeStyle=rgba(th.a,.18*th.bright);x.lineWidth=.8;x.stroke();

 // restrained highlights
 const ha=m==='sleep'?.050:m==='sport'?.080:.075;
 let hx=cx-r*.21,hy=cy-r*.27,hg=x.createRadialGradient(hx,hy,0,hx,hy,r*.17);
 hg.addColorStop(0,`rgba(255,255,255,${ha})`);hg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=hg;x.beginPath();x.arc(hx,hy,r*.17,0,TAU);x.fill();
 hx=cx+r*.16;hy=cy+r*.19;hg=x.createRadialGradient(hx,hy,0,hx,hy,r*.09);hg.addColorStop(0,rgba(th.hi,.040));hg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=hg;x.beginPath();x.arc(hx,hy,r*.09,0,TAU);x.fill();
 x.restore();

 // limbal edge: dark, thin and irregular rather than a perfect luminous plate
 x.beginPath();x.arc(fixedX,fixedY,r,0,TAU);x.strokeStyle='rgba(0,0,0,.78)';x.lineWidth=2.1;x.stroke();
 x.beginPath();x.arc(fixedX,fixedY,r*.993,0,TAU);x.strokeStyle=rgba(th.o,.16*th.bright);x.lineWidth=.72;x.stroke();
 for(let i=0;i<9;i++){
   const a=.34+i*.71+rnd(i+2901)*.18,len=.16+rnd(i+3001)*.25;
   x.beginPath();x.arc(fixedX,fixedY,r*(.984+rnd(i+3101)*.012),a,a+len);x.strokeStyle=rgba(th.hi,.030+rnd(i+3201)*.035);x.lineWidth=.45;x.stroke();
 }
 return{cx:fixedX,cy:fixedY,r};
}

function drawOrbit(e,th,t,m){
 const menu=app.classList.contains('menu-open');
 const r1=e.r*1.075,r2=e.r*1.145;
 const start=t*th.speed-Math.PI*.62;
 const len=m==='sleep'?.46:m==='sport'?.58:.78;
 x.beginPath();x.arc(e.cx,e.cy,r1,0,TAU);x.strokeStyle=rgba(th.o,.050*(menu?1.3:1));x.lineWidth=.55;x.stroke();
 x.beginPath();x.arc(e.cx,e.cy,r2,0,TAU);x.strokeStyle=rgba(th.o,.026*(menu?1.3:1));x.lineWidth=.42;x.stroke();
 x.beginPath();x.arc(e.cx,e.cy,r1,start,start+len);x.strokeStyle=rgba(th.o,th.orbit*(menu?1.35:1));x.lineWidth=1.0;x.lineCap='round';x.stroke();
 x.beginPath();x.arc(e.cx,e.cy,r2,-start*.68,-start*.68+len*.35);x.strokeStyle=rgba(th.o,th.orbit*.42);x.lineWidth=.72;x.stroke();
 dust.forEach((d,i)=>{
   const a=d.a+t*d.s+Math.sin(t*.00038+d.p)*.010,rr=e.r*d.k;
   const px=e.cx+Math.cos(a)*rr,py=e.cy+Math.sin(a)*rr,tw=.64+.36*Math.sin(t*.0012+d.p);
   x.beginPath();x.arc(px,py,d.z,0,TAU);x.fillStyle=rgba(i%5===0?th.hi:th.o,d.al*tw*(m==='sleep'?.72:1));x.fill();
 });
}

function draw(t){
 x.clearRect(0,0,W,H);gx+=(tgx-gx)*.055;gy+=(tgy-gy)*.055;
 const m=mode();if(m){x.save();x.globalCompositeOperation='screen';const th=themes[m],e=drawEye(vars(),th,t,m);drawOrbit(e,th,t,m);x.restore()}
 requestAnimationFrame(draw);
}
function point(e){const v=vars();tgx=Math.max(-1,Math.min(1,(e.clientX-v.cx)/(v.r*1.7)))*v.r*.022;tgy=Math.max(-1,Math.min(1,(e.clientY-v.cy)/(v.r*1.7)))*v.r*.018}
stage.addEventListener('pointerdown',point,{passive:true});stage.addEventListener('pointermove',point,{passive:true});stage.addEventListener('pointerleave',()=>{tgx=0;tgy=0},{passive:true});
addEventListener('resize',resize,{passive:true});
const note=document.querySelector('.settings-note');if(note)note.textContent='IRIS v33: единый живой master-eye для Главной, Спорта, Воды и Сна.';
resize();requestAnimationFrame(draw);
})();