(() => {
  'use strict';
  const screen=document.getElementById('screen'), nav=document.getElementById('bottomNav'), overlay=document.getElementById('overlay'), toastHost=document.getElementById('toastHost');
  if(!screen||!nav) return;
  const extras=[
    {id:'movement',label:'Движение',icon:'⌁'},
    {id:'walk',label:'Прогулка',icon:'🚶'},
    {id:'breathe',label:'Дыхание',icon:'◌'},
    {id:'focus',label:'Фокус',icon:'◎'},
    {id:'route',label:'Маршрут',icon:'↝'},
    {id:'analytics',label:'Данные',icon:'▥'}
  ];
  let timerId=null, endAt=0, lastCustomAt=0;
  function toast(text){if(!toastHost)return;const n=document.createElement('div');n.className='toast show';n.textContent=text;toastHost.appendChild(n);setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),250)},1900)}
  function enhance(){document.querySelectorAll('.radial-menu').forEach(menu=>{if(menu.dataset.quickV2==='1')return;menu.dataset.quickV2='1';extras.forEach((x,i)=>{const b=document.createElement('button');b.type='button';b.className='radial-extra';b.dataset.quick=x.id;b.dataset.quickExtra=x.id;b.style.setProperty('--angle',`${i*60+30}deg`);b.style.setProperty('--counter',`${-(i*60+30)}deg`);b.innerHTML=`<span>${x.icon}</span><small>${x.label}</small>`;menu.appendChild(b)})})}
  function closeRadial(){document.querySelectorAll('.radial-open').forEach(n=>n.classList.remove('radial-open'));document.querySelectorAll('.radial-menu .hover').forEach(n=>n.classList.remove('hover'))}
  function go(view){closeRadial();nav.querySelector(`[data-view="${view}"]`)?.click()}
  function ensureUtility(){let layer=document.getElementById('vectorUtility');if(layer)return layer;layer=document.createElement('div');layer.id='vectorUtility';layer.className='vector-utility';layer.innerHTML='<button class="vu-backdrop" data-vu-close aria-label="Закрыть"></button><section class="vu-card"><button class="vu-close" data-vu-close>×</button><div id="vuBody"></div></section>';document.body.appendChild(layer);layer.addEventListener('click',e=>{if(e.target.closest('[data-vu-close]'))closeUtility()});return layer}
  function openUtility(html,kind=''){const layer=ensureUtility();layer.className=`vector-utility open ${kind}`;layer.querySelector('#vuBody').innerHTML=html;requestAnimationFrame(()=>layer.classList.add('shown'))}
  function closeUtility(){clearInterval(timerId);timerId=null;const layer=document.getElementById('vectorUtility');if(!layer)return;layer.classList.remove('shown');setTimeout(()=>layer.className='vector-utility',220)}
  function startMiniTimer(title,seconds,subtitle){endAt=Date.now()+seconds*1000;openUtility(`<small class="vu-kicker">VECTOR QUICK</small><h2>${title}</h2><p>${subtitle}</p><div class="vu-timer" id="vuTimer">${fmt(seconds)}</div><button class="vu-primary" data-vu-done>Завершить</button>`,'timer-mode');const layer=document.getElementById('vectorUtility');layer.querySelector('[data-vu-done]').onclick=()=>{closeUtility();toast(`${title}: готово ✓`)};timerId=setInterval(()=>{const left=Math.max(0,Math.ceil((endAt-Date.now())/1000));const el=document.getElementById('vuTimer');if(el)el.textContent=fmt(left);if(left<=0){clearInterval(timerId);timerId=null;toast(`${title}: готово ✓`);setTimeout(closeUtility,600)}},500)}
  function fmt(sec){const m=Math.floor(sec/60),s=sec%60;return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  function startBreathing(){openUtility('<small class="vu-kicker">ТИХАЯ ПОМОЩЬ</small><h2>Одна минута дыхания</h2><p id="vuBreathText">Спокойный вдох</p><div class="vu-breathe"><i></i></div><button class="vu-primary" data-vu-done>Готово</button>','breathe-mode');const layer=document.getElementById('vectorUtility'),text=layer.querySelector('#vuBreathText');let inhale=true;const switchPhase=()=>{inhale=!inhale;text.textContent=inhale?'Спокойный вдох':'Длинный выдох';layer.classList.toggle('exhale',!inhale)};timerId=setInterval(switchPhase,5000);layer.querySelector('[data-vu-done]').onclick=()=>{closeUtility();toast('Стало чуть тише ◌')}}
  function trigger(id){lastCustomAt=Date.now();closeRadial();navigator.vibrate?.(8);if(id==='movement')return go('move');if(id==='walk')return startMiniTimer('Прогулка · 7 минут',420,'Минимальная доза движения. Не нужно идти быстро.');if(id==='breathe')return startBreathing();if(id==='focus')return startMiniTimer('Фокус · 10 минут',600,'Одна задача. Уведомления могут подождать.');if(id==='route')return go('route');if(id==='analytics')return go('me')}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-quick-extra]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();trigger(b.dataset.quickExtra)},true);
  document.addEventListener('pointerup',e=>{const b=document.querySelector('.radial-open .radial-extra.hover');if(!b)return;e.preventDefault();e.stopImmediatePropagation();trigger(b.dataset.quickExtra)},true);
  document.addEventListener('click',e=>{if(Date.now()-lastCustomAt<350&&e.target.closest('[data-sphere]')){e.preventDefault();e.stopImmediatePropagation()}},true);
  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(screen,{childList:true,subtree:true});enhance();
})();
