import {useAuthStore} from "@/store/auth-store";
import {normalizeWorkouts,HealthSnapshot} from "@/lib/ecosystem/activity";
const BASE="https://niakfwerfqmrmhuypkpd.supabase.co",KEY="sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";
async function request(owner:string,init:RequestInit={}){
 const current=()=>{const state=useAuthStore.getState();if(!state.token||state.user?.id!==owner)throw Error("Your account changed. Sign in and try again.");return state.token};
 const run=async()=>{const token=current(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{return await fetch(`${BASE}/rest/v1/health_snapshots?user_id=eq.${encodeURIComponent(owner)}`,{...init,headers:{apikey:KEY,Authorization:`Bearer ${token}`,"Content-Type":"application/json",...init.headers},signal:controller.signal})}finally{clearTimeout(timer)}};
 let response=await run();if(response.status===401){await useAuthStore.getState().getCurrentUser();response=await run()}current();
 if(!response.ok)throw Error("Your health records could not be synced. Check your connection and try again.");return response;
}
export async function getHealthSnapshot(owner:string):Promise<{snapshot:HealthSnapshot;updatedAt:string}|null>{
 const rows=await(await request(owner)).json(),row=rows[0];if(!row)return null;
 if(row.payload?.version!==1)throw Error("Please update Treksor to read these records.");
 return{snapshot:{version:1,capturedAt:row.payload.capturedAt,workouts:normalizeWorkouts(row.payload.workouts)},updatedAt:row.updated_at};
}
export async function saveHealthSnapshot(owner:string,rows:unknown[]){
 const payload:HealthSnapshot={version:1,capturedAt:new Date().toISOString(),workouts:normalizeWorkouts(rows)};
 await request(owner,{method:"POST",headers:{Prefer:"resolution=merge-duplicates"},body:JSON.stringify({user_id:owner,payload})});
}
export async function deleteHealthSnapshot(owner:string){await request(owner,{method:"DELETE"})}
