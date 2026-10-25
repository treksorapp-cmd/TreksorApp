// Deliberate allowlist: no journal text, mood records, vision answers, tokens, or email.
export function buildProgressPayload(input: {
  device: string;
  workout: {trainingPlan: unknown; gymSets: unknown[]; checkIns: Record<string,string[]>; workouts:{exercises:{completed:boolean}[]}[]};
  tracking: {id:string;title:string;percentage:number;custom:boolean;items:{id:string;label:string;value:string;record?:Record<string,boolean>}[]}[];
  articles: Record<string,{_id:string;title:string;category:string;isRead?:boolean}[]>;
  meditations: {id:string;isRead?:boolean}[];
  thoughtDates: Record<string,string>;
  vision: unknown;
}) {
  const unique = new Map<string, typeof input.articles[string][number]>();
  Object.values(input.articles).flat().forEach(a => unique.set(a._id,{...a,isRead:!!a.isRead||!!unique.get(a._id)?.isRead}));
  const articles = [...unique.values()];
  const exercises = input.workout.workouts.flatMap(w => w.exercises);
  const vision = input.vision as {answers?:unknown[]} | unknown[] | null;
  const answers = Array.isArray(vision) ? vision : vision?.answers || [];
  return {
    version:1, device:input.device,
    trainingPlan:input.workout.trainingPlan,
    gymSets:input.workout.gymSets,
    checkIns:input.workout.checkIns,
    exercises:{completed:exercises.filter(e => e.completed).length,total:exercises.length},
    trackers:input.tracking.map(t => ({id:t.id,title:t.title,percentage:t.percentage,custom:t.custom,items:t.items.map(i => ({id:i.id,label:i.label,value:i.value,record:i.record || {}}))})),
    articles:{completed:articles.filter(a => a.isRead).length,total:articles.length,read:articles.filter(a => a.isRead).map(a => ({id:a._id,title:a.title,category:a.category}))},
    meditations:{completed:input.meditations.filter(m => m.isRead).length,total:input.meditations.length},
    thoughtDates:Object.values(input.thoughtDates).filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)),
    vision:{completed:answers.filter(a => typeof a === 'string' && a.trim()).length,total:10},
  };
}
