export const STORAGE_KEY = 'vector-health-v1';
export const ONBOARDING_KEY = 'healthplus-onboarding-v2';

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

const baseState = () => ({
  version: 2,
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

export function normalizeState(raw) {
  const d = baseState();
  const old = object(raw);
  const profile = object(old.profile);
  const calculator = { ...d.calculator, ...object(old.calculator) };
  const name = profile.name || old.profileName || '';
  const height = Number(profile.height || calculator.height || d.profile.height);
  const weight = Number(profile.weight || calculator.weight || d.profile.weight);
  return {
    ...d, ...old, version: 2,
    profile: { ...d.profile, ...profile, name, height:Number.isFinite(height)?height:d.profile.height, weight:Number.isFinite(weight)?weight:d.profile.weight, goal:profile.goal||old.healthGoal||d.profile.goal, tone:profile.tone||d.profile.tone },
    calculator: { ...calculator, height, weight },
    dailyLogs: object(old.dailyLogs), foodLogs: object(old.foodLogs), completedSessions: array(old.completedSessions), reminders: array(old.reminders), routeEvents: array(old.routeEvents),
    behavior: { ...d.behavior, ...object(old.behavior), actions:object(old.behavior?.actions), dose:object(old.behavior?.dose), hours:object(old.behavior?.hours), experiments:{...d.behavior.experiments,...object(old.behavior?.experiments)} },
    ui: { ...d.ui, ...object(old.ui) },
    onboardingCompleted: Boolean(old.onboardingCompleted || localStorage.getItem(ONBOARDING_KEY)==='done')
  };
}

export function loadState() { try { return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')); } catch { return baseState(); } }
export function saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state))); }
export function updateState(mutator) { const state=loadState(); const next=mutator(state)||state; saveState(next); return next; }
export function markOnboarded() { localStorage.setItem(ONBOARDING_KEY,'done'); }
export function resetOnboarding() { localStorage.removeItem(ONBOARDING_KEY); updateState(s=>{s.onboardingCompleted=false;return s;}); }
