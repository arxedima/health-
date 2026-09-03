(() => {
  "use strict";

  const STORAGE_KEY = "vector-health-v1";
  const COMPLETION_KEY = "vector-minimal-completions-v1";
  const app = document.getElementById("app");
  const root = document.getElementById("viewRoot");
  if (!app || !root) return;

  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const todayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; }
    catch { return {}; }
  }

  function readCompletions() {
    try { return JSON.parse(localStorage.getItem(COMPLETION_KEY) || "{}") || {}; }
    catch { return {}; }
  }

  function saveCompletion(key) {
    const all = readCompletions();
    const date = todayKey();
    all[date] = { ...(all[date] || {}), [key]: true };
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
  }

  function getPeriod() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 17) return "day";
    if (hour >= 17 && hour < 22) return "evening";
    return "night";
  }

  function periodCopy(period) {
    return {
      morning: { greeting: "Доброе утро 👋", line: "Начнём день спокойно и без перегруза.", orb: "Я рядом. Давай выберем один полезный шаг." },
      day: { greeting: "Добрый день 👋", line: "Сохраняем ритм и фокус на главном.", orb: "Я слежу за ритмом дня и подскажу, что сейчас важнее." },
      evening: { greeting: "Добрый вечер 👋", line: "Посмотрим, что осталось на сегодня.", orb: "День почти завершён. Можно мягко закрыть оставшиеся задачи." },
      night: { greeting: "Спокойной ночи 🌙", line: "Время снизить темп и восстановиться.", orb: "Ты хорошо поработал сегодня. Теперь важен отдых." }
    }[period];
  }

  function getTodayData() {
    const state = readState();
    const date = todayKey();
    const foodLogs = state.foodLogs?.[date] || [];
    const daily = state.dailyLogs?.[date] || {};
    const sessions = (state.completedSessions || []).filter(item => item.date === date).length;
    const kcal = foodLogs.reduce((sum, item) => sum + (Number(item.kcal) || 0), 0);
    const target = Number(state.calorieTarget) || 2000;
    const water = Number(daily.water) || 0;
    const sleep = Number(daily.sleep) || 0;
    const steps = Number(daily.steps) || 0;
    const meals = new Set(foodLogs.map(item => item.meal));
    const completions = readCompletions()[date] || {};
    return { state, foodLogs, daily, sessions, kcal, target, water, sleep, steps, meals, completions };
  }

  function timelineFor(data) {
    const hour = new Date().getHours();
    return [
      { key: "water", time: "08:00", icon: "water", title: "Стакан воды", subtitle: "Мягкий старт дня", done: Boolean(data.completions.water || data.water > 0) },
      { key: "lfk", time: "10:00", icon: "activity", title: "ЛФК", subtitle: "12 минут движения", done: Boolean(data.completions.lfk || data.sessions > 0), action: "lfk" },
      { key: "lunch", time: "13:00", icon: "food", title: "Обед", subtitle: data.meals.has("lunch") ? "Добавлен в дневник" : "Добавить питание", done: Boolean(data.completions.lunch || data.meals.has("lunch")), action: "nutrition" },
      { key: "walk", time: "16:00", icon: "activity", title: "Прогулка", subtitle: data.steps ? `${Math.round(data.steps).toLocaleString("ru-RU")} шагов сегодня` : "20–30 минут", done: Boolean(data.completions.walk || data.steps >= 4000) },
      { key: "sleep", time: "22:30", icon: "moon", title: "Подготовка ко сну", subtitle: data.sleep ? `Сон: ${data.sleep.toLocaleString("ru-RU")} ч` : "Спокойное завершение дня", done: Boolean(data.completions.sleep || (hour >= 23 && data.sleep > 0)), action: "breathing" }
    ];
  }

  function nextReminder(state) {
    const reminders = (state.reminders || []).filter(item => item.active && item.time);
    if (!reminders.length) return null;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const today = now.getDay();
    const date = todayKey();
    return reminders
      .filter(item => item.repeat === "daily" || (item.repeat === "weekdays" && today >= 1 && today <= 5) || (item.repeat === "once" && item.date === date))
      .map(item => ({ ...item, minutes: Number(item.time.slice(0, 2)) * 60 + Number(item.time.slice(3, 5)) }))
      .filter(item => item.minutes >= current)
      .sort((a, b) => a.minutes - b.minutes)[0] || null;
  }

  function focusFor(timeline, period) {
    const next = timeline.find(item => !item.done);
    if (!next) return { key: "done", icon: "heart", title: "На сегодня всё главное сделано", text: "Можно выдохнуть и оставить время для восстановления.", button: "Хороший день" };
    const map = {
      water: { title: "Выпей стакан воды", text: "Один небольшой шаг — и день уже движется в правильном ритме.", button: "Отметить как выполнено" },
      lfk: { title: "12 минут мягкой ЛФК", text: "Без гонки за результатом — только спокойное движение в комфортной амплитуде.", button: "Открыть ЛФК" },
      lunch: { title: "Добавь обед в дневник", text: "Так дневная картина питания станет точнее, а рекомендации — полезнее.", button: "Открыть питание" },
      walk: { title: "Небольшая прогулка", text: "20–30 минут лёгкого движения помогут переключиться и восстановить внимание.", button: "Отметить прогулку" },
      sleep: { title: period === "night" ? "Пора готовиться ко сну" : "Подготовь спокойный вечер", text: "Убавь темп и оставь несколько минут на дыхание и восстановление.", button: "Начать дыхание" }
    };
    return { ...next, ...map[next.key] };
  }

  function statsMarkup(data) {
    const kcalPct = Math.min(100, Math.round(data.kcal / data.target * 100));
    return `<div class="mh-stats" aria-label="Показатели дня">
      <div><span>Калории</span><strong>${Math.round(data.kcal).toLocaleString("ru-RU")}</strong><small>${kcalPct}% цели</small></div>
      <div><span>Вода</span><strong>${data.water ? `${data.water.toLocaleString("ru-RU")} л` : "—"}</strong><small>сегодня</small></div>
      <div><span>Сон</span><strong>${data.sleep ? `${data.sleep.toLocaleString("ru-RU")} ч` : "—"}</strong><small>последняя запись</small></div>
    </div>`;
  }

  function renderMinimalHome() {
    const data = getTodayData();
    const period = getPeriod();
    const copy = periodCopy(period);
    const timeline = timelineFor(data);
    const focus = focusFor(timeline, period);
    const reminder = nextReminder(data.state);
    const date = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    app.dataset.period = period;
    app.classList.add("minimal-home");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", period === "night" ? "#101a3d" : "#f7f8fc");

    root.innerHTML = `<section class="minimal-home-view" data-minimal-rendered="true">
      <header class="mh-header">
        <div class="mh-brand"><span class="mh-brand-dot"></span><div><strong>Health+</strong><small>VECTOR</small></div></div>
        <button class="mh-icon-button" type="button" data-minimal-action="ai" aria-label="Открыть AI">✦</button>
      </header>

      <div class="mh-intro">
        <span class="mh-date">${esc(date)}</span>
        <h1>${copy.greeting}</h1>
        <p>${copy.line}</p>
      </div>

      <button class="mh-orb-stage" type="button" data-minimal-action="ai" aria-label="Открыть AI-помощника">
        <span class="mh-orb" aria-hidden="true"><i class="mh-eye left"></i><i class="mh-eye right"></i><i class="mh-smile"></i></span>
        <span class="mh-orb-message">${copy.orb}</span>
      </button>

      <article class="mh-focus-card">
        <div class="mh-focus-icon">${icon(focus.icon)}</div>
        <div class="mh-focus-copy"><small>Твоя главная задача</small><h2>${esc(focus.title)}</h2><p>${esc(focus.text)}</p></div>
        ${focus.key === "lfk" ? `<button class="mh-primary" type="button" data-view="lfk">${esc(focus.button)}</button>` : focus.key === "lunch" ? `<button class="mh-primary" type="button" data-action="go-nutrition">${esc(focus.button)}</button>` : focus.key === "sleep" ? `<button class="mh-primary" type="button" data-minimal-action="breathing">${esc(focus.button)}</button>` : focus.key === "done" ? `<button class="mh-primary is-done" type="button" disabled>✓ ${esc(focus.button)}</button>` : `<button class="mh-primary" type="button" data-minimal-complete="${focus.key}">${esc(focus.button)}</button>`}
      </article>

      ${reminder ? `<button class="mh-reminder" type="button" data-action="go-reminders"><span>${icon("bell")}</span><div><small>Ближайшее напоминание</small><strong>${esc(reminder.time)} · ${esc(reminder.title)}</strong></div><b>›</b></button>` : ""}

      <section class="mh-timeline-section">
        <div class="mh-section-head"><div><small>ТАЙМЛАЙН ДНЯ</small><h2>Твой ритм</h2></div><button type="button" data-action="go-journal">Дневник</button></div>
        <div class="mh-timeline">
          ${timeline.map(item => `<div class="mh-timeline-row ${item.done ? "done" : ""}">
            <time>${item.time}</time>
            <span class="mh-line-dot">${item.done ? "✓" : ""}</span>
            <button type="button" ${item.action === "lfk" ? `data-view="lfk"` : item.action === "nutrition" ? `data-action="go-nutrition"` : item.action === "breathing" ? `data-minimal-action="breathing"` : `data-minimal-complete="${item.key}"`}>
              <span class="mh-row-icon">${icon(item.icon)}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.subtitle)}</small></span><b>${item.done ? "Готово" : "›"}</b>
            </button>
          </div>`).join("")}
        </div>
      </section>

      ${statsMarkup(data)}

      <div class="mh-quick-dock" aria-label="Быстрые действия">
        <button type="button" data-minimal-action="ai"><span>✦</span><small>AI</small></button>
        <button type="button" data-action="go-nutrition">${icon("food")}<small>Питание</small></button>
        <button type="button" data-view="lfk">${icon("activity")}<small>ЛФК</small></button>
        <button type="button" data-minimal-action="breathing">${icon("heart")}<small>Дыхание</small></button>
      </div>
    </section>`;
  }

  function isHome() {
    return Boolean(document.querySelector('#desktopNav [data-view="home"].active, #mobileNav [data-view="home"].active'));
  }

  let scheduled = false;
  function sync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const home = isHome();
      app.classList.toggle("minimal-home", home);
      app.dataset.period = getPeriod();
      if (!home) return;
      if (!root.querySelector(".minimal-home-view")) renderMinimalHome();
    });
  }

  const observer = new MutationObserver(sync);
  observer.observe(root, { childList: true });
  observer.observe(document.getElementById("desktopNav"), { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  observer.observe(document.getElementById("mobileNav"), { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  document.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.minimalComplete) {
      saveCompletion(button.dataset.minimalComplete);
      renderMinimalHome();
      return;
    }
    if (button.dataset.minimalAction === "ai") {
      document.getElementById("hp-ai-open")?.click();
      return;
    }
    if (button.dataset.minimalAction === "breathing") {
      document.getElementById("hp-sos-open")?.click();
    }
  });

  setInterval(() => {
    const period = getPeriod();
    if (app.dataset.period !== period) {
      app.dataset.period = period;
      if (isHome()) renderMinimalHome();
    }
  }, 60000);

  sync();
})();
