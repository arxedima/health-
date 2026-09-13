(()=>{
'use strict';
// Shared motion language and frame feed. The eye, its rim and progress use one clock.
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const profiles={
 home:{pace:.00065,breath:.008,pupil:.005,wander:1,flow:.009,halo:1},
 water:{pace:.00072,breath:.010,pupil:.004,wander:.55,flow:.024,halo:1.15},
 sport:{pace:.0008,breath:.004,pupil:.003,wander:.25,flow:.007,halo:1},
 food:{pace:.00052,breath:.008,pupil:.006,wander:.5,flow:.014,halo:1.02},
 sleep:{pace:.00048,breath:.013,pupil:.010,wander:.18,flow:.010,halo:.8}
};
const media=matchMedia('(prefers-reduced-motion: reduce)');
let preference='full';try{preference=localStorage.getItem('irisMotionV41')||'full'}catch{}
if(!['full','soft','still'].includes(preference))preference='full';
let background=60;try{const raw=localStorage.getItem('irisBackgroundV42');if(raw!==null&&Number.isFinite(Number(raw)))background=clamp(Number(raw),0,100)}catch{}
const listeners=new Set(),weights={home:1,water:0,sport:0,food:0,sleep:0};
const energyByKind={food:0,sleep:0};
let waterWave=0,sport=0,touchEcho=0,touchAngle=0;
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${clamp(a,0,1)})`;
const intensity=()=>media.matches||preference==='still'?0:preference==='soft'?.35:1;
const invalidate=()=>dispatchEvent(new CustomEvent('iris:motion'));
function publishPreference(){document.documentElement.dataset.motion=intensity()===0?'still':preference;invalidate()}
function setPreference(value){if(!['full','soft','still'].includes(value))return;try{localStorage.setItem('irisMotionV41',value)}catch{}preference=value;publishPreference()}
function setBackground(value){if(!Number.isFinite(Number(value)))return;background=clamp(Number(value),0,100);try{localStorage.setItem('irisBackgroundV42',String(background))}catch{}invalidate()}
media.addEventListener?.('change',publishPreference);
addEventListener('storage',e=>{if(e.key==='irisMotionV41'){preference=['full','soft','still'].includes(e.newValue)?e.newValue:'full';publishPreference()}});
addEventListener('storage',e=>{if(e.key==='irisBackgroundV42'){background=e.newValue===null?60:clamp(Number(e.newValue)||0,0,100);invalidate()}});
function record(kind){if(!intensity())return;if(kind in energyByKind)energyByKind[kind]=1;if(kind==='water')waterWave=1;invalidate()}
function touch(angle){touchAngle=angle;touchEcho=1;invalidate()}
function update(mode,t,dt,running){
 const amount=intensity(),step=clamp(dt/16.667,.25,3),mix=amount?1-Math.exp(-dt/330):1;
 for(const name of Object.keys(weights))weights[name]+=(Number(name===mode)-weights[name])*mix;
 const p={pace:0,breath:0,pupil:0,wander:0,flow:0,halo:0};
 for(const [name,w] of Object.entries(weights))for(const k of Object.keys(p))p[k]+=profiles[name][k]*w;
 sport+=(Number(running&&mode==='sport')-sport)*(amount?1-Math.exp(-dt/360):1);
 if(amount){for(const kind of Object.keys(energyByKind))energyByKind[kind]*=Math.pow(.987,step);waterWave*=Math.pow(.987,step);touchEcho*=Math.pow(.964,step)}else{energyByKind.food=energyByKind.sleep=waterWave=touchEcho=0}
 const energy=energyByKind[mode]||0;
 const phase=t*.0041%TAU;
 // A soft paired training rhythm: deliberately unrelated to measured heart rate.
 const beat=(Math.exp(-Math.pow((phase-.8)/.44,2))+.45*Math.exp(-Math.pow((phase-1.75)/.48,2)))*sport*amount;
 return{...p,amount,weights:{...weights},energy,waterWave,touchEcho,touchAngle,beat,sport,breathing:Math.sin(t*p.pace)*amount};
}
function cloud(ctx,x,y,rx,ry,rotation,color,alpha){
 if(alpha<.001)return;
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(rx,ry);
 const g=ctx.createRadialGradient(0,0,.04,0,0,1);g.addColorStop(0,rgba(color,alpha));g.addColorStop(.42,rgba(color,alpha*.48));g.addColorStop(1,rgba(color,0));
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
}
function backdrop(ctx,f){
 const {x,y,r,t,motion:q}=f,w=q.weights,a=q.amount,quiet=(1-f.menu*.28)*background/60;
 ctx.save();ctx.globalCompositeOperation='screen';
 // A full-screen colour field remains visible beyond the eye and below the readout.
 const fields={home:[69,94,116,.33],water:[20,103,163,.53],sport:[152,39,40,.48],food:[65,109,48,.53],sleep:[89,46,149,.49]};
 const color=[0,0,0];let opacity=0;
 for(const [name,values] of Object.entries(fields)){for(let i=0;i<3;i++)color[i]+=values[i]*w[name];opacity+=values[3]*w[name]}
 ctx.save();ctx.translate(f.width*.5,y+r*.22);ctx.scale(Math.max(r*2.45,f.width*.88),Math.max(r*3.7,f.height*.74));
 const field=ctx.createRadialGradient(0,0,0,0,0,1);field.addColorStop(0,rgba(color,opacity*quiet));field.addColorStop(.32,rgba(color,opacity*.86*quiet));field.addColorStop(.68,rgba(color,opacity*.38*quiet));field.addColorStop(1,rgba(color,0));ctx.fillStyle=field;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
 // Home: an off-axis, cold halo which slowly follows the gaze.
 if(w.home>.003){
  const k=w.home*quiet,drift=Math.sin(t*.00012)*a;
  cloud(ctx,x-r*.13+drift*r*.1,y-r*.08,r*1.64,r*1.48,-.4,[167,203,230],.071*k);
  cloud(ctx,x+r*.55,y-r*.4,r*.75,r*1.24,.5+drift*.09,[187,213,230],.045*k);
 }
 // Water: crossing blue caustics, constrained to the space just around the iris.
 if(w.water>.003){
  const k=w.water*quiet,drift=Math.sin(t*.00036)*a;
  cloud(ctx,x-r*.52,y+r*.18,r*.92,r*1.7,-.45+drift*.14,[35,119,200],.15*k);
  cloud(ctx,x+r*.49,y-r*.17,r*.73,r*1.52,.55-drift*.1,[88,184,224],.105*k);
 }
 // Sport: a warm corona responds to the timer. It settles when paused.
 if(w.sport>.003){
  const k=w.sport*quiet;
  cloud(ctx,x,y,r*(1.58+q.beat*.1),r*(1.36+q.beat*.06),0,[188,53,39],(.11+q.beat*.038)*k);
  cloud(ctx,x-r*.68,y+r*.08,r*.68,r*1.1,-.45,[238,101,64],(.06+q.beat*.04)*k);
 }
 // Food: diffuse green light with a restrained golden inner warmth.
 if(w.food>.003){
  const k=w.food*quiet,drift=Math.sin(t*.00022)*a;
  cloud(ctx,x-r*.4,y+r*.2,r*1.15,r*1.38,-.35+drift*.1,[94,135,58],(.095+q.energy*.045)*k);
  cloud(ctx,x+r*.47,y-r*.22,r*.9,r*1.27,.7,[158,160,80],.065*k);
 }
 // Sleep: two low-contrast violet veils breathe in opposite directions.
 if(w.sleep>.003){
  const k=w.sleep*quiet,breath=q.breathing;
  cloud(ctx,x-r*.4,y-r*.02,r*(.94+breath*.025),r*1.6,-.53+breath*.025,[106,66,170],(.11+breath*.014)*k);
  cloud(ctx,x+r*.49,y+r*.17,r*.87,r*1.39,.5-breath*.025,[58,74,149],.09*k);
 }
 ctx.restore();
 // Keep the outer edge of the viewport black in every theme.
 const edge=ctx.createLinearGradient(0,0,f.width,0);edge.addColorStop(0,'#000');edge.addColorStop(.10,'rgba(0,0,0,.14)');edge.addColorStop(.25,'rgba(0,0,0,0)');edge.addColorStop(.75,'rgba(0,0,0,0)');edge.addColorStop(.90,'rgba(0,0,0,.14)');edge.addColorStop(1,'#000');ctx.fillStyle=edge;ctx.fillRect(0,0,f.width,f.height);
 const ends=ctx.createLinearGradient(0,0,0,f.height);ends.addColorStop(0,'rgba(0,0,0,.66)');ends.addColorStop(.22,'rgba(0,0,0,0)');ends.addColorStop(.72,'rgba(0,0,0,0)');ends.addColorStop(1,'rgba(0,0,0,.8)');ctx.fillStyle=ends;ctx.fillRect(0,0,f.width,f.height);
}
function fiber(f,t,q){
 const a=f.a,w=q.weights,amount=q.amount;
 return amount*(w.home*Math.sin(a*2+t*.00023)*.005+w.water*Math.sin(a*3-t*.00085+f.s*.6)*.021+w.food*Math.sin(a*5+t*.00035)*.012+w.sleep*Math.sin(a*2+t*.00026)*.01)+q.beat*Math.sin(a*4)*.007;
}
function inner(ctx,f){
 const {r,t,col,motion:q}=f,w=q.weights;
 ctx.save();ctx.globalCompositeOperation='screen';
 if(w.water>.003){
  for(let j=0;j<2;j++){
   const angle=-.7+j*2.1+Math.sin(t*.0004+j)*.16*q.amount;
   cloud(ctx,Math.cos(angle)*r*.52,Math.sin(angle)*r*.52,r*.4,r*.12,angle+.8,[93,193,235],.09*w.water);
  }
 }
 if(w.food>.003){
  const g=ctx.createRadialGradient(0,0,r*.21,0,0,r*.46);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.3,rgba([184,166,86],(.06+q.energy*.05)*w.food));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*.46,0,TAU);ctx.fill();
 }
 // Recorded actions produce one outward response rather than a constant flash.
 const action=q.energy*(w.food+w.sleep)+q.waterWave*w.water;
 if(q.amount&&action>.02){
  const progress=1-action,rr=r*(.23+progress*.72),g=ctx.createRadialGradient(0,0,Math.max(0,rr-r*.14),0,0,rr+r*.14);
  g.addColorStop(0,rgba(col,0));g.addColorStop(.5,rgba(col,Math.sin(progress*Math.PI)*.11));g.addColorStop(1,rgba(col,0));ctx.fillStyle=g;ctx.fillRect(-r,-r,r*2,r*2);
 }
 ctx.restore();
}
window.IRISMotion={update,backdrop,fiber,inner,touch,record,intensity,invalidate,setPreference,setBackground,get background(){return background},get preference(){return preference},get reduced(){return media.matches},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},frame(f){for(const fn of listeners)fn(f)}};
publishPreference();
})();
