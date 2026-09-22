/* IRIS theme: persisted preference; does not change user records or canvas gestures. */
(()=>{const app=document.getElementById('app');if(!app)return;
const key='iris-editorial-theme';
let theme='light';try{theme=localStorage.getItem(key)||'light'}catch(e){}
function apply(){const light=theme==='light';app.classList.toggle('iris-light',light);const b=document.getElementById('irisThemeToggle');if(b){b.setAttribute('aria-pressed',String(light));b.innerHTML='<span>Светлая тема</span><em>'+ (light?'ВКЛ':'ВЫКЛ') +'</em>';}document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#fbfdff':'#000000');}
const panel=document.querySelector('.settings-list');if(panel&&!document.getElementById('irisThemeToggle')){const b=document.createElement('button');b.id='irisThemeToggle';b.type='button';b.addEventListener('click',()=>{theme=theme==='light'?'dark':'light';try{localStorage.setItem(key,theme)}catch(e){}apply();window.dispatchEvent(new Event('resize'))});panel.insertBefore(b,panel.firstChild)}
apply();
})();