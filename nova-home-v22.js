/* Nova+ v22 — home-only static rebuild. No animation: calibrated layout + SVG glass sphere + wavy water. */
(function(){
  const root = document.getElementById('novaApp');
  if(!root) return;

  function readState(){
    try{
      return Object.assign({
        sport:{done:2,target:3},
        food:{done:3,target:8},
        water:{done:4,target:8},
        sleep:{done:1,target:8}
      }, JSON.parse(localStorage.getItem('nova-v20') || '{}'));
    }catch{
      return {sport:{done:2,target:3},food:{done:3,target:8},water:{done:4,target:8},sleep:{done:1,target:8}};
    }
  }

  function ratio(m){
    const done = Number(m && m.done) || 0;
    const target = Number(m && m.target) || 0;
    return target > 0 ? Math.max(0,Math.min(1,done/target)) : 0;
  }

  function overall(){
    const s = readState();
    return (ratio(s.sport)+ratio(s.food)+ratio(s.water)+ratio(s.sleep))/4;
  }

  function sphereMarkup(p){
    const progress = Math.max(0,Math.min(1,p));
    const waterPct = progress <= 0 ? 0 : Math.min(93,progress*93);
    const top = 48;
    const bottom = 212;
    const span = bottom - top;
    const y = bottom - (waterPct/100)*span;
    const a = 7;
    const y1 = (y + 2).toFixed(1);
    const y2 = (y - a).toFixed(1);
    const y3 = (y + a).toFixed(1);
    const y4 = (y - 2).toFixed(1);
    const arcPct = (progress*100).toFixed(2);

    return `
      <svg class="nova22-sphere-svg" viewBox="0 0 260 260" role="img" aria-label="Общий прогресс ${Math.round(progress*100)} процентов">
        <defs>
          <clipPath id="nova22SphereClip"><circle cx="130" cy="132" r="82"/></clipPath>

          <radialGradient id="nova22GlassBase" cx="31%" cy="22%" r="82%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".82"/>
            <stop offset="22%" stop-color="#eef8ff" stop-opacity=".58"/>
            <stop offset="58%" stop-color="#bddcf3" stop-opacity=".34"/>
            <stop offset="100%" stop-color="#82b8df" stop-opacity=".18"/>
          </radialGradient>
          <radialGradient id="nova22GlassShade" cx="65%" cy="76%" r="73%">
            <stop offset="0%" stop-color="#477fac" stop-opacity=".18"/>
            <stop offset="58%" stop-color="#7bb3db" stop-opacity=".07"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="nova22Water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a8daf6" stop-opacity=".62"/>
            <stop offset="28%" stop-color="#72bce8" stop-opacity=".66"/>
            <stop offset="68%" stop-color="#3e8fd1" stop-opacity=".72"/>
            <stop offset="100%" stop-color="#236fb8" stop-opacity=".76"/>
          </linearGradient>
          <linearGradient id="nova22WaterHighlight" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".05"/>
            <stop offset="42%" stop-color="#f0fbff" stop-opacity=".38"/>
            <stop offset="72%" stop-color="#bce7ff" stop-opacity=".16"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="nova22Rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".98"/>
            <stop offset="46%" stop-color="#eef9ff" stop-opacity=".58"/>
            <stop offset="78%" stop-color="#9dcced" stop-opacity=".45"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity=".84"/>
          </linearGradient>
          <linearGradient id="nova22Arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#2987eb"/>
            <stop offset="100%" stop-color="#1468cd"/>
          </linearGradient>
          <filter id="nova22SoftGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- progress arc is a real partial path, independent of sphere geometry -->
        <path d="M101 28 A108 108 0 0 1 232 139" pathLength="100" fill="none" stroke="rgba(62,119,181,.12)" stroke-width="7" stroke-linecap="round"/>
        <path d="M101 28 A108 108 0 0 1 232 139" pathLength="100" fill="none" stroke="url(#nova22Arc)" stroke-width="7.5" stroke-linecap="round" stroke-dasharray="${arcPct} 100"/>

        <!-- glass body -->
        <circle cx="130" cy="132" r="82" fill="url(#nova22GlassBase)"/>
        <circle cx="130" cy="132" r="82" fill="url(#nova22GlassShade)"/>

        <!-- real wavy water, clipped inside the sphere -->
        <g clip-path="url(#nova22SphereClip)">
          <path d="M42 ${y1} C73 ${y2}, 98 ${y2}, 128 ${y1} C157 ${y3}, 184 ${y3}, 218 ${y4} L218 222 L42 222 Z" fill="url(#nova22Water)"/>
          <path d="M42 ${y1} C73 ${y2}, 98 ${y2}, 128 ${y1} C157 ${y3}, 184 ${y3}, 218 ${y4}" fill="none" stroke="url(#nova22WaterHighlight)" stroke-width="3.2" stroke-linecap="round"/>
          <ellipse cx="118" cy="188" rx="58" ry="29" fill="#4d9bd5" opacity=".08"/>
          <circle cx="103" cy="177" r="2.8" fill="#f4fbff" opacity=".35"/>
          <circle cx="145" cy="194" r="2.1" fill="#f4fbff" opacity=".28"/>
          <circle cx="164" cy="169" r="1.7" fill="#f4fbff" opacity=".25"/>
        </g>

        <!-- depth and glass reflections above water -->
        <circle cx="130" cy="132" r="78.5" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3"/>
        <ellipse cx="101" cy="91" rx="42" ry="24" fill="#ffffff" opacity=".22" transform="rotate(-23 101 91)" filter="url(#nova22SoftGlow)"/>
        <path d="M77 105 C84 75 105 57 132 53" fill="none" stroke="#ffffff" stroke-opacity=".72" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M182 93 C198 116 202 144 194 166" fill="none" stroke="#dff4ff" stroke-opacity=".26" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="130" cy="132" r="82" fill="none" stroke="url(#nova22Rim)" stroke-width="2.2"/>
      </svg>`;
  }

  function enhance(){
    const hero = root.querySelector('.home-hero');
    const page = hero && hero.closest('main.page');
    const isHome = Boolean(hero && page && page.querySelector('.hero-title'));

    root.classList.toggle('nova22-home-active', isHome);
    if(!isHome) return;

    page.classList.add('nova22-home-page');
    hero.classList.remove('nova21-hero');
    hero.classList.add('nova22-hero');

    const p = overall();
    const sig = p.toFixed(4);
    if(hero.dataset.nova22 === sig) return;

    hero.dataset.nova22 = sig;
    hero.innerHTML = sphereMarkup(p);
  }

  let raf = 0;
  function schedule(){
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(enhance);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  window.addEventListener('storage',schedule);
  document.addEventListener('click',()=>setTimeout(schedule,0),true);
  schedule();
})();
