(()=>{
'use strict';
const app=document.getElementById('app');
const stage=document.getElementById('stage');
const menu=document.getElementById('radialMenu');
const orbit=document.getElementById('irisOrbitV23');
if(!app||!stage||!menu||document.getElementById('irisV25Polish'))return;

const style=document.createElement('style');
style.id='irisV25Polish';
style.textContent=`
:root{--v25-ease:cubic-bezier(.16,1,.3,1)}
.app{--v25-mode-alpha:1}
.mode-whisper{font-size:7px!important;letter-spacing:.42em!important;color:rgba(241,246,250,.28)!important;text-shadow:0 0 16px rgba(var(--accent),.04)}
.metric-label{font-size:8px!important;letter-spacing:.40em!important;color:rgba(246,249,252,.76)!important}
.metric-caption{font-size:7px!important;letter-spacing:.22em!important;color:rgba(229,236,242,.24)!important}
.metric-value{text-shadow:0 0 20px rgba(var(--accent),.10)!important}
.motion-hint{opacity:.14!important;letter-spacing:.20em!important;gap:11px!important}
.mode-dots.visible{opacity:.30!important}
.sound-trigger{opacity:.28!important;transform:scale(.94)!important;transform-origin:left center!important;transition:opacity .22s ease,transform .22s ease!important}
.sound-trigger:active{opacity:.48!important;transform:scale(.98)!important}
.sound-trigger::after{opacity:.26!important}
.settings-trigger{opacity:.72;transition:opacity .2s ease}
.settings-trigger:active{opacity:1}

/* cleaner, staged hold menu */
.radial-menu{filter:none!important;opacity:0!important;transform:translate(-50%,-50%) scale(.86)!important;transition:opacity .22s ease,transform .42s var(--v25-ease)!important}
.radial-menu.open{opacity:1!important;transform:translate(-50%,-50%) scale(1)!important}
.radial-menu .menu-orbit{inset:7.5%!important;border-color:rgba(var(--accent),.08)!important;box-shadow:0 0 30px rgba(var(--accent),.025),inset 0 0 26px rgba(var(--accent),.018)!important;opacity:0;transform:scale(.80);transition:opacity .22s .10s ease,transform .36s .06s var(--v25-ease)}
.app.menu-open .radial-menu .menu-orbit{opacity:1;transform:scale(1)}
.radial-core{width:13%!important;border-color:rgba(255,255,255,.16)!important;box-shadow:0 0 18px rgba(var(--accent),.10)!important;opacity:0;transform:translate(-50%,-50%) scale(.55)!important;transition:opacity .16s ease,transform .28s var(--v25-ease)}
.app.menu-open .radial-core{opacity:1;transform:translate(-50%,-50%) scale(1)!important}
.radial-item{min-width:82px!important;height:32px!important;border-radius:16px!important;border-color:rgba(255,255,255,.055)!important;background:rgba(2,4,7,.72)!important;color:rgba(255,255,255,.48)!important;font-size:7px!important;letter-spacing:.22em!important;box-shadow:none!important;opacity:0;transition:opacity .24s ease,color .16s ease,border-color .16s ease,box-shadow .16s ease,transform .22s var(--v25-ease)!important}
.app.menu-open .radial-item{opacity:1}
.app.menu-open .radial-top{transition-delay:.24s,.24s,.24s,.24s,.24s!important}
.app.menu-open .radial-right{transition-delay:.28s,.28s,.28s,.28s,.28s!important}
.app.menu-open .radial-bottom{transition-delay:.32s,.32s,.32s,.32s,.32s!important}
.app.menu-open .radial-left{transition-delay:.36s,.36s,.36s,.36s,.36s!important}
.radial-item.active{color:rgba(255,255,255,.94)!important;border-color:rgba(var(--accent),.26)!important;box-shadow:0 0 18px rgba(var(--accent),.10)!important}

.v25-spokes{position:absolute;z-index:8;left:var(--eye-x);top:var(--eye-y);width:calc(var(--eye-r)*2.06);height:calc(var(--eye-r)*2.06);transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;opacity:0;transition:opacity .18s .12s ease}
.app.menu-open .v25-spokes{opacity:1}
.v25-spokes i{position:absolute;left:50%;top:50%;width:calc(var(--eye-r)*.56);height:1px;transform-origin:0 50%;background:linear-gradient(90deg,rgba(var(--accent),.20),rgba(var(--accent),.055),transparent);opacity:0;scale:.35 1;transition:opacity .18s .13s ease,scale .34s .10s var(--v25-ease)}
.app.menu-open .v25-spokes i{opacity:.72;scale:1 1}
.v25-spokes i:nth-child(1){rotate:-90deg}.v25-spokes i:nth-child(2){rotate:0deg}.v25-spokes i:nth-child(3){rotate:90deg}.v25-spokes i:nth-child(4){rotate:180deg}

/* flatter summaries, less card-like */
.insight-panel{border-color:rgba(255,255,255,.045)!important;background:linear-gradient(180deg,rgba(255,255,255,.022),rgba(255,255,255,.008))!important;box-shadow:0 14px 42px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.025)!important}
.week-row span{border-color:rgba(255,255,255,.035)!important;background:rgba(255,255,255,.012)!important}
.week-row span:nth-child(2),.week-row span:nth-child(3),.week-row span:nth-child(4){background:rgba(255,255,255,.065)!important}
.insight-stats span{color:rgba(255,255,255,.38)!important}

/* quieter sport controls */
.v24-sport button{height:34px!important;padding:0 15px!important;border-radius:17px!important;border-color:rgba(255,255,255,.055)!important;background:rgba(255,255,255,.015)!important;color:rgba(255,255,255,.50)!important}
.v24-sport .main.running{color:rgba(255,255,255,.86)!important;border-color:rgba(var(--accent),.30)!important;box-shadow:0 0 18px rgba(var(--accent),.06)!important}
.v24-sport .reset{color:rgba(255,255,255,.23)!important}

/* subtle mode personality */
.app.mode-home #irisOrbitV23{filter:saturate(.88) brightness(.98)}
.app.mode-sport #irisOrbitV23{filter:saturate(.90) brightness(1.02)}
.app.mode-water #irisOrbitV23{filter:saturate(.92) brightness(1.02)}
.app.mode-food #irisOrbitV23{filter:saturate(.78) brightness(.96)}
.app.mode-sleep #irisOrbitV23{filter:saturate(.70) brightness(.70)}
#irisOrbitV23{transition:filter .7s ease,opacity .7s ease,transform .34s var(--v25-ease)}
#irisOrbitV23.v25-tap{transform:scale(1.008);filter:brightness(1.20) saturate(.92)}

/* brief eye transition when mode changes */
#irisCanvas{transition:filter .62s ease,opacity .42s ease}
.app.v25-mode-shift #irisCanvas{filter:brightness(.88) contrast(1.035);opacity:.93}
.app.v25-mode-shift #irisOrbitV23{filter:brightness(1.12) saturate(.86)}

@media(max-height:720px){.mode-whisper{transform:translateX(-50%) translateY(-4px)!important}.metric{transform:translateX(-50%) translateY(5px)!important}}
`;
document.head.appendChild(style);

const spokes=document.createElement('div');
spokes.className='v25-spokes';
spokes.setAttribute('aria-hidden','true');
spokes.innerHTML='<i></i><i></i><i></i><i></i>';
stage.insertBefore(spokes,menu);

let lastClass=app.className;
let modeTimer=0;
new MutationObserver(()=>{
  if(app.className===lastClass)return;
  const before=lastClass;lastClass=app.className;
  const modeChanged=/mode-\w+/.exec(before)?.[0]!==/mode-\w+/.exec(lastClass)?.[0];
  if(modeChanged){
    app.classList.add('v25-mode-shift');
    clearTimeout(modeTimer);
    modeTimer=setTimeout(()=>app.classList.remove('v25-mode-shift'),360);
  }
}).observe(app,{attributes:true,attributeFilter:['class']});

let tapTimer=0;
stage.addEventListener('pointerdown',e=>{
  if(e.target.closest('button'))return;
  const liveOrbit=document.getElementById('irisOrbitV23');
  if(!liveOrbit)return;
  liveOrbit.classList.remove('v25-tap');
  void liveOrbit.offsetWidth;
  liveOrbit.classList.add('v25-tap');
  clearTimeout(tapTimer);
  tapTimer=setTimeout(()=>liveOrbit.classList.remove('v25-tap'),260);
},{passive:true});

const note=document.querySelector('.settings-note');
if(note)note.textContent='IRIS v25: тише интерфейс, глубже атмосфера, живая орбита и поэтапное меню из зрачка.';
})();