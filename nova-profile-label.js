/* Nova+ — keep profile naming consistent in bottom navigation. */
(()=>{
  const nav=document.getElementById('nav');
  if(!nav)return;
  const apply=()=>{
    const profileButton=nav.querySelector('[data-view="me"]');
    const label=profileButton?.querySelector('small');
    if(label&&label.textContent!=='Профиль')label.textContent='Профиль';
  };
  new MutationObserver(apply).observe(nav,{childList:true,subtree:true});
  apply();
})();
