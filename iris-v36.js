(()=>{'use strict';
const app=document.getElementById('app');
const stage=document.getElementById('stage');
const mlEl=document.getElementById('metricLabel');
const mvEl=document.getElementById('metricValue');
const mcEl=document.getElementById('metricCaption');
if(!app||!stage||document.getElementById('irisV36Style'))return;

const style=document.createElement('style');
style.id='irisV36Style';
style.textContent=`
/* IRIS v36 — Water only: keep the eye central, remove duplicate UI, add cleaner depth */
.app.mode-water #irisUnifiedV34{filter:brightness(1.34) saturate(1.20) contrast(1.035)!important}
.app.mode-water #irisV24Data{opacity:.82!important}
.app.mode-water .ambient{filter:blur(32px)!important;opacity:.92!important}
.app.mode-water .mode-whisper{color:rgba(192,224,247,.38)!important}

.app.mode-water .water-line,
.app.mode-water .water-head{display:none!important}

.app.mode-water .metric{
  top:calc(var(--eye-y) + var(--eye-r) + 25px)!important;
  width:min(88vw,390px)!important;
}
.app.mode-water .metric-label{font-size:8px!important;letter-spacing:.42em!important;color:rgba(247,250,252,.80)!important}
.app.mode-water .metric-value{margin-top:8px!important;font-size:clamp(32px,8.7vw,44px)!important;font-weight:220!important;line-height:1!important;text-shadow:0 0 26px rgba(112,196,246,.13)!important}
.app.mode-water .metric-caption{margin-top:8px!important;font-size:7px!important;letter-spacing:.27em!important;color:rgba(205,229,244,.36)!important}

.app.mode-water .water-panel{
  top:calc(var(--eye-y) + var(--eye-r) + 132px)!important;
  bottom:auto!important;
  width:min(74vw,300px)!important;
  transform:translateX(-50%)!important;
  opacity:1!important;
}
.app.mode-water .water-actions{
  display:flex!important;
  grid-template-columns:none!important;
  justify-content:center!important;
  gap:10px!important;
  margin-top:0!important;
}
.app.mode-water .water-actions button{
  flex:1 1 0!important;
  min-width:0!important;
  height:34px!important;
  padding:0 13px!important;
  border-radius:17px!important;
  border:1px solid rgba(255,255,255,.065)!important;
  background:rgba(255,255,255,.012)!important;
  color:rgba(230,242,250,.50)!important;
  font-size:8px!important;
  letter-spacing:.18em!important;
  box-shadow:none!important;
  backdrop-filter:blur(8px)!important;
  -webkit-backdrop-filter:blur(8px)!important;
}
.app.mode-water .water-actions button:active{
  border-color:rgba(132,204,247,.26)!important;
  background:rgba(132,204,247,.028)!important;
  color:rgba(240,248,253,.78)!important;
  transform:scale(.985);
}
.app.mode-water .water-hint{
  margin-top:10px!important;
  font-size:6px!important;
  letter-spacing:.25em!important;
  color:rgba(175,211,234,.25)!important;
}
.app.mode-water #motionHint{opacity:0!important}

@media(max-height:720px){
  .app.mode-water .metric{top:calc(var(--eye-y) + var(--eye-r) + 19px)!important}
  .app.mode-water .water-panel{top:calc(var(--eye-y) + var(--eye-r) + 121px)!important}
  .app.mode-water .water-actions button{height:32px!important}
}
`;
document.head.appendChild(style);

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=ml=>(ml/1000).toFixed(2).replace('.',',').replace(/,00$/,',0')+' Л';
function readWater(){
  const ml=clamp(parseInt(localStorage.getItem('irisWaterMl')||'0',10)||0,0,6000);
  const goal=clamp(parseInt(localStorage.getItem('irisWaterGoalMl')||'2000',10)||2000,500,6000);
  return{ml,goal,p:clamp(ml/goal,0,1)};
}
function sync(){
  if(!app.classList.contains('mode-water'))return;
  const w=readWater();
  if(mlEl)mlEl.textContent='ВОДА';
  if(mvEl)mvEl.textContent=fmt(w.ml);
  if(mcEl)mcEl.textContent=`ИЗ ${fmt(w.goal)} · ${Math.round(w.p*100)}%`;
  const hint=document.querySelector('.water-hint');
  if(hint)hint.textContent='СВАЙП ВВЕРХ · +250 МЛ';
}
new MutationObserver(()=>requestAnimationFrame(sync)).observe(app,{attributes:true,attributeFilter:['class']});
addEventListener('storage',sync);
setInterval(sync,220);
const note=document.querySelector('.settings-note');
if(note)note.textContent='IRIS v36: Вода стала чище — без дублирования, с одним главным показателем и более живым синим глазом.';
sync();
})();