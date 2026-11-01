const BASE="https://niakfwerfqmrmhuypkpd.supabase.co",KEY="sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";
const paths:Record<string,string>={intermediate:"d6f4cfc7-e5ab-44f4-92c6-a54286add778.mp4",advanced:"b7506c16-a302-4de7-be01-44458a28757d.mp4"};
export async function meditationAudio(id:string,fallback:string){
 const path=paths[id];if(!path)return fallback;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 try{const response=await fetch(`${BASE}/storage/v1/object/sign/treksor-media/${path}`,{method:"POST",headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,"Content-Type":"application/json"},body:JSON.stringify({expiresIn:900}),signal:controller.signal});if(!response.ok)throw Error("Meditation media unavailable");const data=await response.json(),signed=data.signedURL||data.signedUrl;if(typeof signed!=="string")throw Error("Missing audio link");const url=signed.startsWith("http")?signed:`${BASE}/storage/v1${signed}`;if(new URL(url).origin!==BASE)throw Error("Invalid media host");return url}finally{clearTimeout(timeout)}
}
export function meditationCacheKey(id:string,fallback:string){return paths[id]||fallback}
