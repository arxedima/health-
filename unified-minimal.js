(() => {
  "use strict";
  const app = document.getElementById("app");
  if (!app) return;

  function period() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 17) return "day";
    if (hour >= 17 && hour < 22) return "evening";
    return "night";
  }

  function apply() {
    const value = period();
    app.classList.add("minimal-ui");
    app.dataset.period = value;
    document.body.dataset.healthPeriod = value;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = value === "night" ? "#101936" : value === "evening" ? "#fbf3f6" : "#f7f8fc";
  }

  function loadFinalExperience() {
    if (!document.querySelector('link[data-final-ui]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "./final-ui.css?v=20260904-5";
      link.dataset.finalUi = "true";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-final-ui]')) {
      const script = document.createElement("script");
      script.src = "./final-ui.js?v=20260904-5";
      script.defer = true;
      script.dataset.finalUi = "true";
      document.body.appendChild(script);
    }
  }

  apply();
  loadFinalExperience();
  setInterval(apply, 60000);
})();
