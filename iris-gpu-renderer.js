(()=>{'use strict';
const app=document.querySelector('#app'),stage=document.querySelector('#stage'),old=document.querySelector('#irisCanvas');
if(!app||!stage||!old)return;
const c=document.createElement('canvas');c.id='irisGpuCanvas';c.setAttribute('aria-hidden','true');old.insertAdjacentElement('afterend',c);
Object.assign(c.style,{position:'absolute',inset:'0',width:'100%',height:'100%',display:'block',pointerEvents:'none',zIndex:'1'});
old.style.opacity='0';
const gl=c.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'high-performance'});
if(!gl){old.style.opacity='';c.remove();return}
const vs=`#version 300 es
in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const fs=`#version 300 es
precision highp float;in vec2 uv;out vec4 O;
uniform vec2 res,ptr;uniform float time,touch,light,mode;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
vec3 pal(){if(mode<.5)return vec3(.24,.55,.82);if(mode<1.5)return vec3(.92,.24,.20);if(mode<2.5)return vec3(.12,.55,.92);if(mode<3.5)return vec3(.15,.65,.34);return vec3(.48,.30,.86);}
void main(){
 vec2 q=(uv-.5)*vec2(res.x/res.y,1.);q.y+=.055;
 float r=length(q),a=atan(q.y,q.x),R=.205;
 vec2 mp=(ptr-.5)*vec2(res.x/res.y,1.);mp.y+=.055;float ma=atan(mp.y,mp.x),mr=length(mp);
 float da=atan(sin(a-ma),cos(a-ma));float influence=touch*exp(-da*da*42.)*smoothstep(R*1.18,R*.18,mr);
 float wave=sin(da*12.-time*6.)*exp(-da*da*24.); float warp=influence*(.20*sin(da*7.)+.10*sign(da)+.07*wave);a+=warp;
 vec3 col=pal(),bg=light>.5?vec3(.984,.992,1.):vec3(0.);
 float iris=1.-smoothstep(R*.965,R,r);float pupil=1.-smoothstep(R*.255,R*.29,r);
 float edge=smoothstep(R*.20,R*.31,r)*iris;
 float phase=time*influence*7.; float radial=pow(max(0.,sin(a*260.+n(vec2(a*42.,r*900.))*7.+phase)),9.);
 float radial2=pow(max(0.,sin(a*137.-r*1150.+n(vec2(a*23.,r*530.))*5.-phase*.72)),12.);
 float crypt=n(vec2(a*55.,r*145.));
 float depth=.18+.82*smoothstep(R*.25,R*.92,r);
 vec3 irisCol=mix(col*.22,col*1.12,depth);
 irisCol+=col*(radial*.42+radial2*.24)*edge;
 irisCol-=vec3(.16)*crypt*edge*.32;
 float touchFiber=influence*(.025+.04*sin(a*190.+r*800.+phase*1.8));irisCol+=col*touchFiber;
 float rim=smoothstep(R*.83,R*.97,r)*iris;
 irisCol=mix(irisCol,col*.12,rim*.78);
 vec3 outc=mix(bg,irisCol,iris);outc=mix(outc,vec3(.006),pupil);
 float pupilGlow=smoothstep(R*.33,R*.27,r)*smoothstep(R*.245,R*.29,r);outc+=col*pupilGlow*.16;
 if(light>.5)outc=mix(outc,vec3(.98,.995,1.),(1.-iris)*.0);
 O=vec4(outc,1.);
}`;
function sh(t,s){const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(x));return x}
let pr;try{pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr))}catch(e){old.style.opacity='';c.remove();return}
gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const U={res:gl.getUniformLocation(pr,'res'),ptr:gl.getUniformLocation(pr,'ptr'),time:gl.getUniformLocation(pr,'time'),touch:gl.getUniformLocation(pr,'touch'),light:gl.getUniformLocation(pr,'light'),mode:gl.getUniformLocation(pr,'mode')};
let px=.5,py=.5,down=0,target=0,raf=0;
function resize(){const d=Math.min(devicePixelRatio||1,1.6),r=stage.getBoundingClientRect();c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);gl.viewport(0,0,c.width,c.height)}
function mode(){return app.classList.contains('mode-sport')?1:app.classList.contains('mode-water')?2:app.classList.contains('mode-food')?3:app.classList.contains('mode-sleep')?4:0}
function draw(t){down+=(target-down)*.18;gl.uniform2f(U.res,c.width,c.height);gl.uniform2f(U.ptr,px,1-py);gl.uniform1f(U.time,t*.001);gl.uniform1f(U.touch,down);gl.uniform1f(U.light,app.classList.contains('iris-light')?1:0);gl.uniform1f(U.mode,mode());gl.drawArrays(gl.TRIANGLES,0,3);raf=requestAnimationFrame(draw)}
function pt(e){const r=stage.getBoundingClientRect();px=(e.clientX-r.left)/r.width;py=(e.clientY-r.top)/r.height}
stage.addEventListener('pointerdown',e=>{pt(e);target=1},{passive:true});stage.addEventListener('pointermove',e=>{if(target)pt(e)},{passive:true});stage.addEventListener('pointerup',()=>target=0,{passive:true});stage.addEventListener('pointercancel',()=>target=0,{passive:true});
addEventListener('resize',resize,{passive:true});new MutationObserver(()=>{}).observe(app,{attributes:true,attributeFilter:['class']});resize();raf=requestAnimationFrame(draw);
window.IRISGPU={canvas:c,gl};
})();