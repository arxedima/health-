// Nova+ v15 — clean home component. Rebuilds only the main hero DOM.
(function(){
  const app=document.getElementById('app');
  const screen=document.getElementById('screen');
  const header=document.getElementById('header');
  if(!app||!screen)return;

  const moonSvg=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.7 15.1A8.3 8.3 0 0 1 9 4.3a8.6 8.6 0 1 0 10.7 10.8Z" fill="currentColor"/></svg>`;

  function ratio(metric){
    const t=metric?.querySelector('small')?.textContent||'';
    const m=t.match(/([0-9]+(?:[.,][0-9]+)?)\s*\/\s*([0-9]+(?:[.,][0-9]+)?)/);
    if(!m)return 0;
    const d=Number(m[1].replace(',','.'))||0;
    const g=Number(m[2].replace(',','.'))||0;
    return g>0?Math.max(0,Math.min(1,d/g)):0;
  }

  function overall(home){
    const cards=[...home.querySelectorAll('.metric-grid .metric')].slice(0,4);
    if(cards.length!==4)return 0;
    return cards.reduce((s,c)=>s+ratio(c),0)/4;
  }

  function buildHero(progress,dark){
    const p=Math.max(0,Math.min(1,progress));
    const pct=(p*100).toFixed(2);
    const visual=p<=0?0:Math.min(.93,p);
    const sphereTop=56,sphereBottom=224,sphereSize=168;
    const liquidH=sphereSize*visual;
    const liquidY=sphereBottom-liquidH;
    const fog=dark?'#8dbfe3':'#eff8fd';
    const fog2=dark?'#6da7d2':'#dceff9';
    const shellA=dark?'#547fa5':'#f7fbfe';
    const shellB=dark?'#244f76':'#dcecf7';
    const shellC=dark?'#0a2d50':'#afcfe6';
    const rim=dark?'#cfeaff':'#ffffff';
    const liquidA=dark?'#4d8fc1':'#93c9e9';
    const liquidB=dark?'#215d91':'#5ea4d2';

    return `<div class="nova15-hero" data-progress="${Math.round(p*100)}" data-theme="${dark?'dark':'light'}">
      <svg class="nova15-orb-svg" viewBox="0 0 320 260" role="img" aria-label="Общий прогресс ${Math.round(p*100)} процентов">
        <defs>
          <radialGradient id="nova15Shell" cx="28%" cy="22%" r="82%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".93"/>
            <stop offset="13%" stop-color="${shellA}" stop-opacity=".86"/>
            <stop offset="58%" stop-color="${shellB}" stop-opacity=".92"/>
            <stop offset="100%" stop-color="${shellC}" stop-opacity=".98"/>
          </radialGradient>
          <linearGradient id="nova15Liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${liquidA}" stop-opacity=".26"/>
            <stop offset="100%" stop-color="${liquidB}" stop-opacity=".42"/>
          </linearGradient>
          <radialGradient id="nova15Highlight" cx="35%" cy="35%" r="66%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".92"/>
            <stop offset="42%" stop-color="#ffffff" stop-opacity=".30"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </radialGradient>
          <clipPath id="nova15SphereClip"><circle cx="160" cy="140" r="84"/></clipPath>
          <filter id="nova15ArcGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="nova15SphereShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="11" flood-color="${dark?'#001224':'#77a9cc'}" flood-opacity="${dark?'.32':'.13'}"/></filter>
          <filter id="nova15Blur12" x="-35%" y="-80%" width="170%" height="260%"><feGaussianBlur stdDeviation="12"/></filter>
          <filter id="nova15Blur8" x="-35%" y="-80%" width="170%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>

        <g class="nova15-fog-back" filter="url(#nova15Blur12)" opacity="${dark?'.58':'.48'}">
          <ellipse cx="74" cy="174" rx="79" ry="20" fill="${fog2}" fill-opacity=".42"/>
          <ellipse cx="146" cy="182" rx="91" ry="24" fill="${fog}" fill-opacity=".44"/>
          <ellipse cx="242" cy="176" rx="92" ry="22" fill="${fog2}" fill-opacity=".40"/>
        </g>

        <g class="nova15-shell">
          <circle cx="160" cy="140" r="84" fill="url(#nova15Shell)" stroke="${rim}" stroke-opacity="${dark?'.48':'.82'}" stroke-width="1.6"/>
          <circle cx="160" cy="140" r="80.5" fill="none" stroke="#ffffff" stroke-opacity="${dark?'.08':'.28'}" stroke-width="1"/>
        </g>

        <g clip-path="url(#nova15SphereClip)">
          <rect class="nova15-liquid" x="76" y="${liquidY.toFixed(2)}" width="168" height="${liquidH.toFixed(2)}" fill="url(#nova15Liquid)"/>
          <ellipse class="nova15-wave" cx="144" cy="${liquidY.toFixed(2)}" rx="76" ry="12" fill="${dark?'#a9d2ed':'#dff3fc'}" fill-opacity="${p>0?'.14':'0'}"/>
          <ellipse class="nova15-wave" cx="205" cy="${(liquidY+2).toFixed(2)}" rx="69" ry="10" fill="${dark?'#78b6de':'#b9e0f3'}" fill-opacity="${p>0?'.12':'0'}"/>

          <g class="nova15-fog-mid" filter="url(#nova15Blur8)" opacity="${dark?'.52':'.40'}">
            <ellipse cx="116" cy="175" rx="72" ry="17" fill="${fog}" fill-opacity=".55"/>
            <ellipse cx="190" cy="184" rx="86" ry="19" fill="${fog2}" fill-opacity=".52"/>
            <ellipse cx="234" cy="171" rx="62" ry="16" fill="${fog}" fill-opacity=".45"/>
          </g>

          <ellipse cx="124" cy="95" rx="43" ry="25" fill="url(#nova15Highlight)" transform="rotate(-17 124 95)"/>
          <ellipse cx="187" cy="154" rx="64" ry="49" fill="#001b36" fill-opacity="${dark?'.10':'.035'}"/>
        </g>

        <g class="nova15-fog-front" filter="url(#nova15Blur8)" opacity="${dark?'.62':'.54'}">
          <ellipse cx="86" cy="190" rx="74" ry="16" fill="${fog2}" fill-opacity=".45"/>
          <ellipse cx="155" cy="194" rx="95" ry="20" fill="${fog}" fill-opacity=".52"/>
          <ellipse cx="245" cy="189" rx="82" ry="18" fill="${fog2}" fill-opacity=".43"/>
        </g>

        <path class="nova15-arc-track" pathLength="100" d="M139 35 C 211 29 263 69 279 130"/>
        <path class="nova15-arc-value" pathLength="100" d="M139 35 C 211 29 263 69 279 130" style="stroke-dasharray:${pct} 100"/>
      </svg>
    </div>`;
  }

  function tuneCopy(home,dark){
    const h1=home.querySelector('h1');
    const sub=home.querySelector('.page-sub');
    if(h1&&!h1.dataset.v15Original)h1.dataset.v15Original=h1.innerHTML;
    if(sub&&!sub.dataset.v15Original)sub.dataset.v15Original=sub.textContent||'';

    if(dark){
      let name='Дмитрий';
      const original=(h1?.textContent||'').replace(/\s+/g,' ').trim();
      const comma=original.indexOf(',');
      if(comma>=0){const candidate=original.slice(comma+1).trim();if(candidate)name=candidate;}
      if(h1)h1.innerHTML=`Спокойный вечер,<br>${name}`;
      if(sub)sub.textContent='Хороший день. Время восстановиться.';
    }else{
      if(h1?.dataset.v15Original)h1.innerHTML=h1.dataset.v15Original;
      if(sub?.dataset.v15Original)sub.textContent=sub.dataset.v15Original;
    }

    const tip=home.querySelector('.home-tip');
    if(!tip)return;
    const icon=tip.querySelector('.tip-icon');
    const small=tip.querySelector('small');
    const b=tip.querySelector('b');
    const p=tip.querySelector('p');
    [icon,small,b,p].forEach((el)=>{if(el&&!el.dataset.v15Original)el.dataset.v15Original=el.innerHTML});
    if(dark){
      if(icon)icon.innerHTML=moonSvg;
      if(small)small.textContent='Совет дня';
      if(b)b.textContent='Подготовка ко сну';
      if(p)p.textContent='10 минут дыхательной практики улучшают сон.';
    }else{
      [icon,small,b,p].forEach((el)=>{if(el?.dataset.v15Original)el.innerHTML=el.dataset.v15Original});
    }
  }

  function tuneHeader(dark){
    const btn=header?.querySelector('.header-btn');
    if(!btn)return;
    if(!btn.dataset.v15Original)btn.dataset.v15Original=btn.innerHTML;
    if(dark)btn.innerHTML=moonSvg;
  }

  function calibrate(){
    const home=screen.querySelector('.home-page');
    if(!home)return;
    const dark=app.classList.contains('dark');
    const p=overall(home);
    const wrap=home.querySelector('.hero-orb-wrap');
    if(wrap){
      const signature=`${dark?'d':'l'}-${Math.round(p*10000)}`;
      if(wrap.dataset.v15Signature!==signature){
        wrap.innerHTML=buildHero(p,dark);
        wrap.dataset.v15Signature=signature;
      }
    }
    tuneCopy(home,dark);
    tuneHeader(dark);
  }

  let raf=0;
  function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(calibrate)}
  new MutationObserver(schedule).observe(screen,{childList:true,subtree:true,characterData:true});
  new MutationObserver(schedule).observe(app,{attributes:true,attributeFilter:['class']});
  if(header)new MutationObserver(schedule).observe(header,{childList:true,subtree:true});
  schedule();
})();
