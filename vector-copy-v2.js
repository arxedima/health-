(()=>{
  const STORAGE='vector-health-v1';
  const app=document.getElementById('app');
  const screen=document.getElementById('screen');
  if(!app||!screen)return;

  const GOALS=[
    ['nutrition','Питание','Рацион и полезные привычки'],
    ['sport','Спорт','Тренировки и больше движения'],
    ['recovery','Восстановление','Сон, отдых и снижение нагрузки'],
    ['muscle','Набор мышечной массы','Питание и силовые тренировки'],
    ['lfk','ЛФК','Мягкая и бережная нагрузка'],
    ['balanced','Всё вместе','Сбалансированный общий фокус']
  ];
  const TONES=[
    ['calm','Спокойно','Мягко и без давления'],
    ['brief','Кратко','Только главное, без лишнего'],
    ['motivate','Мотивирующе','Больше энергии и поддержки']
  ];
  const GOAL_LABEL=Object.fromEntries(GOALS.map(([k,l])=>[k,l]));
  const LEGACY={move:'sport',recover:'recovery'};
  let pendingGoal=null;
  let pendingTone=null;

  function load(){
    try{return JSON.parse(localStorage.getItem(STORAGE)||'null')||{}}catch{return{}}
  }
  function save(s){try{localStorage.setItem(STORAGE,JSON.stringify(s))}catch{}}
  function migrate(){
    const s=load();
    const g=s?.profile?.goal;
    if(g&&LEGACY[g]){
      s.profile={...(s.profile||{}),goal:LEGACY[g]};
      if(s.healthGoal===g)s.healthGoal=LEGACY[g];
      save(s);
    }
  }
  migrate();

  document.addEventListener('pointerdown',e=>{
    const g=e.target.closest?.('[data-ob-goal]');
    if(g)pendingGoal=LEGACY[g.dataset.obGoal]||g.dataset.obGoal;
    const t=e.target.closest?.('[data-ob-tone]');
    if(t)pendingTone=t.dataset.obTone;
  },true);

  function goalButtons(selected){
    selected=LEGACY[selected]||selected||'balanced';
    return GOALS.map(([k,label,desc])=>`<button data-ob-goal="${k}" class="${selected===k?'selected':''}"><b>${label}</b><small>${desc}</small></button>`).join('');
  }
  function toneButtons(selected){
    selected=selected||'calm';
    return TONES.map(([k,label,desc])=>`<button data-ob-tone="${k}" class="${selected===k?'selected':''}"><b>${label}</b><small>${desc}</small></button>`).join('');
  }

  function patchOnboarding(){
    if(!app.classList.contains('onboarding-mode'))return;
    const card=screen.querySelector('.ob-card');
    if(!card||card.dataset.copyV2)return;
    card.dataset.copyV2='1';

    if(card.querySelector('#obName')){
      const small=card.querySelector(':scope>small'),h=card.querySelector('h1'),p=card.querySelector('p');
      if(small)small.textContent='ЗНАКОМСТВО';
      if(h)h.textContent='Давай настроим VECTOR под тебя.';
      if(p)p.textContent='Для начала — как тебя зовут?';
      const input=card.querySelector('#obName');
      if(input)input.placeholder='Твоё имя';
      return;
    }

    if(card.querySelector('#obHeight')){
      const small=card.querySelector(':scope>small'),h=card.querySelector('h1'),p=card.querySelector('p');
      if(small)small.textContent='ОСНОВА';
      if(h)h.textContent='Немного о тебе.';
      if(p)p.textContent='Рост и вес помогут точнее вести профиль. Эти данные можно изменить позже.';
      return;
    }

    if(card.querySelector('[data-ob-goal]')){
      const oldSelected=pendingGoal||LEGACY[card.querySelector('[data-ob-goal].selected')?.dataset.obGoal]||card.querySelector('[data-ob-goal].selected')?.dataset.obGoal||LEGACY[load()?.profile?.goal]||load()?.profile?.goal||'balanced';
      card.innerHTML=`<small>ГЛАВНАЯ ЦЕЛЬ</small><h1>На чём сделать основной фокус?</h1><p>Выбери направление, которое сейчас для тебя важнее всего.</p><div class="ob-options ob-goals-v2">${goalButtons(oldSelected)}</div>`;
      return;
    }

    if(card.querySelector('[data-ob-tone]')){
      const selected=pendingTone||card.querySelector('[data-ob-tone].selected')?.dataset.obTone||load()?.profile?.tone||'calm';
      card.innerHTML=`<small>СТИЛЬ ПОДДЕРЖКИ</small><h1>Какой стиль поддержки тебе подходит?</h1><p>Выбери, как VECTOR будет формулировать подсказки.</p><div class="ob-options ob-tones-v2">${toneButtons(selected)}</div>`;
      return;
    }

    if(card.querySelector('.ob-formula')){
      const s=load();
      const goal=GOAL_LABEL[LEGACY[s?.profile?.goal]||s?.profile?.goal]||'Всё вместе';
      card.innerHTML=`<small>VECTOR LOOP</small><h1>Настройка готова.</h1><p>Фокус: <b>${goal}</b>. VECTOR будет вести тебя через один понятный следующий шаг — без перегруза и чувства вины.</p><div class="ob-formula"><b>STATE</b><span>→</span><b>ACTION</b><span>→</span><b>LEARN</b><span>→</span><b>ADAPT</b></div>`;
    }
  }

  function patchMainCopy(){
    const now=screen.querySelector('.now-page');
    if(now&&!now.dataset.copyV2){
      now.dataset.copyV2='1';
      const h=now.querySelector('.now-copy h1');
      const p=now.querySelector('.now-copy p');
      const hour=new Date().getHours();
      let title='Сейчас.',sub='Покажу только то, что действительно стоит сделать.';
      if(hour>=5&&hour<11){title='Доброе утро.';sub='Начнём с одного полезного шага.'}
      else if(hour>=17&&hour<22){title='Пора снизить темп.';sub='Оставим только то, что поможет завершить день спокойно.'}
      else if(hour>=22||hour<5){title='Всё нормально.';sub='На сегодня достаточно. Остальное — завтра.'}
      if(h)h.textContent=title;
      if(p)p.textContent=sub;
      const actionLabel=now.querySelector('.one-action>small');
      if(actionLabel)actionLabel.textContent='СЕЙЧАС ВАЖНО';
      const hold=now.querySelector('.hold-note');
      if(hold)hold.textContent='Удерживай карточку: сделать или пропустить';
      const silence=now.querySelector('.silence-note');
      if(silence)silence.textContent='Если сейчас ничего полезного не нужно — VECTOR просто молчит.';
    }

    const food=screen.querySelector('.food-page');
    if(food&&!food.dataset.copyV2){
      food.dataset.copyV2='1';
      const p=food.querySelector('.page-title p');
      if(p&&!food.querySelector('.food-result'))p.textContent='Сначала — короткий вывод. Калории и БЖУ можно открыть ниже.';
      const day=food.querySelector('.food-day h2');
      if(day)day.textContent='Сегодняшнее питание';
      const empty=food.querySelector('.food-day .empty');
      if(empty)empty.textContent='Пока записей нет.';
    }

    const me=screen.querySelector('.me-page');
    if(me&&!me.dataset.copyV2){
      me.dataset.copyV2='1';
      const s=load();
      const p=s.profile||{};
      const goal=GOAL_LABEL[LEGACY[p.goal]||p.goal]||'Всё вместе';
      const profile=me.querySelector('.profile-card span');
      if(profile)profile.textContent=`${p.height||175} см · ${p.weight||70} кг · ${goal}`;
      const title=me.querySelector('.page-title p');
      if(title)title.textContent='Не серия и не баллы. Главное — насколько легко продолжить завтра.';
    }
  }

  function patch(){
    patchOnboarding();
    patchMainCopy();
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(patch));
  observer.observe(app,{subtree:true,childList:true});
  patch();
})();
