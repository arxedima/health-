(()=>{
  const root=document.documentElement;
  const vv=window.visualViewport;
  let raf=0;

  const px=n=>`${Math.max(0,Math.round(Number(n)||0))}px`;

  function update(){
    raf=0;
    const app=document.getElementById('app');
    const appH=app?.getBoundingClientRect().height||0;
    const docH=document.documentElement.clientHeight||0;
    const winH=window.innerHeight||0;
    const layoutH=Math.max(appH,docH,winH);

    const visualH=vv?.height||winH||layoutH;
    const visualTop=vv?.offsetTop||0;
    const occludedBottom=Math.max(0,layoutH-(visualTop+visualH));

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

  /* iOS browser chrome can finish animating after resize has fired. */
  [80,220,520].forEach(ms=>setTimeout(schedule,ms));
})();
