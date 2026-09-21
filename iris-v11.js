(()=>{'use strict';
const qs=s=>document.querySelector(s),app=qs('#app'),stage=qs('#stage');
if(!app||!stage)return;
const style=document.createElement('style');
style.textContent='.sound-trigger.v11-playing .sound-dot{background:rgba(235,245,255,.92);box-shadow:0 0 12px rgba(var(--accent) / .3)}';
document.head.appendChild(style);

// Timestamp-based timing continues when rendering is asleep; only one UI owns the readout.
const D=window.IRISData;
function snapshot(){const w=D.workout;return {ms:w.elapsed+(w.running?Math.max(0,Date.now()-w.started):0),running:w.running,type:w.type,id:w.id}}
function updateTimer(finish=false){
 try{if(!D.updateWorkout(finish))return false}catch(error){
  dispatchEvent(new CustomEvent('iris:error',{detail:error.message||'Не удалось сохранить тренировку.'}));return false;
 }
 const running=snapshot().running;
 dispatchEvent(new CustomEvent('iris:sport'));finish?playClick():playHit(running);
 try{navigator.vibrate?.(running?[14,28,10]:8)}catch{}
 return true;
}
window.IRISSport={snapshot,toggle:()=>updateTimer(),finish:()=>updateTimer(true),reset:()=>updateTimer(true),setType(type){D.setWorkoutType(type);dispatchEvent(new CustomEvent('iris:sport'))}};
addEventListener('storage',e=>{if(e.key===null||e.key==='irisJournalV39')dispatchEvent(new CustomEvent('iris:sport'))});
addEventListener('pageshow',()=>dispatchEvent(new CustomEvent('iris:sport')));
stage.addEventListener('iris:pupil-tap',()=>{if(app.classList.contains('mode-sport')&&app.dataset.contemplation!=='true')updateTimer()});

/* ---------- iPhone-proof dark background music ---------- */
let enabled=localStorage.getItem('irisSound')!=='off',media=null,playing=false,ctx=null,lastGesture=0;
function prepare(){if(media)return;media=new Audio();media.loop=true;media.preload='none';media.playsInline=true;media.volume=.38;media.src='./iris-music.m4a?v=4';media.addEventListener('playing',()=>{playing=true;syncSound()});media.addEventListener('pause',()=>{playing=false;syncSound()});media.addEventListener('ended',()=>{playing=false;syncSound()})}
function makeCtx(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC()}
function unlockAudio(){if(!enabled||playing)return;let n=performance.now();if(n-lastGesture<70)return;lastGesture=n;prepare();try{let p=media.play();p?.then(()=>{playing=true;syncSound()}).catch(()=>{playing=false;syncSound()})}catch{playing=false}try{makeCtx();ctx?.resume()}catch{}syncSound()}
function syncSound(){const old=qs('#soundToggle'),state=qs('#soundState');old?.classList.toggle('v11-playing',enabled&&playing);old?.classList.toggle('locked',enabled&&!playing);old?.classList.toggle('muted',!enabled);old?.setAttribute('aria-pressed',enabled?'true':'false');if(state)state.textContent=!enabled?'ВЫКЛ':playing?'ВКЛ':'КОСНИСЬ'}
function setEnabled(v){enabled=!!v;localStorage.setItem('irisSound',enabled?'on':'off');if(!enabled){try{media?.pause()}catch{};playing=false}else unlockAudio();syncSound()}
function fx(freq,d=.18,g=.035,slide=1){if(!enabled||!ctx||ctx.state!=='running')return;let o=ctx.createOscillator(),q=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(25,freq*slide),ctx.currentTime+d);q.gain.setValueAtTime(.0001,ctx.currentTime);q.gain.exponentialRampToValueAtTime(g,ctx.currentTime+.012);q.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.connect(q);q.connect(ctx.destination);o.start();o.stop(ctx.currentTime+d+.03)}
function playHit(on){fx(on?58:82,.2,.045,on?.8:.72);if(on&&enabled&&ctx?.state==='running')setTimeout(()=>fx(82,.1,.025,.82),135)}function playClick(){fx(150,.16,.018,.75)}
syncSound();

/* Remove old sound button listeners by replacing controls after old engine loaded. */
function replaceSoundControl(){const old=qs('#soundToggle');if(old&&!old.dataset.v11){const neo=old.cloneNode(true);neo.dataset.v11='1';old.replaceWith(neo);neo.addEventListener('click',e=>{e.stopPropagation();if(enabled)setEnabled(false);else{enabled=true;localStorage.setItem('irisSound','on');syncSound();unlockAudio()}})}const oldSet=qs('#soundSettings');if(oldSet&&!oldSet.dataset.v11){const neo=oldSet.cloneNode(true);neo.dataset.v11='1';oldSet.replaceWith(neo);neo.addEventListener('click',e=>{e.stopPropagation();if(enabled)setEnabled(false);else{enabled=true;localStorage.setItem('irisSound','on');syncSound();unlockAudio()}})}syncSound()}
replaceSoundControl();

document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled){try{media?.play().then(()=>{playing=true;syncSound()}).catch(()=>{playing=false;syncSound()})}catch{};try{ctx?.resume()}catch{}}});

})();
