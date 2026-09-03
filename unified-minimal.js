(() => {
  "use strict";
  const app = document.getElementById("app");
  if (!app) return;
  const VERSION = "20260904-10";

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

  function styleOnce(id, href) {
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `${href}?v=${VERSION}`;
    document.head.appendChild(link);
  }

  function scriptOnce(id, src) {
    if (document.getElementById(id)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = id;
      script.src = `${src}?v=${VERSION}`;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  apply();
  /* Load first-run UI immediately so the app never flashes before onboarding. */
  styleOnce("onboarding-css-loader", "./onboarding.css");
  styleOnce("final-ui-css-loader", "./final-ui.css");
  styleOnce("experience-v2-css-loader", "./experience-v2.css");
  styleOnce("cleanup-v3-css-loader", "./cleanup-v3.css");
  styleOnce("shell-v4-css-loader", "./shell-v4.css");
  /* This file is intentionally last: it owns mobile positioning and geometry. */
  styleOnce("quality-v5-css-loader", "./quality-v5.css");

  scriptOnce("onboarding-js-loader", "./onboarding.js")
    .then(() => scriptOnce("final-ui-js-loader", "./final-ui.js"))
    .then(() => scriptOnce("experience-v2-js-loader", "./experience-v2.js"))
    .then(() => scriptOnce("shell-v4-js-loader", "./shell-v4.js"))
    .then(() => scriptOnce("quality-v5-js-loader", "./quality-v5.js"))
    .catch(error => console.error("Health+ UI loader error", error));

  setInterval(apply, 60000);
})();
