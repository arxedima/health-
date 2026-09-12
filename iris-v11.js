(()=>{'use strict';
const qs=s=>document.querySelector(s),app=qs('#app'),stage=qs('#stage'),metric=qs('#metricValue'),caption=qs('#metricCaption');
if(!app||!stage)return;

/* ---------- v1.1 UI ---------- */
const style=document.createElement('style');
style.textContent=`
.v11-panel{position:absolute;z-index:8;left:50%;top:calc(var(--eye-y) + var(--eye-r) + 94px);transform:translate(-50%,10px);opacity:0;pointer-events:none;display:flex;align-items:center;justify-content:center;gap:10px;transition:.35s cubic-bezier(.16,1,.3,1)}
.v11-panel.visible{opacity:1;transform:translate(-50%,0);pointer-events:auto}.v11-btn{height:38px;border-radius:20px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.026);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:0 18px;color:rgba(255,255,255,.78);font-size:8px;letter-spacing:.22em}.v11-btn.main{min-width:118px}.v11-btn.main.running{border-color:rgba(var(--accent) / .36);box-shadow:0 0 26px rgba(var(--accent) / .09)}.v11-btn.ghost{min-width:76px;color:rgba(255,255,255,.38)}
.v11-today{position:absolute;top:51px;left:50%;transform:translateX(-50%);font-size:7px;letter-spacing:.18em;color:rgba(255,255,255,.27);white-space:nowrap}.v11-beat{position:absolute;z-index:4;left:var(--eye-x);top:var(--eye-y);width:calc(var(--eye-r)*2.18);height:calc(var(--eye-r)*2.18);transform:translate(-50%,-50%) scale(.98);border-radius:50%;border:1px solid rgba(220,80,66,0);pointer-events:none;opacity:0}.mode-sport .v11-beat.running{opacity:1;animation:v11beat .78s linear infinite}@keyframes v11beat{0%,100%{transform:translate(-50%,-50%) scale(.98);border-color:rgba(220,80,66,.12);box-shadow:0 0 0 rgba(220,80,66,0)}12%{transform:translate(-50%,-50%) scale(1.025);border-color:rgba(240,105,82,.56);box-shadow:0 0 28px rgba(220,80,66,.12)}30%{transform:translate(-50%,-50%) scale(.995);border-color:rgba(220,80,66,.18)}48%{transform:translate(-50%,-50%) scale(1.012);border-color:rgba(220,80,66,.32)}70%{transform:translate(-50%,-50%) scale(1);border-color:rgba(220,80,66,.08)}}
.sound-trigger.v11-playing .sound-dot{background:rgba(235,245,255,.92);box-shadow:0 0 18px rgba(var(--accent) / .5)}.sound-trigger.v11-playing::after{content:'ИГРАЕТ';position:absolute;left:34px;font-size:6px;letter-spacing:.15em;color:rgba(255,255,255,.34)}
@media(max-height:720px){.v11-panel{top:calc(var(--eye-y) + var(--eye-r) + 80px)}.v11-today{display:none}}
`;
document.head.appendChild(style);
const panel=document.createElement('section');panel.className='v11-panel';panel.innerHTML='<button class="v11-btn main" type="button">СТАРТ</button><button class="v11-btn ghost" type="button">СБРОС</button><div class="v11-today">СЕГОДНЯ · 0 МИН</div>';
stage.appendChild(panel);const mainBtn=panel.querySelector('.main'),resetBtn=panel.querySelector('.ghost'),today=panel.querySelector('.v11-today');
const beat=document.createElement('div');beat.className='v11-beat';stage.insertBefore(beat,stage.firstChild);

/* ---------- real sport timer ---------- */
let elapsed=Math.max(0,+localStorage.getItem('irisSportElapsedV11')||0),running=localStorage.getItem('irisSportRunningV11')==='1',started=+localStorage.getItem('irisSportStartedV11')||0,history=[];
try{history=JSON.parse(localStorage.getItem('irisSportHistoryV11')||'[]');if(!Array.isArray(history))history=[]}catch{history=[]}
const nowMs=()=>elapsed+(running&&started?Math.max(0,Date.now()-started):0),fmt=ms=>{let s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60);s%=60;m%=60;return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`};
function save(){localStorage.setItem('irisSportElapsedV11',String(elapsed));localStorage.setItem('irisSportRunningV11',running?'1':'0');localStorage.setItem('irisSportStartedV11',String(started||0))}
function todayMs(){if(window.IRISData)return IRISData.summary().sport*60000;let d=new Date();d.setHours(0,0,0,0);return history.filter(x=>x?.t>=d.getTime()).reduce((a,x)=>a+(x.ms||0),0)+nowMs()}
function sportMode(){return app.classList.contains('mode-sport')}
function renderSport(){panel.classList.toggle('visible',sportMode());beat.classList.toggle('running',sportMode()&&running);mainBtn.textContent=running?'ПАУЗА':nowMs()>0?'ПРОДОЛЖИТЬ':'СТАРТ';mainBtn.classList.toggle('running',running);today.textContent='СЕГОДНЯ · '+Math.round(todayMs()/60000)+' МИН';if(sportMode()){metric.textContent=fmt(nowMs());caption.textContent=running?'Тренировка идёт':nowMs()>0?'На паузе':'Твой темп. Твоё время.'}}
function toggleSport(){let segment=running&&started?{start:started,end:Date.now()}:null;if(running){elapsed=nowMs();running=false;started=0}else{started=Date.now();running=true}save();if(segment)recordSegment(segment);renderSport();dispatchEvent(new CustomEvent('iris:sport'));playHit(running);try{navigator.vibrate?.(running?[14,28,10]:8)}catch{}}
function recordSegment(s){try{window.IRISData?.addSport(s.start,s.end)}catch(error){dispatchEvent(new CustomEvent('iris:error',{detail:error.message}))}}
function resetSport(){if(running&&started)recordSegment({start:started,end:Date.now()});let ms=nowMs();if(ms>30000){history.unshift({t:Date.now(),ms});history=history.slice(0,30);localStorage.setItem('irisSportHistoryV11',JSON.stringify(history))}elapsed=0;running=false;started=0;save();renderSport();dispatchEvent(new CustomEvent('iris:sport'));playClick()}
mainBtn.addEventListener('click',e=>{e.stopPropagation();unlockAudio();toggleSport()});resetBtn.addEventListener('click',e=>{e.stopPropagation();unlockAudio();resetSport()});

/* ---------- iPhone-proof dark background music ---------- */
let enabled=localStorage.getItem('irisSound')!=='off',media=null,playing=false,ctx=null,lastGesture=0;
function wav(){const sr=16000,sec=8,n=sr*sec,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);let seed=9137;for(let i=0;i<n;i++){let t=i/sr,mod=.78+.22*Math.sin(Math.PI*2*t/sec),x=.38*Math.sin(Math.PI*2*55*t)+.16*Math.sin(Math.PI*2*82.5*t+.8)+.12*Math.sin(Math.PI*2*27.5*t+1.5)+.055*Math.sin(Math.PI*2*110*t+.25);seed=(seed*16807)%2147483647;x=(x*mod+(seed/2147483647-.5)*.025)*.48;v.setInt16(44+i*2,Math.max(-1,Math.min(1,x))*32767,true)}return new Blob([b],{type:'audio/wav'})}
function prepare(){if(media)return;media=new Audio();media.loop=true;media.preload='auto';media.playsInline=true;media.volume=.38;media.src=URL.createObjectURL(wav());media.addEventListener('playing',()=>{playing=true;syncSound()});media.addEventListener('pause',()=>{playing=false;syncSound()});media.addEventListener('ended',()=>{playing=false;syncSound()})}
function makeCtx(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC()}
function unlockAudio(){if(!enabled)return;let n=performance.now();if(n-lastGesture<70)return;lastGesture=n;prepare();try{let p=media.play();p?.then(()=>{playing=true;syncSound()}).catch(()=>{playing=false;syncSound()})}catch{playing=false}try{makeCtx();ctx?.resume()}catch{}syncSound()}
function syncSound(){const old=qs('#soundToggle'),state=qs('#soundState');old?.classList.toggle('v11-playing',enabled&&playing);old?.classList.toggle('locked',enabled&&!playing);old?.classList.toggle('muted',!enabled);old?.setAttribute('aria-pressed',enabled?'true':'false');if(state)state.textContent=!enabled?'ВЫКЛ':playing?'ВКЛ':'КОСНИСЬ'}
function setEnabled(v){enabled=!!v;localStorage.setItem('irisSound',enabled?'on':'off');if(!enabled){try{media?.pause()}catch{};playing=false}else unlockAudio();syncSound()}
function fx(freq,d=.18,g=.035,slide=1){if(!enabled||!ctx||ctx.state!=='running')return;let o=ctx.createOscillator(),q=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(25,freq*slide),ctx.currentTime+d);q.gain.setValueAtTime(.0001,ctx.currentTime);q.gain.exponentialRampToValueAtTime(g,ctx.currentTime+.012);q.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.connect(q);q.connect(ctx.destination);o.start();o.stop(ctx.currentTime+d+.03)}
function playHit(on){fx(on?58:82,.2,.045,on?.8:.72);if(on)setTimeout(()=>fx(82,.1,.025,.82),135)}function playClick(){fx(150,.16,.018,.75)}
prepare();syncSound();

/* Remove old sound button listeners by replacing controls after old engine loaded. */
function replaceSoundControl(){const old=qs('#soundToggle');if(old&&!old.dataset.v11){const neo=old.cloneNode(true);neo.dataset.v11='1';old.replaceWith(neo);neo.addEventListener('click',e=>{e.stopPropagation();if(enabled)setEnabled(false);else{enabled=true;localStorage.setItem('irisSound','on');syncSound();unlockAudio()}})}const oldSet=qs('#soundSettings');if(oldSet&&!oldSet.dataset.v11){const neo=oldSet.cloneNode(true);neo.dataset.v11='1';oldSet.replaceWith(neo);neo.addEventListener('click',e=>{e.stopPropagation();if(enabled)setEnabled(false);else{enabled=true;localStorage.setItem('irisSound','on');syncSound();unlockAudio()}})}syncSound()}
replaceSoundControl();

document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});document.addEventListener('touchstart',unlockAudio,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled){try{media?.play().then(()=>{playing=true;syncSound()}).catch(()=>{playing=false;syncSound()})}catch{};try{ctx?.resume()}catch{}}});

/* The eye engine recognizes one pupil tap, independently of fiber gestures. */
stage.addEventListener('iris:pupil-tap',()=>{if(sportMode())toggleSport()});

new MutationObserver(renderSport).observe(app,{attributes:true,attributeFilter:['class']});setInterval(renderSport,250);renderSport();
})();