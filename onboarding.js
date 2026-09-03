(() => {
  "use strict";
  const STORAGE_KEY = "vector-health-v1";
  const ONBOARDING_KEY = "healthplus-onboarding-v1";
  const root = document.getElementById("viewRoot");
  const app = document.getElementById("app");
  if (!app || !root) return;

  let step = 0;
  let data = { name: "", height: "", weight: "", goal: "balanced" };
  let scheduledBranding = false;

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; }
    catch { return {}; }
  };
  const saveState = state => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);

  function periodGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Доброе утро";
    if (hour >= 11 && hour < 17) return "Добрый день";
    if (hour >= 17 && hour < 22) return "Добрый вечер";
    return "Спокойной ночи";
  }

  function applyBranding() {
    const brand = document.querySelector(".brand");
    if (brand) {
      const strong = brand.querySelector("strong");
      const small = brand.querySelector("small");
      if (strong) strong.textContent = "Health+";
      if (small) small.textContent = "/ VECTOR";
    }
    document.querySelectorAll(".mh-brand").forEach(node => {
      const strong = node.querySelector("strong");
      const small = node.querySelector("small");
      if (strong) strong.textContent = "Health+";
      if (small) small.textContent = "/ VECTOR";
    });
    document.querySelectorAll("button, h1, h2, h3, strong, span, small, p").forEach(node => {
      const text = node.childNodes.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE ? node.textContent.trim() : "";
      if (text === "Спросить VECTOR") node.textContent = "Спросить Health+";
      if (text === "VECTOR — твой персональный AI-тренер") node.textContent = "Health+ / VECTOR — твой персональный AI-тренер";
    });
    document.title = "Health+ / VECTOR";
    applyPersonalGreeting();
    decorateProfile();
  }

  function applyPersonalGreeting() {
    const state = readState();
    const name = state.profileName;
    if (!name) return;
    const heading = root.querySelector(".mh-intro h1");
    if (heading) heading.textContent = `${periodGreeting()}, ${name} 👋`;
  }

  function decorateProfile() {
    const view = root.querySelector(".final-profile .view, .final-profile.view, .view");
    if (!view || app.dataset.finalView !== "profile") return;
    if (view.querySelector(".hp-profile-card")) return;
    const state = readState();
    const name = state.profileName || "Профиль не заполнен";
    const height = Number(state.calculator?.height) || 0;
    const weight = Number(state.calculator?.weight) || 0;
    const goalLabels = { move: "Движение", nutrition: "Питание", recover: "Восстановление", balanced: "Всё вместе" };
    const card = document.createElement("section");
    card.className = "hp-profile-card";
    card.innerHTML = `<span>✦</span><div><strong>${esc(name)}</strong><small>${height ? `${height} см` : "Рост —"} · ${weight ? `${weight} кг` : "Вес —"} · ${goalLabels[state.healthGoal] || "Health+ / VECTOR"}</small></div><button type="button" data-hp-onboarding="restart">Изменить</button>`;
    const hub = view.querySelector(".final-me-hub");
    if (hub) hub.insertAdjacentElement("afterend", card); else view.prepend(card);
  }

  function scheduleBranding() {
    if (scheduledBranding) return;
    scheduledBranding = true;
    requestAnimationFrame(() => {
      scheduledBranding = false;
      applyBranding();
    });
  }

  function ensureOnboarding() {
    let layer = document.getElementById("hpOnboarding");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.id = "hpOnboarding";
    layer.className = "hp-onboard";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = `<div class="hp-ob-shell">
      <div class="hp-ob-top"><div class="hp-ob-brand">Health+ <b>/ VECTOR</b></div><button class="hp-ob-skip" type="button" data-hp-onboarding="skip">Пропустить</button></div>
      <div class="hp-ob-progress"><i></i><i></i><i></i><i></i></div>
      <main class="hp-ob-conversation"><div class="hp-ob-orb-wrap"><div class="hp-ob-orb"><i class="hp-ob-eye left"></i><i class="hp-ob-eye right"></i><i class="hp-ob-smile"></i></div></div><div id="hpObBubble" class="hp-ob-bubble"></div><div id="hpObStage" class="hp-ob-stage"></div></main>
      <div class="hp-ob-actions"><button id="hpObNext" class="hp-ob-next" type="button" data-hp-onboarding="next">Продолжить</button><button id="hpObBack" class="hp-ob-back" type="button" data-hp-onboarding="back">Назад</button></div>
    </div>`;
    document.body.appendChild(layer);
    return layer;
  }

  function render() {
    const layer = ensureOnboarding();
    const bubble = layer.querySelector("#hpObBubble");
    const stage = layer.querySelector("#hpObStage");
    const next = layer.querySelector("#hpObNext");
    const back = layer.querySelector("#hpObBack");
    layer.querySelectorAll(".hp-ob-progress i").forEach((node, index) => node.classList.toggle("done", index <= step));
    back.style.visibility = step === 0 ? "hidden" : "visible";

    if (step === 0) {
      bubble.innerHTML = `<small>ЗНАКОМСТВО</small><h1>Привет! Я Health+ / VECTOR.</h1><p>Как тебя зовут? Я буду обращаться к тебе по имени и делать интерфейс чуть более личным.</p>`;
      stage.innerHTML = `<label class="hp-ob-label" for="hpObName">Твоё имя</label><input id="hpObName" class="hp-ob-input" maxlength="24" autocomplete="given-name" placeholder="Например, Дмитрий" value="${esc(data.name)}">`;
      next.textContent = "Продолжить";
      next.disabled = data.name.trim().length < 2;
      setTimeout(() => stage.querySelector("input")?.focus(), 80);
    } else if (step === 1) {
      bubble.innerHTML = `<small>ПАРА ПАРАМЕТРОВ</small><h1>Рад знакомству, ${esc(data.name)}.</h1><p>Рост и вес помогут сохранить твои базовые параметры в профиле и использовать их в калькуляторах приложения.</p>`;
      stage.innerHTML = `<div class="hp-ob-measures"><div class="hp-ob-measure"><label class="hp-ob-label" for="hpObHeight">Рост</label><input id="hpObHeight" class="hp-ob-input" type="number" inputmode="numeric" min="80" max="230" placeholder="175" value="${esc(data.height)}"><em>см</em></div><div class="hp-ob-measure"><label class="hp-ob-label" for="hpObWeight">Вес</label><input id="hpObWeight" class="hp-ob-input" type="number" inputmode="decimal" min="25" max="300" step="0.1" placeholder="70" value="${esc(data.weight)}"><em>кг</em></div></div>`;
      next.textContent = "Продолжить";
      validateMeasures();
    } else if (step === 2) {
      bubble.innerHTML = `<small>ТВОЙ ФОКУС</small><h1>Что сейчас важнее?</h1><p>Это не жёсткая цель — просто подскажет Health+ / VECTOR, что чаще ставить на главный экран.</p>`;
      const goals = [
        ["move","🏃","Больше двигаться","ЛФК и тренировки"],
        ["nutrition","🥗","Следить за питанием","Еда и дневник"],
        ["recover","🌙","Восстанавливаться","Сон и спокойный ритм"],
        ["balanced","✦","Всё вместе","Сбалансированный режим"]
      ];
      stage.innerHTML = `<div class="hp-ob-goals">${goals.map(([key,emoji,title,sub]) => `<button type="button" class="hp-ob-goal ${data.goal===key?"selected":""}" data-hp-goal="${key}"><span>${emoji}</span><strong>${title}</strong><small>${sub}</small></button>`).join("")}</div>`;
      next.textContent = "Продолжить";
      next.disabled = false;
    } else {
      const goalLabels = { move: "Движение", nutrition: "Питание", recover: "Восстановление", balanced: "Всё вместе" };
      bubble.innerHTML = `<small>ГОТОВО</small><h1>${esc(data.name)}, всё настроено ✨</h1><p>Я запомнил основные данные. Позже их всегда можно изменить в разделе «Я».</p>`;
      stage.innerHTML = `<div class="hp-ob-summary"><div><small>Имя</small><strong>${esc(data.name)}</strong></div><div><small>Рост / вес</small><strong>${esc(data.height)} см · ${esc(data.weight)} кг</strong></div><div><small>Фокус</small><strong>${goalLabels[data.goal]}</strong></div></div>`;
      next.textContent = "Открыть мой день";
      next.disabled = false;
      layer.querySelector(".hp-ob-orb-wrap").classList.add("happy");
      setTimeout(() => layer.querySelector(".hp-ob-orb-wrap")?.classList.remove("happy"), 800);
    }
  }

  function validateMeasures() {
    const layer = ensureOnboarding();
    const h = Number(data.height);
    const w = Number(data.weight);
    layer.querySelector("#hpObNext").disabled = !(h >= 80 && h <= 230 && w >= 25 && w <= 300);
  }

  function open(restart = false) {
    const state = readState();
    if (restart) {
      data = {
        name: state.profileName || "",
        height: state.calculator?.height || "",
        weight: state.calculator?.weight || "",
        goal: state.healthGoal || "balanced"
      };
    } else {
      data = { name: "", height: "", weight: "", goal: "balanced" };
    }
    step = 0;
    const layer = ensureOnboarding();
    layer.classList.add("open");
    layer.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    render();
  }

  function close() {
    const layer = ensureOnboarding();
    layer.classList.remove("open");
    layer.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    scheduleBranding();
  }

  function finish() {
    const state = readState();
    state.profileName = data.name.trim();
    state.healthGoal = data.goal;
    state.onboardingCompleted = true;
    state.calculator = { ...(state.calculator || {}), height: Number(data.height), weight: Number(data.weight) };
    saveState(state);
    localStorage.setItem(ONBOARDING_KEY, "done");
    close();
    window.dispatchEvent(new CustomEvent("healthplus:onboarding-complete", { detail: { ...data } }));
    setTimeout(() => scheduleBranding(), 100);
  }

  document.addEventListener("input", event => {
    if (event.target.id === "hpObName") {
      data.name = event.target.value;
      ensureOnboarding().querySelector("#hpObNext").disabled = data.name.trim().length < 2;
      ensureOnboarding().querySelector(".hp-ob-orb-wrap").classList.add("react");
      clearTimeout(event.target._hpTimer);
      event.target._hpTimer = setTimeout(() => ensureOnboarding().querySelector(".hp-ob-orb-wrap")?.classList.remove("react"), 220);
    }
    if (event.target.id === "hpObHeight") { data.height = event.target.value; validateMeasures(); }
    if (event.target.id === "hpObWeight") { data.weight = event.target.value; validateMeasures(); }
  });

  document.addEventListener("click", event => {
    const goal = event.target.closest("[data-hp-goal]");
    if (goal) {
      data.goal = goal.dataset.hpGoal;
      ensureOnboarding().querySelectorAll("[data-hp-goal]").forEach(node => node.classList.toggle("selected", node === goal));
      ensureOnboarding().querySelector(".hp-ob-orb-wrap").classList.add("happy");
      setTimeout(() => ensureOnboarding().querySelector(".hp-ob-orb-wrap")?.classList.remove("happy"), 720);
      navigator.vibrate?.(10);
      return;
    }
    const action = event.target.closest("[data-hp-onboarding]")?.dataset.hpOnboarding;
    if (!action) return;
    if (action === "restart") { open(true); return; }
    if (action === "skip") {
      const state = readState();
      state.onboardingCompleted = true;
      saveState(state);
      localStorage.setItem(ONBOARDING_KEY, "skipped");
      close();
      return;
    }
    if (action === "back") { if (step > 0) { step -= 1; render(); } return; }
    if (action === "next") {
      if (step === 0 && data.name.trim().length < 2) return;
      if (step === 1) { const h=Number(data.height),w=Number(data.weight); if (!(h>=80&&h<=230&&w>=25&&w<=300)) return; }
      if (step < 3) { step += 1; render(); navigator.vibrate?.(8); }
      else finish();
    }
  });

  const observer = new MutationObserver(scheduleBranding);
  observer.observe(root, { childList: true, subtree: true });
  observer.observe(document.querySelector(".sidebar") || document.body, { childList: true, subtree: true });
  scheduleBranding();

  setTimeout(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) open(false);
  }, 650);
})();
