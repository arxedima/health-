(() => {
  "use strict";
  const app = document.getElementById("app");
  const root = document.getElementById("viewRoot");
  const desktopNav = document.getElementById("desktopNav");
  const mobileNav = document.getElementById("mobileNav");
  if (!app || !root || !desktopNav || !mobileNav) return;

  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const exercises = [
    { name:"Приседания", meta:"12 × 3", reps:12, rest:45, muscle:"Ноги · ягодицы", tips:["Колени направляйте по линии стоп","Держите корпус устойчивым","Работайте только в комфортной глубине"] },
    { name:"Отжимания", meta:"10 × 3", reps:10, rest:45, muscle:"Грудь · трицепс", tips:["Корпус держите одной линией","Локти не разводите резко","Выдох на усилии"] },
    { name:"Тяга гантели в наклоне", meta:"12 × 3", reps:12, rest:60, muscle:"Спина · бицепс", tips:["Спина нейтральная","Тяните локоть назад","Двигайтесь без рывка"] },
    { name:"Ягодичный мост", meta:"15 × 3", reps:15, rest:45, muscle:"Ягодицы · задняя цепь", tips:["Стопы устойчиво на полу","Не переразгибайте поясницу","Пауза в верхней точке"] },
    { name:"Жим гантелей вверх", meta:"10 × 3", reps:10, rest:60, muscle:"Плечи · трицепс", tips:["Не запрокидывайте голову","Рёбра не выпячивайте","Контролируйте опускание"] },
    { name:"Планка", meta:"40 сек × 3", reps:40, rest:45, muscle:"Кор · стабилизация", tips:["Таз не проваливайте","Шея продолжает линию спины","Дышите ровно"] }
  ];

  let training = { index:0, rep:0, set:1, running:true, rest:45, timerId:null, screen:"list" };
  let quickOpen = false;

  function goView(view){
    const target = desktopNav.querySelector(`[data-view="${view}"]`) || mobileNav.querySelector(`[data-view="${view}"]`);
    target?.click();
  }
  function goJournal(tab){
    goView("journal");
    setTimeout(()=>root.querySelector(`[data-journal-tab="${tab}"]`)?.click(),80);
  }
  function toast(message){
    const stack=document.getElementById("toastStack"); if(!stack)return;
    const item=document.createElement("div"); item.className="toast"; item.textContent=message; stack.appendChild(item); setTimeout(()=>item.remove(),2600);
  }

  function injectTrainingGateway(){
    const current = app.dataset.finalView || "";
    if(current!=="lfk" && !root.classList.contains("final-lfk")) return;
    const view=root.querySelector(".view"); if(!view || view.querySelector(".x2-training-gateway")) return;
    const heading=view.querySelector(".section-heading");
    const gateway=document.createElement("section"); gateway.className="x2-training-gateway";
    gateway.innerHTML=`<span class="x2-training-kicker">ТРЕНИРОВКА СЕГОДНЯ</span><h2>FULL BODY · 24 мин</h2><p>6 упражнений · средняя нагрузка · спокойный темп</p><div class="x2-training-meta"><span>Всё тело</span><span>6 упражнений</span><span>≈ 24 мин</span></div><div class="x2-training-actions"><button class="x2-start" type="button" data-x2-action="workouts">Открыть тренировку →</button><button class="x2-build" type="button" data-x2-action="builder">Собрать свою</button></div>`;
    if(heading) heading.insertAdjacentElement("afterend",gateway); else view.prepend(gateway);
  }

  function ensureTrainingLayer(){
    let layer=document.getElementById("x2TrainingLayer");
    if(layer)return layer;
    layer=document.createElement("section"); layer.id="x2TrainingLayer"; layer.className="x2-training-layer"; layer.setAttribute("aria-hidden","true");
    layer.innerHTML=`<div class="x2-training-shell"><header class="x2-training-head"><button type="button" data-x2-action="training-back" aria-label="Назад">←</button><div><h1 id="x2TrainTitle">Тренировка</h1><small id="x2TrainSub">FULL BODY</small></div><button type="button" data-x2-action="training-close" aria-label="Закрыть">×</button></header><main class="x2-training-body" id="x2TrainingBody"></main></div>`;
    document.body.appendChild(layer); return layer;
  }
  function openTraining(screen="list", index=0){
    const layer=ensureTrainingLayer(); training.screen=screen; training.index=index; training.rep=0; training.set=1; training.running=true; training.rest=exercises[index]?.rest||45;
    layer.classList.add("open"); layer.setAttribute("aria-hidden","false"); document.documentElement.classList.add("x2-training-open"); renderTraining(); navigator.vibrate?.(10);
  }
  function closeTraining(){
    stopRestTimer(); const layer=document.getElementById("x2TrainingLayer"); if(!layer)return; layer.classList.remove("open"); layer.setAttribute("aria-hidden","true"); document.documentElement.classList.remove("x2-training-open");
  }
  function setTrainingHeader(title,sub=""){
    const layer=ensureTrainingLayer(); layer.querySelector("#x2TrainTitle").textContent=title; layer.querySelector("#x2TrainSub").textContent=sub;
  }
  function renderTraining(){
    const body=ensureTrainingLayer().querySelector("#x2TrainingBody");
    if(training.screen==="list"){
      setTrainingHeader("Тренировка","Сегодня");
      body.innerHTML=`<article class="x2-workout-hero x2-card"><small>Сегодня</small><h2>FULL BODY · 24 мин</h2><p>Средняя нагрузка · 6 упражнений</p><button type="button" data-x2-action="start-workout">Начать тренировку →</button><div class="x2-figure"><i class="head"></i><i class="body"></i><i class="arm1"></i><i class="arm2"></i><i class="leg1"></i><i class="leg2"></i></div></article><div class="x2-section-title"><h3>Упражнения</h3><button type="button" data-x2-action="ai-coach">AI-тренер</button></div><section class="x2-exercise-list x2-card">${exercises.map((e,i)=>`<button class="x2-exercise-row" type="button" data-x2-exercise="${i}"><span>${i+1}</span><div><strong>${e.name}</strong><small>${e.meta}</small></div><i class="x2-pose"></i></button>`).join("")}</section><button class="x2-builder-entry" type="button" data-x2-action="builder"><span>＋</span><div><strong>Собрать тренировку</strong><small>Место, время, зона и интенсивность</small></div><b>›</b></button>`;
    } else if(training.screen==="active"){
      const e=exercises[training.index]; const pct=Math.min(100,Math.max(4,(training.rep/e.reps)*100));
      setTrainingHeader(e.name,`Подход ${training.set} / 3`);
      body.innerHTML=`<section class="x2-active-stage"><small>${e.muscle}</small><div class="x2-progress-wrap"><div class="x2-progress-ring" style="--p:${pct}"></div><div class="x2-rep-count">${String(training.rep).padStart(2,"0")} <small>/ ${e.reps}</small></div><div class="x2-active-pose"><div class="person"></div></div><button class="x2-mini-orb" type="button" data-x2-action="ai-coach" aria-label="AI-тренер"></button></div></section><article class="x2-coach-card x2-card">${e.tips.map(t=>`<p>${t}</p>`).join("")}<p>Осталось ${Math.max(0,e.reps-training.rep)} повторений</p></article><div class="x2-active-controls"><button type="button" data-x2-action="pause">${training.running?"Ⅱ":"▶"}</button><div class="x2-rest"><strong id="x2RestTime">00:${String(training.rest).padStart(2,"0")}</strong><small>ДО ОТДЫХА</small></div><button class="x2-next" type="button" data-x2-action="next-rep">+1</button></div>`;
      startRestTimer();
    } else if(training.screen==="exercise"){
      const e=exercises[training.index]; setTrainingHeader(e.name,e.muscle);
      body.innerHTML=`<article class="x2-ex-card x2-card"><div class="x2-tags"><span>${e.muscle.split(" · ")[0]}</span><span>${e.muscle.split(" · ")[1]||"Техника"}</span></div><div class="x2-ex-visual"><span class="x2-muscle-person">🏋️</span></div><h2>${e.name}</h2><div class="x2-copy-block"><h3>Как выполнять</h3><p>${e.tips.join(". ")}.</p></div><div class="x2-copy-block"><h3>Типичные ошибки</h3><ul><li>Резкие движения и потеря контроля</li><li>Слишком большая амплитуда</li><li>Задержка дыхания</li></ul></div><div class="x2-metrics"><div><small>ПОДХОДЫ</small><strong>3</strong></div><div><small>ПОВТОРЫ</small><strong>${e.reps}</strong></div><div><small>ОТДЫХ</small><strong>${e.rest} сек</strong></div></div><button class="x2-big-button" type="button" data-x2-action="start-exercise">Начать упражнение →</button></article>`;
    } else if(training.screen==="ai"){
      setTrainingHeader("AI-тренер","VECTOR");
      body.innerHTML=`<section class="x2-ai-stage"><div class="x2-ai-orb"></div><article class="x2-ai-message x2-card">Отличная работа! 🔥</article><article class="x2-ai-message x2-card">Сохраняй спокойный темп и контролируй технику.</article><div class="x2-heart"><span>♥</span> Пульс можно добавить вручную</div><article class="x2-ai-message x2-card">Если упражнение вызывает боль или необычный дискомфорт — остановись.</article><button class="x2-big-button" type="button" data-x2-action="back-active">Вернуться к тренировке</button></section>`;
    } else if(training.screen==="builder"){
      setTrainingHeader("Собрать тренировку","Умный режим");
      body.innerHTML=`<div class="x2-builder-progress"><i class="active"></i><i></i><i></i><i></i><i></i></div>${builderQuestion("Где тренируемся?",["Дом","Зал","Улица"],"place",1)}${builderQuestion("Сколько времени?",["10 мин","20 мин","30 мин","45 мин","60 мин"],"time",2,"time")}${builderQuestion("Что тренируем?",["Всё тело","Ноги","Грудь","Спина","Руки","Кор"],"body",0)}${builderQuestion("Интенсивность?",["Легко","Средне","Тяжело"],"level",1)}<button class="x2-big-button" type="button" data-x2-action="builder-done">Собрать и начать →</button>`;
    }
  }
  function builderQuestion(title,options,key,selected=0,extra=""){
    return `<section class="x2-question"><h3>${title}</h3><div class="x2-choice-row ${extra}">${options.map((o,i)=>`<button type="button" class="${i===selected?"active":""}" data-x2-choice="${key}">${o}</button>`).join("")}</div></section>`;
  }
  function startRestTimer(){
    stopRestTimer(); if(!training.running)return;
    training.timerId=setInterval(()=>{ if(!training.running)return; training.rest=Math.max(0,training.rest-1); const node=document.getElementById("x2RestTime"); if(node)node.textContent=`00:${String(training.rest).padStart(2,"0")}`; if(training.rest<=0){training.running=false;stopRestTimer();navigator.vibrate?.([20,40,20]);}},1000);
  }
  function stopRestTimer(){ if(training.timerId){clearInterval(training.timerId);training.timerId=null;} }

  function ensureQuick(){
    let layer=document.getElementById("x2QuickLayer"); if(layer)return layer;
    layer=document.createElement("section"); layer.id="x2QuickLayer"; layer.className="x2-quick-layer"; layer.setAttribute("aria-hidden","true");
    layer.innerHTML=`<button class="x2-quick-close" type="button" data-x2-action="quick-close" aria-label="Закрыть">×</button><div class="x2-quick-arc"><button class="x2-quick-item" type="button" data-x2-action="food"><b>Сфотографировать еду</b><span>📷</span></button><button class="x2-quick-item" type="button" data-x2-action="water"><b>Добавить воду</b><span>${icon("water")}</span></button><button class="x2-quick-item" type="button" data-x2-action="timer"><b>Запустить таймер</b><span>${icon("clock")}</span></button><button class="x2-quick-item" type="button" data-x2-action="reminder"><b>Напоминание</b><span>${icon("bell")}</span></button><button class="x2-quick-main" type="button" data-x2-action="quick-close" aria-label="Закрыть">＋</button></div>`;
    document.body.appendChild(layer); return layer;
  }
  function openQuick(){
    const old=document.getElementById("finalQuickLayer"); if(old){old.classList.remove("open");old.setAttribute("aria-hidden","true");}
    const layer=ensureQuick(); layer.classList.add("open"); layer.setAttribute("aria-hidden","false"); document.documentElement.classList.add("x2-quick-open"); quickOpen=true; navigator.vibrate?.(12);
  }
  function closeQuick(){const layer=document.getElementById("x2QuickLayer");if(layer){layer.classList.remove("open");layer.setAttribute("aria-hidden","true");}document.documentElement.classList.remove("x2-quick-open");quickOpen=false;}

  function decorateHome(){
    const row=[...root.querySelectorAll(".mh-timeline-row")].find(r=>r.textContent.includes("ЛФК"));
    if(row && !row.dataset.x2Workout){
      row.dataset.x2Workout="1"; const strong=row.querySelector("strong"); const small=row.querySelector("small"); const btn=row.querySelector("button"); if(strong)strong.textContent="Тренировка"; if(small)small.textContent="Всё тело · 24 мин"; if(btn){btn.removeAttribute("data-view");btn.removeAttribute("data-action");btn.dataset.x2Action="workouts";}
    }
  }

  let scheduled=false;
  function sync(){
    if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;injectTrainingGateway();decorateHome();});
  }
  new MutationObserver(sync).observe(root,{childList:true,subtree:true});
  new MutationObserver(sync).observe(desktopNav,{childList:true,subtree:true,attributes:true});

  document.addEventListener("click",event=>{
    const button=event.target.closest("button"); if(!button)return;
    if(button.matches(".final-nav-plus,[data-final-action='quick']")){
      event.preventDefault();event.stopImmediatePropagation();openQuick();return;
    }
  },true);

  document.addEventListener("click",event=>{
    const button=event.target.closest("button"); if(!button)return;
    const action=button.dataset.x2Action;
    if(button.dataset.x2Exercise!==undefined){training.index=Number(button.dataset.x2Exercise)||0;training.screen="exercise";renderTraining();return;}
    if(button.dataset.x2Choice){const group=button.parentElement;group?.querySelectorAll("button").forEach(b=>b.classList.remove("active"));button.classList.add("active");return;}
    if(!action)return;
    if(action==="workouts"){openTraining("list");return;}
    if(action==="builder"){openTraining("builder");return;}
    if(action==="training-close"){closeTraining();return;}
    if(action==="training-back"){
      if(training.screen==="list")closeTraining(); else {stopRestTimer();training.screen="list";renderTraining();}return;
    }
    if(action==="start-workout"){training.index=0;training.screen="active";training.rep=0;training.rest=exercises[0].rest;renderTraining();return;}
    if(action==="start-exercise"){training.screen="active";training.rep=0;training.rest=exercises[training.index].rest;renderTraining();return;}
    if(action==="next-rep"){
      const e=exercises[training.index]; training.rep+=1; navigator.vibrate?.(8);
      if(training.rep>=e.reps){training.rep=e.reps;toast("Подход завершён ✓"); if(training.set<3){training.set+=1;setTimeout(()=>{training.rep=0;training.rest=e.rest;renderTraining();},450);} else if(training.index<exercises.length-1){setTimeout(()=>{training.index+=1;training.set=1;training.rep=0;training.rest=exercises[training.index].rest;renderTraining();},500);} }
      renderTraining();return;
    }
    if(action==="pause"){training.running=!training.running;if(training.running)startRestTimer();else stopRestTimer();renderTraining();return;}
    if(action==="ai-coach"){stopRestTimer();training.screen="ai";renderTraining();return;}
    if(action==="back-active"){training.screen="active";renderTraining();return;}
    if(action==="builder-done"){training.index=0;training.screen="active";training.rep=0;training.rest=45;renderTraining();toast("Тренировка собрана");return;}
    if(action==="quick-close"){closeQuick();return;}
    if(action==="food"){closeQuick();document.getElementById("hp-ai-open")?.click();return;}
    if(action==="water"){closeQuick();goJournal("today");setTimeout(()=>document.getElementById("journalWater")?.focus(),180);return;}
    if(action==="timer"){closeQuick();goView("timer");return;}
    if(action==="reminder"){closeQuick();goJournal("reminders");return;}
  });

  document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(quickOpen)closeQuick();else if(document.getElementById("x2TrainingLayer")?.classList.contains("open"))closeTraining();});
  sync();
})();
