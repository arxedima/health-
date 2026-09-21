const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const code=fs.readFileSync(path.join(__dirname,'../iris-data.js'),'utf8');
const KEY='irisJournalV39';
function setup(seed={},initial=Date.parse('2026-09-21T12:00:00')){
 let now=initial,fail=false;const map=new Map(Object.entries(seed)),listeners={};
 const addEventListener=(k,f)=>(listeners[k]||=[]).push(f);
 const dispatchEvent=e=>(listeners[e.type]||[]).forEach(f=>f(e));
 const storage={getItem:k=>map.get(k)??null,setItem(k,v){if(fail&&k===KEY)throw Error('quota');map.set(k,String(v))}};
 class Clock extends Date{constructor(...v){super(...(v.length?v:[now]))}static now(){return now}}
 const context={Date:Clock,crypto:{randomUUID},structuredClone,localStorage:storage,CustomEvent:class{constructor(type,{detail}={}){this.type=type;this.detail=detail}},addEventListener,dispatchEvent,document:{hidden:false,addEventListener(){}},setTimeout:()=>1,clearTimeout(){}};
 context.window=context;vm.createContext(context);vm.runInContext(code,context);
 return {D:context.IRISData,context,map,storage,now:()=>now,advance:ms=>now+=ms,fail:v=>fail=v,reload:()=>setup(Object.fromEntries(map),now),emit:dispatchEvent};
}
const plain=x=>JSON.parse(JSON.stringify(x));
test('old v44 journal migrates without replacing IDs, records or food goal',()=>{
 const old={version:1,food:[{id:'food-old',name:'Омлет',kcal:300,meal:'Завтрак',at:Date.parse('2026-09-21T08:00:00'),date:'2026-09-21'}],sleep:[],water:[],sport:[],foodGoal:1800};
 const {D}=setup({[KEY]:JSON.stringify(old),irisWaterGoalMl:'2500',irisSportGoalMinV24:'45'});
 assert.equal(D.entries.food[0].id,'food-old');assert.equal(D.foodGoal,1800);assert.equal(D.goals.waterMl,2500);assert.equal(D.goals.sportMin,45);assert.equal(D.entries.checkins.length,0);
 D.setPortion(330);assert.equal(D.entries.food.length,1);
});
test('water edit, lower/upper bounds, correct record undo and deletion undo',()=>{
 const a=setup(),D=a.D;D.changeWater(250);const first=D.entries.water[0];
 D.saveWater({id:first.id,ml:330,at:a.now()});assert.equal(D.summary().water,.33);
 D.changeWater(-250);assert.equal(D.summary().water,.08);
 assert.throws(()=>D.remove('water',first.id),/итог воды/);
 assert.throws(()=>D.undoWater(first.id),/самое последнее/);
 D.undoWater(D.entries.water.at(-1).id);assert.equal(D.summary().water,.33);
 const token=D.remove('water',first.id);assert.equal(D.summary().present.water,false);D.undoRemove(token);assert.equal(D.summary().water,.33);
 D.changeWater(6000);assert.equal(D.summary().water,6);assert.throws(()=>D.saveWater({ml:1,at:a.now()}),/итог воды/);
 assert.throws(()=>D.undoRemove(token),/Дневник уже изменился/);
});
test('timer pause, resume and finish form one workout and exclude paused time',()=>{
 const a=setup(),D=a.D;D.setWorkoutType('walk');D.updateWorkout();const id=D.workout.id;
 a.advance(120000);assert.equal(D.summary().sport,2);D.updateWorkout();a.advance(60000);D.updateWorkout();a.advance(60000);D.updateWorkout(true);
 assert.equal(D.summary().sport,3);assert.equal(D.workouts().length,1);assert.equal(D.workouts()[0].ms,180000);assert.equal(D.workouts()[0].segments,2);assert.equal(D.workouts()[0].id,id);assert.equal(D.workout.running,false);assert.equal(D.workout.elapsed,0);
 assert.equal(D.journalEvents(D.day()).filter(e=>e.kind==='sport').length,1);assert.equal(D.updateWorkout(true),false);
});
test('failed atomic timer save leaves both active timer and history untouched',()=>{
 const a=setup(),D=a.D;D.updateWorkout();a.advance(60000);const raw=a.map.get(KEY);a.fail(true);
 assert.throws(()=>D.updateWorkout(true),/Не удалось сохранить/);assert.equal(a.map.get(KEY),raw);assert.equal(D.workout.running,true);assert.equal(D.entries.sport.length,0);
 a.fail(false);D.updateWorkout(true);assert.equal(D.entries.sport.length,1);assert.equal(D.summary().sport,1);
});
test('running workout survives reload and continues across midnight without duplication',()=>{
 const a=setup({},Date.parse('2026-09-20T23:59:00'));a.D.updateWorkout();a.advance(120000);const b=a.reload();
 assert.equal(b.D.summary('2026-09-20').sport,1);assert.equal(b.D.summary('2026-09-21').sport,1);
 b.D.updateWorkout(true);assert.equal(b.D.summary('2026-09-20').sport,1);assert.equal(b.D.summary('2026-09-21').sport,1);assert.equal(b.D.entries.sport.length,1);
});
test('manual workout, metadata edit preserving pauses, overlap rejection, grouped removal',()=>{
 const a=setup(),D=a.D;D.updateWorkout();a.advance(60000);D.updateWorkout();a.advance(60000);D.updateWorkout();a.advance(120000);D.updateWorkout(true);
 const entry=D.workouts()[0];D.saveSport({id:entry.id,end:entry.end,minutes:3,type:'rehab',note:'Без боли',effort:2});
 assert.equal(D.workouts()[0].segments,2);assert.equal(D.workouts()[0].type,'rehab');
 assert.throws(()=>D.saveSport({end:a.now(),minutes:10,type:'run'}),/уже есть тренировка/);
 a.advance(3600000);D.saveSport({end:a.now(),minutes:20,type:'walk'});assert.equal(D.summary().sport,23);
 const token=D.remove('sport',entry.id);assert.equal(token.entries.length,2);assert.equal(D.workouts().length,1);D.undoRemove(token);assert.equal(D.summary().sport,23);
});
test('active workout cannot change type, be edited or be deleted',()=>{
 const a=setup(),D=a.D;D.updateWorkout();a.advance(60000);D.updateWorkout();const id=D.workout.id;
 assert.throws(()=>D.setWorkoutType('walk'),/Сначала заверши/);assert.throws(()=>D.saveSport({id,end:a.now(),minutes:1}),/Сначала заверши/);assert.throws(()=>D.remove('sport',id),/Сначала заверши/);
 D.updateWorkout(true);D.remove('sport',id);assert.equal(D.summary().sport,0);
});
test('adding consecutive manual workouts never replaces an earlier manual record',()=>{
 const a=setup(),D=a.D;D.saveSport({end:a.now()-3600000,minutes:20,type:'walk'});D.saveSport({end:a.now(),minutes:15,type:'rehab'});assert.equal(D.entries.sport.length,2);assert.equal(D.summary().sport,35);assert.equal(D.workoutEntry(undefined),null);
});
test('invalid timestamps and fractional water cannot produce un-restorable backups',()=>{
 const a=setup(),D=a.D;assert.throws(()=>D.changeWater(.5));assert.throws(()=>D.saveFood({name:'Тест',kcal:100,meal:'Обед',at:-1}));assert.throws(()=>D.saveSleep({start:-3600000,end:0}));assert.equal(D.previewBackup(D.exportBackup()).counts.added,0);
});
test('personal goals, rest days, disabled categories and weekend overrides',()=>{
 const {D}=setup();const r=D.routine;r.sportDays=[2,4];r.enabled.food=false;r.weekend={waterMl:1500,sportMin:10,sleepHours:9,foodKcal:1900};
 D.setGoals({waterMl:3000,sportMin:45,sleepHours:8.5,foodKcal:2200,routine:r});
 assert.equal(D.dailyPlan().rest,true);assert.equal(D.progress().count,2);assert.equal(D.progress().sport,null);assert.equal(D.progress().food,null);
 assert.equal(D.dailyPlan('2026-09-20').targets.water,1.5);assert.equal(D.dailyPlan('2026-09-22').targets.sport,45);
 D.changeWater(3000);assert.equal(D.progress().home,.5);
 const off=D.routine;for(const k of Object.keys(off.enabled))off.enabled[k]=false;D.setGoals({...D.goals,routine:off});assert.equal(D.progress().home,null);assert.equal(D.summary().water,3);
 assert.throws(()=>D.setGoals({...D.goals,sleepHours:8.1}),/Проверь цели/);assert.throws(()=>D.setPortion(25),/Порция воды/);
});
test('food favorite and repeat data are separate entries; sleep quality and overlaps',()=>{
 const a=setup(),D=a.D;const food={name:'Овсянка',kcal:420,meal:'Завтрак',at:a.now(),favorite:true};D.saveFood(food);D.saveFood({...food,kcal:210,favorite:false});assert.equal(D.entries.food.length,2);assert.equal(D.summary().food,630);assert.equal(D.entries.favorites.length,1);
 const sleep=D.saveSleep({start:a.now()-9*3600000,end:a.now()-3600000,quality:4});assert.equal(D.summary().sleep,8);assert.equal(sleep.quality,4);
 assert.throws(()=>D.saveSleep({start:a.now()-2*3600000,end:a.now(),quality:3}),/уже есть запись/);
 assert.throws(()=>D.saveSleep({start:a.now()-3600000,end:a.now(),quality:6}),/от 1 до 5/);
});
test('check-in is voluntary, one per day, editable and never a hidden zero',()=>{
 const a=setup(),D=a.D;assert.equal(D.entries.checkins.length,0);assert.equal(D.summary().present.food,false);
 const e=D.saveCheckin({energy:2,mood:3,stress:4,note:'Много дел'});D.saveCheckin({energy:4,mood:4,stress:2});assert.equal(D.entries.checkins.length,1);assert.equal(D.entries.checkins[0].id,e.id);assert.equal(D.entries.checkins[0].energy,4);
 assert.throws(()=>D.saveCheckin({energy:0,mood:3,stress:2}),/от 1 до 5/);assert.throws(()=>D.saveCheckin({date:D.shift(D.day(),1),energy:3,mood:3,stress:3}),/проверь дату/);
 assert.equal(D.journalEvents(D.day()).filter(e=>e.kind==='checkins').length,1);
});
test('backup round trip includes new data/settings; duplicates and stale preview are safe',()=>{
 const a=setup(),D=a.D;D.changeWater(330);D.setPortion(330);D.setGoals({...D.goals,sleepHours:9});D.saveCheckin({energy:2,mood:3,stress:2});D.saveSleep({start:a.now()-3600000*8,end:a.now(),quality:5});D.saveSport({end:a.now()-3600000*9,minutes:20,type:'walk',effort:2,note:'Парк'});
 const backup=D.exportBackup(),b=setup(),plan=b.D.previewBackup(backup);assert.equal(plan.counts.added,4);
 b.D.restoreBackup(backup,{revision:plan.revision,restoreGoal:true});assert.equal(b.D.routine.waterPortion,330);assert.equal(b.D.goals.sleepHours,9);assert.equal(b.D.entries.sleep[0].quality,5);assert.equal(b.D.entries.sport[0].type,'walk');assert.equal(b.D.entries.checkins.length,1);
 assert.equal(b.D.previewBackup(backup).counts.added,0);b.D.changeWater(100);assert.throws(()=>b.D.restoreBackup(backup,{revision:plan.revision}),/Дневник изменился/);
 const broken=JSON.parse(backup);broken.journal.checkins[0].energy=99;const raw=b.map.get(KEY);assert.throws(()=>b.D.restoreBackup(JSON.stringify(broken)),/целую резервную/);assert.equal(b.map.get(KEY),raw);
});
test('old backup does not overwrite newer goals or routine unless present',()=>{
 const a=setup();a.D.setPortion(400);a.D.setGoals({...a.D.goals,sleepHours:9});const backup=JSON.parse(a.D.exportBackup());delete backup.journal.routine;delete backup.journal.goals;delete backup.journal.checkins;
 a.D.restoreBackup(JSON.stringify(backup),{restoreGoal:true});assert.equal(a.D.routine.waterPortion,400);assert.equal(a.D.goals.sleepHours,9);
});
test('journal storage event refreshes summaries and settings from another tab',()=>{
 const a=setup(),b=a.reload();b.D.setPortion(450);b.D.changeWater(500);a.map.set(KEY,b.map.get(KEY));a.emit({type:'storage',key:KEY});assert.equal(a.D.routine.waterPortion,450);assert.equal(a.D.summary().water,.5);
});
test('a failed preference or check-in write does not alter persisted data',()=>{
 const a=setup(),before=a.map.get(KEY);a.fail(true);assert.throws(()=>a.D.setPortion(450),/Не удалось сохранить/);assert.throws(()=>a.D.saveCheckin({energy:3,mood:3,stress:3}),/Не удалось сохранить/);assert.equal(a.map.get(KEY),before);assert.equal(a.D.routine.waterPortion,250);assert.equal(a.D.entries.checkins.length,0);
});
test('invalid journal is not overwritten when a write is attempted',()=>{
 const a=setup({[KEY]:'broken-json'});assert(a.D.error);assert.throws(()=>a.D.changeWater(250));assert.equal(a.map.get(KEY),'broken-json');
});
test('all loaded release assets are present in the offline cache list',()=>{
 const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 for(const match of html.matchAll(/(?:src|href)="\.\/([^"?]+)\?([^"\s]+)"/g)){
  assert(fs.existsSync(path.join(root,match[1])),match[1]);assert(sw.includes('/health-/'+match[1]+'?'+match[2]),'not precached: '+match[1]);
 }
 assert(!html.includes('iris44'));assert(sw.includes('v4.6.0'));assert.equal(JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'))).start_url.includes('v=46'),true);
});
