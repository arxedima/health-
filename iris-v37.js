(()=>{'use strict';
const app=document.getElementById('app');
if(!app||document.getElementById('irisV37Style'))return;

const style=document.createElement('style');
style.id='irisV37Style';
style.textContent=`
/* IRIS v37 — only Sport / Water / Sleep. Home and Food stay untouched. */
#irisAtmosphereV37{
  position:absolute;inset:-14%;z-index:1;pointer-events:none;opacity:0;
  transition:opacity .55s ease,background .7s ease;
  filter:blur(30px);transform:translateZ(0)
}
.app.mode-sport #irisAtmosphereV37{
  opacity:1;
  background:
    radial-gradient(circle at var(--eye-x) var(--eye-y),rgba(214,62,52,.16) 0%,rgba(151,38,34,.085) 24%,rgba(92,20,22,.035) 43%,transparent 67%),
    radial-gradient(ellipse at 50% 61%,rgba(122,27,31,.075),transparent 45%);
  animation:v37SportAmbient 1.55s ease-in-out infinite
}
.app.mode-water #irisAtmosphereV37{
  opacity:1;
  background:
    radial-gradient(circle at var(--eye-x) var(--eye-y),rgba(78,170,238,.17) 0%,rgba(49,126,194,.095) 25%,rgba(27,78,132,.04) 45%,transparent 68%),
    radial-gradient(ellipse at 50% 62%,rgba(53,137,211,.085),transparent 48%);
  animation:v37WaterAmbient 4.8s ease-in-out infinite
}
.app.mode-sleep #irisAtmosphereV37{
  opacity:1;
  background:
    radial-gradient(circle at var(--eye-x) var(--eye-y),rgba(78,95,190,.15) 0%,rgba(56,68,145,.085) 28%,rgba(32,39,92,.038) 48%,transparent 70%),
    radial-gradient(ellipse at 50% 60%,rgba(59,69,145,.07),transparent 50%);
  animation:v37SleepAmbient 7.2s ease-in-out infinite
}
@keyframes v37SportAmbient{0%,100%{opacity:.84;transform:scale(.99)}50%{opacity:1;transform:scale(1.025)}}
@keyframes v37WaterAmbient{0%,100%{opacity:.88;transform:scale(1)}50%{opacity:1;transform:scale(1.018)}}
@keyframes v37SleepAmbient{0%,100%{opacity:.80;transform:scale(1)}50%{opacity:.95;transform:scale(1.012)}}

/* Brighten only the weak modes. */
.app.mode-sport #irisModeV30{
  filter:brightness(1.30) saturate(1.17) contrast(1.045) drop-shadow(0 0 18px rgba(215,65,55,.14))!important
}
.app.mode-water #irisUnifiedV34{
  filter:brightness(1.58) saturate(1.30) contrast(1.055) drop-shadow(0 0 22px rgba(84,175,238,.16))!important
}
.app.mode-sleep #irisUnifiedV34{
  filter:brightness(1.45) saturate(1.22) contrast(1.045) drop-shadow(0 0 20px rgba(88,105,206,.14))!important
}
.app.mode-sport #irisOrbitV23{opacity:.28!important;filter:brightness(1.08) saturate(1.04)!important}
.app.mode-sport #irisV24Data{opacity:1!important}
.app.mode-sport .v11-beat.running{filter:drop-shadow(0 0 12px rgba(221,73,61,.18))}

/* Keep Water clean even if an older cached layout leaks through. */
.app.mode-water .water-line,.app.mode-water .water-head{display:none!important}
.app.mode-water .metric{top:calc(var(--eye-y) + var(--eye-r) + 25px)!important;width:min(88vw,390px)!important}
.app.mode-water .metric-value{margin-top:8px!important;font-size:clamp(32px,8.7vw,44px)!important;line-height:1!important;text-shadow:0 0 28px rgba(105,193,246,.18)!important}
.app.mode-water .metric-caption{margin-top:8px!important;color:rgba(210,233,247,.40)!important}
.app.mode-water .water-panel{top:calc(var(--eye-y) + var(--eye-r) + 132px)!important;bottom:auto!important;width:min(74vw,300px)!important}
.app.mode-water .water-actions{display:flex!important;gap:10px!important;margin-top:0!important}
.app.mode-water .water-actions button{height:34px!important;border-radius:17px!important;background:rgba(255,255,255,.016)!important;border-color:rgba(255,255,255,.075)!important;color:rgba(234,244,251,.56)!important;font-size:8px!important;letter-spacing:.18em!important}
.app.mode-water .water-hint{margin-top:10px!important;color:rgba(180,217,239,.28)!important}

/* Sleep keeps the same round eye, only gains night atmosphere. */
.app.mode-sleep .mode-whisper{color:rgba(196,208,242,.39)!important;opacity:.72!important}
.app.mode-sleep .metric-value{text-shadow:0 0 28px rgba(99,116,212,.14)!important}
.app.mode-sleep .metric-caption{color:rgba(198,207,233,.38)!important}

/* Do not affect the two strong reference screens. */
.app.mode-home #irisAtmosphereV37,.app.mode-food #irisAtmosphereV37{opacity:0!important;animation:none!important}
`;
document.head.appendChild(style);

const atmosphere=document.createElement('div');
atmosphere.id='irisAtmosphereV37';
atmosphere.setAttribute('aria-hidden','true');
const stage=document.getElementById('stage');
if(stage)app.insertBefore(atmosphere,stage);else app.appendChild(atmosphere);

const note=document.querySelector('.settings-note');
if(note)note.textContent='IRIS v37: Спорт, Вода и Сон стали ярче и получили собственную атмосферу; Главная и Питание не изменены.';
})();