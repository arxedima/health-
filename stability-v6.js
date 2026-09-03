(() => {
  "use strict";
  const app = document.getElementById("app");
  const root = document.getElementById("viewRoot");
  if (!app || !root) return;

  let lastView = app.dataset.finalView || "home";
  let activeAnimation = null;
  let queued = false;

  function currentPage() {
    return root.querySelector(":scope > .minimal-home-view, :scope > .view");
  }

  function animateActualViewChange() {
    const nextView = app.dataset.finalView || lastView;
    if (nextView === lastView) return;
    lastView = nextView;
    requestAnimationFrame(() => {
      const page = currentPage();
      if (!page || typeof page.animate !== "function") return;
      activeAnimation?.cancel?.();
      page.classList.add("v6-page-transition");
      activeAnimation = page.animate([
        { opacity: .94, transform: "translate3d(0,8px,0) scale(.996)" },
        { opacity: 1, transform: "translate3d(0,0,0) scale(1)" }
      ], {
        duration: 360,
        easing: "cubic-bezier(.22,.74,.2,1)",
        fill: "none"
      });
      activeAnimation.addEventListener("finish", () => page.classList.remove("v6-page-transition"), { once:true });
      activeAnimation.addEventListener("cancel", () => page.classList.remove("v6-page-transition"), { once:true });
    });
  }

  function killReplayClasses() {
    root.querySelectorAll(":scope > .final-enter").forEach(node => node.classList.remove("final-enter"));
  }

  function settle() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      killReplayClasses();
      animateActualViewChange();
    });
  }

  const appObserver = new MutationObserver(mutations => {
    if (mutations.some(m => m.type === "attributes" && m.attributeName === "data-final-view")) settle();
  });
  appObserver.observe(app, { attributes:true, attributeFilter:["data-final-view"] });

  const rootObserver = new MutationObserver(() => {
    /* Do not animate ordinary data refreshes. Only remove legacy replay classes. */
    requestAnimationFrame(killReplayClasses);
  });
  rootObserver.observe(root, { childList:true, subtree:false });

  /* Avoid a flash when returning from the PWA background. */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      document.documentElement.classList.add("v6-resume");
      requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("v6-resume")));
    }
  });

  /* Better tactile feedback for the bottom shell without re-rendering anything. */
  document.addEventListener("pointerdown", event => {
    if (event.target.closest("#mobileNav .final-nav-item, #mobileNav .final-nav-plus")) navigator.vibrate?.(6);
  }, { passive:true });

  killReplayClasses();
})();
