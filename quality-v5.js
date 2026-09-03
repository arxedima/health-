(() => {
  "use strict";
  const STORAGE_KEY = "vector-health-v1";
  const COMPLETION_KEY = "vector-minimal-completions-v1";
  const ONBOARDING_KEY = "healthplus-onboarding-v1";
  const app = document.getElementById("app");
  const root = document.getElementById("viewRoot");
  if (!app || !root) return;

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; }
    catch { return {}; }
  };
  const saveState = state => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  function markCompletion(key) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(COMPLETION_KEY) || "{}") || {}; } catch {}
    const date = todayKey();
    all[date] = { ...(all[date] || {}), [key]: true };
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
  }

  function toast(message) {
    const stack = document.getElementById("toastStack");
    if (!stack) return;
    const node = document.createElement("div");
    node.className = "toast final-toast";
    node.textContent = message;
    stack.appendChild(node);
    setTimeout(() => node.remove(), 2200);
  }

  function refreshHome() {
    const home = document.querySelector('#mobileNav [data-view="home"].active, #desktopNav [data-view="home"].active');
    if (!home) return;
    const current = root.querySelector(".minimal-home-view");
    if (current) current.remove();
  }

  function addWater(amount = 0.25) {
    const state = readState();
    const date = todayKey();
    state.dailyLogs = state.dailyLogs && typeof state.dailyLogs === "object" ? state.dailyLogs : {};
    const day = { ...(state.dailyLogs[date] || {}) };
    const current = Number(day.water) || 0;
    day.water = Math.round((current + amount) * 100) / 100;
    state.dailyLogs[date] = day;
    saveState(state);
    markCompletion("water");
    navigator.vibrate?.(10);
    toast(`💧 Вода добавлена · ${day.water.toLocaleString("ru-RU")} л сегодня`);
    refreshHome();
  }

  function enforceBrand() {
    document.title = "Health+ / VECTOR";
    document.querySelectorAll(".brand").forEach(brand => {
      brand.classList.add("health-brand");
      const strong = brand.querySelector("strong");
      if (strong) strong.textContent = "Health+ / VECTOR";
    });
    if (app.classList.contains("final-subpage")) {
      const kicker = document.getElementById("viewKicker");
      if (kicker) kicker.textContent = "Health+ / VECTOR";
    }
  }

  function removeLegacy() {
    document.querySelectorAll(".mh-quick-dock,.minimal-quick-dock,.minimal-home-actions,.home-quick-actions,.quick-dock,.mobile-actions,.floating-actions").forEach(n => n.remove());
  }

  function releaseFirstRunGate() {
    const pending = !localStorage.getItem(ONBOARDING_KEY);
    const layer = document.getElementById("hpOnboarding");
    if (!pending || layer?.classList.contains("open")) document.documentElement.classList.remove("hp-first-run-pending");
  }

  /* Handle water before older delegated click handlers. */
  document.addEventListener("click", event => {
    const water = event.target.closest('[data-minimal-complete="water"], [data-final-action="water"]');
    if (!water) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    addWater(.25);
  }, true);

  /* Keep the visible shell clean even when older renderers mutate the DOM. */
  let queued = false;
  const sync = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      enforceBrand();
      removeLegacy();
      releaseFirstRunGate();
    });
  };
  const observer = new MutationObserver(sync);
  observer.observe(app, { childList:true, subtree:true, attributes:true, attributeFilter:["class"] });
  observer.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:["class"] });

  window.addEventListener("healthplus:onboarding-complete", () => {
    document.documentElement.classList.remove("hp-first-run-pending");
    setTimeout(() => { enforceBrand(); refreshHome(); }, 50);
  });
  window.addEventListener("pageshow", sync);
  sync();
})();
