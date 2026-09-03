(() => {
  "use strict";
  const app = document.getElementById("app");
  const root = document.getElementById("viewRoot");
  const topbar = document.querySelector(".topbar");
  const desktopBrand = document.querySelector(".sidebar .brand");
  if (!app || !root || !topbar) return;

  function unifyBrand() {
    if (desktopBrand) {
      if (!desktopBrand.classList.contains("health-brand")) desktopBrand.classList.add("health-brand");
      const strong = desktopBrand.querySelector("strong");
      if (strong && strong.textContent !== "Health+ / VECTOR") strong.textContent = "Health+ / VECTOR";
    }
    const kicker = document.getElementById("viewKicker");
    if (kicker && app.classList.contains("final-subpage") && kicker.textContent !== "Health+ / VECTOR") kicker.textContent = "Health+ / VECTOR";
    if (document.title !== "Health+ / VECTOR") document.title = "Health+ / VECTOR";
  }

  function removeLegacyDock() {
    [".mh-quick-dock", ".minimal-quick-dock", ".minimal-home-actions", ".home-quick-actions", ".quick-dock", ".mobile-actions", ".floating-actions"].forEach(selector => {
      document.querySelectorAll(selector).forEach(node => node.remove());
    });
  }

  function lockScrollShell() {
    const content = document.querySelector("#app .content");
    const nav = document.querySelector("#app .mobile-nav");
    if (content && content.dataset.shellScroll !== "content-only") content.dataset.shellScroll = "content-only";
    if (nav && nav.dataset.shellFixed !== "true") nav.dataset.shellFixed = "true";
  }

  function sync() {
    unifyBrand();
    removeLegacyDock();
    lockScrollShell();
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; sync(); });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  sync();
  window.addEventListener("pageshow", sync);
})();
