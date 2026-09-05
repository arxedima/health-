/* Health+ / VECTOR — iOS scroll restoration guard v2
   ChatGPT/Safari may restore either document scroll or inner screen scroll after render. */
(()=>{
  const screen=document.getElementById('screen');
  if(!screen)return;

  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(_){}

  let lastView='';
  let settling=false;

  function forceTop(){
    try{window.scrollTo(0,0)}catch(_){}
    try{document.documentElement.scrollTop=0}catch(_){}
    try{document.body.scrollTop=0}catch(_){}
    screen.scrollTop=0;
    try{screen.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){}
  }

  function settleTop(){
    if(settling)return;
    settling=true;
    forceTop();
    requestAnimationFrame(()=>{
      forceTop();
      requestAnimationFrame(forceTop);
    });
    [40,90,180,360,650].forEach(ms=>setTimeout(forceTop,ms));
    setTimeout(()=>{settling=false},720);
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
    if(e.target.closest?.('[data-view], [data-go], .brand')){
      lastView='';
      setTimeout(settleTop,0);
    }
  },true);

  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-view], [data-go], .brand')) setTimeout(settleTop,0);
  },true);

  window.addEventListener('pageshow',()=>setTimeout(settleTop,0));
  window.addEventListener('load',()=>setTimeout(settleTop,0),{once:true});
  window.addEventListener('orientationchange',()=>setTimeout(settleTop,80));

  lastView=viewName();
  settleTop();
})();
