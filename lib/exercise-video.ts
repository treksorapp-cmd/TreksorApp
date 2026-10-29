import {decode} from "base-64";
const API = "https://treksor-admin-production.up.railway.app";
const entries = new Map<string, {url:string;until:number}>();
const pending = new Map<string, Promise<string>>();
const keyFor = (id:string,path?:string|null) => `${id}:${path||""}`;
export function cachedExerciseVideo(id:string,path?:string|null) {
  const entry=entries.get(keyFor(id,path));
  return entry && entry.until>Date.now() ? entry.url : null;
}
export function rememberExerciseVideo(id:string,path:string|null|undefined,url:string){
 try{
  const parsed=new URL(url);if(parsed.origin!=="https://niakfwerfqmrmhuypkpd.supabase.co"||!parsed.pathname.startsWith("/storage/v1/object/sign/treksor-media/"))return;
  const segment=parsed.searchParams.get("token")?.split(".")[1];if(!segment)return;
  const padded=segment.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(segment.length/4)*4,"=");
  const expiry=Number(JSON.parse(decode(padded)).exp)*1000-30000;
  if(Number.isFinite(expiry)&&expiry>Date.now())entries.set(keyFor(id,path),{url,until:Math.min(expiry,Date.now()+600000)});
 }catch{}
}
/** Stable signed URLs let the native MP4 cache survive navigation between screens. */
export async function resolveExerciseVideo(id:string,path?:string|null,fallback?:string,force=false):Promise<string> {
  if(!id)throw Error("No demonstration is linked to this exercise yet.");
  const key=keyFor(id,path),cached=cachedExerciseVideo(id,path);
  if(!force&&cached)return cached;
  if(pending.has(key))return pending.get(key)!;
  const task=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try {
      const r=await fetch(`${API}/api/public/workout-video?id=${encodeURIComponent(id)}`,{signal:controller.signal});
      if(!r.ok)throw Error("Video unavailable");
      const data=await r.json();
      if(typeof data.url!=="string"||!data.url.startsWith("https://"))throw Error("Invalid video URL");
      entries.set(key,{url:data.url,until:Date.now()+10*60*1000});
      return data.url;
    } catch(error) {
      if(fallback&&!path&&!force)return fallback;
      throw error;
    } finally {clearTimeout(timer);pending.delete(key)}
  })();
  pending.set(key,task);
  return task;
}
