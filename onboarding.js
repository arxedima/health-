(() => {
  "use strict";
  const STORAGE_KEY = "vector-health-v1";
  const ONBOARDING_KEY = "healthplus-onboarding-v1";
  const app = document.getElementById("app");
  const root = document.getElementById("viewRoot");
  if (!app || !root) return;

  let step = 0;
  let data = { name:"", height:"", weight:"", goal:"balanced" };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const readState = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch { return {}; } };
  const saveState = state => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  function greeting(){
    const h = new Date().getHours();
    return h>=5&&h<11?"Доброе утро":h>=11&&h<17?"Добрый день":h>=17&&h<22?"Добрый вечер":"Спокойной ночи";
  }

  function applyBranding(){
    document.title = "Health+ / VECTOR";
    document.querySelectorAll(".brand").forEach(brand => {
      brand.classList.add("health-brand");
      const strong = brand.querySelector("strong");
      const small = brand.querySelector("small");
      if (strong) strong.textContent = "Health+ / VECTOR";
      if (small) small.textContent = "";
    });
    const state = readState();
    if (state.profileName) {
      const heading = root.querySelector(".mh-intro h1");
      if (heading) heading.textContent = `${greeting()}, ${state.profileName} 👋`;
    }
    decorateProfile();
  }

  function decorateProfile(){
    if (app.dataset.finalView !== "profile") return;
    const view = root.querySelector(".view");
    if (!view || view.querySelector(".hp-profile-card")) return;
    const state = readState();
    const name = state.profileName || "Профиль не заполнен";
    const height = Number(state.calculator?.height) || 0;
    const weight = Number(state.calculator?.weight) || 0;
    const goals = {move:"Движение",nutrition:"Питание",recover:"Восстановление",balanced:"Всё вместе"};
    const card = document.createElement("section");
    card.className = "hp-profile-card";
    card.innerHTML = `<span>✦</span><div><strong>${esc(name)}</strong><small>${height?`${height} см`:"Рост —"} · ${weight?`${weight} кг`:"Вес —"} · ${goals[state.healthGoal]||"Health+ / VECTOR"}</small></div><button type="button" data-hp-onboarding="restart">Изменить</button>`;
    const hub = view.querySelector(".final-me-hub");
    if (hub) hub.insertAdjacentElement("afterend", card); else view.prepend(card);
  }

  function ensureLayer(){
    let layer = document.getElementById("hpOnboarding");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.id = "hpOnboarding";
    layer.className = "hp-onboard";
    layer.setAttribute("aria-hidden","true");
    layer.innerHTML = `<div class="hp-ob-shell">
      <div class="hp-ob-top"><div class="hp-ob-brand">Health+ <b>/ VECTOR</b></div><button class="hp-ob-skip" type="button" data-hp-onboarding="skip">Пропустить</button></div>
      <div class="hp-ob-progress"><i></i><i></i><i></i><i></i></div>
      <main class="hp-ob-conversation"><div class="hp-ob-orb-wrap"><div class="hp-ob-orb"><i class="hp-ob-eye left"></i><i class="hp-ob-eye right"></i><i class="hp-ob-smile"></i></div></div><div id="hpObBubble" class="hp-ob-bubble"></div><div id="hpObStage" class="hp-ob-stage"></div></main>
      <div class="hp-ob-actions"><button id="hpObNext" class="hp-ob-next" type="button" data-hp-onboarding="next">Продолжить</button><button id="hpObBack" class="hp-ob-back" type="button" data-hp-onboarding="back">Назад</button></div>
    </div>`;
    document.body.appendChild(layer);
    return layer;
  }

  function validMeasures(){
    const h=Number(data.height), w=Number(data.weight);
    return h>=80&&h<=230&&w>=25&&w<=300;
  }

  function render(){
    const layer=ensureLayer(), bubble=layer.querySelector("#hpObBubble"), stage=layer.querySelector("#hpObStage"), next=layer.querySelector("#hpObNext"), back=layer.querySelector("#hpObBack");
    layer.querySelectorAll(".hp-ob-progress i").forEach((n,i)=>n.classList.toggle("done",i<=step));
    back.style.visibility=step===0?"hidden":"visible";
    if(step===0){
      bubble.innerHTML=`<small>ЗНАКОМСТВО</small><h1>Привет! Я Health+ / VECTOR.</h1><p>Как тебя зовут? Я настрою приложение под тебя и буду обращаться по имени.</p>`;
      stage.innerHTML=`<label class="hp-ob-label" for="hpObName">Твоё имя</label><input id="hpObName" class="hp-ob-input" maxlength="24" autocomplete="given-name" placeholder="Например, Дмитрий" value="${esc(data.name)}">`;
      next.textContent="Продолжить"; next.disabled=data.name.trim().length<2;
      setTimeout(()=>stage.querySelector("input")?.focus(),60);
    } else if(step===1){
      bubble.innerHTML=`<small>ПАРА ПАРАМЕТРОВ</small><h1>Рад знакомству, ${esc(data.name)}.</h1><p>Рост и вес сохранятся в профиле и будут использоваться в калькуляторах Health+.</p>`;
      stage.innerHTML=`<div class="hp-ob-measures"><div class="hp-ob-measure"><label class="hp-ob-label" for="hpObHeight">Рост</label><input id="hpObHeight" class="hp-ob-input" type="number" inputmode="numeric" min="80" max="230" placeholder="175" value="${esc(data.height)}"><em>см</em></div><div class="hp-ob-measure"><label class="hp-ob-label" for="hpObWeight">Вес</label><input id="hpObWeight" class="hp-ob-input" type="number" inputmode="decimal" min="25" max="300" step="0.1" placeholder="70" value="${esc(data.weight)}"><em>кг</em></div></div>`;
      next.textContent="Продолжить"; next.disabled=!validMeasures();
    } else if(step===2){
      bubble.innerHTML=`<small>ТВОЙ ФОКУС</small><h1>Что сейчас важнее?</h1><p>Это поможет выбирать главную задачу дня. Всё можно изменить позже.</p>`;
      const goals=[["move","🏃","Движение","ЛФК и тренировки"],["nutrition","🥗","Питание","Еда и дневник"],["recover","🌙","Восстановление","Сон и спокойный ритм"],["balanced","✦","Всё вместе","Сбалансированный режим"]];
      stage.innerHTML=`<div class="hp-ob-goals">${goals.map(([k,e,t,s])=>`<button type="button" class="hp-ob-goal ${data.goal===k?"selected":""}" data-hp-goal="${k}"><span>${e}</span><strong>${t}</strong><small>${s}</small></button>`).join("")}</div>`;
      next.textContent="Продолжить"; next.disabled=false;
    } else {
      const goals={move:"Движение",nutrition:"Питание",recover:"Восстановление",balanced:"Всё вместе"};
      bubble.innerHTML=`<small>ГОТОВО</small><h1>${esc(data.name)}, всё настроено ✨</h1><p>Данные сохранены. Теперь Health+ / VECTOR может персонализировать твой день.</p>`;
      stage.innerHTML=`<div class="hp-ob-summary"><div><small>Имя</small><strong>${esc(data.name)}</strong></div><div><small>Рост / вес</small><strong>${esc(data.height)} см · ${esc(data.weight)} кг</strong></div><div><small>Фокус</small><strong>${goals[data.goal]}</strong></div></div>`;
      next.textContent="Открыть мой день"; next.disabled=false;
    }
  }

  function open(restart=false){
    const state=readState();
    data=restart?{name:state.profileName||"",height:state.calculator?.height||"",weight:state.calculator?.weight||"",goal:state.healthGoal||"balanced"}:{name:"",height:"",weight:"",goal:"balanced"};
    step=0;
    const layer=ensureLayer();
    layer.classList.add("open");
    layer.setAttribute("aria-hidden","false");
    document.documentElement.classList.remove("hp-first-run-pending");
    document.documentElement.classList.add("hp-onboarding-open");
    render();
  }

  function close(){
    const layer=ensureLayer();
    layer.classList.remove("open"); layer.setAttribute("aria-hidden","true");
    document.documentElement.classList.remove("hp-onboarding-open","hp-first-run-pending");
    applyBranding();
  }

  function finish(){
    const state=readState();
    state.profileName=data.name.trim(); state.healthGoal=data.goal; state.onboardingCompleted=true;
    state.calculator={...(state.calculator||{}),height:Number(data.height),weight:Number(data.weight)};
    saveState(state); localStorage.setItem(ONBOARDING_KEY,"done"); close();
    window.dispatchEvent(new CustomEvent("healthplus:onboarding-complete",{detail:{...data}}));
  }

  document.addEventListener("input",event=>{
    if(event.target.id==="hpObName"){data.name=event.target.value;ensureLayer().querySelector("#hpObNext").disabled=data.name.trim().length<2;}
    if(event.target.id==="hpObHeight"){data.height=event.target.value;ensureLayer().querySelector("#hpObNext").disabled=!validMeasures();}
    if(event.target.id==="hpObWeight"){data.weight=event.target.value;ensureLayer().querySelector("#hpObNext").disabled=!validMeasures();}
  });
  document.addEventListener("click",event=>{
    const goal=event.target.closest("[data-hp-goal]");
    if(goal){data.goal=goal.dataset.hpGoal;ensureLayer().querySelectorAll("[data-hp-goal]").forEach(n=>n.classList.toggle("selected",n===goal));navigator.vibrate?.(8);return;}
    const action=event.target.closest("[data-hp-onboarding]")?.dataset.hpOnboarding;
    if(!action)return;
    if(action==="restart"){open(true);return;}
    if(action==="skip"){const state=readState();state.onboardingCompleted=true;saveState(state);localStorage.setItem(ONBOARDING_KEY,"skipped");close();return;}
    if(action==="back"){if(step>0){step--;render();}return;}
    if(action==="next"){
      if(step===0&&data.name.trim().length<2)return;
      if(step===1&&!validMeasures())return;
      if(step<3){step++;render();navigator.vibrate?.(7);}else finish();
    }
  });

  const observer=new MutationObserver(()=>requestAnimationFrame(applyBranding));
  observer.observe(root,{childList:true,subtree:true});
  applyBranding();
  window.HealthPlusOnboarding={open:()=>open(true)};

  /* No delay: first-run conversation owns the first visible frame. */
  if(!localStorage.getItem(ONBOARDING_KEY)) open(false);
  else document.documentElement.classList.remove("hp-first-run-pending");
})();
