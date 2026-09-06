// Nova+ v14 — dark-home reference lock.
// Keeps live metrics and business logic. Only the dark home copy/arc geometry is overridden.
(function(){
  const app=document.getElementById('app');
  const screen=document.getElementById('screen');
  if(!app||!screen)return;

  function metricRatio(metric){
    const text=metric?.querySelector('small')?.textContent||'';
    const m=text.match(/([0-9]+(?:[.,][0-9]+)?)\s*\/\s*([0-9]+(?:[.,][0-9]+)?)/);
    if(!m)return 0;
    const done=Number(m[1].replace(',','.'))||0;
    const target=Number(m[2].replace(',','.'))||0;
    return target>0?Math.max(0,Math.min(1,done/target)):0;
  }

  function overall(home){
    const metrics=Array.from(home.querySelectorAll('.metric-grid .metric')).slice(0,4);
    if(metrics.length!==4)return 0;
    return Math.max(0,Math.min(1,metrics.reduce((s,m)=>s+metricRatio(m),0)/4));
  }

  function lockNightReference(){
    if(!app.classList.contains('dark'))return;
    const home=screen.querySelector('.home-page');
    if(!home)return;

    const name=(home.querySelector('h1')?.textContent||'').includes('Дмитрий')?'Дмитрий':'Дмитрий';
    const h1=home.querySelector('h1');
    const sub=home.querySelector('.page-sub');
    if(h1)h1.innerHTML=`Спокойный вечер,<br>${name}`;
    if(sub)sub.textContent='Хороший день. Время восстановиться.';

    const p=overall(home);
    const progress=p*100;
    const visualFill=progress<=0?0:Math.min(93,progress);

    const sphere=home.querySelector('.hero-orb');
    if(sphere){
      sphere.style.setProperty('--nova-fill',`${visualFill.toFixed(2)}%`);
      sphere.dataset.progress=String(Math.round(progress));
      sphere.setAttribute('aria-label',`Общий прогресс ${Math.round(progress)} процентов`);
    }

    // Short night arc: top-centre to right-lower, as in the approved night reference.
    const arc='M122 29 A105 105 0 0 1 226 139';
    const track=home.querySelector('.ring-track');
    const value=home.querySelector('.ring-value');
    if(track){
      track.setAttribute('d',arc);
      track.setAttribute('pathLength','100');
    }
    if(value){
      value.setAttribute('d',arc);
      value.setAttribute('pathLength','100');
      value.style.strokeDasharray=`${progress.toFixed(2)} 100`;
      value.style.strokeDashoffset='0';
    }

    const tip=home.querySelector('.home-tip');
    if(tip){
      const small=tip.querySelector('small');
      const title=tip.querySelector('b');
      const text=tip.querySelector('p');
      if(small)small.textContent='Совет дня';
      if(title)title.textContent='Подготовка ко сну';
      if(text)text.textContent='10 минут дыхательной практики улучшают сон.';
    }
  }

  let raf=0;
  function schedule(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(lockNightReference);
  }

  new MutationObserver(schedule).observe(screen,{childList:true,subtree:true,characterData:true});
  new MutationObserver(schedule).observe(app,{attributes:true,attributeFilter:['class']});
  window.addEventListener('pageshow',schedule,{passive:true});
  schedule();
})();
