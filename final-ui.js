(() => {
  "use strict";

  const app = document.getElementById("app");
  const root = document.getElementById("viewRoot");
  const desktopNav = document.getElementById("desktopNav");
  const mobileNav = document.getElementById("mobileNav");
  if (!app || !root || !desktopNav || !mobileNav) return;

  let currentView = "home";
  let syncQueued = false;
  let orbHoldTimer = null;
  let orbLongPressed = false;
  let orbRestoreTimer = null;

  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const nav = [
    ["home", "Сегодня", "home"],
    ["lfk", "Движение", "activity"],
    ["quick", "", "plus"],
    ["nutrition", "Питание", "food"],
    ["profile", "Я", "user"]
  ];

  function captureView() {
    if (!desktopNav.querySelector(".final-nav-shell")) {
      const active = desktopNav.querySelector("button.active[data-view]");
      if (active) currentView = active.dataset.view;
      app.dataset.finalView = currentView;
    } else if (app.dataset.finalView) {
      currentView = app.dataset.finalView;
    }
    return currentView;
  }

  function mappedView(view) {
    if (view === "timer") return "lfk";
    if (view === "journal") return "profile";
    return view;
  }

  function navMarkup(view) {
    const mapped = mappedView(view);
    return `<div class="final-nav-shell">${nav.map(([key, label, iconName]) => {
      if (key === "quick") return `<button class="final-nav-plus" type="button" data-final-action="quick" aria-label="Быстрые действия"><span>${icon("plus")}</span></button>`;
      return `<button type="button" data-view="${key}" class="final-nav-item ${mapped === key ? "active" : ""}" aria-current="${mapped === key ? "page" : "false"}">${icon(iconName)}<span>${label}</span></button>`;
    }).join("")}</div><button class="final-proxy ${view === "timer" ? "active" : ""}" type="button" data-view="timer" aria-hidden="true" tabindex="-1"></button><button class="final-proxy ${view === "journal" ? "active" : ""}" type="button" data-view="journal" aria-hidden="true" tabindex="-1"></button>`;
  }

  function rebuildNavigation() {
    if (!desktopNav.querySelector(".final-nav-shell")) desktopNav.innerHTML = navMarkup(currentView);
    if (!mobileNav.querySelector(".final-nav-shell")) mobileNav.innerHTML = navMarkup(currentView);
  }

  function goView(view) {
    closeSheet();
    const target = desktopNav.querySelector(`[data-view="${view}"]`) || mobileNav.querySelector(`[data-view="${view}"]`);
    target?.click();
  }

  function goJournal(tab = "today") {
    goView("journal");
    setTimeout(() => root.querySelector(`[data-journal-tab="${tab}"]`)?.click(), 60);
  }

  function toast(message) {
    const stack = document.getElementById("toastStack");
    if (!stack) return;
    const item = document.createElement("div");
    item.className = "toast final-toast";
    item.textContent = message;
    stack.appendChild(item);
    setTimeout(() => item.remove(), 2600);
  }

  function ensureSheet() {
    let layer = document.getElementById("finalQuickLayer");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.id = "finalQuickLayer";
    layer.className = "final-quick-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = `<button class="final-quick-backdrop" type="button" data-final-action="close-sheet" aria-label="Закрыть"></button><section class="final-quick-sheet" role="dialog" aria-modal="true"><div class="final-sheet-handle"></div><header><div><small id="finalSheetKicker">БЫСТРЫЕ ДЕЙСТВИЯ</small><h2 id="finalSheetTitle">Что сделать?</h2></div><button type="button" class="final-sheet-close" data-final-action="close-sheet">×</button></header><div id="finalSheetActions" class="final-sheet-actions"></div></section>`;
    document.body.appendChild(layer);
    return layer;
  }

  function openSheet(kind = "quick") {
    const layer = ensureSheet();
    const kicker = layer.querySelector("#finalSheetKicker");
    const title = layer.querySelector("#finalSheetTitle");
    const actions = layer.querySelector("#finalSheetActions");
    if (kind === "orb") {
      kicker.textContent = "HEALTH+ AI";
      title.textContent = "Чем помочь?";
      actions.innerHTML = `
        <button type="button" data-final-action="ai"><span>✦</span><div><strong>Спросить AI</strong><small>Открыть помощника</small></div><b>›</b></button>
        <button type="button" data-final-action="lfk"><span>${icon("activity")}</span><div><strong>Подобрать движение</strong><small>Современная ЛФК и архив</small></div><b>›</b></button>
        <button type="button" data-final-action="breathing"><span>${icon("heart")}</span><div><strong>Помочь расслабиться</strong><small>Спокойное дыхание</small></div><b>›</b></button>
        <button type="button" data-final-action="today"><span>${icon("journal")}</span><div><strong>Посмотреть мой день</strong><small>Состояние и прогресс</small></div><b>›</b></button>`;
    } else {
      kicker.textContent = "БЫСТРЫЕ ДЕЙСТВИЯ";
      title.textContent = "Добавить или запустить";
      actions.innerHTML = `
        <button type="button" data-final-action="food-photo"><span>📷</span><div><strong>Сфотографировать еду</strong><small>AI-анализ блюда</small></div><b>›</b></button>
        <button type="button" data-final-action="water"><span>${icon("water")}</span><div><strong>Добавить воду</strong><small>Открыть запись состояния</small></div><b>›</b></button>
        <button type="button" data-final-action="timer"><span>${icon("clock")}</span><div><strong>Запустить таймер</strong><small>Таймер, секундомер, интервалы</small></div><b>›</b></button>
        <button type="button" data-final-action="reminder"><span>${icon("bell")}</span><div><strong>Напоминание</strong><small>ЛФК, вода или другая задача</small></div><b>›</b></button>`;
    }
    layer.classList.add("open");
    layer.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("final-sheet-open");
    navigator.vibrate?.(12);
  }

  function closeSheet() {
    const layer = document.getElementById("finalQuickLayer");
    if (!layer) return;
    layer.classList.remove("open");
    layer.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("final-sheet-open");
  }

  function openAi() {
    closeSheet();
    document.getElementById("hp-ai-open")?.click();
  }

  function openBreathing() {
    closeSheet();
    document.getElementById("hp-sos-open")?.click();
  }

  function decorateMovement() {
    const view = root.querySelector(".view");
    if (!view) return;
    const heading = view.querySelector(".section-heading");
    if (heading && !view.querySelector(".final-movement-tools")) {
      const tools = document.createElement("div");
      tools.className = "final-movement-tools";
      tools.innerHTML = `<button type="button" data-final-action="timer"><span>${icon("clock")}</span><div><small>ИНСТРУМЕНТ</small><strong>Таймер занятий</strong></div><b>›</b></button>`;
      heading.insertAdjacentElement("afterend", tools);
    }
    const chips = view.querySelector(".chips");
    if (chips && !chips.closest(".final-filter-details")) {
      const details = document.createElement("details");
      details.className = "final-filter-details";
      details.innerHTML = `<summary>Фильтр по зоне тела <span>+</span></summary>`;
      chips.parentNode.insertBefore(details, chips);
      details.appendChild(chips);
    }
  }

  function decorateNutrition() {
    const view = root.querySelector(".view");
    if (!view || view.querySelector(".final-food-scan")) return;
    const heading = view.querySelector(".section-heading");
    const scan = document.createElement("button");
    scan.type = "button";
    scan.className = "final-food-scan";
    scan.dataset.finalAction = "food-photo";
    scan.innerHTML = `<span class="final-scan-icon">📷</span><div><small>HEALTH+ AI</small><strong>Сфотографировать еду</strong><p>Распознать блюдо и приблизительно оценить калорийность.</p></div><b>›</b>`;
    if (heading) heading.insertAdjacentElement("afterend", scan); else view.prepend(scan);
  }

  function decorateProfile() {
    const view = root.querySelector(".view");
    if (!view || view.querySelector(".final-me-hub")) return;
    const hub = document.createElement("section");
    hub.className = "final-me-hub";
    hub.innerHTML = `<button type="button" data-final-action="journal-today"><span>${icon("journal")}</span><div><strong>Мой день</strong><small>Сон, вода, шаги и самочувствие</small></div><b>›</b></button><button type="button" data-final-action="journal-week"><span>◔</span><div><strong>Прогресс</strong><small>Динамика за 7 дней</small></div><b>›</b></button><button type="button" data-final-action="reminder"><span>${icon("bell")}</span><div><strong>Напоминания</strong><small>Расписание полезных действий</small></div><b>›</b></button>`;
    view.prepend(hub);
  }

  function decorateSubpage() {
    root.classList.remove("final-home", "final-lfk", "final-timer", "final-nutrition", "final-journal", "final-profile");
    root.classList.add(`final-${currentView}`);
    app.classList.toggle("final-subpage", currentView !== "home");

    const title = document.getElementById("viewTitle");
    const subtitle = document.getElementById("viewSubtitle");
    if (currentView === "lfk") {
      if (title) title.textContent = "Движение";
      if (subtitle) subtitle.textContent = "ЛФК, архивные комплексы и таймер";
      decorateMovement();
    } else if (currentView === "nutrition") {
      if (title) title.textContent = "Питание";
      if (subtitle) subtitle.textContent = "Сканер еды и дневник питания";
      decorateNutrition();
    } else if (currentView === "profile") {
      if (title) title.textContent = "Я";
      if (subtitle) subtitle.textContent = "Прогресс, напоминания и настройки";
      decorateProfile();
    } else if (currentView === "journal") {
      if (title) title.textContent = "Мой день";
      if (subtitle) subtitle.textContent = "Состояние, динамика и напоминания";
    } else if (currentView === "timer") {
      if (title) title.textContent = "Таймер";
      if (subtitle) subtitle.textContent = "Фокус, интервалы и время занятий";
    }

    const page = root.querySelector(":scope > .view, :scope > .minimal-home-view");
    if (page && !page.classList.contains("final-enter")) {
      page.classList.add("final-enter");
      setTimeout(() => page.classList.remove("final-enter"), 520);
    }
  }

  function setupOrb() {
    const stage = root.querySelector(".mh-orb-stage");
    if (!stage || stage.dataset.finalOrb === "ready") return;
    stage.dataset.finalOrb = "ready";
    delete stage.dataset.minimalAction;
    stage.removeAttribute("data-minimal-action");

    stage.addEventListener("pointerdown", () => {
      orbLongPressed = false;
      stage.classList.add("final-orb-pressed");
      clearTimeout(orbHoldTimer);
      orbHoldTimer = setTimeout(() => {
        orbLongPressed = true;
        stage.classList.remove("final-orb-pressed");
        stage.classList.add("final-orb-hold");
        navigator.vibrate?.([18, 30, 18]);
        setTimeout(() => stage.classList.remove("final-orb-hold"), 520);
        openSheet("orb");
      }, 620);
    });

    const cancelPress = () => {
      clearTimeout(orbHoldTimer);
      stage.classList.remove("final-orb-pressed");
    };
    stage.addEventListener("pointerup", cancelPress);
    stage.addEventListener("pointercancel", cancelPress);
    stage.addEventListener("pointerleave", cancelPress);

    stage.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (orbLongPressed) { orbLongPressed = false; return; }
      reactOrb(stage);
    }, true);
  }

  function reactOrb(stage) {
    const message = stage.querySelector(".mh-orb-message");
    if (!message) return;
    const original = message.dataset.original || message.textContent;
    message.dataset.original = original;
    const period = app.dataset.period || "day";
    const phrases = period === "night"
      ? ["Я здесь 🌙", "Можно выдохнуть. Сегодня достаточно.", "Хочешь немного спокойного дыхания?"]
      : ["Слушаю ✨", "Что сделаем первым?", "Я рядом — один шаг за раз.", "Нажми и подержи меня для быстрых действий."];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    stage.classList.remove("final-orb-tap");
    void stage.offsetWidth;
    stage.classList.add("final-orb-tap");
    message.textContent = phrase;
    navigator.vibrate?.(10);
    clearTimeout(orbRestoreTimer);
    orbRestoreTimer = setTimeout(() => {
      stage.classList.remove("final-orb-tap");
      if (message.isConnected) message.textContent = original;
    }, 2600);
  }

  function celebrateOrb() {
    setTimeout(() => {
      const stage = root.querySelector(".mh-orb-stage");
      const message = stage?.querySelector(".mh-orb-message");
      if (!stage || !message) return;
      stage.classList.add("final-orb-success");
      message.textContent = "Готово! Отличный маленький шаг ✨";
      navigator.vibrate?.([12, 30, 12]);
      setTimeout(() => stage.classList.remove("final-orb-success"), 1200);
    }, 90);
  }

  function sync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => {
      syncQueued = false;
      captureView();
      rebuildNavigation();
      decorateSubpage();
      setupOrb();
    });
  }

  const observer = new MutationObserver(sync);
  observer.observe(root, { childList: true, subtree: false });
  observer.observe(desktopNav, { childList: true });
  observer.observe(mobileNav, { childList: true });

  document.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.finalAction;
    if (!action) {
      if (button.dataset.minimalComplete) celebrateOrb();
      return;
    }
    if (action === "quick") return openSheet("quick");
    if (action === "close-sheet") return closeSheet();
    if (action === "food-photo" || action === "ai") return openAi();
    if (action === "breathing") return openBreathing();
    if (action === "lfk") return goView("lfk");
    if (action === "timer") return goView("timer");
    if (action === "water" || action === "journal-today" || action === "today") { goJournal("today"); if (action === "water") setTimeout(() => toast("Добавьте воду в записи за сегодня"), 180); return; }
    if (action === "journal-week") return goJournal("week");
    if (action === "reminder") return goJournal("reminders");
  });

  document.addEventListener("keydown", event => { if (event.key === "Escape") closeSheet(); });
  sync();
})();
