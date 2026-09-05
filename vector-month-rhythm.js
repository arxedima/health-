/* Health+ / VECTOR — monthly rhythm replaces dose ladder */
(()=>{
  const STORAGE='vector-health-v1';
  const screen=document.getElementById('screen');
  if(!screen)return;

  const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  function load(){
    try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch{return{}}
  }
  function keyFor(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
  function statusFor(state,y,m,d,today){
    const date=new Date(y,m,d);
    if(date>today && d!==today.getDate()) return 'future';
    const log=state?.dailyLogs?.[keyFor(y,m,d)]||{};
    const actions=Object.values(log.actions||{}).filter(Boolean);
    const done=actions.filter(a=>a?.status==='done').length;
    const skipped=actions.filter(a=>a?.status==='skipped').length;
    const pending=actions.filter(a=>a?.status==='pending').length;
    const hasActivity=actions.length>0 || Number(log.water)>0 || Number(log.steps)>0 || Number(log.sleep)>0 || Number(log.energy)>0;

    if(d===today.getDate() && m===today.getMonth() && y===today.getFullYear()){
      if(actions.length>0 && done===actions.length) return 'done';
      return 'partial';
    }
    if(!hasActivity) return 'neutral';
    if(actions.length>0 && done===actions.length) return 'done';
    if(done>0 || skipped>0 || pending>0 || hasActivity) return 'partial';
    return 'neutral';
  }

  function render(){
    const ladder=screen.querySelector('.move-page .ladder');
    if(!ladder || ladder.dataset.monthRhythm==='1')return;
    ladder.dataset.monthRhythm='1';

    const now=new Date();
    now.setHours(23,59,59,999);
    const y=now.getFullYear(),m=now.getMonth();
    const days=new Date(y,m+1,0).getDate();
    const state=load();
    const cells=[];
    for(let d=1;d<=days;d++){
      const status=statusFor(state,y,m,d,now);
      const today=d===now.getDate();
      cells.push(`<button class="month-day ${status}${today?' today':''}" data-month-day="${d}" aria-label="${d} ${monthNames[m].toLowerCase()}"><span>${d}</span></button>`);
    }

    const logs=state?.dailyLogs||{};
    let green=0,yellow=0;
    for(let d=1;d<=Math.min(days,now.getDate());d++){
      const s=statusFor(state,y,m,d,now);
      if(s==='done')green++;
      else if(s==='partial')yellow++;
    }

    ladder.classList.add('month-rhythm');
    ladder.innerHTML=`
      <div class="month-rhythm-head">
        <div><small>РИТМ МЕСЯЦА</small><h2>${monthNames[m]}</h2></div>
        <span>${green} зелёных дней</span>
      </div>
      <div class="month-grid">${cells.join('')}</div>
      <div class="month-legend">
        <span><i class="neutral"></i>Нет данных</span>
        <span><i class="partial"></i>В процессе</span>
        <span><i class="done"></i>План выполнен</span>
      </div>`;
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(render));
  observer.observe(screen,{subtree:true,childList:true});
  window.addEventListener('storage',()=>requestAnimationFrame(render));
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-view="move"]')) setTimeout(render,80);
  },true);
  render();
})();
