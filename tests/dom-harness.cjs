const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

async function harness({width=393,height=709,left=0,water='0',reduced=false,welcome=false,motion='full',paint=true,beforeLoad=()=>{}}={}){
  const errors=[];
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(html,{url:'https://arxedima.github.io/health-/?v=46',runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window,d=w.document;
  const sheet=d.createElement('style');sheet.textContent=fs.readFileSync(path.join(root,'styles.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'journal.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'next.css'),'utf8');d.head.append(sheet);
  const clockBase=Date.now();
  class Clock extends Date{constructor(...args){super(...(args.length?args:[clockBase+now]))}static now(){return clockBase+now}}
  w.Date=Clock;
  let now=0,id=0,frames=new Map(),timers=new Map(),intervals=[];
  const contexts=new Map();let hidden=false;
  Object.defineProperty(d,'hidden',{get:()=>hidden});
  Object.defineProperty(w.performance,'now',{value:()=>now,configurable:true});
  Object.defineProperty(w,'innerWidth',{value:width+left*2});
  Object.defineProperty(w,'innerHeight',{value:height});
  Object.defineProperty(w,'devicePixelRatio',{value:2});
  w.structuredClone=structuredClone;
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
  w.XMLHttpRequest=class {open(method,url){this.url=url}send(){this.status=200;this.responseText=fs.readFileSync(path.join(root,this.url.split('?')[0]),'utf8')}};
  w.matchMedia=()=>({matches:reduced,addEventListener(){}});
  w.URL.createObjectURL=()=> 'blob:qa';w.navigator.vibrate=()=>{};
  w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};
  w.HTMLMediaElement.prototype.pause=function(){};
  w.requestAnimationFrame=fn=>{const key=++id;frames.set(key,fn);return key};
  w.cancelAnimationFrame=key=>frames.delete(key);
  w.setTimeout=(fn,delay=0)=>{const key=++id;timers.set(key,{fn,at:now+delay});return key};
  w.clearTimeout=key=>timers.delete(key);
  w.setInterval=fn=>{intervals.push(fn);return ++id};
  w.clearInterval=()=>{};
  const rect={left,top:0,width,height,right:left+width,bottom:height,x:left,y:0};
  w.HTMLElement.prototype.getBoundingClientRect=function(){if(this.classList.contains('bottom-nav'))return {...rect,top:height-82,y:height-82,height:64,bottom:height-18};return rect};
  Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return width}});
  Object.defineProperty(w.HTMLElement.prototype,'clientHeight',{get(){return height}});
  Object.defineProperty(w.HTMLElement.prototype,'scrollHeight',{get(){return this.id==='metric'?214:height}});
  w.HTMLElement.prototype.setPointerCapture=function(pointerId){this.capture=pointerId};
  w.HTMLElement.prototype.releasePointerCapture=function(pointerId){
    if(this.capture===pointerId){this.capture=null;const e=new w.Event('lostpointercapture',{bubbles:true});Object.assign(e,{pointerId,clientX:0,clientY:0});this.dispatchEvent(e)}
  };
  w.HTMLCanvasElement.prototype.getContext=function(){
    if(contexts.has(this.id))return contexts.get(this.id).proxy;
    const canvas=createCanvas(1,1),ctx=canvas.getContext('2d');
    const data={canvas,ctx,curves:[],proxy:null,paints:0,strokes:0,arcs:[]};
    const proxy=new Proxy(ctx,{
      get(target,k){
        if(!paint&&typeof target[k]==='function')return k.startsWith('create')?()=>({addColorStop(){}}):()=>{};
        if(k==='clearRect')return (...a)=>{data.curves=[];return target.clearRect(...a)};
        if(k==='fillRect')return (...a)=>{if(a[0]===0&&a[1]===0){data.curves=[];data.paints++;data.strokes=0;data.arcs=[]}return target.fillRect(...a)};
        if(k==='stroke')return (...a)=>{data.strokes++;return target.stroke(...a)};
        if(k==='arc')return (...a)=>{data.arcs.push(a);return target.arc(...a)};
        if(k==='quadraticCurveTo')return (...a)=>{data.curves.push(a);return target.quadraticCurveTo(...a)};
        const value=target[k];return typeof value==='function'?value.bind(target):value;
      },set(target,k,v){target[k]=v;return true}
    });data.proxy=proxy;contexts.set(this.id,data);
    Object.defineProperty(this,'width',{get:()=>canvas.width,set:v=>canvas.width=v});
    Object.defineProperty(this,'height',{get:()=>canvas.height,set:v=>canvas.height=v});
    return proxy;
  };
  w.localStorage.setItem('irisMotionV41',motion);w.localStorage.setItem('irisSound','off');if(!welcome)w.localStorage.setItem('irisWelcomedV39','1');
  w.localStorage.setItem('irisWaterMl',water);
  const day=new Date();w.localStorage.setItem('irisWaterDateV24',`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`);
  beforeLoad(w,d);
  for(const script of [...d.scripts]){
    if(script.src){const name=path.basename(new URL(script.src).pathname);w.eval(fs.readFileSync(path.join(root,name),'utf8')+'\n//# sourceURL='+name)}
    else w.eval(script.textContent);
  }
  async function tick(count=1){
    for(let i=0;i<count;i++){
      now+=16.667;
      for(const [key,timer] of timers){if(timer.at<=now){timers.delete(key);timer.fn()}}
      const batch=[...frames];for(const [key,fn] of batch){if(frames.has(key)){frames.delete(key);fn(now)}}
      if(i%15===0)intervals.forEach(fn=>fn());
      await Promise.resolve();
    }
  }
  function point(){const style=d.documentElement.style;return{x:parseFloat(style.getPropertyValue('--eye-x')),y:parseFloat(style.getPropertyValue('--eye-y')),r:parseFloat(style.getPropertyValue('--eye-r'))}}
  function pointer(type,x,y,pointerId=1,isPrimary=true){const e=new w.Event(type,{bubbles:true});Object.assign(e,{clientX:left+x,clientY:y,pointerId,isPrimary,buttons:type==='pointerup'||type==='pointercancel'?0:1,pressure:.5});d.querySelector('#stage').dispatchEvent(e)}
  async function tap(x,y){pointer('pointerdown',x,y);await tick(5);pointer('pointerup',x,y);await tick(1)}
  async function swipe(dx,dy=0){const p=point();pointer('pointerdown',p.x,p.y);await tick(2);pointer('pointermove',p.x+dx,p.y+dy);await tick(10);pointer('pointerup',p.x+dx,p.y+dy);await tick(45)}
  async function select(mode){const p=point();pointer('pointerdown',p.x,p.y);await tick(36);assert.equal(d.querySelector('#radialMenu').getAttribute('aria-hidden'),'false');d.querySelector(`[data-mode="${mode}"]`).click();pointer('pointerup',p.x,p.y);await tick(65);assert(d.querySelector('#app').classList.contains('mode-'+mode));}
  await tick(70);
  assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
  return{w,d,contexts,tick,point,pointer,tap,swipe,select,errors,setHidden(v){hidden=v;d.dispatchEvent(new w.Event('visibilitychange'))},close:()=>w.close()};
}

module.exports={harness};
