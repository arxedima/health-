const test=require('node:test');
const assert=require('node:assert/strict');
const {harness}=require('./dom-harness.cjs');
const formSubmit=(a,id)=>a.d.querySelector(id).dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
const fill=(a,name,value,scope='#nextEntryForm')=>a.d.querySelector(`${scope} [name="${name}"]`).value=value;
const emit=(a,name,detail)=>a.w.dispatchEvent(new a.w.CustomEvent(name,{detail}));
const local=ms=>{const d=new Date(ms);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
test('five eyes retain local reactive fibers and share an outer arc',async()=>{
 const a=await harness(),{w,d}=a;
 try{
  assert.equal(d.querySelectorAll('canvas').length,1);let radius;
  for(const mode of ['home','sport','water','food','sleep']){
   if(mode!=='home')await a.select(mode);const p=a.point();radius??=p.r;assert(Math.abs(p.r-radius)<.1,'mode-independent radius');
   const ctx=a.contexts.get('irisCanvas'),unique=c=>[...new Map(c.map(q=>[q.join(','),q])).values()],before=unique(ctx.curves).map(q=>q.slice());
   assert(ctx.arcs.some(q=>Math.abs(q[2]-p.r*1.026)<2),'outer track: '+mode);assert(ctx.strokes<350,'batched strokes plus decaying touch sector');
   a.pointer('pointerdown',p.x+p.r*.65,p.y);await a.tick(14);const after=unique(ctx.curves);assert.equal(after.length,before.length);
   let near=0,far=0,n=0,f=0;for(let i=0;i<before.length;i++){const angle=Math.atan2(before[i][1],before[i][0]),delta=Math.hypot(after[i][0]-before[i][0],after[i][1]-before[i][1]);if(Math.abs(angle)<.4){near+=delta;n++}if(Math.abs(angle)>2.7){far+=delta;f++}}
   assert(near/n>far/f*3,mode+' local deformation');a.pointer('pointerup',p.x+p.r*.65,p.y);await a.tick(70);
   assert.equal(w.IRISSport.snapshot().running,false,'fiber tap does not start timer');
  }
  assert.equal(a.errors.length,0);
 }finally{a.close()}
});
test('water portion works on home, water buttons and swipe; toast clears on navigation',async()=>{
 const a=await harness(),{d,w}=a;
 try{
  w.IRISData.setPortion(330);d.querySelector('[data-home-add="water"]').click();assert.equal(w.IRISData.summary().water,.33);
  assert.equal(d.querySelector('#journalToast').hidden,false);await a.select('water');assert.equal(d.querySelector('#journalToast').hidden,true);
  d.querySelector('[data-water="250"]').click();assert.equal(w.IRISData.summary().water,.66);
  await a.swipe(0,-100);assert.equal(w.IRISData.summary().water,.99);await a.swipe(0,100);assert.equal(w.IRISData.summary().water,.66);
  d.querySelector('#waterPortion').click();fill(a,'portion','400');formSubmit(a,'#nextEntryForm');assert.equal(w.IRISData.routine.waterPortion,400);assert.equal(d.querySelector('#nextEntryError').textContent,'');
  d.querySelector('#journalTab').click();await a.tick(2);assert.equal(d.querySelector('#journalToast').hidden,true);assert.equal(d.querySelector('#dailyJournal').hidden,false);assert.equal(d.querySelector('#journalTab').getAttribute('aria-current'),'page');assert(d.querySelectorAll('#journalEntries [data-entry]').length>0);
 }finally{a.close()}
});
test('manual workout form, journal editing and undo remove the whole record',async()=>{
 const a=await harness(),{d,w}=a;
 try{
  d.querySelector('#journalTab').click();d.querySelector('#journalAdd').click();d.querySelector('[data-add-kind="sport"]').click();assert(d.querySelector('#nextEntryDialog').open);
  fill(a,'minutes','20');fill(a,'type','walk');fill(a,'end',local(w.Date.now()-3600000));fill(a,'effort','2');fill(a,'note','По парку');formSubmit(a,'#nextEntryForm');assert.equal(d.querySelector('#nextEntryError').textContent,'');await a.tick(2);
  assert.equal(w.IRISData.summary().sport,20);d.querySelector('#journalEntries [data-kind="sport"]').click();fill(a,'minutes','25');formSubmit(a,'#nextEntryForm');await a.tick(2);assert.equal(w.IRISData.summary().sport,25);
  d.querySelector('#journalEntries [data-kind="sport"]').click();d.querySelector('#nextEntryDelete').click();d.querySelector('#nextEntryDelete').click();await a.tick(2);assert.equal(w.IRISData.summary().sport,0);
  d.querySelector('#journalToast button').click();assert.equal(w.IRISData.summary().sport,25);
 }finally{a.close()}
});
test('timer controls group pause/resume and finish instead of silently resetting',async()=>{
 const a=await harness(),{d,w}=a;
 try{
  await a.select('sport');d.querySelector('.sport-type').click();fill(a,'type','rehab');formSubmit(a,'#nextEntryForm');
  const p=a.point();await a.tap(p.x,p.y);assert.equal(w.IRISSport.snapshot().running,true);await a.tick(80);d.querySelector('.v24-sport .main').click();assert.equal(w.IRISSport.snapshot().running,false);
  await a.tick(20);d.querySelector('.v24-sport .main').click();await a.tick(80);d.querySelector('.v24-sport .reset').click();await a.tick(2);
  assert.equal(w.IRISSport.snapshot().running,false);assert.equal(w.IRISSport.snapshot().ms,0);assert.equal(w.IRISData.workouts().length,1);assert.equal(w.IRISData.workouts()[0].segments,2);assert.equal(w.IRISData.workouts()[0].type,'rehab');
  d.querySelector('.sport-history').click();assert.equal(d.querySelector('#app').dataset.view,'journal');assert.equal(d.querySelectorAll('#journalEntries [data-kind="sport"]').length,1);
 }finally{a.close()}
});
test('food repeat scales a new portion only after confirmation; sleep saves quality',async()=>{
 const a=await harness(),{d,w}=a;
 try{
  w.IRISData.saveFood({name:'Омлет',kcal:420,meal:'Завтрак',at:w.Date.now()-3600000});const id=w.IRISData.entries.food[0].id;
  w.IRISJournal.openFood(id);[...d.querySelectorAll('#entryFields button')].find(b=>b.textContent==='Повторить сегодня').click();assert.equal(w.IRISData.entries.food.length,1);
  d.querySelector('#repeatPortion').value='.5'; // HTML select accepts only exact option values.
  d.querySelector('#repeatPortion').value='0.5';d.querySelector('#repeatPortion').dispatchEvent(new w.Event('change'));
  assert.equal(d.querySelector('#entryForm [name="kcal"]').value,'210');formSubmit(a,'#entryForm');assert.equal(w.IRISData.entries.food.length,2);assert.equal(w.IRISData.summary().food,630);
  w.IRISJournal.openSleep();fill(a,'start',local(w.Date.now()-10*3600000),'#entryForm');fill(a,'end',local(w.Date.now()-2*3600000),'#entryForm');fill(a,'quality','4','#entryForm');formSubmit(a,'#entryForm');assert.equal(d.querySelector('#entryError').textContent,'');assert.equal(w.IRISData.entries.sleep[0].quality,4);
 }finally{a.close()}
});
test('personal routine and optional check-in feed statistics without zero-filled averages',async()=>{
 const a=await harness(),{d,w}=a;
 try{
  emit(a,'iris:goals');fill(a,'waterMl','2500','#goalsForm');fill(a,'sleepHours','8.5','#goalsForm');d.querySelector('#goalsForm [name="enabled-food"]').checked=false;
  d.querySelector('#goalsForm [name="weekendEnabled"]').checked=true;d.querySelector('#goalsForm [name="weekendEnabled"]').dispatchEvent(new w.Event('change'));fill(a,'weekend-waterMl','1500','#goalsForm');formSubmit(a,'#goalsForm');assert.equal(d.querySelector('#goalsError').textContent,'');assert.equal(w.IRISData.dailyPlan('2026-09-21').targets.water,2.5);assert.equal(w.IRISData.dailyPlan('2026-09-20').targets.water,1.5);assert.equal(w.IRISData.routine.enabled.food,false);
  d.querySelector('#homeCheckin').click();for(const key of ['energy','mood','stress'])d.querySelector(`#nextEntryForm [name="${key}"][value="3"]`).checked=true;fill(a,'note','Спокойный день');formSubmit(a,'#nextEntryForm');assert.equal(w.IRISData.entries.checkins.length,1);
  w.IRISData.changeWater(500);d.querySelector('#statsTab').click();await a.tick(2);assert(d.querySelector('#statsPerspective').textContent.includes('Самочувствие'));
  d.querySelector('[data-period="week"]').click();assert.equal(d.querySelectorAll('.comparison-card').length,4);assert(d.querySelector('.comparison-card').textContent.includes('0,5 л'));assert(d.querySelector('.comparison-card').textContent.includes('1 из 7 дней'));assert.equal(d.querySelectorAll('#statsEvents [data-day]').length,7);
  d.querySelector('[data-period="month"]').click();assert.equal(d.querySelectorAll('#statsEvents [data-day]').length,30);
 }finally{a.close()}
});
test('canvas sleeps behind journal, stats, dialogs and hidden document, then wakes',async()=>{
 const a=await harness(),{d}=a;
 try{
  const ctx=a.contexts.get('irisCanvas');
  for(const selector of ['#journalTab','#statsTab']){d.querySelector(selector).click();await a.tick(2);const paints=ctx.paints;await a.tick(80);assert.equal(ctx.paints,paints,selector);d.querySelector('#eyeTab').click();await a.tick(5);assert(ctx.paints>paints)}
  d.querySelector('#homeCheckin').click();await a.tick(2);const dialogPaints=ctx.paints;await a.tick(80);assert.equal(ctx.paints,dialogPaints);d.querySelector('#nextEntryDialog').close();await a.tick(5);assert(ctx.paints>dialogPaints);
  a.setHidden(true);const hiddenPaints=ctx.paints;await a.tick(80);assert.equal(ctx.paints,hiddenPaints);a.setHidden(false);await a.tick(5);assert(ctx.paints>hiddenPaints);
 }finally{a.close()}
});
test('welcome keeps the eye inert until entry and still mode does not animate idly',async()=>{
 const a=await harness({welcome:true,motion:'still'});try{assert.equal(a.d.querySelector('#stage').inert,true);a.d.querySelector('#enterIris').click();await a.tick(4);assert.equal(a.d.querySelector('#stage').inert,false);const ctx=a.contexts.get('irisCanvas'),paints=ctx.paints;await a.tick(80);assert.equal(ctx.paints,paints);a.w.IRISData.changeWater(250);await a.tick(4);assert(ctx.paints>paints)}finally{a.close()}
});
test('short/offset viewports, reduced motion and cancelled multi-touch remain operable (mock geometry)',async()=>{
 for(const options of [{width:320,height:568},{width:393,height:852},{width:520,height:820,left:240},{width:375,height:667,reduced:true}]){
  const a=await harness(options);try{await a.select('water');await a.swipe(-100);assert(a.d.querySelector('#app').classList.contains('mode-food'));const p=a.point();a.pointer('pointerdown',p.x,p.y);a.pointer('pointerdown',p.x,p.y,2,false);a.pointer('pointercancel',p.x,p.y,1);await a.tick(40);assert(!a.d.querySelector('#app').classList.contains('menu-open'));assert.equal(a.errors.length,0)}finally{a.close()}
 }
});
