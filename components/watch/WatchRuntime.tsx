import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import { handleWatchRequest } from '@/lib/watch/companion';
import { watchBridge } from '@/lib/watch/connection';
export default function WatchRuntime() {
  useEffect(()=>{
    if(!watchBridge) return;
    const bridge=watchBridge;
    let queue=Promise.resolve(), timer:ReturnType<typeof setTimeout>;
    const invalidate=()=>{clearTimeout(timer); timer=setTimeout(()=>bridge.changed(),160)};
    const sub=bridge.addListener('onWatchRequest',({id,json})=>{
      const run=async()=>{
        try { bridge.reply(id,JSON.stringify(await handleWatchRequest(JSON.parse(json)))); }
        catch(e){bridge.reply(id,JSON.stringify({error:e instanceof Error ? e.message : 'Refresh and try again.'}));}
      };
      queue=queue.then(run,run);
    });
    const off=[useAuthStore.subscribe(invalidate),useWorkoutStore.subscribe(invalidate)];
    return ()=>{clearTimeout(timer);sub.remove();off.forEach(f=>f())};
  },[]);
  return null;
}
