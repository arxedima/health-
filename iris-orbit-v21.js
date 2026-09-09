(()=>{
  'use strict';
  const stage=document.getElementById('stage');
  if(!stage||document.querySelector('.iris-orbit-v21'))return;

  const style=document.createElement('style');
  style.textContent=`
    .iris-orbit-v21{
      position:absolute;z-index:3;left:var(--eye-x);top:var(--eye-y);
      width:calc(var(--eye-r)*2.54);height:calc(var(--eye-r)*2.54);
      transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
      opacity:.62;mix-blend-mode:screen;transition:width .55s cubic-bezier(.16,1,.3,1),height .55s cubic-bezier(.16,1,.3,1),opacity .35s ease;
      filter:drop-shadow(0 0 12px rgba(var(--accent),.10));
    }
    .iris-orbit-v21 .orbit-arc,
    .iris-orbit-v21 .orbit-arc::before,
    .iris-orbit-v21 .orbit-arc::after{
      position:absolute;inset:0;border-radius:50%;content:'';
    }
    .iris-orbit-v21 .orbit-arc{
      background:conic-gradient(from 8deg,transparent 0 8%,rgba(var(--accent),.24) 10% 13%,transparent 15% 31%,rgba(var(--accent),.10) 34% 39%,transparent 42% 62%,rgba(var(--accent),.20) 66% 70%,transparent 73% 88%,rgba(var(--accent),.08) 91% 94%,transparent 96% 100%);
      -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 1.35px),#000 calc(100% - 1px));
      mask:radial-gradient(farthest-side,transparent calc(100% - 1.35px),#000 calc(100% - 1px));
      animation:irisOrbitSpin 17s linear infinite;
    }
    .iris-orbit-v21 .orbit-arc::before{
      inset:5.2%;
      background:conic-gradient(from 185deg,transparent 0 18%,rgba(var(--accent),.14) 21% 25%,transparent 28% 57%,rgba(255,255,255,.12) 60% 62%,transparent 65% 100%);
      -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 1px),#000 100%);
      mask:radial-gradient(farthest-side,transparent calc(100% - 1px),#000 100%);
      animation:irisOrbitSpinReverse 26s linear infinite;
    }
    .iris-orbit-v21 .orbit-arc::after{
      inset:10.8%;border:1px solid rgba(var(--accent),.075);
      box-shadow:0 0 18px rgba(var(--accent),.028),inset 0 0 18px rgba(var(--accent),.018);
      animation:irisOrbitBreath 4.2s ease-in-out infinite;
    }
    .iris-orbit-v21 .orbit-particles{position:absolute;inset:0;border-radius:50%;animation:irisOrbitSpin 31s linear infinite;}
    .iris-orbit-v21 .orbit-particles i{
      position:absolute;left:50%;top:50%;width:2px;height:2px;border-radius:50%;
      background:rgba(225,241,255,.76);box-shadow:0 0 7px rgba(var(--accent),.48);
      transform-origin:0 0;transform:rotate(var(--a)) translateX(calc(var(--eye-r)*1.245));opacity:var(--o);
    }
    .iris-orbit-v21 .orbit-particles i:nth-child(3n){width:1px;height:1px;box-shadow:0 0 5px rgba(var(--accent),.36)}
    .iris-orbit-v21 .orbit-particles i:nth-child(4n){animation:irisOrbitSpark 2.8s ease-in-out infinite alternate}
    .app.menu-open .iris-orbit-v21{opacity:.88}
    .app.mode-sport .iris-orbit-v21{animation:irisOrbitSport 1.15s ease-in-out infinite}
    .app.mode-sleep .iris-orbit-v21{opacity:.34}
    .app.mode-insights .iris-orbit-v21{opacity:.42}
    @keyframes irisOrbitSpin{to{transform:rotate(360deg)}}
    @keyframes irisOrbitSpinReverse{to{transform:rotate(-360deg)}}
    @keyframes irisOrbitBreath{0%,100%{opacity:.34;transform:scale(.985)}50%{opacity:.78;transform:scale(1.018)}}
    @keyframes irisOrbitSpark{from{opacity:.18}to{opacity:.92}}
    @keyframes irisOrbitSport{0%,100%{filter:drop-shadow(0 0 9px rgba(var(--accent),.08))}50%{filter:drop-shadow(0 0 18px rgba(var(--accent),.23))}}
    @media(prefers-reduced-motion:reduce){.iris-orbit-v21 .orbit-arc,.iris-orbit-v21 .orbit-arc::before,.iris-orbit-v21 .orbit-arc::after,.iris-orbit-v21 .orbit-particles,.iris-orbit-v21 .orbit-particles i,.app.mode-sport .iris-orbit-v21{animation:none!important}}
  `;
  document.head.appendChild(style);

  const orbit=document.createElement('div');
  orbit.className='iris-orbit-v21';
  orbit.setAttribute('aria-hidden','true');
  orbit.innerHTML='<div class="orbit-arc"></div><div class="orbit-particles"></div>';
  const particles=orbit.querySelector('.orbit-particles');
  const angles=[3,29,61,94,127,158,196,224,251,283,314,343];
  angles.forEach((a,i)=>{
    const dot=document.createElement('i');
    dot.style.setProperty('--a',a+'deg');
    dot.style.setProperty('--o',String(.18+(i%5)*.11));
    particles.appendChild(dot);
  });
  const canvas=document.getElementById('irisCanvas');
  if(canvas&&canvas.nextSibling)stage.insertBefore(orbit,canvas.nextSibling);else stage.appendChild(orbit);
})();
