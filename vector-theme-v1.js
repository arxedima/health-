(() => {
  'use strict';
  const app=document.getElementById('app');
  const header=document.getElementById('appHeader');
  if(!app||!header)return;
  const KEY='vector-theme-v1';
  function read(){try{return localStorage.getItem(KEY)||'dark'}catch{return'dark'}}
  function apply(theme,save=false){const value=theme==='light'?'light':'dark';document.documentElement.dataset.vectorTheme=value;app.dataset.theme=value;if(save){try{localStorage.setItem(KEY,value)}catch{}}
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=value==='light'?'#f4f7fd':'#0e1836';
    document.querySelectorAll('[data-vector-theme-toggle]').forEach(btn=>{btn.setAttribute('aria-label',value==='light'?'Включить тёмную тему':'Включить светлую тему');btn.setAttribute('title',value==='light'?'Тёмная тема':'Светлая тема')});
  }
  function ensureButton(){if(header.querySelector('[data-vector-theme-toggle]'))return;const b=document.createElement('button');b.type='button';b.className='vector-theme-toggle';b.dataset.vectorThemeToggle='1';b.innerHTML='<span class="theme-sun">☀️</span><span class="theme-moon">🌙</span>';header.appendChild(b);apply(read(),false)}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-vector-theme-toggle]');if(!b)return;e.preventDefault();e.stopPropagation();const next=(document.documentElement.dataset.vectorTheme==='light')?'dark':'light';apply(next,true);navigator.vibrate?.(8)},true);
  const observer=new MutationObserver(()=>requestAnimationFrame(ensureButton));observer.observe(header,{childList:true,subtree:false});
  apply(read(),false);ensureButton();
})();
