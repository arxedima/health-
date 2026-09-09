(() => {
  'use strict';

  const canvas = document.getElementById('irisCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const app = document.getElementById('app');
  const stage = document.getElementById('stage');
  const metricLabel = document.getElementById('metricLabel');
  const metricValue = document.getElementById('metricValue');
  const metricCaption = document.getElementById('metricCaption');
  const radialMenu = document.getElementById('radialMenu');
  const radialItems = [...document.querySelectorAll('.radial-item')];
  const touchRing = document.getElementById('touchRing');
  const motionHint = document.getElementById('motionHint');
  const modeDots = document.getElementById('modeDots');
  const settingsPanel = document.getElementById('settingsPanel');
  const settingsTrigger = document.getElementById('settingsTrigger');
  const insightPanel = document.getElementById('insightPanel');
  const modeWhisper = document.getElementById('modeWhisper');

  const MODES = {
    home:     { label:'ГЛАВНАЯ', value:'',        caption:'КОСНИСЬ ГЛАЗА',       accent:[198,220,237], inner:[118,147,165], warm:[211,194,177], whisper:'IRIS НАБЛЮДАЕТ' },
    sport:    { label:'СПОРТ',   value:'24:17',   caption:'ТРЕНИРОВКА',          accent:[238,100,78],  inner:[128,58,48],   warm:[255,179,137], whisper:'ПУЛЬС · ДВИЖЕНИЕ' },
    water:    { label:'ВОДА',    value:'1.2 Л',   caption:'СЕГОДНЯ',              accent:[118,188,235], inner:[50,111,153],  warm:[185,225,255], whisper:'БАЛАНС ЖИДКОСТИ' },
    food:     { label:'ПИТАНИЕ', value:'1 420',   caption:'ККАЛ',                 accent:[158,185,134], inner:[85,108,69],   warm:[218,181,121], whisper:'ЭНЕРГИЯ ИЗ ЕДЫ' },
    sleep:    { label:'СОН',     value:'7 Ч 24 М',caption:'ПРОШЛОЙ НОЧЬЮ',        accent:[104,137,185], inner:[45,60,92],    warm:[137,160,198], whisper:'ВОССТАНОВЛЕНИЕ' },
    insights: { label:'ИТОГИ',   value:'84',      caption:'ИНДЕКС ДНЯ',           accent:[206,218,229], inner:[86,100,116],   warm:[196,188,181], whisper:'СВОДКА СОСТОЯНИЯ' }
  };
  const ORDER = ['home','sport','water','food','sleep','insights'];

  let mode = 'home';
  let currentAccent = MODES.home.accent.slice();
  let currentInner = MODES.home.inner.slice();
  let currentWarm = MODES.home.warm.slice();
  let W = 0, H = 0, DPR = 1;
  let center = {x:0,y:0};
  let eyeCenter = {x:0,y:0};
  let targetEyeOffset = {x:0,y:0};
  let eyeOffset = {x:0,y:0};
  let irisRadius = 120;
  let fibers = [];
  let dust = [];
  let pointer = {x:0,y:0,down:false,startX:0,startY:0,startT:0,lastX:0,lastY:0};
  let holdTimer = null;
  let menuOpen = false;
  let menuSelection = null;
  let focusPulse = 0;
  let focusPulseX = 0;
  let focusPulseY = 0;
  let firstInteraction = false;
  let lastTapTime = 0;
  let pupilBoost = 0;
  let modeFlash = 0;

  function rand(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  function rgb(arr,a=1){ return `rgba(${arr[0]|0},${arr[1]|0},${arr[2]|0},${a})`; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function lerpColor(a,b,t){ return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]; }

  function buildTexture(){
    fibers=[];
    const count=Math.min(500,Math.max(320,Math.floor(irisRadius*2.55)));
    for(let i=0;i<count;i++){
      const angle=(i/count)*Math.PI*2+(rand(i)-.5)*.032;
      fibers.push({
        angle,
        inner:.22+rand(i*3.7)*.14,
        outer:.70+rand(i*8.1)*.32,
        width:.22+rand(i*5.4)*1.1,
        alpha:.07+rand(i*7.2)*.27,
        bend:(rand(i*9.4)-.5)*.20,
        warm:rand(i*11.1)>.80,
        seed:rand(i*13.5)
      });
    }
    dust=[];
    for(let i=0;i<110;i++){
      const a=rand(i*2.3)*Math.PI*2;
      const r=irisRadius*(.90+rand(i*3.1)*.40);
      dust.push({a,r,s:.3+rand(i*4.9)*1.4,alpha:.04+rand(i*7.7)*.17});
    }
  }

  function resize(){
    DPR=Math.min(2,window.devicePixelRatio||1);
    W=Math.floor(innerWidth); H=Math.floor(innerHeight);
    canvas.width=Math.floor(W*DPR); canvas.height=Math.floor(H*DPR);
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    center.x=W/2; center.y=H*.455;
    eyeCenter.x=center.x; eyeCenter.y=center.y;
    irisRadius=Math.min(W*.395,H*.215,205);
    buildTexture();
  }

  function updatePalette(){
    const cfg=MODES[mode];
    currentAccent=lerpColor(currentAccent,cfg.accent,.028);
    currentInner=lerpColor(currentInner,cfg.inner,.028);
    currentWarm=lerpColor(currentWarm,cfg.warm,.028);
    document.documentElement.style.setProperty('--accent',`${currentAccent[0]|0} ${currentAccent[1]|0} ${currentAccent[2]|0}`);
  }

  function drawBackground(){
    ctx.clearRect(0,0,W,H);
    const glow=ctx.createRadialGradient(eyeCenter.x,eyeCenter.y,irisRadius*.12,eyeCenter.x,eyeCenter.y,irisRadius*2.8);
    glow.addColorStop(0,rgb(currentAccent,.05));
    glow.addColorStop(.30,rgb(currentAccent,.022));
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  }

  function drawModeDecoration(cx,cy,R,t){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.globalCompositeOperation='screen';
    if(mode==='sport'){
      ctx.beginPath();
      ctx.arc(0,0,R*1.16,-Math.PI*.62,Math.PI*.70);
      ctx.strokeStyle=rgb(currentAccent,.78);
      ctx.lineWidth=1.3;
      ctx.shadowColor=rgb(currentAccent,.7);ctx.shadowBlur=12;ctx.stroke();
      ctx.shadowBlur=0;
      const a=-Math.PI*.62+(Math.PI*1.32)*.72;
      ctx.beginPath();ctx.arc(Math.cos(a)*R*1.16,Math.sin(a)*R*1.16,2.2,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.95)';ctx.fill();
    }
    if(mode==='water'){
      const y=R*.55;
      ctx.beginPath();
      for(let i=0;i<=80;i++){
        const x=-R+2*R*i/80;
        const yy=y+Math.sin(i*.26+t*.002)*R*.045;
        if(i===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);
      }
      ctx.strokeStyle=rgb(currentAccent,.42);ctx.lineWidth=.9;ctx.stroke();
    }
    if(mode==='food'){
      for(let i=0;i<10;i++){
        const a=(i/10)*Math.PI*2+t*.00006;
        const rr=R*(.90+(i%3)*.05);
        ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,1+(i%2)*.6,0,Math.PI*2);
        ctx.fillStyle=rgb(i%3===0?currentWarm:currentAccent,.22);ctx.fill();
      }
    }
    if(mode==='insights'){
      for(let i=0;i<7;i++){
        const a=-Math.PI*.78+i*(Math.PI*1.56/6);
        const len=R*(.14+.035*(i%4));
        const rr=R*1.12;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
        ctx.lineTo(Math.cos(a)*(rr+len),Math.sin(a)*(rr+len));
        ctx.strokeStyle=rgb(currentAccent,.16);ctx.lineWidth=.7;ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawEye(t){
    const breathe=1+Math.sin(t*.00085)*.012;
    const modeScale=mode==='insights'?.73:1;
    const R=irisRadius*breathe*modeScale;
    const cx=eyeCenter.x+eyeOffset.x;
    const cy=eyeCenter.y+eyeOffset.y+(mode==='insights'?-H*.035:0);

    ctx.save();ctx.translate(cx,cy);
    for(let i=0;i<6;i++){
      const rr=R*(1.03+i*.05);
      ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);
      ctx.strokeStyle=rgb(currentAccent,.055-i*.006);ctx.lineWidth=.55;ctx.stroke();
    }

    let g=ctx.createRadialGradient(0,0,R*.10,0,0,R*1.03);
    g.addColorStop(0,'rgba(0,0,0,.995)');
    g.addColorStop(.22,rgb(currentInner,.78));
    g.addColorStop(.51,rgb(currentAccent,.38));
    g.addColorStop(.79,rgb(currentInner,.38));
    g.addColorStop(1,'rgba(3,7,9,.03)');
    ctx.beginPath();ctx.arc(0,0,R,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();

    ctx.save();ctx.beginPath();ctx.arc(0,0,R*.995,0,Math.PI*2);ctx.clip();ctx.globalCompositeOperation='screen';
    for(let k=0;k<10;k++){
      const rr=R*(.29+k*.07);ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);
      ctx.strokeStyle=rgb(currentAccent,.025+((k%3)*.011));ctx.lineWidth=.5;ctx.stroke();
    }
    for(let i=0;i<fibers.length;i++){
      const f=fibers[i];
      const jitter=Math.sin(t*.0012+f.seed*20)*.009;
      const a=f.angle+jitter;
      const r1=R*f.inner,r2=R*f.outer;
      const x1=Math.cos(a)*r1,y1=Math.sin(a)*r1;
      const x2=Math.cos(a+f.bend)*r2,y2=Math.sin(a+f.bend)*r2;
      const midR=(r1+r2)*.52;
      const ma=a+f.bend*.36+Math.sin(f.seed*19+t*.0004)*.014;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(Math.cos(ma)*midR,Math.sin(ma)*midR,x2,y2);
      ctx.strokeStyle=f.warm?rgb(currentWarm,f.alpha*.72):rgb(currentAccent,f.alpha);
      ctx.lineWidth=f.width;ctx.stroke();
    }
    ctx.globalCompositeOperation='source-over';
    for(let i=0;i<48;i++){
      const a=(i/48)*Math.PI*2+rand(i*14.4)*.10;
      const r1=R*(.36+rand(i*4.5)*.16),r2=R*(.65+rand(i*9.8)*.22);
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a+.025*(rand(i)-.5))*r2,Math.sin(a+.025*(rand(i)-.5))*r2);
      ctx.strokeStyle=`rgba(0,0,0,${.13+rand(i*7.1)*.19})`;ctx.lineWidth=.7+rand(i*3.2)*1.4;ctx.stroke();
    }
    ctx.restore();

    const rim=ctx.createRadialGradient(0,0,R*.82,0,0,R*1.06);
    rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(.78,rgb(currentAccent,.05));rim.addColorStop(.92,'rgba(2,5,7,.74)');rim.addColorStop(1,'rgba(0,0,0,.99)');
    ctx.beginPath();ctx.arc(0,0,R*1.06,0,Math.PI*2);ctx.fillStyle=rim;ctx.fill();
    ctx.beginPath();ctx.arc(0,0,R*.995,0,Math.PI*2);ctx.strokeStyle=rgb(currentAccent,.18);ctx.lineWidth=.8;ctx.stroke();

    const pupilR=R*(.22+Math.sin(t*.00055)*.008+pupilBoost*.032);
    const pg=ctx.createRadialGradient(-pupilR*.16,-pupilR*.18,pupilR*.04,0,0,pupilR*1.18);
    pg.addColorStop(0,'rgba(6,8,10,1)');pg.addColorStop(.72,'rgba(0,0,0,1)');pg.addColorStop(1,rgb(currentAccent,.035));
    ctx.beginPath();ctx.arc(0,0,pupilR,0,Math.PI*2);ctx.fillStyle=pg;ctx.fill();
    ctx.beginPath();ctx.arc(0,0,pupilR*1.02,0,Math.PI*2);ctx.strokeStyle=rgb(currentAccent,.19);ctx.lineWidth=.7;ctx.stroke();

    ctx.save();ctx.globalCompositeOperation='screen';
    const hx=-R*.25,hy=-R*.31;const hg=ctx.createRadialGradient(hx,hy,0,hx,hy,R*.16);
    hg.addColorStop(0,'rgba(255,255,255,.38)');hg.addColorStop(.16,'rgba(255,255,255,.14)');hg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=hg;ctx.beginPath();ctx.arc(hx,hy,R*.16,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(R*.27,-R*.18,R*.018,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.50)';ctx.fill();ctx.restore();

    if(focusPulse>0){
      ctx.save();ctx.globalCompositeOperation='screen';
      for(let i=0;i<3;i++){
        const pr=focusPulse*R*(.42+i*.16);ctx.beginPath();ctx.arc(focusPulseX-cx,focusPulseY-cy,pr,0,Math.PI*2);
        ctx.strokeStyle=rgb(currentAccent,.22*(1-focusPulse));ctx.lineWidth=.8;ctx.stroke();
      }
      ctx.restore();
    }

    if(mode==='sleep'){
      const close=.38+Math.sin(t*.00055)*.015;ctx.save();ctx.fillStyle='rgba(0,0,0,.975)';
      ctx.beginPath();ctx.ellipse(0,-R*(1.05-close),R*1.36,R*.82,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(0,R*(1.05-close),R*1.36,R*.82,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(0,R*.02,R*.93,Math.PI*.08,Math.PI*.92);ctx.strokeStyle=rgb(currentAccent,.20);ctx.lineWidth=.8;ctx.stroke();ctx.restore();
    }
    ctx.restore();

    drawModeDecoration(cx,cy,R,t);

    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<dust.length;i++){
      const d=dust[i],a=d.a+t*.000015*(i%2?1:-1),rr=d.r*modeScale*(1+Math.sin(t*.0007+i)*.012);
      ctx.beginPath();ctx.arc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,d.s,0,Math.PI*2);ctx.fillStyle=rgb(currentAccent,d.alpha);ctx.fill();
    }
    ctx.restore();

    if(modeFlash>0){
      ctx.save();ctx.globalCompositeOperation='screen';
      const flash=ctx.createRadialGradient(cx,cy,0,cx,cy,R*1.8);flash.addColorStop(0,rgb(currentAccent,.12*modeFlash));flash.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=flash;ctx.fillRect(cx-R*2,cy-R*2,R*4,R*4);ctx.restore();
    }
  }

  function render(t){
    updatePalette();
    eyeOffset.x+=(targetEyeOffset.x-eyeOffset.x)*.07;eyeOffset.y+=(targetEyeOffset.y-eyeOffset.y)*.07;
    pupilBoost+=(0-pupilBoost)*.035;focusPulse=Math.max(0,focusPulse-.018);modeFlash=Math.max(0,modeFlash-.025);
    drawBackground();drawEye(t);requestAnimationFrame(render);
  }

  function setMode(next,reason='gesture'){
    if(!MODES[next])return;
    mode=next;const cfg=MODES[next];
    metricLabel.textContent=cfg.label;metricValue.textContent=cfg.value;metricCaption.textContent=cfg.caption;
    modeWhisper.textContent=cfg.whisper;app.dataset.mode=next;pupilBoost=1;modeFlash=1;
    insightPanel.classList.toggle('visible',next==='insights');
    try{navigator.vibrate?.(8)}catch(e){}
    renderDots();if(reason!=='init')hideHint();
  }

  function renderDots(){
    modeDots.innerHTML='';ORDER.forEach(m=>{const s=document.createElement('span');if(m===mode)s.className='active';modeDots.appendChild(s);});
    modeDots.classList.toggle('visible',mode!=='home');
  }
  function hideHint(){if(firstInteraction)return;firstInteraction=true;motionHint.classList.add('hidden');}
  function pulseAt(x,y){
    focusPulse=.04;focusPulseX=x;focusPulseY=y;touchRing.style.left=x+'px';touchRing.style.top=y+'px';
    touchRing.classList.remove('pulse');void touchRing.offsetWidth;touchRing.classList.add('pulse');pupilBoost=1;
  }

  function openMenu(){
    if(menuOpen)return;menuOpen=true;menuSelection=null;radialMenu.classList.add('open');radialMenu.setAttribute('aria-hidden','false');app.classList.add('menu-open');
    try{navigator.vibrate?.(12)}catch(e){}hideHint();
  }
  function closeMenu(commit=true){
    if(!menuOpen)return;if(commit&&menuSelection)setMode(menuSelection);menuOpen=false;menuSelection=null;
    radialItems.forEach(i=>i.classList.remove('active'));radialMenu.classList.remove('open');radialMenu.setAttribute('aria-hidden','true');app.classList.remove('menu-open');
  }
  function updateMenuSelection(x,y){
    if(!menuOpen)return;const dx=x-center.x,dy=y-center.y,dist=Math.hypot(dx,dy);
    if(dist<irisRadius*.32)menuSelection=null;
    else{
      const angle=Math.atan2(dy,dx);
      if(angle>-Math.PI*.25&&angle<=Math.PI*.25)menuSelection='food';
      else if(angle>Math.PI*.25&&angle<=Math.PI*.75)menuSelection='sleep';
      else if(angle<=-Math.PI*.25&&angle>-Math.PI*.75)menuSelection='sport';
      else menuSelection='water';
    }
    radialItems.forEach(i=>i.classList.toggle('active',i.dataset.mode===menuSelection));
  }

  function handlePointerDown(e){
    const p=point(e);pointer.down=true;pointer.startX=p.x;pointer.startY=p.y;pointer.lastX=p.x;pointer.lastY=p.y;pointer.startT=performance.now();
    targetEyeOffset.x=((p.x-center.x)/Math.max(W,1))*18;targetEyeOffset.y=((p.y-center.y)/Math.max(H,1))*18;
    clearTimeout(holdTimer);holdTimer=setTimeout(()=>{if(pointer.down)openMenu();},620);
  }
  function handlePointerMove(e){
    const p=point(e);pointer.lastX=p.x;pointer.lastY=p.y;const dx=p.x-center.x,dy=p.y-center.y;
    targetEyeOffset.x=Math.max(-11,Math.min(11,dx/W*30));targetEyeOffset.y=Math.max(-9,Math.min(9,dy/H*28));
    if(pointer.down&&Math.hypot(p.x-pointer.startX,p.y-pointer.startY)>16&&!menuOpen)clearTimeout(holdTimer);
    if(menuOpen)updateMenuSelection(p.x,p.y);
  }
  function handlePointerUp(e){
    const p=point(e);clearTimeout(holdTimer);const dt=performance.now()-pointer.startT,dx=p.x-pointer.startX,dy=p.y-pointer.startY,dist=Math.hypot(dx,dy);
    pointer.down=false;targetEyeOffset.x=0;targetEyeOffset.y=0;
    if(menuOpen){closeMenu(true);return;}
    if(dt<420&&dist<22){
      const now=performance.now();pulseAt(p.x,p.y);hideHint();
      if(now-lastTapTime<320){openSettings();lastTapTime=0;return;}lastTapTime=now;
      if(mode==='home'){
        metricCaption.textContent='УДЕРЖИВАЙ ДЛЯ МЕНЮ';
        setTimeout(()=>{if(mode==='home')metricCaption.textContent=MODES.home.caption;},1500);
      }
      return;
    }
    if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.2){
      const i=ORDER.indexOf(mode),next=dx<0?ORDER[(i+1)%ORDER.length]:ORDER[(i-1+ORDER.length)%ORDER.length];setMode(next);return;
    }
    if(dy>90&&Math.abs(dy)>Math.abs(dx)*1.2){openSettings();return;}
    if(dy<-90&&Math.abs(dy)>Math.abs(dx)*1.2){setMode('insights');}
  }
  function point(e){
    if(e.touches?.[0])return{x:e.touches[0].clientX,y:e.touches[0].clientY};
    if(e.changedTouches?.[0])return{x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};
    return{x:e.clientX,y:e.clientY};
  }

  function openSettings(){settingsPanel.classList.add('open');settingsPanel.setAttribute('aria-hidden','false');app.classList.add('settings-open');hideHint();}
  function closeSettings(){settingsPanel.classList.remove('open');settingsPanel.setAttribute('aria-hidden','true');app.classList.remove('settings-open');}

  radialItems.forEach(item=>item.addEventListener('click',e=>{e.stopPropagation();menuSelection=item.dataset.mode;closeMenu(true);}));
  settingsTrigger.addEventListener('click',openSettings);
  document.querySelectorAll('[data-close-settings]').forEach(el=>el.addEventListener('click',closeSettings));
  stage.addEventListener('pointerdown',handlePointerDown,{passive:true});
  stage.addEventListener('pointermove',handlePointerMove,{passive:true});
  stage.addEventListener('pointerup',handlePointerUp,{passive:true});
  stage.addEventListener('pointercancel',()=>{pointer.down=false;clearTimeout(holdTimer);closeMenu(false);targetEyeOffset.x=targetEyeOffset.y=0;},{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pointer.down=false;clearTimeout(holdTimer);closeMenu(false);}});

  resize();setMode('home','init');requestAnimationFrame(render);
  if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=iris03').catch(()=>{}));
})();
