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

  apply();
  setInterval(apply, 60000);
})();
