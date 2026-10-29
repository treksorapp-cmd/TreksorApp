export function clockText(seconds:number){const value=Math.max(0,Math.floor(Number.isFinite(seconds)?seconds:0));return `${Math.floor(value/60).toString().padStart(2,"0")}:${(value%60).toString().padStart(2,"0")}`}
export function workoutClock(active:{startedAt:string;restEndsAt?:string|null;restDuration?:number},now:number){
 const started=Date.parse(active.startedAt),end=Date.parse(active.restEndsAt||""),remaining=Number.isFinite(end)?Math.max(0,Math.ceil((end-now)/1000)):0;
 return {elapsed:Number.isFinite(started)?Math.max(0,Math.floor((now-started)/1000)):0,remaining,resting:remaining>0,fraction:remaining?Math.min(1,remaining/Math.max(1,active.restDuration||remaining)):0};
}
