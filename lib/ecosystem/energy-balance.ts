/** Energy estimates must never be presented as measured fat loss. */
export type EnergySource="apple-health"|"garmin"|"manual";
export type EnergyDay={date:string;source:EnergySource;activeKcal:number|null;restingKcal:number|null;intakeKcal:number|null;capturedAt:string};
export type EnergyBalance={intake:number;burned:number;net:number;status:"deficit"|"surplus"|"balanced";estimated:true;source:EnergySource};
export function estimateEnergyBalance(day:EnergyDay):EnergyBalance|null{
 const {activeKcal:a,restingKcal:r,intakeKcal:i}=day;
 if(a==null||r==null||i==null||![a,r,i].every(n=>Number.isFinite(n)&&n>=0))return null;
 const burned=a+r,net=i-burned;
 return {intake:i,burned,net,status:net< -50?"deficit":net>50?"surplus":"balanced",estimated:true,source:day.source};
}
/** A watch's active calories alone cannot establish an energy deficit. */
export function energyCompleteness(day:EnergyDay){return {active:day.activeKcal!=null,resting:day.restingKcal!=null,intake:day.intakeKcal!=null}}
