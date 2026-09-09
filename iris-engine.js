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

  const MODES = {
    home:  { label: 'HOME',  value: '',       caption: 'TOUCH TO FOCUS', accent:[198,220,237], inner:[118,147,165], warm:[211,194,177] },
    sport: { label: 'SPORT', value: '24:17',  caption: 'WORKOUT',        accent:[238,100,78],  inner:[128,58,48],   warm:[255,179,137] },
    water: { label: 'WATER', value: '1.2 L',  caption: 'TODAY',          accent:[118,188,235], inner:[50,111,153],  warm:[185,225,255] },
    food:  { label: 'FOOD',  value: '1,420',  caption: 'KCAL',           accent:[158,185,134], inner:[85,108,69],   warm:[218,181,121] },
    sleep: { label: 'SLEEP', value: '7 h 24 m', caption:'LAST NIGHT',    accent:[104,137,185], inner:[45,60,92],    warm:[137,160,198] }
  };
  const ORDER = ['home','sport','water','food','sleep'];

  let mode = 'home';
  let targetAccent = MODES.home.accent.slice();
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

  function rand(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function rgb(arr, a=1) { return `rgba(${arr[0]|0},${arr[1]|0},${arr[2]|0},${a})`; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function lerpColor(a,b,t){ return [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)]; }

  function buildTexture() {
    fibers = [];
    const count = Math.min(420, Math.max(260, Math.floor(irisRadius * 2.2)));
    for (let i=0;i<count;i++) {
      const angle = (i/count) * Math.PI*2 + (rand(i)-.5)*.035;
      const inner = .25 + rand(i*3.7)*.12;
      const outer = .72 + rand(i*8.1)*.30;
      const width = .25 + rand(i*5.4)*.95;
      const alpha = .06 + rand(i*7.2)*.24;
      const bend = (rand(i*9.4)-.5)*.18;
      const warm = rand(i*11.1) > .79;
      fibers.push({angle,inner,outer,width,alpha,bend,warm,seed:rand(i*13.5)});
    }
    dust = [];
    for (let i=0;i<90;i++) {
      const a = rand(i*2.3)*Math.PI*2;
      const r = irisRadius*(.88 + rand(i*3.1)*.36);
      dust.push({a,r,s:.3+rand(i*4.9)*1.3,alpha:.05+rand(i*7.7)*.18});
    }
  }

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.floor(innerWidth);
    H = Math.floor(innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W+'px';
    canvas.style.height = H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    center.x = W/2;
    center.y = H*.47;
    eyeCenter.x = center.x;
    eyeCenter.y = center.y;
    irisRadius = Math.min(W*.36, H*.205, 190);
    buildTexture();
  }

  function updatePalette() {
    const cfg = MODES[mode];
    currentAccent = lerpColor(currentAccent, cfg.accent, .025);
    currentInner = lerpColor(currentInner, cfg.inner, .025);
    currentWarm = lerpColor(currentWarm, cfg.warm, .025);
    document.documentElement.style.setProperty('--accent', `${currentAccent[0]|0} ${currentAccent[1]|0} ${currentAccent[2]|0}`);
  }

  function drawBackground(t) {
    ctx.clearRect(0,0,W,H);
    const glow = ctx.createRadialGradient(eyeCenter.x,eyeCenter.y, irisRadius*.18, eyeCenter.x,eyeCenter.y, irisRadius*2.6);
    glow.addColorStop(0, rgb(currentAccent,.035));
    glow.addColorStop(.32, rgb(currentAccent,.018));
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,W,H);

    // faint vertical light veil
    ctx.save();
    ctx.globalCompositeOperation='screen';
    const veil = ctx.createLinearGradient(0,eyeCenter.y-irisRadius*2.1,0,eyeCenter.y+irisRadius*2.1);
    veil.addColorStop(0,'rgba(255,255,255,0)');
    veil.addColorStop(.48,rgb(currentAccent,.012));
    veil.addColorStop(.52,rgb(currentAccent,.012));
    veil.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=veil;
    ctx.fillRect(eyeCenter.x-irisRadius*1.6,eyeCenter.y-irisRadius*2.2,irisRadius*3.2,irisRadius*4.4);
    ctx.restore();
  }

  function drawEye(t) {
    const breathe = 1 + Math.sin(t*.00085)*.012;
    const R = irisRadius*breathe;
    const cx = eyeCenter.x + eyeOffset.x;
    const cy = eyeCenter.y + eyeOffset.y;

    ctx.save();
    ctx.translate(cx,cy);

    // outer halo
    for (let i=0;i<5;i++) {
      const rr = R*(1.03+i*.055);
      ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2);
      ctx.strokeStyle=rgb(currentAccent,.055-i*.007);
      ctx.lineWidth=.55;
      ctx.stroke();
    }

    // iris base
    let g = ctx.createRadialGradient(0,0,R*.11,0,0,R*1.02);
    g.addColorStop(0,'rgba(0,0,0,.99)');
    g.addColorStop(.24, rgb(currentInner,.72));
    g.addColorStop(.53, rgb(currentAccent,.32));
    g.addColorStop(.80, rgb(currentInner,.34));
    g.addColorStop(1,'rgba(3,7,9,.05)');
    ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(0,0,R*.99,0,Math.PI*2); ctx.clip();
    ctx.globalCompositeOperation='screen';

    // subtle concentric structures
    for(let k=0;k<9;k++){
      const rr=R*(.31+k*.075);
      ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2);
      ctx.strokeStyle=rgb(currentAccent,.028 + ((k%3)*.01));
      ctx.lineWidth=.55;
      ctx.stroke();
    }

    // fibrous iris
    for (let i=0;i<fibers.length;i++) {
      const f=fibers[i];
      const jitter=Math.sin(t*.0012 + f.seed*20)*.008;
      const a=f.angle+jitter;
      const r1=R*f.inner;
      const r2=R*f.outer;
      const x1=Math.cos(a)*r1, y1=Math.sin(a)*r1;
      const x2=Math.cos(a+f.bend)*r2, y2=Math.sin(a+f.bend)*r2;
      const midR=(r1+r2)*.52;
      const ma=a+f.bend*.36 + Math.sin(f.seed*19+t*.0004)*.012;
      const mx=Math.cos(ma)*midR, my=Math.sin(ma)*midR;
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.quadraticCurveTo(mx,my,x2,y2);
      ctx.strokeStyle = f.warm ? rgb(currentWarm,f.alpha*.72) : rgb(currentAccent,f.alpha);
      ctx.lineWidth=f.width;
      ctx.stroke();
    }

    // crypts / dark radial cuts
    ctx.globalCompositeOperation='source-over';
    for(let i=0;i<44;i++){
      const a=(i/44)*Math.PI*2 + rand(i*14.4)*.1;
      const r1=R*(.38+rand(i*4.5)*.15), r2=R*(.67+rand(i*9.8)*.20);
      ctx.beginPath();
      ctx.²È="25¤ðÌí¤¬¬¥ì(€€€€€€€½¹ÍÐÁÈõ™½ÕÍAÕ±Í”©H¨ ¸ÐÀ­¤¨¸ÄÔ¤ì(€€€€€€€Ñà¹‰•¥¹A…Ñ  ¤ìÑà¹…ÉŒ¡™½ÕÍAÕ±Í•`µà±™½ÕÍAÕ±Í•dµä±ÁÈ°À±5…Ñ ¹A$¨È¤ì(€€€€€€€Ñà¹ÍÑÉ½­•MÑå±”õÉˆ¡ÕÉÉ•¹Ñ•¹Ð°¸ÈÀ¨ Äµ™½ÕÍAÕ±Í”¤¤ì(€€€€€€€Ñà¹±¥¹•]¥‘Ñ ô¸àì(€€€€€€€Ñà¹ÍÑÉ½­” ¤ì(€€€€€ô(€€€€€Ñà¹É•ÍÑ½É” ¤ì(€€€ô((€€€€¼¼Í±••À±¥è•å”Á¡åÍ¥…±±ä±½Í•Ì(€€€¥˜€¡µ½‘”ôôôÍ±••Àœ¤ì(€€€€€½¹ÍÐ±½Í”ô¸Ìà€¬5…Ñ ¹Í¥¸¡Ð¨¸ÀÀÀÔÔ¤¨¸ÀÄÔì(€€€€€Ñà¹™¥±±MÑå±”ôÉ‰„ À°À°À°¸äÜ¤œì(€€€€€Ñà¹‰•¥¹A…Ñ  ¤ì(€€€€€Ñà¹•±±¥ÁÍ” À°µH¨ Ä¸ÀÔµ±½Í”¤±H¨Ä¸ÌÔ±H¨¸àÈ°À°À±5…Ñ ¹A$¨È¤ìÑà¹™¥±° ¤ì(€€€€€Ñà¹‰•¥¹A…Ñ  ¤ì(€€€€€Ñà¹•±±¥ÁÍ” À±H¨ Ä¸ÀÔµ±½Í”¤±H¨Ä¸ÌÔ±H¨¸àÈ°À°À±5…Ñ ¹A$¨È¤ìÑà¹™¥±° ¤ì(€€€€€Ñà¹‰•¥¹A…Ñ  ¤ì(€€€€€Ñà¹…ÉŒ À±H¨¸ÀÈ±H¨¸äÌ±5…Ñ ¹A$¨¸Àà±5…Ñ ¹A$¨¸äÈ¤ì(€€€€€Ñà¹ÍÑÉ½­•MÑå±”õÉˆ¡ÕÉÉ•¹Ñ•¹Ð°¸Ää¤ìÑà¹±¥¹•]¥‘Ñ ô¸àìÑà¹ÍÑÉ½­” ¤ì(€€€€€Ñà¹É•ÍÑ½É” ¤ì(€€€ô((€€€Ñà¹É•ÍÑ½É” ¤ì((€€€€¼¼•áÑ•É¹…°‘ÕÍÐ(€€€Ñà¹Í…Ù” ¤ìÑà¹±½‰…±½µÁ½Í¥Ñ•=Á•É…Ñ¥½¸ôÍÉ••¸œì(€€€™½È¡±•Ð¤ôÀí¤ñ‘ÕÍÐ¹±•¹Ñ í¤¬¬¥ì(€€€€€½¹ÍÐõ‘ÕÍÑm¥tì(€€€€€½¹ÍÐ„õ¹„­Ð¨¸ÀÀÀÀÄÔ¨¡¤”ÈüÄè´Ä¤ì(€€€€€½¹ÍÐÉÈõ¹È¨ Ä­5…Ñ ¹Í¥¸¡Ð¨¸ÀÀÀÜ­¤¤¨¸ÀÄÈ¤ì(€€€€€½¹ÍÐàõà­5…Ñ ¹½Ì¡„¤©ÉÈ°äõä­5…Ñ ¹Í¥¸¡„¤©ÉÈì(€€€€€Ñà¹‰•¥¹A…Ñ  ¤íÑà¹…ÉŒ¡à±ä±¹Ì°À±5…Ñ ¹A$¨È¤íÑà¹™¥±±MÑå±”õÉˆ¡ÕÉÉ•¹Ñ•¹Ð±¹…±Á¡„¤íÑà¹™¥±° ¤ì(€€€ô(€€€Ñà¹É•ÍÑ½É” ¤ì(€ô((€™Õ¹Ñ¥½¸É•¹‘•È¡Ð¤ì(€€€ÕÁ‘…Ñ•A…±•ÑÑ” ¤ì(€€€•å•=™™Í•Ð¹à€¬ô€¡Ñ…É•Ñå•=™™Í•Ð¹àµ•å•=™™Í•Ð¹à¤¨¸ÀÜì(€€€•å•=™™Í•Ð¹ä€¬ô€¡Ñ…É•Ñå•=™™Í•Ð¹äµ•å•=™™Í•Ð¹ä¤¨¸ÀÜì(€€€ÁÕÁ¥±	½½ÍÐ€¬ô€ ÀµÁÕÁ¥±	½½ÍÐ¤¨¸ÀÌÔì(€€€™½ÕÍAÕ±Í”õ5…Ñ ¹µ…à À±™½ÕÍAÕ±Í”´¸ÀÄà¤ì(€€€‘É…Ý	…­É½Õ¹¡Ð¤ì(€€€‘É…Ýå”¡Ð¤ì(€€€É•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”¡É•¹‘•È¤ì(€ô((€™Õ¹Ñ¥½¸Í•Ñ5½‘”¡¹•áÐ°É•…Í½¸ô•ÍÑÕÉ”œ¤ì(€€€¥˜ …5=Mm¹•áÑt¤É•ÑÕÉ¸ì(€€€µ½‘”õ¹•áÐì(€€€Ñ…É•Ñ•¹Ðõ5=Mm¹•áÑt¹…•¹Ð¹Í±¥” ¤ì(€€€½¹ÍÐ™œõ5=Mm¹•áÑtì(€€€µ•ÑÉ¥1…‰•°¹Ñ•áÑ½¹Ñ•¹Ðõ™œ¹±…‰•°ì(€€€µ•ÑÉ¥Y…±Õ”¹Ñ•áÑ½¹Ñ•¹Ðõ™œ¹Ù…±Õ”ì(€€€µ•ÑÉ¥…ÁÑ¥½¸¹Ñ•áÑ½¹Ñ•¹Ðõ™œ¹…ÁÑ¥½¸ì(€€€…ÁÀ¹‘…Ñ…Í•Ð¹µ½‘”õ¹•áÐì(€€€ÁÕÁ¥±	½½ÍÐôÄì(€€€ÑÉäì¹…Ù¥…Ñ½È¹Ù¥‰É…Ñ”ü¸ à¤ìô…Ñ ¡”¥íô(€€€É•¹‘•É½ÑÌ ¤ì(€€€¥˜¡É•…Í½¸„ôô¥¹¥Ðœ¤¡¥‘•!¥¹Ð ¤ì(€ô((€™Õ¹Ñ¥½¸É•¹‘•É½ÑÌ ¥ì(€€€µ½‘•½ÑÌ¹¥¹¹•É!Q50ôœœì(€€€=IH¹™½É… ¡´ôùì(€€€€€½¹ÍÐÌõ‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ÍÁ…¸œ¤ì(€€€€€¥˜¡´ôôõµ½‘”¥Ì¹±…ÍÍ9…µ”ô…Ñ¥Ù”œì(€€€€€µ½‘•½ÑÌ¹…ÁÁ•¹‘¡¥±¡Ì¤ì(€€€ô¤ì(€€€µ½‘•½ÑÌ¹±…ÍÍ1¥ÍÐ¹Ñ½±” Ù¥Í¥‰±”œ±µ½‘”„ôô¡½µ”œ¤ì(€ô((€™Õ¹Ñ¥½¸¡¥‘•!¥¹Ð ¥ì(€€€¥˜¡™¥ÉÍÑ%¹Ñ•É…Ñ¥½¸¥É•ÑÕÉ¸ì(€€€™¥ÉÍÑ%¹Ñ•É…Ñ¥½¸õÑÉÕ”ì(€€€µ½Ñ¥½¹!¥¹Ð¹±…ÍÍ1¥ÍÐ¹…‘ ¡¥‘‘•¸œ¤ì(€ô((€™Õ¹Ñ¥½¸ÁÕ±Í•Ð¡à±ä¥ì(€€€™½ÕÍAÕ±Í”ô¸ÀÐì™½ÕÍAÕ±Í•`õàì™½ÕÍAÕ±Í•dõäì(€€€Ñ½Õ¡I¥¹œ¹ÍÑå±”¹±•™Ðõà¬ÁàœìÑ½Õ¡I¥¹œ¹ÍÑå±”¹Ñ½Àõä¬Áàœì(€€€Ñ½Õ¡I¥¹œ¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ÁÕ±Í”œ¤ìÙ½¥Ñ½Õ¡I¥¹œ¹½™™Í•Ñ]¥‘Ñ ìÑ½Õ¡I¥¹œ¹±…ÍÍ1¥ÍÐ¹…‘ ÁÕ±Í”œ¤ì(€€€ÁÕÁ¥±	½½ÍÐôÄì(€ô((€™Õ¹Ñ¥½¸½Á•¹5•¹Ô ¥ì(€€€¥˜¡µ•¹Õ=Á•¸¥É•ÑÕÉ¸ì(€€€µ•¹Õ=Á•¸õÑÉÕ”ì(€€€µ•¹ÕM•±•Ñ¥½¸õ¹Õ±°ì(€€€É…‘¥…±5•¹Ô¹±…ÍÍ1¥ÍÐ¹…‘ ½Á•¸œ¤ì(€€€É…‘¥…±5•¹Ô¹Í•ÑÑÑÉ¥‰ÕÑ” …É¥„µ¡¥‘‘•¸œ°™…±Í”œ¤ì(€€€…ÁÀ¹±…ÍÍ1¥ÍÐ¹…‘ µ•¹Ôµ½Á•¸œ¤ì(€€€ÑÉåí¹…Ù¥…Ñ½È¹Ù¥‰É…Ñ”ü¸ ÄÈ¥õ…Ñ ¡”¥íô(€€€¡¥‘•!¥¹Ð ¤ì(€ô(€™Õ¹Ñ¥½¸±½Í•5•¹Ô¡½µµ¥ÐõÑÉÕ”¥ì(€€€¥˜ …µ•¹Õ=Á•¸¥É•ÑÕÉ¸ì(€€€¥˜¡½µµ¥Ð€˜˜µ•¹ÕM•±•Ñ¥½¸¤Í•Ñ5½‘”¡µ•¹ÕM•±•Ñ¥½¸¤ì(€€€µ•¹Õ=Á•¸õ™…±Í”ì(€€€µ•¹ÕM•±•Ñ¥½¸õ¹Õ±°ì(€€€É…‘¥…±%Ñ•µÌ¹™½É… ¡¤ôù¤¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” …Ñ¥Ù”œ¤¤ì(€€€É…‘¥…±5•¹Ô¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ½Á•¸œ¤ì(€€€É…‘¥…±5•¹Ô¹Í•ÑÑÑÉ¥‰ÕÑ” …É¥„µ¡¥‘‘•¸œ°ÑÉÕ”œ¤ì(€€€…ÁÀ¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” µ•¹Ôµ½Á•¸œ¤ì(€ô((€™Õ¹Ñ¥½¸ÕÁ‘…Ñ•5•¹ÕM•±•Ñ¥½¸¡à±ä¥ì(€€€¥˜ …µ•¹Õ=Á•¸¥É•ÑÕÉ¸ì(€€€½¹ÍÐ‘àõàµ•¹Ñ•È¹à°‘äõäµ•¹Ñ•È¹äì(€€€½¹ÍÐ‘¥ÍÐõ5…Ñ ¹¡åÁ½Ð¡‘à±‘ä¤ì(€€€¥˜¡‘¥ÍÐñ¥É¥ÍI…‘¥ÕÌ¨¸ÌÈ¥ìµ•¹ÕM•±•Ñ¥½¸õ¹Õ±°ìô(€€€•±Í”ì(€€€€€½¹ÍÐ…¹±”õ5…Ñ ¹…Ñ…¸È¡‘ä±‘à¤ì(€€€€€¥˜¡…¹±”øµ5…Ñ ¹A$¨¸ÈÔ€˜˜…¹±”ðõ5…Ñ ¹A$¨¸ÈÔ¤µ•¹ÕM•±•Ñ¥½¸ô™½½œì(€€€€€•±Í”¥˜¡…¹±”ù5…Ñ ¹A$¨¸ÈÔ€˜˜…¹±”ðõ5…Ñ ¹A$¨¸ÜÔ¤µ•¹ÕM•±•Ñ¥½¸ôÍ±••Àœì(€€€€€•±Í”¥˜¡…¹±”ðôµ5…Ñ ¹A$¨¸ÈÔ€˜˜…¹±”øµ5…Ñ ¹A$¨¸ÜÔ¤µ•¹ÕM•±•Ñ¥½¸ôÍÁ½ÉÐœì(€€€€€•±Í”µ•¹ÕM•±•Ñ¥½¸ôÝ…Ñ•Èœì(€€€ô(€€€É…‘¥…±%Ñ•µÌ¹™½É… ¡¤ôù¤¹±…ÍÍ1¥ÍÐ¹Ñ½±” …Ñ¥Ù”œ±¤¹‘…Ñ…Í•Ð¹µ½‘”ôôõµ•¹ÕM•±•Ñ¥½¸¤¤ì(€ô((€™Õ¹Ñ¥½¸¡…¹‘±•A½¥¹Ñ•É½Ý¸¡”¥ì(€€€½¹ÍÐÀõÁ½¥¹Ð¡”¤ì(€€€Á½¥¹Ñ•È¹‘½Ý¸õÑÉÕ”ìÁ½¥¹Ñ•È¹ÍÑ…ÉÑ`õÀ¹àìÁ½¥¹Ñ•È¹ÍÑ…ÉÑdõÀ¹äìÁ½¥¹Ñ•È¹±…ÍÑ`õÀ¹àìÁ½¥¹Ñ•È¹±…ÍÑdõÀ¹äìÁ½¥¹Ñ•È¹ÍÑ…ÉÑPõÁ•É™½Éµ…¹”¹¹½Ü ¤ì(€€€Ñ…É•Ñå•=™™Í•Ð¹àô ¡À¹àµ•¹Ñ•È¹à¤½5…Ñ ¹µ…à¡\°Ä¤¤¨Äàì(€€€Ñ…É•Ñå•=™™Í•Ð¹äô ¡À¹äµ•¹Ñ•È¹ä¤½5…Ñ ¹µ…à¡ °Ä¤¤¨Äàì(€€€±•…ÉQ¥µ•½ÕÐ¡¡½±‘Q¥µ•È¤ì(€€€¡½±‘Q¥µ•ÈõÍ•ÑQ¥µ•½ÕÐ  ¤ôùì¥˜¡Á½¥¹Ñ•È¹‘½Ý¸¤½Á•¹5•¹Ô ¤ìô°ØÈÀ¤ì(€ô((€™Õ¹Ñ¥½¸¡…¹‘±•A½¥¹Ñ•É5½Ù”¡”¥ì(€€€½¹ÍÐÀõÁ½¥¹Ð¡”¤ìÁ½¥¹Ñ•È¹±…ÍÑ`õÀ¹àìÁ½¥¹Ñ•È¹±…ÍÑdõÀ¹äì(€€€½¹ÍÐ‘àô¡À¹àµ•¹Ñ•È¹à¤°‘äô¡À¹äµ•¹Ñ•È¹ä¤ì(€€€Ñ…É•Ñå•=™™Í•Ð¹àõ5…Ñ ¹µ…à ´ÄÀ±5…Ñ ¹µ¥¸ ÄÀ±‘à½\¨Èà¤¤ì(€€€Ñ…É•Ñå•=™™Í•Ð¹äõ5…Ñ ¹µ…à ´ä±5…Ñ ¹µ¥¸ ä±‘ä½ ¨Èà¤¤ì(€€€¥˜¡Á½¥¹Ñ•È¹‘½Ý¸€˜˜5…Ñ ¹¡åÁ½Ð¡À¹àµÁ½¥¹Ñ•È¹ÍÑ…ÉÑ`±À¹äµÁ½¥¹Ñ•È¹ÍÑ…ÉÑd¤øÄØ€˜˜€…µ•¹Õ=Á•¸¤±•…ÉQ¥µ•½ÕÐ¡¡½±‘Q¥µ•È¤ì(€€€¥˜¡µ•¹Õ=Á•¸¤ÕÁ‘…Ñ•5•¹ÕM•±•Ñ¥½¸¡À¹à±À¹ä¤ì(€ô((€™Õ¹Ñ¥½¸¡…¹‘±•A½¥¹Ñ•ÉUÀ¡”¥ì(€€€½¹ÍÐÀõÁ½¥¹Ð¡”¤ì(€€€±•…ÉQ¥µ•½ÕÐ¡¡½±‘Q¥µ•È¤ì(€€€½¹ÍÐ‘ÐõÁ•É™½Éµ…¹”¹¹½Ü ¤µÁ½¥¹Ñ•È¹ÍÑ…ÉÑPì(€€€½¹ÍÐ‘àõÀ¹àµÁ½¥¹Ñ•È¹ÍÑ…ÉÑ`°‘äõÀ¹äµÁ½¥¹Ñ•È¹ÍÑ…ÉÑdì(€€€½¹ÍÐ‘¥ÍÐõ5…Ñ ¹¡åÁ½Ð¡‘à±‘ä¤ì(€€€Á½¥¹Ñ•È¹‘½Ý¸õ™…±Í”ì(€€€Ñ…É•Ñå•=™™Í•Ð¹àôÀìÑ…É•Ñå•=™™Í•Ð¹äôÀì((€€€¥˜¡µ•¹Õ=Á•¸¥ì±½Í•5•¹Ô¡ÑÉÕ”¤ìÉ•ÑÕÉ¸ìô((€€€¥˜¡‘ÐðÐÈÀ€˜˜‘¥ÍÐðÈÈ¥ì(€€€€€½¹ÍÐ¹½ÜõÁ•É™½Éµ…¹”¹¹½Ü ¤ì(€€€€€ÁÕ±Í•Ð¡À¹à±À¹ä¤ì(€€€€€¡¥‘•!¥¹Ð ¤ì(€€€€€¥˜¡¹½Üµ±…ÍÑQ…ÁQ¥µ”ðÌÈÀ¥ì½Á•¹M•ÑÑ¥¹Ì ¤ì±…ÍÑQ…ÁQ¥µ”ôÀìÉ•ÑÕÉ¸ìô(€€€€€±…ÍÑQ…ÁQ¥µ”õ¹½Üì(€€€€€¥˜¡µ½‘”ôôô¡½µ”œ¤ì(€€€€€€€µ•ÑÉ¥…ÁÑ¥½¸¹Ñ•áÑ½¹Ñ•¹Ðô!=1Q<=A8œì(€€€€€€€Í•ÑQ¥µ•½ÕÐ  ¤ôùì¥˜¡µ½‘”ôôô¡½µ”œ¤µ•ÑÉ¥…ÁÑ¥½¸¹Ñ•áÑ½¹Ñ•¹ÐôQ=U Q<=ULœìô°ÄÐÀÀ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô((€€€¥˜¡5…Ñ ¹…‰Ì¡‘à¤øÜÀ€˜˜5…Ñ ¹…‰Ì¡‘à¤ù5…Ñ ¹…‰Ì¡‘ä¤¨Ä¸È¥ì(€€€€€½¹ÍÐ¤õ=IH¹¥¹‘•á=˜¡µ½‘”¤ì(€€€€€½¹ÍÐ¹•áÐô‘àðÀ€ü=IIl¡¤¬Ä¤•=IH¹±•¹Ñ¡t€è=IIl¡¤´Ä­=IH¹±•¹Ñ ¤•=IH¹±•¹Ñ¡tì(€€€€€Í•Ñ5½‘”¡¹•áÐ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜¡‘äøäÀ€˜˜5…Ñ ¹…‰Ì¡‘ä¤ù5…Ñ ¹…‰Ì¡‘à¤¨Ä¸È¥ì(€€€€€½Á•¹M•ÑÑ¥¹Ì ¤ì(€€€ô(€ô((€™Õ¹Ñ¥½¸Á½¥¹Ð¡”¥ì(€€€¥˜¡”¹Ñ½Õ¡•Ìü¹lÁt¤É•ÑÕÉ¸íàé”¹Ñ½Õ¡•ÍlÁt¹±¥•¹Ñ`±äé”¹Ñ½Õ¡•ÍlÁt¹±¥•¹Ñeôì(€€€¥˜¡”¹¡…¹•‘Q½Õ¡•Ìü¹lÁt¤É•ÑÕÉ¸íàé”¹¡…¹•‘Q½Õ¡•ÍlÁt¹±¥•¹Ñ`±äé”¹¡…¹•‘Q½Õ¡•ÍlÁt¹±¥•¹Ñeôì(€€€É•ÑÕÉ¸íàé”¹±¥•¹Ñ`±äé”¹±¥•¹Ñeôì(€ô((€™Õ¹Ñ¥½¸½Á•¹M•ÑÑ¥¹Ì ¥ì(€€€Í•ÑÑ¥¹ÍA…¹•°¹±…ÍÍ1¥ÍÐ¹…‘ ½Á•¸œ¤ì(€€€Í•ÑÑ¥¹ÍA…¹•°¹Í•ÑÑÑÉ¥‰ÕÑ” …É¥„µ¡¥‘‘•¸œ°™…±Í”œ¤ì(€€€…ÁÀ¹±…ÍÍ1¥ÍÐ¹…‘ Í•ÑÑ¥¹Ìµ½Á•¸œ¤ì(€€€¡¥‘•!¥¹Ð ¤ì(€ô(€™Õ¹Ñ¥½¸±½Í•M•ÑÑ¥¹Ì ¥ì(€€€Í•ÑÑ¥¹ÍA…¹•°¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ½Á•¸œ¤ì(€€€Í•ÑÑ¥¹ÍA…¹•°¹Í•ÑÑÑÉ¥‰ÕÑ” …É¥„µ¡¥‘‘•¸œ°ÑÉÕ”œ¤ì(€€€…ÁÀ¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” Í•ÑÑ¥¹Ìµ½Á•¸œ¤ì(€ô((€É…‘¥…±%Ñ•µÌ¹™½É… ¡¥Ñ•´ôùì(€€€¥Ñ•´¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±”ôùì”¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤ìµ•¹ÕM•±•Ñ¥½¸õ¥Ñ•´¹‘…Ñ…Í•Ð¹µ½‘”ì±½Í•5•¹Ô¡ÑÉÕ”¤ìô¤ì(€ô¤ì(€Í•ÑÑ¥¹ÍQÉ¥•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°½Á•¹M•ÑÑ¥¹Ì¤ì(€‘½Õµ•¹Ð¹ÅÕ•ÉåM•±•Ñ½É±° m‘…Ñ„µ±½Í”µÍ•ÑÑ¥¹Ítœ¤¹™½É… ¡•°ôù•°¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±±½Í•M•ÑÑ¥¹Ì¤¤ì((€ÍÑ…”¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È Á½¥¹Ñ•É‘½Ý¸œ±¡…¹‘±•A½¥¹Ñ•É½Ý¸±íÁ…ÍÍ¥Ù”éÑÉÕ•ô¤ì(€ÍÑ…”¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È Á½¥¹Ñ•Éµ½Ù”œ±¡…¹‘±•A½¥¹Ñ•É5½Ù”±íÁ…ÍÍ¥Ù”éÑÉÕ•ô¤ì(€ÍÑ…”¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È Á½¥¹Ñ•ÉÕÀœ±¡…¹‘±•A½¥¹Ñ•ÉUÀ±íÁ…ÍÍ¥Ù”éÑÉÕ•ô¤ì(€ÍÑ…”¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È Á½¥¹Ñ•É…¹•°œ° ¤ôùìÁ½¥¹Ñ•È¹‘½Ý¸õ™…±Í”ì±•…ÉQ¥µ•½ÕÐ¡¡½±‘Q¥µ•È¤ì±½Í•5•¹Ô¡™…±Í”¤ìÑ…É•Ñå•=™™Í•Ð¹àõÑ…É•Ñå•=™™Í•Ð¹äôÀìô±íÁ…ÍÍ¥Ù”éÑÉÕ•ô¤ì((€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È É•Í¥é”œ±É•Í¥é”±íÁ…ÍÍ¥Ù”éÑÉÕ•ô¤ì(€‘½Õµ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È Ù¥Í¥‰¥±¥Ñå¡…¹”œ° ¤ôùì¥˜¡‘½Õµ•¹Ð¹¡¥‘‘•¸¥ìÁ½¥¹Ñ•È¹‘½Ý¸õ™…±Í”ì±•…ÉQ¥µ•½ÕÐ¡¡½±‘Q¥µ•È¤ì±½Í•5•¹Ô¡™…±Í”¤ìõô¤ì((€É•Í¥é” ¤ì(€Í•Ñ5½‘” ¡½µ”œ°¥¹¥Ðœ¤ì(€É•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”¡É•¹‘•È¤ì((€¥˜ Í•ÉÙ¥•]½É­•Èœ¥¸¹…Ù¥…Ñ½È¤ì(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±½…œ° ¤ôù¹…Ù¥…Ñ½È¹Í•ÉÙ¥•]½É­•È¹É•¥ÍÑ•È œ¸½ÍÜ¹©Ìœ¤¹…Ñ   ¤ôùíô¤¤ì(€ô)ô¤ ¤ì(