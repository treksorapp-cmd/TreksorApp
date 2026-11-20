import { pillars, resolvePillar } from './pillar-navigation';
const labels: Record<string,string> = {
  home:'Home', today:'Progress', tracking:'Progress', progress:'Progress', chat:'Guide',
  community:'Community', events:'Events', profile:'Profile', edit:'Edit profile',
  body:'Body', workout:'Gym', nutrition:'Nutrition', walks:'Walks',
  mental:'Mind', mind:'Mind', spiritual:'Balance', purpose:'Purpose',
  articles:'Articles', article:'Articles', thoughts:'Power thoughts', myspace:'My space',
  'my-space':'My space', 'vision-board':'Vision board', journal:'Journal', notes:'Notes',
  moments:'Life moments', 'premium-research':'Premium', connections:'Connections',
  'daily-check-in':'Daily check-in', journey:'Goals & weekly review',
  groceries:'Shopping list', beverages:'Beverages', supplements:'Supplements',
  'beverage-details':'Beverage', 'supplement-details':'Supplement', temp:'Nutrition',
  'my-plan':'My plan', guide:'Build my plan', selection:'Choose your training',
  session:'Session', exercises:'Exercises', workouts:'Workouts', library:'Exercise library',
  details:'Exercise', mediation:'Meditation', practice:'Practice', sleep:'Sleep', wake:'Wake',
  'new-entry':'New entry', 'edit-entry':'Edit entry', 'view-entry':'Entry', 'new-entry-success':'Saved',
};
const auth = new Set(['login','register','verify-otp','reset-password','request-reset-password']);
export function routeTrail(pathname: string, origin?: string) {
  const segments=pathname.split('/').filter(p=>p&&!p.startsWith('('));
  const first=segments[0];
  const visible=!!first&&!auth.has(first)&&first!=='services';
  const pillar=resolvePillar('/'+segments.join('/'),origin);
  const parts:string[]=[];
  for(let i=0;i<segments.length;i++){
    const part=segments[i];
    // Never expose record IDs or arbitrary article/exercise slugs in the trail.
    if(!labels[part]) { if(i===segments.length-1)parts.push('Details'); break; }
    let label=labels[part];
    if(i===0&&pillar==='purpose')label='Purpose';
    if(parts[parts.length-1]!==label)parts.push(label);
  }
  return {visible,pillar,label:parts.join(' / ')||'Home',home: '/(tabs)/home' as const,
    parent: pillar?pillars[pillar].route:'/(tabs)/home'};
}
