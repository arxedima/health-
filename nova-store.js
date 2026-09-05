const KEY='nova-plus-v1';
const OLD_KEY='vector-health-v1';

export const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const base=()=>({
  version:1,
  profile:{name:'Дмитрий',height:175,weight:70,goal:'balanced'},
  settings:{theme:'auto'},
  daily:{},
  meals:{},
  reminders:[],
  createdAt:Date.now()
});

function obj(v,f={}){return v&&typeof v==='object'&&!Array.isArray(v)?v:f}
function arr(v){return Array.isArray(v)?v:[]}
function cleanName(v){
  const name=String(v||'').trim();
  if(!name)return 'Дмитрий';
  if(/^дима$/i.test(name)||/^dima$/i.test(name))return 'Дмитрий';
  return name;
}

function migrateVector(){
  try{
    const old=JSON.parse(localStorage.getItem(OLD_KEY)||'null');
    if(!old)return null;
    const n=base();
    const p=obj(old.profile);
    n.profile.name=cleanName(p.name||old.profileName||n.profile.name);
    n.profile.height=Number(p.height||old.calculator?.height||n.profile.height);
    n.profile.weight=Number(p.weight||old.calculator?.weight||n.profile.weight);
    n.profile.goal=p.goal||old.healthGoal||n.profile.goal;
    n.daily=obj(old.dailyLogs);
    n.meals=obj(old.foodLogs);
    n.reminders=arr(old.reminders);
    return n;
  }catch{return null}
}

export function normalize(raw){
  const b=base(),r=obj(raw),profile={...b.profile,...obj(r.profile)};
  profile.name=cleanName(profile.name);
  return {
    ...b,...r,
    profile,
    settings:{...b.settings,...obj(r.settings)},
    daily:obj(r.daily),
    meals:obj(r.meals),
    reminders:arr(r.reminders)
  };
}

export function load(){
  try{
    const saved=localStorage.getItem(KEY);
    if(saved)return normalize(JSON.parse(saved));
    const migrated=migrateVector();
    if(migrated){save(migrated);return normalize(migrated)}
  }catch{}
  return base();
}

export function save(state){localStorage.setItem(KEY,JSON.stringify(normalize(state)));return state}

export function update(mutator){const s=load();const next=mutator(s)||s;save(next);return next}

export function today(state=load(),date=new Date()){
  const k=dateKey(date);
  state.daily[k]=state.daily[k]||{water:0,steps:0,sleep:0,focus:0,moveMinutes:0,moveKcal:0,plan:{},mood:3};
  state.meals[k]=state.meals[k]||[];
  return {key:k,log:state.daily[k],meals:state.meals[k]};
}

export function setTheme(theme){return update(s=>{s.settings.theme=theme;return s})}
export {KEY};