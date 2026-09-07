/* Nova+ v21 — enhance only the home hero.
   Uses the existing v20 state from localStorage and leaves the rest of the app architecture untouched. */
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

  function progress(){
    const s = readState();
    return (ratio(s.sport)+ratio(s.food)+ratio(s.water)+ratio(s.sleep))/4;
  }

  function enhance(){
    const hero = root.querySelector('.home-hero');
    if(!hero) return;

    const p = progress();
    const water = p <= 0 ? 0 : Math.min(93,p*100);
    const arc = Math.max(0,Math.min(100,p*100));

    if(hero.dataset.nova21 === '1'){
      const orb = hero.querySelector('.nova21-orb');
      const value = hero.querySelector('.nova21-arc-value');
      if(orb) orb.style.setProperty('--water-level', `${water.toFixed(2)}%`);
      if(value) value.style.strokeDasharray = `${arc.toFixed(2)} 100`;
      return;
    }

    hero.dataset.nova21 = '1';
    hero.classList.add('nova21-hero');
    hero.innerHTML = `
      <svg class="nova21-arc" viewBox="0 0 260 260" aria-hidden="true">
        <path class="nova21-arc-track" pathLength="100" d="M99 35 A105 105 0 0 1 228 143"></path>
        <path class="nova21-arc-value" pathLength="100" d="M99 35 A105 105 0 0 1 228 143" style="stroke-dasharray:${arc.toFixed(2)} 100"></path>
      </svg>
      <div class="nova21-orb" style="--water-level:${water.toFixed(2)}%" role="img" aria-label="Общий прогресс ${Math.round(p*100)} процентов">
        <div class="nova21-water"></div>
        <span class="nova21-depth"></span>
        <span class="nova21-shine"></span>
        <span class="nova21-rim"></span>
        <span class="nova21-bubbles" aria-hidden="true"><i></i><i></i><i></i></span>
      </div>`;
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
