(() => {
  "use strict";

  const STORAGE_KEY = "vector-health-v1";
  const todayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const esc = value => String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const defaultState = {
    view: "home",
    mode: "system",
    theme: "navy",
    lfkTab: "modern",
    lfkFilter: "all",
    nutritionTab: "diary",
    journalTab: "today",
    journalDate: todayKey(),
    calorieTarget: 2000,
    calculator: { sex: "male", age: 30, weight: 70, height: 175, activity: 1.375, goal: "maintain" },
    foodLogs: {},
    completedSessions: [],
    dailyLogs: {},
    reminders: []
  };

  let state = loadState();
  let systemDark = matchMedia("(prefers-color-scheme: dark)").matches;
  let wakeLock = null;

  const navItems = [
    { key: "home", label: "Главная", icon: "home" },
    { key: "lfk", label: "ЛФК", icon: "activity" },
    { key: "timer", label: "Таймер", icon: "clock" },
    { key: "nutrition", label: "Питание", icon: "food" },
    { key: "journal", label: "Дневник", icon: "journal" },
    { key: "profile", label: "Профиль", icon: "user" }
  ];

  const headers = {
    home: ["СЕГОДНЯ", "Привет!", "Мягкое движение и питание в одном ритме"],
    lfk: ["ВОССТАНОВЛЕНИЕ", "ЛФК", "Комплексы по зонам тела и архивная гимнастика"],
    timer: ["ИНСТРУМЕНТЫ", "Часы и таймер", "Отсчёт, секундомер и интервалы"],
    nutrition: ["ДНЕВНИК", "Питание", "Калории, продукты и баланс БЖУ"],
    journal: ["МОЙ ПРОГРЕСС", "Умный дневник", "Показатели, недельная таблица и напоминания"],
    profile: ["НАСТРОЙКИ", "Профиль", "Оформление и данные приложения"]
  };

  const programs = [
    {
      id: "knee-soft", type: "modern", area: "knee", number: "01", title: "Мягкая мобилизация колена", duration: 12,
      description: "Спокойный комплекс без ударной нагрузки.", tags: ["Колено", "Лёгкая нагрузка"],
      exercises: [
        ["Движения стопой", "Лёжа или сидя, без напряжения", 45],
        ["Напряжение мышц бедра", "Мягкая изометрия", 40],
        ["Скольжение пяткой", "Только в комфортной амплитуде", 45],
        ["Пауза и спокойное дыхание", "Не задерживайте дыхание", 30],
        ["Разгибание ноги сидя", "Без дополнительного веса", 40],
        ["Перенос веса у опоры", "Только если разрешено специалистом", 45]
      ]
    },
    {
      id: "back-release", type: "modern", area: "back", number: "02", title: "Разгрузка поясницы", duration: 10,
      description: "Дыхание, мягкая подвижность и расслабление.", tags: ["Спина", "Без оборудования"],
      exercises: [
        ["Диафрагмальное дыхание", "Лёжа, ладони на нижних рёбрах", 60],
        ["Наклон таза лёжа", "Небольшое контролируемое движение", 45],
        ["Колени вправо и влево", "Комфортная амплитуда", 45],
        ["Положение отдыха", "Расслабьте плечи и поясницу", 60],
        ["Кошка в малой амплитуде", "Без резких прогибов", 45]
      ]
    },
    {
      id: "neck-office", type: "modern", area: "neck", number: "03", title: "Шея и плечевой пояс", duration: 8,
      description: "Небольшая разминка после работы за экраном.", tags: ["Шея", "Сидя"],
      exercises: [
        ["Опустить и поднять плечи", "Двигайтесь медленно", 40],
        ["Сведение лопаток", "Не запрокидывайте голову", 40],
        ["Повороты головы", "Без боли и предельной амплитуды", 45],
        ["Мягкое вытяжение макушкой", "Подбородок параллельно полу", 45],
        ["Спокойное дыхание", "Длинный выдох", 60]
      ]
    },
    {
      id: "ussr-radio", type: "retro", area: "whole", number: "А1", title: "Радиогимнастика СССР", duration: 12,
      description: "Современная реконструкция утренней зарядки в ритме радиопередачи.", tags: ["Всё тело", "Ретро"],
      exercises: [
        ["Ходьба на месте", "Ровный ритм и свободное дыхание", 60],
        ["Круги плечами", "Назад и вперёд", 45],
        ["Подъём рук через стороны", "Вдох вверх, выдох вниз", 45],
        ["Наклоны корпуса", "Небольшая амплитуда", 45],
        ["Полуприсед у опоры", "Пропустите при ограничениях колена", 40],
        ["Спокойная ходьба", "Восстановите дыхание", 60]
      ]
    },
    {
      id: "ussr-work", type: "retro", area: "back", number: "А2", title: "Производственная гимнастика", duration: 7,
      description: "Короткая адаптация зарядки для перерыва в работе.", tags: ["Спина", "На работе"],
      exercises: [
        ["Потянуться вверх", "Не задерживайте дыхание", 35],
        ["Круги кистями", "Смените направление", 35],
        ["Сведение лопаток", "Плечи не поднимать", 40],
        ["Повороты корпуса сидя", "Малая амплитуда", 40],
        ["Перекаты с пятки на носок", "Рядом с устойчивой опорой", 45]
      ]
    },
    {
      id: "ussr-hygiene", type: "retro", area: "whole", number: "А3", title: "Гигиеническая гимнастика", duration: 15,
      description: "Неторопливый общеукрепляющий комплекс по мотивам старых пособий.", tags: ["Всё тело", "Утро"],
      exercises: [
        ["Спокойная ходьба", "Начните в удобном темпе", 60],
        ["Движения руками", "Через стороны без рывка", 45],
        ["Повороты корпуса", "Таз остаётся устойчивым", 45],
        ["Отведение ноги у опоры", "Небольшая амплитуда", 40],
        ["Подъём на носки", "Держитесь за опору", 40],
        ["Дыхательная пауза", "Вдох на 4, выдох на 6", 60]
      ]
    }
  ];

  const foodDatabase = [
    ["chicken", "Куриная грудка", 165, 31, 3.6, 0],
    ["turkey", "Индейка", 135, 29, 1.7, 0],
    ["egg", "Яйцо куриное", 157, 12.7, 11.5, 0.7],
    ["salmon", "Лосось", 208, 20, 13, 0],
    ["tuna", "Тунец", 116, 26, 1, 0],
    ["cottage", "Творог 5%", 121, 17, 5, 3],
    ["yogurt", "Йогурт натуральный", 63, 5.3, 1.6, 7],
    ["milk", "Молоко 2,5%", 52, 2.8, 2.5, 4.7],
    ["buckwheat", "Гречка варёная", 110, 4.2, 1.1, 21.3],
    ["rice", "Рис варёный", 130, 2.7, 0.3, 28],
    ["oats", "Овсяная каша", 88, 3, 1.7, 15],
    ["pasta", "Макароны варёные", 131, 5, 1.1, 25],
    ["potato", "Картофель варёный", 82, 2, 0.4, 16.7],
    ["bread", "Хлеб цельнозерновой", 247, 13, 4.2, 41],
    ["banana", "Банан", 89, 1.1, 0.3, 23],
    ["apple", "Яблоко", 52, 0.3, 0.2, 14],
    ["avocado", "Авокадо", 160, 2, 14.7, 8.5],
    ["tomato", "Помидор", 18, 0.9, 0.2, 3.9],
    ["cucumber", "Огурец", 15, 0.7, 0.1, 3.6],
    ["broccoli", "Брокколи", 34, 2.8, 0.4, 6.6],
    ["cheese", "Сыр твёрдый", 350, 25, 27, 2],
    ["nuts", "Орехи", 607, 20, 54, 21],
    ["olive-oil", "Оливковое масло", 884, 0, 100, 0],
    ["protein", "Сывороточный протеин", 390, 76, 7, 9]
  ].map(([id, name, kcal, protein, fat, carbs]) => ({ id, name, kcal, protein, fat, carbs }));

  const mealNames = { breakfast: "Завтрак", lunch: "Обед", dinner: "Ужин", snack: "Перекус" };
  const themeOptions = [
    ["navy", "Navy", "#49b7ff"], ["burgundy", "Burgundy", "#f05d70"], ["gold", "Gold", "#f0c64e"],
    ["olive", "Olive", "#aebc65"], ["coast", "Coast", "#3eb9e8"], ["sage", "Sage", "#68c9be"], ["terra", "Terra", "#e9794e"]
  ];

  const app = document.getElementById("app");
  const root = document.getElementById("viewRoot");
  const programDialog = document.getElementById("programDialog");
  const foodDialog = document.getElementById("foodDialog");
  const desktopNav = document.getElementById("desktopNav");
  const mobileNav = document.getElementById("mobileNav");

  const timerState = {
    mode: "timer", running: false, duration: 300000, remaining: 300000, elapsed: 0, startedAt: 0,
    work: 40, rest: 20, rounds: 6, currentRound: 1, phase: "work", keepAwake: true, laps: []
  };
  let sessionState = null;
  const firedReminders = new Set();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return structuredClone(defaultState);
      return {
        ...defaultState,
        ...saved,
        calculator: { ...defaultState.calculator, ...(saved.calculator || {}) },
        dailyLogs: saved.dailyLogs && typeof saved.dailyLogs === "object" ? saved.dailyLogs : {},
        reminders: Array.isArray(saved.reminders) ? saved.reminders : []
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resolveMode() {
    return state.mode === "system" ? (systemDark ? "dark" : "light") : state.mode;
  }

  function applyAppearance() {
    app.dataset.theme = state.theme;
    app.dataset.mode = resolveMode();
    document.documentElement.style.colorScheme = resolveMode();
    document.querySelector('meta[name="theme-color"]').content = resolveMode() === "dark" ? "#07111b" : "#f3f5f7";
    document.getElementById("themeQuick").innerHTML = icon(resolveMode() === "dark" ? "moon" : "sun");
  }

  function renderNav() {
    const html = navItems.map(item => `<button type="button" data-view="${item.key}" class="${state.view === item.key ? "active" : ""}" aria-current="${state.view === item.key ? "page" : "false"}">${icon(item.icon)}<span>${item.label}</span></button>`).join("");
    desktopNav.innerHTML = html;
    mobileNav.innerHTML = html;
  }

  function setView(view) {
    if (!headers[view]) return;
    state.view = view;
    saveState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    root.focus({ preventScroll: true });
  }

  function renderHeader() {
    const [kicker, title, subtitle] = headers[state.view];
    document.getElementById("viewKicker").textContent = kicker;
    document.getElementById("viewTitle").textContent = title;
    document.getElementById("viewSubtitle").textContent = subtitle;
  }

  function getLogs(date = todayKey()) {
    return state.foodLogs[date] || [];
  }

  function getTotals(date = todayKey()) {
    return getLogs(date).reduce((sum, item) => ({
      kcal: sum.kcal + item.kcal,
      protein: sum.protein + item.protein,
      fat: sum.fat + item.fat,
      carbs: sum.carbs + item.carbs
    }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });
  }

  function macroTargets() {
    const kcal = state.calorieTarget;
    return { protein: Math.round(kcal * .25 / 4), fat: Math.round(kcal * .30 / 9), carbs: Math.round(kcal * .45 / 4) };
  }

  function todaySessions() {
    return state.completedSessions.filter(item => item.date === todayKey()).length;
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString("ru-RU");
  }

  function getDailyLog(date = todayKey()) {
    return state.dailyLogs[date] || {
      weight: "", water: "", sleep: "", steps: "", bikeMinutes: "", bikeResistance: "",
      painBefore: "", painAfter: "", energy: "", note: ""
    };
  }

  function sessionsForDate(date) {
    return state.completedSessions.filter(item => item.date === date).length;
  }

  function recentDateKeys(count = 7) {
    return Array.from({ length: count }, (_, index) => {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - (count - 1 - index));
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    });
  }

  function formatDay(date, long = false) {
    const value = new Date(`${date}T12:00:00`);
    return new Intl.DateTimeFormat("ru-RU", long ? { weekday: "short", day: "numeric", month: "short" } : { day: "2-digit", month: "2-digit" }).format(value);
  }

  function valueOrDash(value, suffix = "") {
    if (value === "" || value === null || value === undefined) return "—";
    const number = Number(value);
    const formatted = Number.isInteger(number) ? formatNumber(number) : number.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
    return `${formatted}${suffix}`;
  }

  function painStatus(log) {
    const before = Number(log.painBefore);
    const after = Number(log.painAfter);
    if (log.painBefore === "" || log.painAfter === "") return "neutral";
    if (after >= 7 || after - before >= 2) return "alert";
    if (after <= before) return "good";
    return "watch";
  }

  function smartInsight(date) {
    const log = getDailyLog(date);
    const status = painStatus(log);
    const sessions = sessionsForDate(date);
    if (status === "alert") return { tone: "alert", title: "Обратите внимание на нагрузку", text: "После занятия показатель боли заметно вырос. Не увеличивайте нагрузку и при сохранении симптомов обсудите это со специалистом." };
    if (Number(log.sleep) > 0 && Number(log.sleep) < 6 && Number(log.energy) > 0 && Number(log.energy) <= 2) return { tone: "watch", title: "Сегодня нужен спокойный темп", text: "Сна и энергии меньше обычного. Выберите щадящий комплекс и ориентируйтесь на самочувствие." };
    if (sessions && status === "good") return { tone: "good", title: "Нагрузка перенесена спокойно", text: "Комплекс выполнен, а показатель боли не вырос. Запись попадёт в недельную статистику." };
    if (sessions) return { tone: "good", title: "Занятие сохранено", text: "Добавьте самочувствие после нагрузки, чтобы дневник точнее показывал динамику." };
    return { tone: "neutral", title: "Отметьте состояние за день", text: "Заполните несколько показателей — питание и выполненная ЛФК добавятся в таблицу автоматически." };
  }

  function renderHome() {
    const totals = getTotals();
    const target = state.calorieTarget;
    const remaining = Math.max(0, target - totals.kcal);
    const kcalPercent = clamp(totals.kcal / target * 100, 0, 100);
    const macros = macroTargets();
    const nextReminder = getNextReminder();
    const todayLog = getDailyLog();
    const date = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    return `<section class="view">
      <div class="home-grid">
        <article class="panel summary-panel">
          <div class="summary-top">
            <div class="day-ring" style="--progress:${Math.min(360, (todaySessions() ? 360 : 120))}deg"><div><strong>${todaySessions() ? "Готово" : "День"}</strong><small>${todaySessions() ? "комплекс" : "в балансе"}</small></div></div>
            <div class="summary-copy"><span class="eyebrow">${date.toUpperCase()}</span><h2>${todaySessions() ? "ЛФК выполнена" : "Начните с мягкого движения"}</h2><p>${todaySessions() ? "Сегодняшняя активность сохранена. Можно уделить внимание питанию и отдыху." : "12 минут спокойной мобилизации — без гонки за результатом."}</p></div>
          </div>
          <div class="metrics">
            <div class="metric-card"><span>КАЛОРИИ</span><strong>${formatNumber(totals.kcal)}</strong><small>из ${formatNumber(target)}</small></div>
            <div class="metric-card"><span>ЛФК</span><strong>${todaySessions()}</strong><small>сегодня</small></div>
            <div class="metric-card"><span>БЕЛОК</span><strong>${formatNumber(totals.protein)} г</strong><small>цель ${macros.protein} г</small></div>
          </div>
        </article>
        <article class="panel next-panel">
          <div class="panel-head"><span class="eyebrow">БЛИЖАЙШИЙ КОМПЛЕКС</span><span class="round-icon">${icon("activity")}</span></div>
          <div class="next-visual"><div class="pulse-ring">${icon("activity")}</div></div>
          <h2>Мягкая мобилизация колена</h2><p>6 упражнений · около 12 минут</p>
          <button class="primary full" type="button" data-action="open-program" data-program="knee-soft">${icon("play")} Открыть комплекс</button>
        </article>
      </div>
      <div class="home-tools-grid">
        <article class="panel quick-tool-card">
          <div class="panel-head"><span class="round-icon">${icon("journal")}</span><span class="status-pill">УМНАЯ ТАБЛИЦА</span></div>
          <div><h3>Дневник состояния</h3><p>${todayLog.sleep || todayLog.steps || todayLog.painAfter !== "" ? `Сегодня: сон ${valueOrDash(todayLog.sleep, " ч")} · шаги ${valueOrDash(todayLog.steps)}` : "Запишите сон, шаги, воду, нагрузку и самочувствие."}</p></div>
          <button class="secondary full" type="button" data-action="go-journal">Открыть дневник</button>
        </article>
        <article class="panel quick-tool-card">
          <div class="panel-head"><span class="round-icon">${icon("bell")}</span><span class="status-pill">НАПОМИНАНИЯ</span></div>
          <div><h3>${nextReminder ? esc(nextReminder.title) : "Добавьте расписание"}</h3><p>${nextReminder ? `Ближайшее: ${formatNextReminder(nextReminder)}` : "ЛФК, вода, питание или контрольный замер."}</p></div>
          <button class="secondary full" type="button" data-action="go-reminders">Настроить напоминания</button>
        </article>
      </div>
      <article class="panel nutrition-hero">
        <img class="nutrition-image" src="./assets/balanced-meal.webp" alt="Сбалансированное блюдо с курицей, гречкой и овощами" />
        <div class="nutrition-copy">
          <span class="eyebrow">ПИТАНИЕ СЕГОДНЯ</span><h2>${formatNumber(remaining)} ккал осталось</h2><p>Добавляйте продукты и порции — калории и БЖУ посчитаются автоматически.</p>
          <div class="macro-row"><span>Белки<strong>${formatNumber(totals.protein)} / ${macros.protein} г</strong></span><span>Жиры<strong>${formatNumber(totals.fat)} / ${macros.fat} г</strong></span><span>Углеводы<strong>${formatNumber(totals.carbs)} / ${macros.carbs} г</strong></span></div>
          <div class="button-row"><button class="primary" type="button" data-action="go-nutrition">${icon("plus")} Добавить еду</button><button class="secondary" type="button" data-action="go-calculator">Рассчитать норму</button></div>
        </div>
      </article>
    </section>`;
  }

  function renderLfk() {
    const filtered = programs.filter(program => program.type === state.lfkTab && (state.lfkFilter === "all" || program.area === state.lfkFilter));
    return `<section class="view">
      <div class="section-heading"><div><span class="eyebrow">БИБЛИОТЕКА ДВИЖЕНИЯ</span><h2>Выберите комплекс</h2><p>Все занятия работают с пошаговым таймером.</p></div><span class="status-pill">${icon(state.lfkTab === "retro" ? "archive" : "heart")} ${state.lfkTab === "retro" ? "Архив" : "ЛФК"}</span></div>
      <div class="safety-note">${icon("info")}<div><strong>Сначала согласуйте нагрузку со специалистом.</strong> Комплексы не заменяют назначение врача. Остановитесь при резкой боли, головокружении или ухудшении самочувствия.</div></div>
      <div class="tabs" role="tablist" aria-label="Вид гимнастики">
        <button type="button" class="${state.lfkTab === "modern" ? "active" : ""}" data-lfk-tab="modern">Современная ЛФК</button>
        <button type="button" class="${state.lfkTab === "retro" ? "active" : ""}" data-lfk-tab="retro">Гимнастика СССР</button>
      </div>
      <div class="chips" aria-label="Фильтр по области тела">
        ${[["all", "Все"], ["knee", "Колено"], ["back", "Спина"], ["neck", "Шея"], ["whole", "Всё тело"]].map(([key, label]) => `<button type="button" class="${state.lfkFilter === key ? "active" : ""}" data-lfk-filter="${key}">${label}</button>`).join("")}
      </div>
      ${filtered.length ? `<div class="program-grid">${filtered.map(program => `<button class="program-card ${program.type === "retro" ? "retro-card" : ""}" type="button" data-action="open-program" data-program="${program.id}">
        <div class="panel-head"><span class="program-no">${program.number}</span>${program.type === "retro" ? `<span class="retro-label">АДАПТАЦИЯ</span>` : `<span class="tag">${program.tags[0]}</span>`}</div>
        <h3>${program.title}</h3><p>${program.description}</p><footer><span>${program.duration} мин · ${program.exercises.length} упражнений</span>${icon("chevron")}</footer>
      </button>`).join("")}</div>` : `<div class="empty-state">Для выбранной зоны комплексов пока нет.</div>`}
      ${state.lfkTab === "retro" ? `<div class="safety-note">${icon("archive")}<div><strong>Это современные реконструкции, а не медицинские назначения.</strong> Сложные и устаревшие элементы исключены, но индивидуальные ограничения всё равно нужно учитывать.</div></div>` : ""}
    </section>`;
  }

  function renderTimer() {
    const isStopwatch = timerState.mode === "stopwatch";
    const modeLabel = timerState.mode === "interval" ? `Раунд ${timerState.currentRound} из ${timerState.rounds}` : (isStopwatch ? `${timerState.laps.length} отметок` : "Обратный отсчёт");
    return `<section class="view">
      <article class="panel clock-panel"><div class="live-clock" id="liveClock">--:--</div><div class="clock-date" id="clockDate"></div></article>
      <div class="tabs" role="tablist" aria-label="Режим таймера">
        <button type="button" class="${timerState.mode === "timer" ? "active" : ""}" data-timer-mode="timer">Таймер</button>
        <button type="button" class="${timerState.mode === "stopwatch" ? "active" : ""}" data-timer-mode="stopwatch">Секундомер</button>
        <button type="button" class="${timerState.mode === "interval" ? "active" : ""}" data-timer-mode="interval">Интервалы</button>
      </div>
      <div class="timer-layout">
        <article class="panel timer-display">
          <div><span class="eyebrow" id="timerRound">${modeLabel}</span><div class="timer-value" id="timerValue">${timerDisplayValue()}</div><div class="timer-phase" id="timerPhase">${timerPhaseLabel()}</div></div>
          ${timerState.mode === "timer" ? `<div class="preset-row">${[[30, "30 сек"], [60, "1 мин"], [300, "5 мин"], [600, "10 мин"]].map(([value, label]) => `<button type="button" data-preset="${value}">${label}</button>`).join("")}</div>` : ""}
          <div class="timer-controls"><button class="primary" type="button" data-action="toggle-timer">${icon(timerState.running ? "pause" : "play")} ${timerState.running ? "Пауза" : "Старт"}</button><button class="secondary" type="button" data-action="reset-timer">${icon("reset")} Сброс</button></div>
          ${isStopwatch && timerState.running ? `<button class="secondary" type="button" data-action="lap-timer">Отметить круг</button>` : ""}
        </article>
        <aside class="panel timer-settings">
          <div class="panel-head"><div><span class="eyebrow">НАСТРОЙКИ</span><h3>${timerState.mode === "interval" ? "Интервальная работа" : timerState.mode === "stopwatch" ? "Секундомер" : "Длительность"}</h3></div>${icon("clock")}</div>
          ${timerSettingsMarkup()}
          <div class="wake-line"><span><strong>Не гасить экран</strong><br />пока идёт отсчёт</span><button type="button" class="switch ${timerState.keepAwake ? "active" : ""}" data-action="toggle-wake" role="switch" aria-checked="${timerState.keepAwake}"></button></div>
          ${timerState.mode === "stopwatch" ? `<div class="laps" id="laps">${renderLaps()}</div>` : `<p class="data-note">При завершении прозвучит сигнал и, если устройство поддерживает, сработает вибрация.</p>`}
        </aside>
      </div>
    </section>`;
  }

  function timerSettingsMarkup() {
    if (timerState.mode === "interval") return `<div class="field-grid"><label class="field">Работа, сек<input id="workSeconds" type="number" min="5" max="3600" value="${timerState.work}" /></label><label class="field">Отдых, сек<input id="restSeconds" type="number" min="5" max="3600" value="${timerState.rest}" /></label></div><label class="field">Количество раундов<input id="roundCount" type="number" min="1" max="99" value="${timerState.rounds}" /></label><button class="secondary full" type="button" data-action="apply-interval">Применить параметры</button>`;
    if (timerState.mode === "stopwatch") return `<p class="data-note">Запускайте, ставьте на паузу и сохраняйте промежуточные круги. Отсчёт продолжится при переходе в другой раздел.</p>`;
    const seconds = Math.ceil(timerState.duration / 1000);
    return `<div class="field-grid"><label class="field">Минуты<input id="timerMinutes" type="number" min="0" max="180" value="${Math.floor(seconds / 60)}" /></label><label class="field">Секунды<input id="timerSeconds" type="number" min="0" max="59" value="${seconds % 60}" /></label></div><button class="secondary full" type="button" data-action="apply-timer">Применить время</button>`;
  }

  function renderNutrition() {
    const totals = getTotals();
    const target = state.calorieTarget;
    const remaining = target - totals.kcal;
    const macros = macroTargets();
    const percent = clamp(totals.kcal / target * 100, 0, 100);
    return `<section class="view">
      <div class="section-heading"><div><span class="eyebrow">БАЛАНС ДНЯ</span><h2>${formatNumber(totals.kcal)} из ${formatNumber(target)} ккал</h2><p>${remaining >= 0 ? `Осталось ${formatNumber(remaining)} ккал` : `Превышение на ${formatNumber(Math.abs(remaining))} ккал`}</p></div><span class="status-pill">${icon("kcal")} ${Math.round(percent)}%</span></div>
      <div class="tabs" role="tablist" aria-label="Раздел питания"><button type="button" class="${state.nutritionTab === "diary" ? "active" : ""}" data-nutrition-tab="diary">Дневник</button><button type="button" class="${state.nutritionTab === "calculator" ? "active" : ""}" data-nutrition-tab="calculator">Калькулятор нормы</button></div>
      ${state.nutritionTab === "diary" ? renderFoodDiary(totals, macros, percent) : renderCalorieCalculator()}
    </section>`;
  }

  function renderFoodDiary(totals, macros, percent) {
    return `<div class="nutrition-layout">
      <aside class="panel nutrition-summary">
        <div class="panel-head"><div><span class="eyebrow">СЕГОДНЯ</span><h3>Калории и БЖУ</h3></div>${icon("food")}</div>
        <div class="kcal-overview"><div class="kcal-ring" style="--progress:${percent * 3.6}deg"><div><strong>${Math.round(percent)}%</strong><small>дневной нормы</small></div></div><div class="remaining"><span>Осталось</span><strong>${formatNumber(Math.max(0, state.calorieTarget - totals.kcal))}</strong><span>килокалорий</span></div></div>
        <div class="macro-progress">${macroLine("Белки", totals.protein, macros.protein)}${macroLine("Жиры", totals.fat, macros.fat)}${macroLine("Углеводы", totals.carbs, macros.carbs)}</div>
        <button class="primary full" style="margin-top:20px" type="button" data-action="open-custom-food">${icon("plus")} Свой продукт</button>
      </aside>
      <div>
        <article class="panel">
          <div class="panel-head"><div><span class="eyebrow">ДОБАВИТЬ ПРОДУКТ</span><h3>Что вы съели?</h3></div></div>
          <label class="search-field" aria-label="Поиск продукта">${icon("search")}<input id="foodSearch" type="search" placeholder="Например, курица или гречка" autocomplete="off" /></label>
          <div class="food-results" id="foodResults">${foodResultsMarkup("")}</div>
        </article>
        <div id="mealLog">${mealLogMarkup()}</div>
      </div>
    </div>`;
  }

  function macroLine(label, value, target) {
    const percent = clamp(value / target * 100, 0, 100);
    return `<div><header><span>${label}</span><strong>${formatNumber(value)} / ${target} г</strong></header><div class="progress-track"><i style="width:${percent}%"></i></div></div>`;
  }

  function foodResultsMarkup(query) {
    const normalized = query.trim().toLocaleLowerCase("ru");
    const results = foodDatabase.filter(food => !normalized || food.name.toLocaleLowerCase("ru").includes(normalized)).slice(0, normalized ? 8 : 5);
    if (!results.length) return `<div class="empty-state">Продукт не найден. Добавьте его через кнопку «Свой продукт».</div>`;
    return results.map(food => `<button class="food-result" type="button" data-action="add-food" data-food="${food.id}"><div><strong>${food.name}</strong><small>Б ${food.protein} · Ж ${food.fat} · У ${food.carbs} на 100 г</small></div><span>${food.kcal} ккал</span><span class="round-icon">${icon("plus")}</span></button>`).join("");
  }

  function mealLogMarkup() {
    const logs = getLogs();
    return Object.entries(mealNames).map(([meal, label]) => {
      const items = logs.filter(item => item.meal === meal);
      const kcal = items.reduce((sum, item) => sum + item.kcal, 0);
      return `<section class="meal-section"><header class="meal-head"><h3>${label}</h3><span>${formatNumber(kcal)} ккал</span></header>${items.length ? items.map(item => `<div class="food-entry"><div><strong>${esc(item.name)}</strong><small>${formatNumber(item.grams)} г · Б ${formatNumber(item.protein)} · Ж ${formatNumber(item.fat)} · У ${formatNumber(item.carbs)}</small></div><span>${formatNumber(item.kcal)} ккал</span><button class="icon-plain danger" type="button" data-action="delete-food" data-entry="${item.id}" aria-label="Удалить ${esc(item.name)}">${icon("trash")}</button></div>`).join("") : `<div class="meal-empty">Пока ничего не добавлено</div>`}</section>`;
    }).join("");
  }

  function renderCalorieCalculator() {
    const c = state.calculator;
    return `<div class="nutrition-layout">
      <article class="panel calculator-form">
        <div class="panel-head"><div><span class="eyebrow">ВАШИ ДАННЫЕ</span><h3>Рассчитать ориентир</h3></div>${icon("kcal")}</div>
        <label class="field">Пол<select id="calcSex"><option value="male" ${c.sex === "male" ? "selected" : ""}>Мужской</option><option value="female" ${c.sex === "female" ? "selected" : ""}>Женский</option></select></label>
        <div class="field-grid"><label class="field">Возраст<input id="calcAge" type="number" min="14" max="100" value="${c.age}" /></label><label class="field">Вес, кг<input id="calcWeight" type="number" min="30" max="300" step="0.1" value="${c.weight}" /></label></div>
        <label class="field">Рост, см<input id="calcHeight" type="number" min="120" max="230" value="${c.height}" /></label>
        <label class="field">Активность<select id="calcActivity"><option value="1.2" ${Number(c.activity) === 1.2 ? "selected" : ""}>Минимальная</option><option value="1.375" ${Number(c.activity) === 1.375 ? "selected" : ""}>1–3 тренировки в неделю</option><option value="1.55" ${Number(c.activity) === 1.55 ? "selected" : ""}>3–5 тренировок в неделю</option><option value="1.725" ${Number(c.activity) === 1.725 ? "selected" : ""}>Высокая активность</option></select></label>
        <label class="field">Цель<select id="calcGoal"><option value="lose" ${c.goal === "lose" ? "selected" : ""}>Снижение веса</option><option value="maintain" ${c.goal === "maintain" ? "selected" : ""}>Поддержание веса</option><option value="gain" ${c.goal === "gain" ? "selected" : ""}>Набор веса</option></select></label>
        <button class="primary full" type="button" data-action="calculate-calories">Рассчитать норму</button>
      </article>
      <aside class="panel">
        <span class="eyebrow">ТЕКУЩАЯ ЦЕЛЬ</span><div class="calc-result"><small>Ориентир на день</small><strong>${formatNumber(state.calorieTarget)} ккал</strong><p>Расчёт выполнен по формуле Миффлина — Сан Жеора с поправкой на активность и выбранную цель.</p></div>
        <div class="safety-note" style="margin-top:16px">${icon("info")}<div>Калькулятор даёт приблизительный ориентир. При заболеваниях, восстановлении после операции, беременности или расстройствах пищевого поведения рацион лучше обсуждать со специалистом.</div></div>
      </aside>
    </div>`;
  }

  function renderJournal() {
    const tabs = [["today", "Сегодня"], ["week", "7 дней"], ["reminders", "Напоминания"]];
    return `<section class="view">
      <div class="section-heading"><div><span class="eyebrow">ВСЁ В ОДНОМ МЕСТЕ</span><h2>Умный дневник</h2><p>Питание и ЛФК считаются автоматически, остальные показатели добавляете вы.</p></div><span class="status-pill">${icon(state.journalTab === "reminders" ? "bell" : "journal")} ${state.journalTab === "reminders" ? "Расписание" : "Моя динамика"}</span></div>
      <div class="tabs" role="tablist" aria-label="Раздел умного дневника">${tabs.map(([key, label]) => `<button type="button" class="${state.journalTab === key ? "active" : ""}" data-journal-tab="${key}">${label}</button>`).join("")}</div>
      ${state.journalTab === "today" ? renderDailyJournal() : state.journalTab === "week" ? renderWeekJournal() : renderReminders()}
    </section>`;
  }

  function renderDailyJournal() {
    const date = state.journalDate || todayKey();
    const log = getDailyLog(date);
    const totals = getTotals(date);
    const sessions = sessionsForDate(date);
    const insight = smartInsight(date);
    const scaleOptions = value => `<option value="">Не указано</option>${Array.from({ length: 11 }, (_, index) => `<option value="${index}" ${String(value) === String(index) ? "selected" : ""}>${index}</option>`).join("")}`;
    return `<div class="journal-layout">
      <form class="panel smart-form" id="smartLogForm">
        <div class="panel-head"><div><span class="eyebrow">ЕЖЕДНЕВНАЯ ЗАПИСЬ</span><h3>${formatDay(date, true)}</h3></div>${icon("calendar")}</div>
        <label class="field">Дата<input id="journalDate" type="date" value="${date}" max="${todayKey()}" /></label>
        <div class="field-grid"><label class="field">Вес, кг<input id="journalWeight" type="number" min="25" max="350" step="0.1" value="${esc(log.weight)}" placeholder="Например, 65" /></label><label class="field">Сон, часов<input id="journalSleep" type="number" min="0" max="24" step="0.1" value="${esc(log.sleep)}" placeholder="Например, 8" /></label></div>
        <div class="field-grid"><label class="field">Вода, мл<input id="journalWater" type="number" min="0" max="10000" step="50" value="${esc(log.water)}" placeholder="1500" /></label><label class="field">Шаги<input id="journalSteps" type="number" min="0" max="100000" step="100" value="${esc(log.steps)}" placeholder="6000" /></label></div>
        <div class="field-grid"><label class="field">Велотренажёр, минут<input id="journalBikeMinutes" type="number" min="0" max="600" step="1" value="${esc(log.bikeMinutes)}" placeholder="15" /></label><label class="field">Сопротивление<input id="journalBikeResistance" type="number" min="0" max="30" step="1" value="${esc(log.bikeResistance)}" placeholder="4" /></label></div>
        <div class="field-grid"><label class="field">Боль до нагрузки, 0–10<select id="journalPainBefore">${scaleOptions(log.painBefore)}</select></label><label class="field">Боль после, 0–10<select id="journalPainAfter">${scaleOptions(log.painAfter)}</select></label></div>
        <label class="field">Энергия<select id="journalEnergy"><option value="">Не указано</option>${[[1, "1 — сил мало"], [2, "2 — ниже обычного"], [3, "3 — нормально"], [4, "4 — хорошо"], [5, "5 — отлично"]].map(([value, label]) => `<option value="${value}" ${String(log.energy) === String(value) ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label class="field">Заметка<textarea id="journalNote" maxlength="300" placeholder="Что было легко или сложно?">${esc(log.note)}</textarea></label>
        <button class="primary full" type="submit">${icon("check")} Сохранить запись</button>
      </form>
      <aside class="journal-side">
        <article class="panel insight-card ${insight.tone}"><span class="eyebrow">УМНАЯ ПОДСКАЗКА</span><h3>${insight.title}</h3><p>${insight.text}</p></article>
        <article class="panel"><div class="panel-head"><div><span class="eyebrow">АВТОМАТИЧЕСКИ</span><h3>Данные за день</h3></div>${icon("activity")}</div><div class="auto-data-grid"><div><span>ЛФК</span><strong>${sessions}</strong><small>занятий</small></div><div><span>Калории</span><strong>${formatNumber(totals.kcal)}</strong><small>ккал</small></div><div><span>Белок</span><strong>${formatNumber(totals.protein)}</strong><small>граммов</small></div><div><span>Записей еды</span><strong>${getLogs(date).length}</strong><small>за день</small></div></div></article>
        <article class="safety-note">${icon("info")}<div>Дневник показывает динамику, но не ставит диагноз. Резкую боль, отёк или заметное ухудшение самочувствия лучше обсудить со специалистом.</div></article>
      </aside>
    </div>`;
  }

  function renderWeekJournal() {
    const dates = recentDateKeys(7);
    const records = dates.map(date => ({ date, log: getDailyLog(date), totals: getTotals(date), sessions: sessionsForDate(date) }));
    const logged = records.filter(({ log }) => Object.values(log).some(value => value !== "" && value !== null));
    const sleepValues = logged.map(({ log }) => Number(log.sleep)).filter(value => value > 0);
    const averageSleep = sleepValues.length ? sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length : 0;
    const totalSteps = logged.reduce((sum, { log }) => sum + (Number(log.steps) || 0), 0);
    const totalWater = logged.reduce((sum, { log }) => sum + (Number(log.water) || 0), 0);
    const sessionCount = records.reduce((sum, record) => sum + record.sessions, 0);
    const rowMarkup = ({ date, log, totals, sessions }) => `<tr class="${painStatus(log)}"><td><button type="button" class="date-link" data-journal-date="${date}">${formatDay(date, true)}</button></td><td>${sessions || "—"}</td><td>${valueOrDash(log.bikeMinutes, " мин")}</td><td>${totals.kcal ? formatNumber(totals.kcal) : "—"}</td><td>${totals.protein ? `${formatNumber(totals.protein)} г` : "—"}</td><td>${valueOrDash(log.water, " мл")}</td><td>${valueOrDash(log.steps)}</td><td>${valueOrDash(log.sleep, " ч")}</td><td>${log.painBefore !== "" || log.painAfter !== "" ? `${log.painBefore === "" ? "—" : log.painBefore} → ${log.painAfter === "" ? "—" : log.painAfter}` : "—"}</td><td>${valueOrDash(log.weight, " кг")}</td></tr>`;
    const cardMarkup = ({ date, log, totals, sessions }) => `<button class="week-day-card ${painStatus(log)}" type="button" data-journal-date="${date}"><header><strong>${formatDay(date, true)}</strong><span>${sessions ? "ЛФК ✓" : "ЛФК —"}</span></header><div><span>Ккал<strong>${totals.kcal ? formatNumber(totals.kcal) : "—"}</strong></span><span>Шаги<strong>${valueOrDash(log.steps)}</strong></span><span>Сон<strong>${valueOrDash(log.sleep, " ч")}</strong></span><span>Боль<strong>${log.painBefore !== "" || log.painAfter !== "" ? `${log.painBefore === "" ? "—" : log.painBefore} → ${log.painAfter === "" ? "—" : log.painAfter}` : "—"}</strong></span></div></button>`;
    return `<div class="week-stack">
      <div class="week-summary">${[["ЛФК", sessionCount, "занятий"], ["Сон", averageSleep ? averageSleep.toFixed(1) : "—", "среднее, ч"], ["Шаги", formatNumber(totalSteps), "за неделю"], ["Вода", formatNumber(totalWater), "мл записано"]].map(([label, value, detail]) => `<article class="metric-card"><span>${label.toUpperCase()}</span><strong>${value}</strong><small>${detail}</small></article>`).join("")}</div>
      <article class="panel week-table-panel"><div class="panel-head"><div><span class="eyebrow">ПОСЛЕДНИЕ 7 ДНЕЙ</span><h3>Умная таблица</h3><p>Нажмите на дату, чтобы заполнить или изменить запись.</p></div><span class="status-pill">${logged.length}/7 заполнено</span></div><div class="smart-table-wrap"><table class="smart-table"><thead><tr><th>Дата</th><th>ЛФК</th><th>Вело</th><th>Ккал</th><th>Белок</th><th>Вода</th><th>Шаги</th><th>Сон</th><th>Боль</th><th>Вес</th></tr></thead><tbody>${records.map(rowMarkup).join("")}</tbody></table></div><div class="week-mobile-list">${records.map(cardMarkup).join("")}</div></article>
      <div class="safety-note">${icon("info")}<div><strong>Цвет строки — только ориентир.</strong> Красная отметка означает, что введённая боль выросла минимум на 2 пункта или достигла 7 из 10.</div></div>
    </div>`;
  }

  function renderReminders() {
    const next = getNextReminder();
    const permission = "Notification" in window ? Notification.permission : "unsupported";
    const statusText = permission === "granted" ? "Уведомления разрешены" : permission === "denied" ? "Уведомления запрещены в настройках" : permission === "unsupported" ? "Используйте календарь iPhone" : "Разрешите уведомления";
    const reminders = [...state.reminders].sort((a, b) => (nextDateForReminder(a)?.getTime() || Infinity) - (nextDateForReminder(b)?.getTime() || Infinity));
    return `<div class="reminder-layout">
      <div class="reminder-main">
        <article class="panel next-reminder-card"><span class="eyebrow">БЛИЖАЙШЕЕ НАПОМИНАНИЕ</span><div class="next-reminder-time">${next ? next.time : "—"}</div><h3>${next ? esc(next.title) : "Расписание пока пустое"}</h3><p>${next ? formatNextReminder(next) : "Добавьте первое напоминание ниже."}</p></article>
        <article class="panel"><div class="panel-head"><div><span class="eyebrow">МОЁ РАСПИСАНИЕ</span><h3>Активные напоминания</h3></div><span class="status-pill">${state.reminders.filter(item => item.active).length} включено</span></div><div class="reminder-list">${reminders.length ? reminders.map(reminderCardMarkup).join("") : `<div class="empty-state">Добавьте напоминание о ЛФК, воде, питании или замере.</div>`}</div></article>
      </div>
      <aside class="reminder-side">
        <form class="panel reminder-form" id="reminderForm"><div class="panel-head"><div><span class="eyebrow">НОВОЕ</span><h3>Добавить напоминание</h3></div>${icon("bell")}</div><label class="field">Название<input id="reminderTitle" required maxlength="60" placeholder="Например, ЛФК для колена" /></label><div class="field-grid"><label class="field">Время<input id="reminderTime" required type="time" value="10:00" /></label><label class="field">Повтор<select id="reminderRepeat"><option value="daily">Каждый день</option><option value="weekdays">По будням</option><option value="once">Один раз</option></select></label></div><label class="field">Дата для разового напоминания<input id="reminderDate" type="date" min="${todayKey()}" value="${todayKey()}" /></label><button class="primary full" type="submit">${icon("plus")} Добавить</button><div class="quick-reminders"><button type="button" data-reminder-template="lfk">ЛФК · 10:00</button><button type="button" data-reminder-template="water">Вода · 12:00</button><button type="button" data-reminder-template="check">Запись · 20:00</button></div></form>
        <article class="panel notification-card"><div class="panel-head"><span class="round-icon">${icon("bell")}</span><span class="status-pill">${statusText}</span></div><h3>Уведомления на iPhone</h3><p>Внутри веб-приложения сигнал работает, пока VECTOR открыт. Кнопка «В календарь» создаёт системное напоминание, которое работает и после закрытия.</p>${permission === "default" ? `<button class="secondary full" type="button" data-action="request-notifications">Разрешить уведомления</button>` : ""}</article>
      </aside>
    </div>`;
  }

  function reminderCardMarkup(reminder) {
    const nextDate = nextDateForReminder(reminder);
    return `<div class="reminder-card ${reminder.active ? "" : "disabled"}"><div class="reminder-clock"><strong>${reminder.time}</strong><small>${repeatLabel(reminder)}</small></div><div class="reminder-copy"><strong>${esc(reminder.title)}</strong><small>${nextDate ? formatNextReminder({ ...reminder, nextAt: nextDate }) : "Время прошло"}</small></div><button type="button" class="switch ${reminder.active ? "active" : ""}" data-reminder-toggle="${reminder.id}" role="switch" aria-checked="${reminder.active}" aria-label="${reminder.active ? "Выключить" : "Включить"} напоминание"></button><div class="reminder-actions"><button class="icon-plain" type="button" data-reminder-export="${reminder.id}" aria-label="Добавить в календарь">${icon("download")}</button><button class="icon-plain danger" type="button" data-reminder-delete="${reminder.id}" aria-label="Удалить напоминание">${icon("trash")}</button></div></div>`;
  }

  function repeatLabel(reminder) {
    if (reminder.repeat === "weekdays") return "по будням";
    if (reminder.repeat === "once") return formatDay(reminder.date, true);
    return "каждый день";
  }

  function nextDateForReminder(reminder, from = new Date()) {
    if (!reminder.active) return null;
    const [hours, minutes] = String(reminder.time || "00:00").split(":").map(Number);
    if (reminder.repeat === "once") {
      const date = new Date(`${reminder.date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
      return date > from ? date : null;
    }
    const candidate = new Date(from);
    candidate.setSeconds(0, 0);
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate <= from) candidate.setDate(candidate.getDate() + 1);
    if (reminder.repeat === "weekdays") {
      while (candidate.getDay() === 0 || candidate.getDay() === 6) candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  function getNextReminder() {
    return state.reminders.filter(item => item.active).map(item => ({ ...item, nextAt: nextDateForReminder(item) })).filter(item => item.nextAt).sort((a, b) => a.nextAt - b.nextAt)[0] || null;
  }

  function formatNextReminder(reminder) {
    const date = reminder.nextAt || nextDateForReminder(reminder);
    if (!date) return "время прошло";
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sameDay = value => value.getFullYear() === date.getFullYear() && value.getMonth() === date.getMonth() && value.getDate() === date.getDate();
    const day = sameDay(today) ? "сегодня" : sameDay(tomorrow) ? "завтра" : new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "short" }).format(date);
    return `${day} в ${reminder.time} · ${repeatLabel(reminder)}`;
  }

  function saveDailyJournal() {
    const date = document.getElementById("journalDate").value || todayKey();
    const fieldValue = id => document.getElementById(id)?.value.trim() || "";
    state.journalDate = date;
    state.dailyLogs[date] = {
      weight: fieldValue("journalWeight"),
      water: fieldValue("journalWater"),
      sleep: fieldValue("journalSleep"),
      steps: fieldValue("journalSteps"),
      bikeMinutes: fieldValue("journalBikeMinutes"),
      bikeResistance: fieldValue("journalBikeResistance"),
      painBefore: fieldValue("journalPainBefore"),
      painAfter: fieldValue("journalPainAfter"),
      energy: fieldValue("journalEnergy"),
      note: fieldValue("journalNote")
    };
    saveState();
    render();
    toast("Запись сохранена в умной таблице");
  }

  function addReminder() {
    const title = document.getElementById("reminderTitle").value.trim();
    const time = document.getElementById("reminderTime").value;
    const repeat = document.getElementById("reminderRepeat").value;
    const date = document.getElementById("reminderDate").value || todayKey();
    if (!title || !time) return toast("Введите название и время");
    const reminder = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title, time, repeat, date, active: true };
    if (repeat === "once" && !nextDateForReminder(reminder)) return toast("Выберите будущее время для разового напоминания");
    state.reminders.push(reminder);
    saveState();
    render();
    toast("Напоминание добавлено");
  }

  function addReminderTemplate(template) {
    const templates = {
      lfk: { title: "Время для ЛФК", time: "10:00", repeat: "daily" },
      water: { title: "Выпить воды", time: "12:00", repeat: "daily" },
      check: { title: "Заполнить дневник", time: "20:00", repeat: "daily" }
    };
    const selected = templates[template];
    if (!selected) return;
    state.reminders.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...selected, date: todayKey(), active: true });
    saveState();
    render();
    toast(`${selected.title}: добавлено`);
  }

  function toggleReminder(id) {
    const reminder = state.reminders.find(item => item.id === id);
    if (!reminder) return;
    reminder.active = !reminder.active;
    saveState();
    render();
    toast(reminder.active ? "Напоминание включено" : "Напоминание выключено");
  }

  function deleteReminder(id) {
    state.reminders = state.reminders.filter(item => item.id !== id);
    saveState();
    render();
    toast("Напоминание удалено");
  }

  async function requestNotifications() {
    if (!("Notification" in window)) return toast("На этом устройстве используйте добавление в календарь");
    try {
      const permission = await Notification.requestPermission();
      render();
      toast(permission === "granted" ? "Уведомления разрешены" : "Разрешение не получено");
    } catch {
      toast("Установите VECTOR на экран «Домой» и повторите");
    }
  }

  function icsDate(date, utc = false) {
    const get = part => utc ? date[`getUTC${part}`]() : date[`get${part}`]();
    return `${get("FullYear")}${String(get("Month") + 1).padStart(2, "0")}${String(get("Date")).padStart(2, "0")}T${String(get("Hours")).padStart(2, "0")}${String(get("Minutes")).padStart(2, "0")}${String(get("Seconds")).padStart(2, "0")}${utc ? "Z" : ""}`;
  }

  function icsEscape(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }

  function exportReminder(id) {
    const reminder = state.reminders.find(item => item.id === id);
    if (!reminder) return;
    let start = nextDateForReminder({ ...reminder, active: true });
    if (!start && reminder.repeat === "once") return toast("Время этого напоминания уже прошло");
    if (!start) start = new Date();
    const end = new Date(start.getTime() + 15 * 60 * 1000);
    const rule = reminder.repeat === "daily" ? "RRULE:FREQ=DAILY" : reminder.repeat === "weekdays" ? "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" : "";
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "CALSCALE:GREGORIAN", "PRODID:-//VECTOR Health//RU", "BEGIN:VEVENT", `UID:${reminder.id}@vector-health`, `DTSTAMP:${icsDate(new Date(), true)}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`, `SUMMARY:${icsEscape(reminder.title)}`, "DESCRIPTION:Напоминание из VECTOR Здоровье", rule, "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(reminder.title)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].filter(Boolean);
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vector-${reminder.id}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast("Откройте файл и добавьте событие в календарь");
  }

  async function showReminderNotification(reminder) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(reminder.title, { body: `Время: ${reminder.time}`, icon: "./assets/vector.svg", tag: `vector-${reminder.id}` });
      } else {
        new Notification(reminder.title, { body: `Время: ${reminder.time}` });
      }
    } catch { /* notification support differs across browsers */ }
  }

  function checkReminders() {
    if (!state.reminders.length) return;
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    state.reminders.forEach(reminder => {
      if (!reminder.active || reminder.time !== time) return;
      const allowed = reminder.repeat === "daily" || (reminder.repeat === "weekdays" && now.getDay() >= 1 && now.getDay() <= 5) || (reminder.repeat === "once" && reminder.date === date);
      const key = `${reminder.id}-${date}-${time}`;
      if (!allowed || firedReminders.has(key)) return;
      firedReminders.add(key);
      toast(`Напоминание: ${reminder.title}`);
      signalDone();
      showReminderNotification(reminder);
      if (reminder.repeat === "once") {
        reminder.active = false;
        saveState();
      }
    });
  }

  function renderProfile() {
    const logCount = Object.values(state.foodLogs).reduce((sum, day) => sum + day.length, 0);
    const diaryCount = Object.keys(state.dailyLogs).length;
    return `<section class="view">
      <div class="profile-grid">
        <article class="panel profile-card"><div class="avatar">V</div><div><span class="eyebrow">МОЙ ПРОФИЛЬ</span><h2>VECTOR Здоровье</h2><p>${state.completedSessions.length} занятий · ${logCount} записей питания · ${diaryCount} дней наблюдений</p></div></article>
        <article class="panel"><p class="setting-label">РЕЖИМ ЭКРАНА</p><div class="mode-grid">${[["system", "monitor", "Системный"], ["light", "sun", "Светлый"], ["dark", "moon", "Тёмный"]].map(([mode, iconName, label]) => `<button type="button" class="${state.mode === mode ? "active" : ""}" data-mode="${mode}">${icon(iconName)}<span>${label}</span></button>`).join("")}</div></article>
      </div>
      <article class="panel"><p class="setting-label">ЦВЕТОВАЯ ТЕМА</p><div class="theme-grid">${themeOptions.map(([key, label, color]) => `<button class="theme-dot ${state.theme === key ? "active" : ""}" type="button" data-theme-choice="${key}" style="--dot:${color}"><i></i><span>${label}</span></button>`).join("")}</div></article>
      <article class="panel"><div class="panel-head"><div><span class="eyebrow">ДАННЫЕ</span><h3>Хранятся на этом устройстве</h3><p>Питание, умный дневник, напоминания и прогресс занятий доступны без регистрации.</p></div></div><p class="data-note">Если очистить данные браузера или удалить приложение с экрана «Домой», локальная история может исчезнуть. Напоминания, добавленные в календарь iPhone, останутся в календаре.</p><button class="danger-button" type="button" data-action="clear-data">Очистить все данные</button></article>
    </section>`;
  }

  function render() {
    applyAppearance();
    renderNav();
    renderHeader();
    const renderer = { home: renderHome, lfk: renderLfk, timer: renderTimer, nutrition: renderNutrition, journal: renderJournal, profile: renderProfile }[state.view];
    root.innerHTML = renderer();
    updateLiveClock();
  }

  function openProgram(programId) {
    const program = programs.find(item => item.id === programId);
    if (!program) return;
    programDialog.innerHTML = `<div class="dialog-head"><div><span class="eyebrow">${program.type === "retro" ? "ГИМНАСТИКА СССР · АДАПТАЦИЯ" : "КОМПЛЕКС ЛФК"}</span><h2>${program.title}</h2></div><button class="icon-button" type="button" data-dialog-close aria-label="Закрыть">×</button></div><div class="dialog-body"><div class="button-row"><span class="tag">${program.duration} минут</span><span class="tag">${program.exercises.length} упражнений</span></div><div class="exercise-steps">${program.exercises.map((exercise, index) => `<div class="exercise-step"><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${exercise[0]}</strong><small>${exercise[1]}</small></div><small>${exercise[2]} сек</small></div>`).join("")}</div><div class="safety-note">${icon("info")}<div>Выполняйте только упражнения, которые разрешены вашим врачом или реабилитологом.</div></div><button class="primary full" style="margin-top:17px" type="button" data-start-program="${program.id}">${icon("play")} Начать с таймером</button></div>`;
    showDialog(programDialog);
  }

  function startProgram(programId) {
    const program = programs.find(item => item.id === programId);
    if (!program) return;
    sessionState = { program, index: 0, remaining: program.exercises[0][2] * 1000, running: true, startedAt: Date.now() };
    renderSessionPlayer();
    requestKeepAwake();
  }

  function renderSessionPlayer() {
    if (!sessionState) return;
    const { program, index, remaining, running } = sessionState;
    const exercise = program.exercises[index];
    programDialog.innerHTML = `<div class="dialog-head"><div><span class="eyebrow">ЗАНЯТИЕ · ${index + 1}/${program.exercises.length}</span><h2>${program.title}</h2></div><button class="icon-button" type="button" data-end-session aria-label="Завершить">×</button></div><div class="dialog-body session-player"><div class="session-name"><small>ТЕКУЩЕЕ УПРАЖНЕНИЕ</small><h3>${exercise[0]}</h3><p class="muted">${exercise[1]}</p></div><div class="timer-value" id="sessionTimer">${formatTimer(remaining)}</div><div class="progress-track"><i id="sessionProgress" style="width:${clamp(remaining / (exercise[2] * 1000) * 100, 0, 100)}%"></i></div><div class="timer-controls"><button class="primary" type="button" data-session-toggle>${icon(running ? "pause" : "play")} ${running ? "Пауза" : "Продолжить"}</button><button class="secondary" type="button" data-session-next>Далее ${icon("chevron")}</button></div></div>`;
  }

  function completeSession() {
    if (!sessionState) return;
    const program = sessionState.program;
    state.completedSessions.push({ id: `${Date.now()}`, programId: program.id, title: program.title, date: todayKey() });
    saveState();
    sessionState = null;
    releaseWakeLock();
    programDialog.innerHTML = `<div class="dialog-head"><div><span class="eyebrow">ГОТОВО</span><h2>Комплекс завершён</h2></div><button class="icon-button" type="button" data-dialog-close aria-label="Закрыть">×</button></div><div class="dialog-body session-player"><div class="day-ring" style="--progress:360deg;margin:0 auto"><div><strong>100%</strong><small>выполнено</small></div></div><h3>Хорошая работа</h3><p class="muted">Занятие сохранено в вашей локальной истории.</p><button class="primary full" type="button" data-dialog-close>Закрыть</button></div>`;
    signalDone();
  }

  function openFoodDialog(foodId) {
    const food = foodDatabase.find(item => item.id === foodId);
    if (!food) return;
    foodDialog.dataset.foodId = food.id;
    foodDialog.innerHTML = `<div class="dialog-head"><div><span class="eyebrow">ДОБАВИТЬ ПРОДУКТ</span><h2>${food.name}</h2></div><button class="icon-button" type="button" data-dialog-close aria-label="Закрыть">×</button></div><form class="dialog-body" id="foodForm"><label class="field">Приём пищи<select id="foodMeal">${Object.entries(mealNames).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label><label class="field">Вес порции, г<div class="portion-control"><button class="icon-plain" type="button" data-portion="-10">${icon("minus")}</button><input id="foodGrams" type="number" min="1" max="3000" step="1" value="100" /><button class="icon-plain" type="button" data-portion="10">${icon("plus")}</button></div></label><div class="calc-result"><small>В этой порции</small><strong id="portionKcal">${food.kcal} ккал</strong><p id="portionMacros">Белки ${food.protein} г · жиры ${food.fat} г · углеводы ${food.carbs} г</p></div><div class="dialog-actions"><button class="secondary" type="button" data-dialog-close>Отмена</button><button class="primary" type="submit">Добавить</button></div></form>`;
    showDialog(foodDialog);
  }

  function openCustomFoodDialog() {
    delete foodDialog.dataset.foodId;
    foodDialog.innerHTML = `<div class="dialog-head"><div><span class="eyebrow">СВОЙ ПРОДУКТ</span><h2>Добавить вручную</h2></div><button class="icon-button" type="button" data-dialog-close aria-label="Закрыть">×</button></div><form class="dialog-body calculator-form" id="customFoodForm"><label class="field">Название<input id="customName" required maxlength="60" placeholder="Название продукта" /></label><label class="field">Приём пищи<select id="customMeal">${Object.entries(mealNames).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label><div class="field-grid"><label class="field">Ккал на 100 г<input id="customKcal" required type="number" min="0" max="1000" step="0.1" /></label><label class="field">Вес порции, г<input id="customGrams" required type="number" min="1" max="3000" value="100" /></label></div><div class="field-grid"><label class="field">Белки / 100 г<input id="customProtein" type="number" min="0" max="100" step="0.1" value="0" /></label><label class="field">Жиры / 100 г<input id="customFat" type="number" min="0" max="100" step="0.1" value="0" /></label></div><label class="field">Углеводы / 100 г<input id="customCarbs" type="number" min="0" max="100" step="0.1" value="0" /></label><div class="dialog-actions"><button class="secondary" type="button" data-dialog-close>Отмена</button><button class="primary" type="submit">Добавить</button></div></form>`;
    showDialog(foodDialog);
  }

  function addFoodEntry(source, grams, meal) {
    const factor = grams / 100;
    const entry = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: source.name, meal, grams, kcal: source.kcal * factor, protein: source.protein * factor, fat: source.fat * factor, carbs: source.carbs * factor };
    state.foodLogs[todayKey()] = [...getLogs(), entry];
    saveState();
    toast(`${source.name}: добавлено ${formatNumber(entry.kcal)} ккал`);
    if (foodDialog.open) foodDialog.close();
    render();
  }

  function deleteFoodEntry(entryId) {
    state.foodLogs[todayKey()] = getLogs().filter(item => item.id !== entryId);
    saveState();
    render();
    toast("Запись удалена");
  }

  function calculateCalories() {
    const sex = document.getElementById("calcSex").value;
    const age = Number(document.getElementById("calcAge").value);
    const weight = Number(document.getElementById("calcWeight").value);
    const height = Number(document.getElementById("calcHeight").value);
    const activity = Number(document.getElementById("calcActivity").value);
    const goal = document.getElementById("calcGoal").value;
    if (!age || !weight || !height || age < 14 || weight < 30 || height < 120) return toast("Проверьте возраст, вес и рост");
    const base = 10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161);
    const adjustment = goal === "lose" ? .85 : goal === "gain" ? 1.10 : 1;
    const target = Math.round(base * activity * adjustment / 10) * 10;
    state.calculator = { sex, age, weight, height, activity, goal };
    state.calorieTarget = target;
    saveState();
    render();
    toast(`Новая цель: ${formatNumber(target)} ккал`);
  }

  function timerDisplayValue() {
    return timerState.mode === "stopwatch" ? formatStopwatch(timerState.elapsed) : formatTimer(timerState.remaining);
  }

  function timerPhaseLabel() {
    if (timerState.mode !== "interval") return timerState.running ? "Идёт отсчёт" : timerState.remaining === 0 ? "Завершено" : "Готов к запуску";
    return timerState.phase === "work" ? "Работа" : "Отдых";
  }

  function formatTimer(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total % 3600 / 60);
    const seconds = total % 60;
    return hours ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatStopwatch(ms) {
    const totalTenths = Math.floor(ms / 100);
    const minutes = Math.floor(totalTenths / 600);
    const seconds = Math.floor(totalTenths % 600 / 10);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${totalTenths % 10}`;
  }

  function toggleTimer() {
    if (timerState.running) {
      if (timerState.mode === "stopwatch") timerState.elapsed += Date.now() - timerState.startedAt;
      else timerState.remaining = Math.max(0, timerState.remaining - (Date.now() - timerState.startedAt));
      timerState.running = false;
      releaseWakeLock();
    } else {
      if (timerState.mode !== "stopwatch" && timerState.remaining <= 0) resetTimer();
      timerState.startedAt = Date.now();
      timerState.running = true;
      requestKeepAwake();
    }
    render();
  }

  function resetTimer() {
    timerState.running = false;
    timerState.elapsed = 0;
    timerState.laps = [];
    timerState.currentRound = 1;
    timerState.phase = "work";
    timerState.remaining = timerState.mode === "interval" ? timerState.work * 1000 : timerState.duration;
    releaseWakeLock();
    if (state.view === "timer") render();
  }

  function setTimerMode(mode) {
    timerState.running = false;
    timerState.mode = mode;
    timerState.elapsed = 0;
    timerState.laps = [];
    timerState.currentRound = 1;
    timerState.phase = "work";
    timerState.remaining = mode === "interval" ? timerState.work * 1000 : timerState.duration;
    releaseWakeLock();
    render();
  }

  function applyTimerInputs() {
    const minutes = clamp(Number(document.getElementById("timerMinutes").value) || 0, 0, 180);
    const seconds = clamp(Number(document.getElementById("timerSeconds").value) || 0, 0, 59);
    const duration = (minutes * 60 + seconds) * 1000;
    if (!duration) return toast("Укажите время больше нуля");
    timerState.duration = duration;
    timerState.remaining = duration;
    timerState.running = false;
    render();
  }

  function applyIntervalInputs() {
    timerState.work = clamp(Number(document.getElementById("workSeconds").value) || 40, 5, 3600);
    timerState.rest = clamp(Number(document.getElementById("restSeconds").value) || 20, 5, 3600);
    timerState.rounds = clamp(Number(document.getElementById("roundCount").value) || 6, 1, 99);
    resetTimer();
    toast("Интервалы обновлены");
  }

  function renderLaps() {
    if (!timerState.laps.length) return `<div class="meal-empty">Кругов пока нет</div>`;
    return timerState.laps.map((lap, index) => `<div class="lap"><span>Круг ${timerState.laps.length - index}</span><strong>${formatStopwatch(lap)}</strong></div>`).join("");
  }

  function tickTimers() {
    updateLiveClock();
    const now = Date.now();
    if (timerState.running) {
      if (timerState.mode === "stopwatch") {
        updateTimerDom(timerState.elapsed + now - timerState.startedAt);
      } else {
        const remaining = Math.max(0, timerState.remaining - (now - timerState.startedAt));
        updateTimerDom(remaining);
        if (remaining <= 0) handleTimerEnd();
      }
    }
    tickSession(now);
  }

  function handleTimerEnd() {
    timerState.running = false;
    timerState.remaining = 0;
    signalDone();
    if (timerState.mode === "interval") {
      if (timerState.phase === "work") {
        timerState.phase = "rest";
        timerState.remaining = timerState.rest * 1000;
        timerState.startedAt = Date.now();
        timerState.running = true;
      } else if (timerState.currentRound < timerState.rounds) {
        timerState.currentRound += 1;
        timerState.phase = "work";
        timerState.remaining = timerState.work * 1000;
        timerState.startedAt = Date.now();
        timerState.running = true;
      } else {
        toast("Все интервалы завершены");
        releaseWakeLock();
      }
    } else {
      toast("Время вышло");
      releaseWakeLock();
    }
    if (state.view === "timer") render();
  }

  function updateTimerDom(value) {
    const display = document.getElementById("timerValue");
    if (display) display.textContent = timerState.mode === "stopwatch" ? formatStopwatch(value) : formatTimer(value);
    const phase = document.getElementById("timerPhase");
    if (phase) phase.textContent = timerPhaseLabel();
    const round = document.getElementById("timerRound");
    if (round && timerState.mode === "interval") round.textContent = `Раунд ${timerState.currentRound} из ${timerState.rounds}`;
  }

  function tickSession(now) {
    if (!sessionState || !sessionState.running) return;
    const elapsed = now - sessionState.startedAt;
    const remaining = Math.max(0, sessionState.remaining - elapsed);
    const display = document.getElementById("sessionTimer");
    if (display) display.textContent = formatTimer(remaining);
    const progress = document.getElementById("sessionProgress");
    const duration = sessionState.program.exercises[sessionState.index][2] * 1000;
    if (progress) progress.style.width = `${clamp(remaining / duration * 100, 0, 100)}%`;
    if (remaining <= 0) {
      sessionState.remaining = 0;
      sessionState.running = false;
      signalDone();
      nextSessionExercise();
    }
  }

  function nextSessionExercise() {
    if (!sessionState) return;
    if (sessionState.index >= sessionState.program.exercises.length - 1) return completeSession();
    sessionState.index += 1;
    sessionState.remaining = sessionState.program.exercises[sessionState.index][2] * 1000;
    sessionState.startedAt = Date.now();
    sessionState.running = true;
    renderSessionPlayer();
  }

  function toggleSession() {
    if (!sessionState) return;
    if (sessionState.running) {
      sessionState.remaining = Math.max(0, sessionState.remaining - (Date.now() - sessionState.startedAt));
      sessionState.running = false;
    } else {
      sessionState.startedAt = Date.now();
      sessionState.running = true;
    }
    renderSessionPlayer();
  }

  function updateLiveClock() {
    const clock = document.getElementById("liveClock");
    const date = document.getElementById("clockDate");
    if (clock) clock.textContent = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date());
    if (date) date.textContent = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  }

  async function requestKeepAwake() {
    if (!timerState.keepAwake || !("wakeLock" in navigator)) return;
    try { wakeLock = await navigator.wakeLock.request("screen"); } catch { /* unsupported or denied */ }
  }

  async function releaseWakeLock() {
    if (!wakeLock) return;
    try { await wakeLock.release(); } catch { /* already released */ }
    wakeLock = null;
  }

  function signalDone() {
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 740;
      gain.gain.setValueAtTime(.12, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .3);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + .3);
    } catch { /* audio may be blocked */ }
  }

  function showDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function toast(message) {
    const stack = document.getElementById("toastStack");
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    stack.appendChild(item);
    setTimeout(() => item.remove(), 3200);
  }

  function handleRootClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.view) return setView(button.dataset.view);
    if (button.dataset.lfkTab) { state.lfkTab = button.dataset.lfkTab; state.lfkFilter = "all"; saveState(); return render(); }
    if (button.dataset.lfkFilter) { state.lfkFilter = button.dataset.lfkFilter; saveState(); return render(); }
    if (button.dataset.timerMode) return setTimerMode(button.dataset.timerMode);
    if (button.dataset.nutritionTab) { state.nutritionTab = button.dataset.nutritionTab; saveState(); return render(); }
    if (button.dataset.journalTab) { state.journalTab = button.dataset.journalTab; saveState(); return render(); }
    if (button.dataset.journalDate) { state.journalDate = button.dataset.journalDate; state.journalTab = "today"; saveState(); return render(); }
    if (button.dataset.reminderTemplate) return addReminderTemplate(button.dataset.reminderTemplate);
    if (button.dataset.reminderToggle) return toggleReminder(button.dataset.reminderToggle);
    if (button.dataset.reminderExport) return exportReminder(button.dataset.reminderExport);
    if (button.dataset.reminderDelete) return deleteReminder(button.dataset.reminderDelete);
    if (button.dataset.mode) { state.mode = button.dataset.mode; saveState(); return render(); }
    if (button.dataset.themeChoice) { state.theme = button.dataset.themeChoice; saveState(); return render(); }
    if (button.dataset.preset) { timerState.duration = Number(button.dataset.preset) * 1000; timerState.remaining = timerState.duration; timerState.running = false; return render(); }

    const action = button.dataset.action;
    if (action === "open-program") return openProgram(button.dataset.program);
    if (action === "go-nutrition") { state.nutritionTab = "diary"; return setView("nutrition"); }
    if (action === "go-calculator") { state.nutritionTab = "calculator"; return setView("nutrition"); }
    if (action === "go-journal") { state.journalTab = "today"; return setView("journal"); }
    if (action === "go-reminders") { state.journalTab = "reminders"; return setView("journal"); }
    if (action === "open-custom-food") return openCustomFoodDialog();
    if (action === "add-food") return openFoodDialog(button.dataset.food);
    if (action === "delete-food") return deleteFoodEntry(button.dataset.entry);
    if (action === "calculate-calories") return calculateCalories();
    if (action === "toggle-timer") return toggleTimer();
    if (action === "reset-timer") return resetTimer();
    if (action === "apply-timer") return applyTimerInputs();
    if (action === "apply-interval") return applyIntervalInputs();
    if (action === "lap-timer") { timerState.laps.unshift(timerState.elapsed + Date.now() - timerState.startedAt); return render(); }
    if (action === "toggle-wake") { timerState.keepAwake = !timerState.keepAwake; if (!timerState.keepAwake) releaseWakeLock(); return render(); }
    if (action === "request-notifications") return requestNotifications();
    if (action === "clear-data") {
      if (confirm("Удалить питание, умный дневник, напоминания, настройки и историю занятий с этого устройства?")) {
        localStorage.removeItem(STORAGE_KEY);
        state = structuredClone(defaultState);
        render();
        toast("Локальные данные очищены");
      }
    }
  }

  function handleRootInput(event) {
    if (event.target.id === "foodSearch") document.getElementById("foodResults").innerHTML = foodResultsMarkup(event.target.value);
  }

  function handleRootChange(event) {
    if (event.target.id === "journalDate" && event.target.value) {
      state.journalDate = event.target.value;
      saveState();
      render();
    }
  }

  function handleRootSubmit(event) {
    if (event.target.id === "smartLogForm") {
      event.preventDefault();
      saveDailyJournal();
    }
    if (event.target.id === "reminderForm") {
      event.preventDefault();
      addReminder();
    }
  }

  function handleProgramDialog(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-dialog-close")) { programDialog.close(); sessionState = null; releaseWakeLock(); render(); }
    if (button.hasAttribute("data-end-session")) { if (confirm("Завершить занятие без сохранения?")) { sessionState = null; releaseWakeLock(); programDialog.close(); } }
    if (button.dataset.startProgram) startProgram(button.dataset.startProgram);
    if (button.hasAttribute("data-session-toggle")) toggleSession();
    if (button.hasAttribute("data-session-next")) nextSessionExercise();
  }

  function handleFoodDialogClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-dialog-close")) foodDialog.close();
    if (button.dataset.portion) {
      const input = document.getElementById("foodGrams");
      input.value = clamp(Number(input.value || 100) + Number(button.dataset.portion), 1, 3000);
      updatePortionPreview();
    }
  }

  function updatePortionPreview() {
    const food = foodDatabase.find(item => item.id === foodDialog.dataset.foodId);
    const gramsInput = document.getElementById("foodGrams");
    if (!food || !gramsInput) return;
    const grams = clamp(Number(gramsInput.value) || 0, 0, 3000);
    const factor = grams / 100;
    document.getElementById("portionKcal").textContent = `${formatNumber(food.kcal * factor)} ккал`;
    document.getElementById("portionMacros").textContent = `Белки ${formatNumber(food.protein * factor)} г · жиры ${formatNumber(food.fat * factor)} г · углеводы ${formatNumber(food.carbs * factor)} г`;
  }

  function handleFoodDialogSubmit(event) {
    event.preventDefault();
    if (event.target.id === "foodForm") {
      const food = foodDatabase.find(item => item.id === foodDialog.dataset.foodId);
      const grams = clamp(Number(document.getElementById("foodGrams").value), 1, 3000);
      const meal = document.getElementById("foodMeal").value;
      if (food) addFoodEntry(food, grams, meal);
    }
    if (event.target.id === "customFoodForm") {
      const source = {
        name: document.getElementById("customName").value.trim(),
        kcal: Number(document.getElementById("customKcal").value),
        protein: Number(document.getElementById("customProtein").value) || 0,
        fat: Number(document.getElementById("customFat").value) || 0,
        carbs: Number(document.getElementById("customCarbs").value) || 0
      };
      const grams = clamp(Number(document.getElementById("customGrams").value), 1, 3000);
      const meal = document.getElementById("customMeal").value;
      if (!source.name || !Number.isFinite(source.kcal)) return toast("Введите название и калорийность");
      addFoodEntry(source, grams, meal);
    }
  }

  desktopNav.addEventListener("click", handleRootClick);
  mobileNav.addEventListener("click", handleRootClick);
  root.addEventListener("click", handleRootClick);
  root.addEventListener("input", handleRootInput);
  root.addEventListener("change", handleRootChange);
  root.addEventListener("submit", handleRootSubmit);
  programDialog.addEventListener("click", handleProgramDialog);
  foodDialog.addEventListener("click", handleFoodDialogClick);
  foodDialog.addEventListener("input", event => { if (event.target.id === "foodGrams") updatePortionPreview(); });
  foodDialog.addEventListener("submit", handleFoodDialogSubmit);
  document.getElementById("themeQuick").addEventListener("click", () => { state.mode = resolveMode() === "dark" ? "light" : "dark"; saveState(); render(); });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => { systemDark = event.matches; if (state.mode === "system") applyAppearance(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && (timerState.running || sessionState?.running)) requestKeepAwake(); });
  window.addEventListener("beforeunload", releaseWakeLock);
  setInterval(tickTimers, 100);
  setInterval(checkReminders, 15000);
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));

  render();
  checkReminders();
})();
