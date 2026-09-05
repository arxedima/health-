(()=>{
  const root=document.documentElement;
  const vv=window.visualViewport;
  let raf=0;

  const px=n=>`${Math.max(0,Math.round(Number(n)||0))}px`;

  function update(){
    raf=0;
    const app=document.getElementById('app');
    const appH=app?.getBoundingClientRect().height||0;
    const winH=window.innerHeight||document.documentElement.clientHeight||appH;
    const visualH=vv?.height||winH;
    const visualTop=vv?.offsetTop||0;

    /*
      iOS 26 can paint position:fixed against window.innerHeight while the
      browser's floating controls reduce visualViewport.height. This delta is
      exactly the region where the bottom nav would otherwise be hidden.
    */
    const occludedBottom=Math.max(0,winH-(visualTop+visualH));

    const active=document.activeElement;
    const editing=!!active&&(/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)||active.isContentEditable);
    const keyboardLikely=editing&&occludedBottom>160;

    root.classList.toggle('vector-keyboard-open',keyboardLikely);
    root.style.setProperty('--vv-bottom',px(keyboardLikely?0:occludedBottom));
    root.style.setProperty('--vv-height',px(visualH));
  }

  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(update);
  }

  schedule();
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(schedule,80),{passive:true});
  addEventListener('focusin',schedule,{passive:true});
  addEventListener('focusout',()=>setTimeout(schedule,80),{passive:true});
  vv?.addEventListener('resize',schedule,{passive:true});
  vv?.addEventListener('scroll',schedule,{passive:true});

  /* Browser chrome can finish its animation after the first viewport event. */
  [60,180,420,800].forEach(ms=>setTimeout(schedule,ms));
})();
