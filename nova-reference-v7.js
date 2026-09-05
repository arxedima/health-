// Nova+ v7 reference-only geometry fixes. Keeps product logic untouched.
(function(){
  const screen=document.getElementById('screen');
  if(!screen)return;

  function calibrateHome(){
    const home=screen.querySelector('.home-page');
    if(!home)return;

    const h1=home.querySelector('h1');
    if(h1 && /Дима\b/.test(h1.textContent||'')){
      h1.innerHTML=h1.innerHTML.replace(/Дима\b/g,'Дмитрий');
    }

    const track=home.querySelector('.ring-track');
    const value=home.querySelector('.ring-value');
    if(track){
      track.setAttribute('d','M44 198 A108 108 0 1 1 219 62');
      track.setAttribute('pathLength','100');
    }
    if(value){
      value.setAttribute('d','M130 20 A108 108 0 0 1 236 130');
      value.setAttribute('pathLength','100');
      const inline=value.getAttribute('style')||'';
      const m=inline.match(/stroke-dasharray:\s*([0-9.]+)/);
      const raw=m?Number(m[1]):18;
      const visible=Math.max(10,Math.min(100,raw));
      value.style.strokeDasharray=`${visible} 100`;
      value.style.strokeDashoffset='0';
    }
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(calibrateHome));
  observer.observe(screen,{childList:true,subtree:true});
  requestAnimationFrame(calibrateHome);
})();
