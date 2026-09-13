(()=>{'use strict';
const qs=s=>document.querySelector(s),app=qs('#app'),stage=qs('#stage');
if(!app||!stage)return;
const style=document.createElement('style');
style.textContent='.sound-trigger.v11-playing .sound-dot{background:rgba(235,245,255,.92);box-shadow:0 0 12px rgba(var(--accent) / .3)}';
document.head.appendChild(style);

// Timestamp-based timing continues when rendering is asleep; only one UI owns the readout.
const timerKeys=['irisSportElapsedV11','irisSportStartedV11','irisSportRunningV11'];
let timer;
function readTimer(){
 const elapsed=Math.max(0,Number(localStorage.getItem(timerKeys[0]))||0),started=Math.max(0,Number(localStorage.getItem(timerKeys[1]))||0);
 timer={elapsed,started,running:localStorage.getItem(timerKeys[2])==='1'&&started>0};
}
function persist(next){
 localStorage.setItem(timerKeys[0],String(next.elapsed));
 localStorage.setItem(timerKeys[1],String(next.started));
 localStorage.setItem(timerKeys[2],next.running?'1':'0');
}
function snapshot(){return {ms:timer.elapsed+(timer.running?Math.max(0,Date.now()-timer.started):0),running:timer.running}}
function updateTimer(reset=false){
 readTimer();const prev={...timer},now=Date.now(),current=snapshot();
 const next=reset?{elapsed:0,started:0,running:false}:prev.running?{elapsed:current.ms,started:0,running:false}:{elapsed:prev.elapsed,started:now,running:true};
 try{
  persist(next);
  if(prev.running&&now>prev.started)window.IRISData?.addSport(prev.started,now);
  timer=next;
 }catch(error){
  try{persist(prev)}catch{}timer=prev;
  dispatchEvent(new CustomEvent('iris:error',{detail:'Не удалось сохранить тренировку. Освободи немного места и попробуй ещё раз.'}));
  dispatchEvent(new CustomEvent('iris:sport'));return;
 }
 dispatchEvent(new CustomEvent('iris:sport'));reset?playClick():playHit(timer.running);
 try{navigator.vibrate?.(timer.running?[14,28,10]:8)}catch{}
}
readTimer();
window.IRISSport={snapshot,toggle:()=>updateTimer(),reset:()=>updateTimer(true)};
addEventListener('storage',e=>{if(e.key!==null&&!timerKeys.includes(e.key))return;readTimer();dispatchEvent(new CustomEvent('iris:sport'))});
addEventListener('pageshow',()=>{readTimer();dispatchEvent(new CustomEvent('iris:sport'))});
stage.addEventListener('iris:pupil-tap',()=>{if(app.classList.contains('mode-sport')&&app.dataset.contemplation!=='true')updateTimer()});

/* ---------- iPhone-proof dark background music ---------- */
let enabled=localStorage.getItem('irisSound')!=='off',media=null,playing=false,ctx=null,lastGesture=0;
function prepare(){if(media)return;media=new Audio();media.loop=true;media.preload='none';media.playsInline=true;media.volume=.38;media.src='./iris-music.m4a?v=4';media.addEventListener('playing',()=>{playing=true;syncSound()});media.addEventListener('pause',()=>{playing=false;syncSound()});media.addEventListener('ended',()=>{playing=false;syncSound()})}
function makeCtx(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC()}
function unlockAudio(){if(!enabled||playing)return;let n=performance.now();if(n-lastGesture<70)return;lastGesture=n;prepare();try{let p=media.play();p?.then(()=>{playing=true;syncSound()}).catch(()=>{playing=false;syncSound()})}catch{playing=false}try{makeCtx();ctx?.resume()}catch{}syncSound()}
function syncSound(){const old=qs('#soundToggle'),state=qs('#soundState');old?.classList.toggle('v11-playing',enabled&&playing);old?.classList.toggle('locked',enabled&&!playing);old?.classList.toggle('muted',!enabled);old?.setAttribute('aria-pressed',enabled?'true':'false');if(state)state.textContent=!enabled?'ВЫКЛ':playing?'ВКЛ':'КОСНИСЬ'}
function setEnabled(v){enabled=!!v;localStorage.setItem('irisSound',enabled?'on':'off');if(!enabled){try{media?.pause()}catch{};playing=false}else unlockAudio();syncSound()}
function fx(freq,d=.18,g=.035,slide=1){if(!enabled||!ctx||ctx.state!=='running')return;let o=ctx.createOscillator(),q=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(25,freq*slide),ctx.currentTime+d);q.gain.setValueAtTime(.0001,ctx.currentTime);q.gain.exponentialRampToValueAtTime(g,ctx.currentTime+.012);q.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.connect(q);q.connect(ctx.destination);o.start();o.stop(ctx.currentTime+d+.03)}
function playHit(on){fx(on?58:82,.2,.045,on?.8:.72);if(on)setTimeout(()=>fx(82,.1,.025,.82),135)}function playClick(){fx(150,.16,.018,.75)}
syncSound();

/* Remove old sound button listeners by replacing controls after old engine loaded. */
function replaceSoundControl(){const old=qs('#soundToggle');if(old&&!old.dataset.v11){const neo=old.cloneNode(true);neo.dataset.v11='1';old.replaceWith(neo);neo.addEventListener('click',e=>{e.stopPropagation();if(enabled)setEnabled(false);else{enabled=true;localStorage.setItem('irisSound','on');syncSound();unlockAudio()}})}const oldSet=qs('#soundSettings');if(oldSet&&!oldSet.dataset.v11){const neo=oldSet.cloneNode(true);neo.dataset.v11='1';oldSet.replaceWith(neo);neo.addEventListener('click',e=>{e.stopPropagation();if(enabled)setEnabled(false);else{enabled=true;localStorage.setItem('irisSound','on');syncSound();unlockAudio()}})}syncSound()}
replaceSoundControl();

document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled){try{media?.play().then(()=>{playing=true;syncSound()}).catch(()=>{playing=false;syncSound()})}catch{};try{ctx?.resume()}catch{}}});

})();
