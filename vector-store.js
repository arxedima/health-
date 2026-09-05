export const STORAGE_KEY = 'vector-health-v1';
export const ONBOARDING_KEY = 'healthplus-onboarding-v2';

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

const baseState = () => ({
  version: 2,
  _rev: 0,
  profile: { name:'', height:175, weight:70, goal:'balanced', tone:'calm' },
  calculator: { sex:'male', age:30, height:175, weight:70, activity:1.375, goal:'maintain' },
  calorieTarget: 2000,
  dailyLogs: {},
  foodLogs: {},
  completedSessions: [],
  reminders: [],
  routeEvents: [],
  behavior: {
    actions: {}, dose: {}, hours: {},
    experiments: { postMealWalk: { id:'postMealWalk', title:'8 минут после еды', offered:0, completed:0, active:true } }
  },
  ui: { view:'now', analyticsOpen:false },
  onboardingCompleted: false,
  createdAt: Date.now()
});

function object(value, fallback={}) { return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback; }
function array(value) { return Array.isArray(value) ? value : []; }
function stamp(value={}) { return Math.max(Number(value.doneAt)||0,Number(value.skippedAt)||0,Number(value.offeredAt)||0,Number(value.at)||0); }
function unionBy(itemsA=[],itemsB=[],keyFn=x=>x?.id) {
  const map=new Map();
  [...array(itemsA),...array(itemsB)].forEach((item,index)=>{
    const key=keyFn(item) ?? `anon-${index}-${JSON.stringify(item)}`;
    const old=map.get(key);
    if(!old || stamp(item)>=stamp(old)) map.set(key,item);
  });
  return [...map.values()];
}
function mergeCounters(a={},b={}) {
  const out={...object(a)};
  for(const [key,value] of Object.entries(object(b))){
    if(value && typeof value==='object' && !Array.isArray(value)){
      const cur=object(out[key]);
      out[key]={...cur,...value};
      for(const n of ['offered','completed','skipped']){
        if(n in cur || n in value) out[key][n]=Math.max(Number(cur[n])||0,Number(value[n])||0);
      }
    } else out[key]=value;
  }
  return out;
}
function mergeActions(a={},b={}) {
  const out={...object(a)};
  for(const [id,next] of Object.entries(object(b))){
    const prev=out[id];
    if(!prev || stamp(next)>=stamp(prev)) out[id]={...object(prev),...object(next)};
    else out[id]={...object(next),...object(prev)};
  }
  return out;
}
function mergeDailyLogs(current={},incoming={}) {
  const out={...object(current)};
  for(const [date,incRaw] of Object.entries(object(incoming))){
    const cur=object(out[date]), inc=object(incRaw);
    out[date]={...cur,...inc};
    out[date].actions=mergeActions(cur.actions,inc.actions);
    if('water' in cur || 'water' in inc) out[date].water=Math.max(Number(cur.water)||0,Number(inc.water)||0);
    if('steps' in cur || 'steps' in inc) out[date].steps=Math.max(Number(cur.steps)||0,Number(inc.steps)||0);
    if('sleep' in cur || 'sleep' in inc) out[date].sleep=Math.max(Number(cur.sleep)||0,Number(inc.sleep)||0);
    /* Energy is not monotonic; when reconciling a stale writer keep the newest stored value. */
    if('energy' in cur) out[date].energy=cur.energy;
  }
  return out;
}
function mergeFoodLogs(current={},incoming={}) {
  const out={...object(current)};
  for(const date of new Set([...Object.keys(object(current)),...Object.keys(object(incoming))])){
    out[date]=unionBy(object(current)[date],object(incoming)[date],x=>x?.id||`${x?.at||0}-${x?.name||''}`);
  }
  return out;
}
function mergeBehavior(current={},incoming={}) {
  const cur=object(current), inc=object(incoming);
  return {
    ...cur,...inc,
    actions:mergeCounters(cur.actions,inc.actions),
    dose:mergeCounters(cur.dose,inc.dose),
    hours:mergeCounters(cur.hours,inc.hours),
    experiments:mergeCounters(cur.experiments,inc.experiments)
  };
}

export function normalizeState(raw) {
  const d = baseState();
  const old = object(raw);
  const profile = object(old.profile);
  const calculator = { ...d.calculator, ...object(old.calculator) };
  const name = profile.name || old.profileName || '';
  const height = Number(profile.height || calculator.height || d.profile.height);
  const weight = Number(profile.weight || calculator.weight || d.profile.weight);
  return {
    ...d, ...old, version: 2, _rev:Number(old._rev)||0,
    profile: { ...d.profile, ...profile, name, height:Number.isFinite(height)?height:d.profile.height, weight:Number.isFinite(weight)?weight:d.profile.weight, goal:profile.goal||old.healthGoal||d.profile.goal, tone:profile.tone||d.profile.tone },
    calculator: { ...calculator, height, weight },
    dailyLogs: object(old.dailyLogs), foodLogs: object(old.foodLogs), completedSessions: array(old.completedSessions), reminders: array(old.reminders), routeEvents: array(old.routeEvents),
    behavior: { ...d.behavior, ...object(old.behavior), actions:object(old.behavior?.actions), dose:object(old.behavior?.dose), hours:object(old.behavior?.hours), experiments:{...d.behavior.experiments,...object(old.behavior?.experiments)} },
    ui: { ...d.ui, ...object(old.ui) },
    onboardingCompleted: Boolean(old.onboardingCompleted || localStorage.getItem(ONBOARDING_KEY)==='done')
  };
}

export function loadState() {
  try { return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')); }
  catch { return baseState(); }
}

/*
  VECTOR has more than one UI module. Every loaded state carries a revision.
  If an older module tries to save after a newer module, reconcile additive
  health data instead of letting the stale copy erase recent changes.
*/
export function saveState(state) {
  const incoming = normalizeState(state);
  let current = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) current = normalizeState(JSON.parse(raw));
  } catch {}

  const incomingRev = Number(incoming._rev)||0;
  const currentRev = Number(current?._rev)||0;

  if (current && incomingRev < currentRev) {
    const merged = normalizeState({
      ...current,
      dailyLogs:mergeDailyLogs(current.dailyLogs,incoming.dailyLogs),
      foodLogs:mergeFoodLogs(current.foodLogs,incoming.foodLogs),
      completedSessions:unionBy(current.completedSessions,incoming.completedSessions,x=>x?.id||`${x?.at||x?.completedAt||0}-${x?.title||''}`),
      reminders:unionBy(current.reminders,incoming.reminders,x=>x?.id||`${x?.time||''}-${x?.title||''}`),
      routeEvents:unionBy(current.routeEvents,incoming.routeEvents,x=>x?.id||`${x?.at||0}-${x?.type||''}-${x?.action||''}`),
      behavior:mergeBehavior(current.behavior,incoming.behavior),
      ui:{...current.ui,...incoming.ui},
      _rev:currentRev+1
    });
    localStorage.setItem(STORAGE_KEY,JSON.stringify(merged));
    return merged;
  }

  incoming._rev=Math.max(incomingRev,currentRev)+1;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(incoming));
  return incoming;
}

export function updateState(mutator) { const state=loadState(); const next=mutator(state)||state; saveState(next); return next; }
export function markOnboarded() { localStorage.setItem(ONBOARDING_KEY,'done'); }
export function resetOnboarding() { localStorage.removeItem(ONBOARDING_KEY); updateState(s=>{s.onboardingCompleted=false;return s;}); }
