/* Nova+ — keep brand and profile naming consistent after every render. */
(()=>{
  const nav=document.getElementById('nav');
  const header=document.getElementById('header');
  const apply=()=>{
    const profileButton=nav?.querySelector('[data-view="me"]');
    const label=profileButton?.querySelector('small');
    if(label&&label.textContent!=='Профиль')label.textContent='Профиль';
    const brand=header?.querySelector('.brand strong');
    if(brand&&brand.textContent!=='Nova+')brand.textContent='Nova+';
  };
  if(nav)new MutationObserver(apply).observe(nav,{childList:true,subtree:true});
  if(header)new MutationObserver(apply).observe(header,{childList:true,subtree:true});
  apply();
})();
