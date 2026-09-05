/* Health+ / VECTOR — iOS scroll restoration guard
   Safari/ChatGPT browser may restore scroll after synchronous render(). */
(()=>{
  const screen=document.getElementById('screen');
  if(!screen)return;

  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(_){}

  let lastView='';
  function forceTop(){
    screen.scrollTop=0;
    try{screen.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){}
  }
  function settleTop(){
    forceTop();
    requestAnimationFrame(()=>{
      forceTop();
      requestAnimationFrame(forceTop);
    });
    setTimeout(forceTop,60);
    setTimeout(forceTop,180);
  }

  function viewName(){
    const m=[...screen.classList].find(c=>c.startsWith('view-'));
    return m||'';
  }

  const observer=new MutationObserver(()=>{
    const v=viewName();
    if(v&&v!==lastView){
      lastView=v;
      settleTop();
    }
  });
  observer.observe(screen,{attributes:true,attributeFilter:['class']});

  document.addEventListener('pointerup',e=>{
    if(e.target.closest?.('[data-view], [data-go], .brand')) setTimeout(settleTop,0);
  },true);

  window.addEventListener('pageshow',()=>setTimeout(settleTop,0));
  window.addEventListener('load',()=>setTimeout(settleTop,0),{once:true});

  lastView=viewName();
  settleTop();
})();
