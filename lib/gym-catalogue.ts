import {GymExercise,mergeGymExercises} from "@/lib/gym-library";
import {rememberExerciseVideo} from "@/lib/exercise-video";
let catalogue:GymExercise[]|null=null,loadedAt=0,pending:Promise<GymExercise[]>|null=null;
export const cachedGymCatalogue=()=>catalogue||mergeGymExercises([]);
/** Resolve the public catalogue and signed links once, before opening a demonstration. */
export async function getGymCatalogue(){
 if(catalogue&&Date.now()-loadedAt<45000)return catalogue;
 if(pending)return pending;
 pending=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{
  const r=await fetch("https://treksor-admin-production.up.railway.app/api/public/discover?type=exercises",{signal:controller.signal});if(!r.ok)throw Error("Exercise catalogue unavailable");
  const data=await r.json();if(!Array.isArray(data.data))throw Error("Invalid catalogue");
  catalogue=mergeGymExercises(data.data);loadedAt=Date.now();
  for(const item of catalogue)if(item.videoUrl){rememberExerciseVideo(item.id,item.video_path,item.videoUrl);if(item.serverId)rememberExerciseVideo(item.serverId,item.video_path,item.videoUrl)}
  return catalogue;
 }finally{clearTimeout(timer);pending=null}})();return pending;
}
