/* Nova+ v23 — home-only responsive rebuild with a single clean progress line. No animation. */
(function(){
  const root=document.getElementById('novaApp');
  if(!root)return;

  function readState(){
    try{
      return Object.assign({theme:'light',sport:{done:2,target:3},food:{done:3,target:8},water:{done:4,target:8},sleep:{done:1,target:8}},JSON.parse(localStorage.getItem('nova-v20')||'{}'));
    }catch{
      return {theme:'light',sport:{done:2,target:3},food:{done:3,target:8},water:{done:4,target:8},sleep:{done:1,target:8}};
    }
  }
  function ratio(m){const d=Number(m&&m.done)||0,t=Number(m&&m.target)||0;return t>0?Math.max(0,Math.min(1,d/t)):0}
  function overall(){const s=readState();return (ratio(s.sport)+ratio(s.food)+ratio(s.water)+ratio(s.sleep))/4}

  function sphereMarkup(progress){
    const s=readState();
    const dark=s.theme==='dark';
    const p=Math.max(0,Math.min(1,progress));
    const waterPct=p<=0?0:Math.min(93,p*93);
    const top=46,bottom=191,span=bottom-top;
    const y=bottom-(waterPct/100)*span;
    const amp=5.2;
    const y1=(y+1.5).toFixed(1),y2=(y-amp).toFixed(1),y3=(y+amp).toFixed(1),y4=(y-1.5).toFixed(1);
    const arcPct=(p*100).toFixed(2);
    const baseA=dark?'#88a9c4':'#ffffff';
    const baseB=dark?'#315f88':'#dceefa';
    const baseC=dark?'#0c3159':'#9fc9e7';
    const water1=dark?'#5aa9e5':'#a9dcf8';
    const water2=dark?'#2f82c5':'#69b7e6';
    const water3=dark?'#145a9f':'#2d84c9';
    const rim=dark?'#dff4ff':'#ffffff';
    const arc=dark?'#eef9ff':'#2a82e4';
    const track=dark?'rgba(125,187,228,.14)':'rgba(52,111,176,.11)';

    return `
    <svg class="nova23-sphere-svg" viewBox="0 0 240 220" role="img" aria-label="Общий прогресс ${Math.round(p*100)} процентов">
      <defs>
        <clipPath id="nova23Clip"><circle cx="120" cy="118" r="74"/></clipPath>
        <radialGradient id="nova23Glass" cx="31%" cy="22%" r="84%">
          <stop offset="0%" stop-color="${baseA}" stop-opacity=".84"/>
          <stop offset="28%" stop-color="${baseA}" stop-opacity=".46"/>
          <stop offset="66%" stop-color="${baseB}" stop-opacity=".44"/>
          <stop offset="100%" stop-color="${baseC}" stop-opacity=".24"/>
        </radialGradient>
        <radialGradient id="nova23Shade" cx="68%" cy="78%" r="72%">
          <stop offset="0%" stop-color="${dark?'#061d37':'#4d8fc2'}" stop-opacity="${dark?'.34':'.13'}"/>
          <stop offset="70%" stop-color="${dark?'#17496f':'#a6d1ed'}" stop-opacity=".05"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="nova23Water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${water1}" stop-opacity="${dark?'.54':'.64'}"/>
          <stop offset="45%" stop-color="${water2}" stop-opacity="${dark?'.62':'.70'}"/>
          <stop offset="100%" stop-color="${water3}" stop-opacity="${dark?'.76':'.78'}"/>
        </linearGradient>
        <linearGradient id="nova23WaveGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="42%" stop-color="#f5fcff" stop-opacity=".42"/>
          <stop offset="72%" stop-color="#d7f3ff" stop-opacity=".20"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="nova23Arc" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${arc}"/><stop offset="100%" stop-color="${dark?'#d9f3ff':'#1669cf'}"/></linearGradient>
        <filter id="nova23Blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4.5"/></filter>
      </defs>

      <!-- one clean progress route: track and value use the exact same path -->
      <path d="M105 24 C150 21 194 47 211 92" pathLength="100" fill="none" stroke="${track}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M105 24 C150 21 194 47 211 92" pathLength="100" fill="none" stroke="url(#nova23Arc)" stroke-width="6.8" stroke-linecap="round" stroke-dasharray="${arcPct} 100"/>

      <circle cx="120" cy="118" r="74" fill="url(#nova23Glass)"/>
      <circle cx="120" cy="118" r="74" fill="url(#nova23Shade)"/>

      <g clip-path="url(#nova23Clip)">
        <path d="M42 ${y1} C68 ${y2},94 ${y2},120 ${y1} C147 ${y3},170 ${y3},198 ${y4} L198 198 L42 198 Z" fill="url(#nova23Water)"/>
        <path d="M42 ${y1} C68 ${y2},94 ${y2},120 ${y1} C147 ${y3},170 ${y3},198 ${y4}" fill="none" stroke="url(#nova23WaveGlow)" stroke-width="2.7" stroke-linecap="round"/>
        <ellipse cx="116" cy="170" rx="50" ry="24" fill="${dark?'#0b4f8c':'#4a9ad3'}" opacity=".08"/>
        <circle cx="97" cy="163" r="2.5" fill="#f5fbff" opacity=".35"/>
        <circle cx="139" cy="179" r="2" fill="#f5fbff" opacity=".27"/>
        <circle cx="154" cy="157" r="1.5" fill="#f5fbff" opacity=".24"/>
      </g>

      <ellipse cx="92" cy="80" rx="37" ry="22" fill="#ffffff" opacity="${dark?'.18':'.24'}" transform="rotate(-22 92 80)" filter="url(#nova23Blur)"/>
      <path d="M75 95 C82 68 101 52 125 48" fill="none" stroke="#ffffff" stroke-opacity="${dark?'.56':'.76'}" stroke-width="4.7" stroke-linecap="round"/>
      <path d="M169 87 C182 106 186 132 180 151" fill="none" stroke="#e7f7ff" stroke-opacity="${dark?'.23':'.28'}" stroke-width="2.7" stroke-linecap="round"/>
      <circle cx="120" cy="118" r="74" fill="none" stroke="${rim}" stroke-opacity="${dark?'.58':'.90'}" stroke-width="1.8"/>
      <circle cx="120" cy="118" r="71" fill="none" stroke="#ffffff" stroke-opacity="${dark?'.08':'.18'}" stroke-width="1.4"/>
    </svg>`;
  }

  function enhance(){
    const hero=root.querySelector('.home-hero');
    const page=hero&&hero.closest('main.page');
    const isHome=Boolean(hero&&page&&page.querySelector('.hero-title'));
    root.classList.toggle('nova23-home-active',isHome);
    if(!isHome)return;

    page.classList.add('nova23-home-page');
    hero.className='home-hero nova23-hero';

    const p=overall();
    const theme=readState().theme;
    const sig=`${theme}-${p.toFixed(4)}`;
    if(hero.dataset.nova23!==sig){
      hero.dataset.nova23=sig;
      hero.innerHTML=sphereMarkup(p);
    }

    document.documentElement.style.overflowX='hidden';
    document.body.style.overflowX='hidden';
    if(document.documentElement.scrollLeft)document.documentElement.scrollLeft=0;
    if(document.body.scrollLeft)document.body.scrollLeft=0;
  }

  let raf=0;
  function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(enhance)}
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  window.addEventListener('storage',schedule);
  document.addEventListener('click',()=>setTimeout(schedule,0),true);
  schedule();
})();
