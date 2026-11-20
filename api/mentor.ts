import {useAuthStore} from '@/store/auth-store';
import type {MentorMemory} from '@/supabase/functions/_shared/mentor';
const endpoint='https://niakfwerfqmrmhuypkpd.supabase.co/functions/v1/treksor-ai';
const key='sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8';
export async function mentorRequest(owner:string,body:unknown):Promise<any>{
 const current=()=>{const s=useAuthStore.getState();if(!s.isAuthenticated||s.user?.id!==owner||!s.token)throw Error('Your account changed. Please sign in again.');return s.token};
 const run=async()=>{const token=current(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),35000);try{return await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:`Bearer ${token}`},body:JSON.stringify(body),signal:controller.signal})}finally{clearTimeout(timer)}};
 let response:Response;try{response=await run()}catch(e){current();throw Error(e instanceof Error&&e.name==='AbortError'?'Guide took too long. Please try again.':'Unable to connect to Guide. Check your internet connection.')}if(response.status===401){await useAuthStore.getState().getCurrentUser();current();try{response=await run()}catch(e){current();throw Error(e instanceof Error&&e.name==='AbortError'?'Guide took too long. Please try again.':'Unable to connect to Guide. Check your internet connection.')}}current();
 const data=await response.json().catch(()=>null);current();if(!response.ok){const detail=typeof data?.error==='string'?data.error:'';if(response.status===401||response.status===403)throw Error('Guide session expired. Please sign in again.');if(response.status===429)throw Error('Guide is busy. Please try again shortly.');if(response.status>=500)throw Error('Guide is temporarily unavailable. Please try again.');throw Error(detail||'Guide could not be reached. Please try again.')}if(!data||typeof data!=='object')throw Error('Guide returned an invalid response. Please try again.');return data;
}
export async function listMentorMemories(owner:string):Promise<MentorMemory[]>{return (await mentorRequest(owner,{action:'memories'})).memories}
export async function saveMentorMemory(owner:string,memory:Pick<MentorMemory,'category'|'content'|'user_approved'>&{id?:string}){return mentorRequest(owner,{action:'save_memory',memory})}
export async function deleteMentorMemory(owner:string,id:string){return mentorRequest(owner,{action:'delete_memory',memoryId:id})}
