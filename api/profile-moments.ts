import {useAuthStore} from "@/store/auth-store";
import * as FileSystem from "expo-file-system";
import {decode} from "base-64";
import type {LifeMoment} from "@/lib/life-moments";
const URL="https://niakfwerfqmrmhuypkpd.supabase.co",KEY="sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";
const uuid=(value:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
async function request(path:string,init:RequestInit={}){
 const state=useAuthStore.getState();if(!state.token||!state.user?.id)throw Error("Sign in to share a moment");const owner=state.user.id;
 async function run(token:string){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);try{return await fetch(URL+path,{...init,headers:{apikey:KEY,Authorization:`Bearer ${token}`,...init.headers},signal:controller.signal})}finally{clearTimeout(timer)}}
 let response=await run(state.token);if(response.status===401){await useAuthStore.getState().getCurrentUser();const next=useAuthStore.getState();if(!next.token||next.user?.id!==owner)throw Error("Please sign in again");response=await run(next.token)}
 if(useAuthStore.getState().user?.id!==owner)throw Error("Your account changed. Please retry.");if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(error.message||error.error||"Unable to update shared moments")};return response;
}
export async function profileIsPublic(owner:string){if(!uuid(owner))throw Error("Invalid profile");const response=await request(`/rest/v1/web_profiles?user_id=eq.${owner}&select=discoverable`);return !!(await response.json())[0]?.discoverable}
export async function publishMoment(item:LifeMoment,makeProfilePublic:boolean,expectedOwner:string){
 const state=useAuthStore.getState(),owner=state.user?.id;if(!owner||owner!==expectedOwner||!uuid(item.id))throw Error("Please sign in again");
 const base64=await FileSystem.readAsStringAsync(item.photoUri,{encoding:FileSystem.EncodingType.Base64});const raw=decode(base64);if(raw.length>8*1024*1024)throw Error("Photo exceeds 8 MB");const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw Error("Please select a JPEG photo again");
 if(!await profileIsPublic(owner)){
  if(!makeProfilePublic)throw Error("A public profile is required to share this moment");
  const existing=await request(`/rest/v1/web_profiles?user_id=eq.${owner}&select=user_id`);const rows=await existing.json();
  if(rows.length)await request(`/rest/v1/web_profiles?user_id=eq.${owner}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({discoverable:true})});
  else await request('/rest/v1/web_profiles',{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:owner,display_name:state.user.name?.trim().length>=2?state.user.name.trim().slice(0,60):"Treksor member",discoverable:true})});
 }

 const path=`${owner}/${item.id}.jpg`;
 // Each moment has a unique path; retries check the existing owner-readable file.
 try{await request(`/storage/v1/object/journey-moments/${path}`,{method:"POST",headers:{"Content-Type":"image/jpeg","x-upsert":"false"},body:bytes.buffer as any})}catch(error){await request(`/storage/v1/object/info/journey-moments/${path}`)}
 await request('/rest/v1/profile_moments?on_conflict=id',{method:"POST",headers:{"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},body:JSON.stringify({id:item.id,user_id:owner,photo_path:path,caption:item.caption,taken_on:item.date,is_public:true})});
}
export async function unpublishMoment(id:string,expectedOwner:string){const owner=useAuthStore.getState().user?.id;if(!owner||owner!==expectedOwner||!uuid(id))throw Error("Invalid moment");await request(`/rest/v1/profile_moments?id=eq.${id}&user_id=eq.${owner}`,{method:"DELETE"});await request(`/storage/v1/object/journey-moments/${owner}/${id}.jpg`,{method:"DELETE"}).catch(()=>{})}
export type SharedMoment={id:string;user_id:string;caption:string;taken_on:string;photo_path:string;photoUrl:string;displayName:string};
export async function getSharedMoments(owner?:string):Promise<SharedMoment[]>{
 if(owner&&!uuid(owner))throw Error("Invalid profile");const response=await request(`/rest/v1/profile_moments?select=*&is_public=eq.true&order=created_at.desc&limit=50${owner?`&user_id=eq.${owner}`:""}`);const rows=await response.json();
 return Promise.all(rows.map(async(row:any)=>{const [sign,profile]=await Promise.all([request(`/storage/v1/object/sign/journey-moments/${row.photo_path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({expiresIn:900})}),request(`/rest/v1/web_profiles?select=display_name&user_id=eq.${row.user_id}`)]);const signed=(await sign.json()).signedURL;return {...row,photoUrl:signed.startsWith("http")?signed:URL+"/storage/v1"+signed,displayName:(await profile.json())[0]?.display_name||"Treksor member"}}));
}
export async function setProfileDiscoverable(owner:string,discoverable:boolean){
 const state=useAuthStore.getState();if(state.user?.id!==owner)throw Error("Your account changed. Please retry.");
 const existing=await request(`/rest/v1/web_profiles?user_id=eq.${owner}&select=user_id`);const rows=await existing.json();
 if(!rows.length&&discoverable)await request('/rest/v1/web_profiles',{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:owner,display_name:state.user.name?.trim().length>=2?state.user.name.trim().slice(0,60):"Treksor member",discoverable:true})});
 else if(rows.length)await request(`/rest/v1/web_profiles?user_id=eq.${owner}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({discoverable})});
}

export async function reportSharedMoment(item:SharedMoment,reason:string){
 const owner=useAuthStore.getState().user?.id;if(!owner||!uuid(item.id)||!uuid(item.user_id)||owner===item.user_id)throw Error("Invalid report");
 if(!["Inappropriate content","Harassment","Spam"].includes(reason))throw Error("Select a report reason");
 await request('/rest/v1/web_reports',{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reporter_id:owner,target_user:item.user_id,reason:`Shared moment ${item.id}: ${reason}`})});
}
export async function blockMomentAuthor(target:string){
 const owner=useAuthStore.getState().user?.id;if(!owner||owner===target||!uuid(target))throw Error("Invalid profile");
 await request('/rest/v1/web_blocks',{method:"POST",headers:{"Content-Type":"application/json",Prefer:"resolution=ignore-duplicates"},body:JSON.stringify({blocker_id:owner,blocked_id:target})});
}
