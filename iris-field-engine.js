(()=>{'use strict';
class IRISFieldEngine{
 constructor(count=520){this.count=count;this.x=new Float32Array(count);this.v=new Float32Array(count);this.force=new Float32Array(count);this.pointer={active:false,a:0,r:0,va:0,vr:0};this.lastA=0;this.lastR=0}
 pointerTo(active,a,r){const p=this.pointer;p.active=active;if(active){let da=a-this.lastA;da-=Math.round(da/(Math.PI*2))*Math.PI*2;p.va=da;p.vr=r-this.lastR;p.a=a;p.r=r;this.lastA=a;this.lastR=r}else{p.va=0;p.vr=0}}
 step(dt,angles,light=false){const h=Math.min(2,Math.max(.35,dt/16.667)),p=this.pointer,n=this.count;for(let i=0;i<n;i++){let f=0;if(p.active){let d=p.a-angles[i];d-=Math.round(d/(Math.PI*2))*Math.PI*2;const w=Math.exp(-(d*d)/(light?.055:.04));f=w*(p.va*5.5+Math.sign(d)*Math.min(.028,Math.abs(d)*.07));}this.force[i]=f;const k=light?.19:.17,damp=Math.pow(light?.80:.77,h);this.v[i]=(this.v[i]+(f-this.x[i])*k*h)*damp;this.x[i]+=this.v[i]*h;if(Math.abs(this.x[i])<1e-5&&Math.abs(this.v[i])<1e-5){this.x[i]=0;this.v[i]=0}}}
 bend(i){return this.x[i]}
 radial(i,a){const p=this.pointer;if(!p.active)return 0;let d=p.a-a;d-=Math.round(d/(Math.PI*2))*Math.PI*2;return Math.exp(-(d*d)/.05)*Math.max(-.035,Math.min(.035,p.vr*.22))}
 reset(){this.x.fill(0);this.v.fill(0);this.force.fill(0);this.pointer.active=false}
}
window.IRISFieldEngine=IRISFieldEngine;
})();