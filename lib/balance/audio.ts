const BASE="https://niakfwerfqmrmhuypkpd.supabase.co",KEY="sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";
// Exact WAV files assigned to Meditation levels in Treksor Admin / Media.
const paths:Record<string,string>={
 beginner:"b78ec3a2-a9a0-4a0c-9d4b-4c9fbb57f88c.wav",
 intermediate:"b6bf096c-2340-4240-8005-86c975431b51.wav",
 advanced:"a7b9d42f-aee3-47fd-b1c3-538021496c3d.wav"
};
export async function meditationAudio(id:string,fallback:string){
 const path=paths[id];if(!path)return fallback;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 try{const response=await fetch(`${BASE}/storage/v1/object/sign/treksor-media/${path}`,{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({expiresIn:900}),signal:controller.signal});if(!response.ok)throw Error("Meditation media unavailable");const data=await response.json(),signed=data.signedURL||data.signedUrl;if(typeof signed!=="string")throw Error("Missing audio link");const url=signed.startsWith("https://")?signed:signed.startsWith("/storage/v1/")?`${BASE}${signed}`:`${BASE}/storage/v1/${signed.replace(/^\//,"")}`;const parsed=new URL(url);if(parsed.origin!==BASE||parsed.pathname!==`/storage/v1/object/sign/treksor-media/${path}`)throw Error("Invalid media link");return url}finally{clearTimeout(timeout)}
}
export function meditationCacheKey(id:string,fallback:string){return paths[id]||fallback}
