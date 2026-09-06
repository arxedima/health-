// Nova+ v16 — tiny static home adapter. No animation, no hero rewriting.
(function(){
  const app=document.getElementById('app');
  const screen=document.getElementById('screen');
  if(!app||!screen)return;

  const sun=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
  const moon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.8 15.1A8.3 8.3 0 0 1 9 4.2a8.6 8.6 0 1 0 10.8 10.9Z" fill="currentColor"/></svg>`;

  function nameFromHome(home){
    const h1=home.querySelector('h1');
    const text=(h1?.textContent||'').replace(/\s+/g,' ').trim();
    const parts=text.split(',');
    const candidate=(parts[parts.length-1]||'').trim();
    return candidate&&candidate.length<30?candidate:'Дмитрий';
  }

  function apply(){
    const home=screen.querySelector('.home-page');
    if(!home)return;
    const dark=app.classList.contains('dark');
    const theme=dark?'dark':'light';
    if(home.dataset.cleanTheme===theme)return;

    const h1=home.querySelector('h1');
    const sub=home.querySelector('.page-sub');
    const name=nameFromHome(home);

    if(h1)h1.innerHTML=dark?`Спокойный вечер,<br>${name}`:`Доброе утро,<br>${name}`;
    if(sub)sub.textContent=dark?'Хороший день. Время восстановиться.':'Маленький шаг — больше результата.';

    const tip=home.querySelector('.home-tip');
    if(tip){
      const icon=tip.querySelector('.tip-icon');
      const title=tip.querySelector('b');
      const text=tip.querySelector('p');
      if(icon)icon.innerHTML=dark?moon:sun;
      if(title)title.textContent=dark?'Подготовка ко сну':'Стакан воды';
      if(text)text.textContent=dark?'10 минут без экрана улучшают сон.':'После пробуждения запускает метаболизм.';
    }

    home.dataset.cleanTheme=theme;
  }

  let raf=0;
  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)};
  new MutationObserver(schedule).observe(screen,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(app,{attributes:true,attributeFilter:['class']});
  schedule();
})();